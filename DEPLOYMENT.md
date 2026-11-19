# Deploy CircuitCheck through GitHub

The complete deployment contains the original simulator extension (v0.6.2 and the retained v0.6.1 download), KiCad uploads, DRC/ERC, revision comparison, repair previews, reports, optional AI explanations, and this repository's 3D models, component labels, findings and camera controls.

| Deployment | What runs there |
| --- | --- |
| GitHub Pages | Recorded interactive demo, 3D examples and extension downloads |
| Docker server | Complete live application, Python API, native KiCad 10.0.7 worker and persistent project data |

GitHub Actions builds and publishes the full container; GitHub Pages cannot execute Python or KiCad. The server is one private workspace protected by HTTPS and a password. Everyone using its credentials shares the same projects; this does not add separate user accounts or tenant isolation.

## 1. Publish from your repository

Commit these files to `main`. In **Actions**, enable workflows if GitHub asks.

- **Build and publish full application** builds the Docker image, runs the Python/native-engine tests and exercises the API/worker together before publishing `ghcr.io/mehulafk/circuitcheck_multiplatform:main`. Each build also publishes `sha-<full commit>`; `v*` Git tags publish matching version tags. Pull requests test without publishing.
- **Deploy CircuitCheck preview to GitHub Pages** builds and browser-tests the demo, then publishes it on pushes to `main`. Select **Settings → Pages → Source → GitHub Actions**. The expected address is `https://mehulafk.github.io/CircuitCheck_MultiPlatform/`.
- **Deploy full application to server** is a manual action for your configured server (step 3).

No Docker Hub account or registry token needs to be added to Actions: publication uses GitHub's built-in `GITHUB_TOKEN` with `packages: write`. After the first publication, open the repository's **Packages** entry and make the container public if you want unauthenticated server pulls. Otherwise log the server into GHCR using a credential with `read:packages`; do not commit credentials.

Forks publish to their own lower-case `ghcr.io/<owner>/<repo>` name. Set `CIRCUITCHECK_IMAGE` accordingly. Pages derives its path from the repository name. For a custom domain or `<owner>.github.io` repository, set the Actions repository variable `PAGES_BASE_PATH` to `/`.

## 2. Run the complete app

Use a Linux x86-64 server with Docker Engine and Compose v2. Give the API/worker at least 2 CPUs and enough RAM for the configured 2 GB aggregate container limits plus the OS. The image contains KiCad; visitors do not install it.

### Local or SSH-accessed workspace

Clone the repo and run `docker compose up --build -d --wait`. Open `http://127.0.0.1:8000/`. For a remote machine, use `ssh -L 8000:127.0.0.1:8000 user@server` and open that same local URL. The API stays bound to loopback.

To use the published image instead of building, set `CIRCUITCHECK_IMAGE=ghcr.io/mehulafk/circuitcheck_multiplatform:main`, run `docker compose pull`, then `docker compose up -d --no-build --wait`.

### HTTPS server

Point a domain's DNS to your server and allow incoming TCP ports 80 and 443. Only the gateway publishes ports; the API and worker remain private.

```sh
git clone https://github.com/mehulafk/CircuitCheck_MultiPlatform.git
cd CircuitCheck_MultiPlatform
cp deploy/.env.example deploy/.env
docker run --rm -it caddy:2-alpine caddy hash-password
```

Enter a strong password when prompted. Edit `deploy/.env`: set `CIRCUITCHECK_DOMAIN`, the username and the generated bcrypt hash. Keep the hash in **single quotes** in this file so Compose preserves its `$` characters. Optional AI credentials stay server-side.

```sh
docker compose --env-file deploy/.env -f deploy/compose.yaml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.yaml pull
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d --wait
```

Open `https://your-domain` and enter the username/password. Caddy obtains and renews the certificate and protects the UI, API, reports and downloads. In this configuration `CIRCUITCHECK_PUBLIC_URL` allows the exact HTTPS origin through the backend's mutation checks; do not expose the API directly or remove gateway authentication.

## 3. Deploy from the GitHub Actions button

This optional step runs the same server configuration from GitHub. On your server, install a dedicated GitHub Actions runner using **Settings → Actions → Runners → New self-hosted runner**. Give it the custom label **`circuitcheck-production`**, run it as a service, and grant its account Docker access. Use this runner only for trusted deployment workflows; pull-request tests in this repository use GitHub-hosted runners.

Create the **production** environment under **Settings → Environments** and restrict it to `main`:

| Type | Name | Value |
| --- | --- | --- |
| Environment variable | `CIRCUITCHECK_DOMAIN` | Your DNS hostname, without `https://` |
| Environment variable | `CIRCUITCHECK_AUTH_USER` | Login name; defaults to `admin` |
| Environment secret | `CIRCUITCHECK_AUTH_HASH` | Generated bcrypt hash, **without surrounding quotes** |
| Optional secret | `AI_API_KEY` | Provider API key |
| Optional variables | `AI_BASE_URL`, `AI_MODEL` | Provider settings |

After the container build succeeds, open **Actions → Deploy full application to server → Run workflow**. Choose `main` and a published image tag. The workflow pulls the image, starts the services, waits for API health and checks that unauthenticated HTTPS requests are rejected. It does not provision or pay for a server. If the job stays queued, check that the runner is online with the required label.

## Updates, rollback and data

The fixed Compose project name `circuitcheck` keeps the `designs`, certificate and Caddy config volumes stable across runner checkouts. Deploy a new published tag to update, or rerun the workflow with a previous `sha-...` tag to roll back the application. Back up `circuitcheck_designs` before updates; image rollback does not undo database changes. Do not use `docker compose down --volumes` on a real deployment: it deletes persistent data. That command appears only in disposable CI cleanup.

Inspect server logs with `docker compose --env-file deploy/.env -f deploy/compose.yaml logs --tail 100`. A healthy API is not proof of a functioning worker: open the example project and confirm checks finish. The container workflow performs that end-to-end check on every build.

## Local verification

```sh
npm ci
npm run build
npm run build:pages
npx playwright install chromium
npm run test:pages
python -m pytest -q
```

Native integration tests require KiCad 10.0.7. The container workflow installs the exact archived official Ubuntu package with its published SHA-256 checksum, then verifies the runtime version; newer PPA releases cannot silently change the engine. Local Windows builds can set `PW_CHANNEL=msedge` to use installed Edge. The committed branch-Pages fallback can be refreshed with `npm run build:branch-pages`; its relative paths also work when the repository is renamed.

## Feature provenance

Compared with original `shubhanshuambashta-code/circuitcheck` commit `620b267`, this change restores its extension download component, simulator installation guide and both original release ZIPs byte-for-byte. The MultiPlatform branch's 3D, metadata and review changes are retained. Simulator behavior remains in the extension; native KiCad analysis remains in the server.

Reference: [GitHub container publishing](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images), [Vite GitHub Pages deployment](https://vite.dev/guide/static-deploy.html#github-pages), [Caddy password authentication](https://caddyserver.com/docs/caddyfile/directives/basic_auth).
