# Full application: frontend, API and native KiCad engine; worker uses the same image.
FROM node:24.21.0-bookworm-slim AS frontend
WORKDIR /build
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 QT_QPA_PLATFORM=offscreen \
    CIRCUITCHECK_DATA=/data KICAD_CONFIG_HOME=/data/config KICAD_DOCUMENTS_HOME=/data/documents
RUN test "$(dpkg --print-architecture)" = amd64 && \
    apt-get update && apt-get install -y --no-install-recommends software-properties-common ca-certificates curl python3 python3-venv && \
    add-apt-repository -y ppa:kicad/kicad-10.0-releases && apt-get update && \
    curl --fail --location --retry 3 \
      'https://launchpad.net/~kicad/+archive/ubuntu/kicad-10.0-releases/+build/33830754/+files/kicad_10.0.7~ubuntu24.04.1_amd64.deb' \
      --output /tmp/kicad.deb && \
    echo 'ce96f7c3bd935a021c65b301427f74c1c16b211210b49ce9b40309ce5ecfbb33  /tmp/kicad.deb' | sha256sum --check - && \
    apt-get install -y --no-install-recommends /tmp/kicad.deb && \
    test "$(kicad-cli version | tail -n 1)" = '10.0.7' && \
    rm -rf /var/lib/apt/lists/* /tmp/kicad.deb
WORKDIR /app
COPY requirements.lock.txt ./
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r requirements.lock.txt
ENV PATH=/opt/venv/bin:$PATH
COPY backend ./backend
COPY scripts ./scripts
COPY fixtures ./fixtures
COPY --from=frontend /build/dist ./dist
RUN useradd --uid 10001 --create-home circuitcheck && mkdir -p /data && chown -R 10001:10001 /app /data
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD python -c "import json,urllib.request; r=json.load(urllib.request.urlopen('http://127.0.0.1:8000/api/health',timeout=4)); assert r['status']=='ok' and r['engine_available']"
CMD ["python","-m","uvicorn","backend.main:app","--host","0.0.0.0","--port","8000"]
