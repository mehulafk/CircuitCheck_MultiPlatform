# Deployment verification

Prepared on 19 November 2026 against MultiPlatform commit `39bd3cf` and original repository commit `620b2673ca83dc4ea77251bf0d81351828f1099d`.

## Passed locally

- Production frontend, Actions Pages build and committed branch-Pages build: TypeScript/Vite builds passed. Vite retains the existing large-3D-chunk advisory.
- All **16 Playwright Pages tests** passed in Edge, including original extension download, simulator compatibility table, 3D loading, component labels, camera axes, findings, revision comparison, reports and mobile layouts.
- **65 Python tests passed**, including the HTTPS-origin boundary and local-development compatibility.
- A separate static-host check served the raw repository at `/renamed-project/`: the source page redirected to `site/`, the extension ZIP downloaded, and the 3D model loaded without failed requests or browser errors.
- Actionlint 1.7.12 accepted all three GitHub Actions workflows with the declared custom runner label.
- Docker Compose 5.8.0 accepted both local and HTTPS-server configurations.
- Caddy 2.11.9 accepted the HTTPS/authentication configuration with a temporary test hash.
- `git diff --check` passed.
- All original-repository source/download files are present, excluding obsolete generated bundle filenames replaced by the rebuilt frontend. The restored v0.6.2 public ZIP has the identical Git object ID `99d30da051e16aba7eeab3ade8a59e91b7b4f72d`.

## Not executed here

- **12 Python native-engine tests skipped** because this machine does not have KiCad installed.
- Docker Engine is unavailable here; no image build or running container stack was tested locally. The container workflow is configured to install the pinned KiCad engine, run the complete Python suite and submit a live sample through the API/worker before publishing.
- The GitHub workflows, registry publication, server deployment and real-domain certificate issuance have not run. A target server/domain and the production runner/environment must be configured as described in `DEPLOYMENT.md`.
- Simulator extension binaries were restored unchanged from the original repository; their simulator integrations were not re-tested.

The server configuration is a password-protected shared workspace. It does not introduce separate user accounts or per-user project ownership.
