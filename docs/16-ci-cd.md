# CI / CD setup

Webship-js ships ready-to-use config files for every major CI/CD provider. The pattern is the same everywhere: install Node 20, install Playwright's chromium with its system deps, start the fixture server on port 8080, run `npm test`. No build step — `tsx` transpiles `.ts` step files on the fly.

## Supported providers

| Provider | File | Account needed | Badge |
| --- | --- | --- | --- |
| GitHub Actions | `.github/workflows/github-actions.yml` | GitHub | yes |
| GitLab CI | `.gitlab-ci.yml` | GitLab | yes |
| CircleCI | `.circleci/config.yml` | CircleCI | yes |
| Bitbucket Pipelines | `bitbucket-pipelines.yml` | Bitbucket | yes |
| Travis CI | `.travis.yml` | travis-ci.com | yes |
| Jenkins | `Jenkinsfile` | self-hosted | no |
| Azure Pipelines | `azure-pipelines.yml` | dev.azure.com | yes |

Each provider's setup notes live in its own section below.

---

## Jenkins

**File**: `Jenkinsfile` (declarative pipeline, at repo root).

Jenkins has no SaaS — you run a controller yourself. The shipped `Jenkinsfile` uses the official `mcr.microsoft.com/playwright:v1.58.2-jammy` Docker image so chromium and every apt dependency are already inside.

### Setup steps

1. **Run a Jenkins controller**. Fastest path is Docker:
   ```bash
   docker run -d --name jenkins \
     -p 8080:8080 -p 50000:50000 \
     -v jenkins_home:/var/jenkins_home \
     -v /var/run/docker.sock:/var/run/docker.sock \
     --group-add $(stat -c '%g' /var/run/docker.sock) \
     jenkins/jenkins:lts
   ```
   The mount + `--group-add` are critical — the pipeline spawns a sibling container for the Playwright image and needs the host's Docker socket.
2. **First-run unlock**: `docker logs jenkins | grep -A 1 "initialAdminPassword"` → paste at `http://localhost:8080`. Pick **Install suggested plugins**. That set already includes the Docker Pipeline plugin we rely on.
3. **Create an admin user** when prompted.
4. **Configure GitHub credentials**: *Manage Jenkins → Credentials → System → Global → Add* → kind `Username with password` (or `SSH Username with private key`), id `github-creds`.
5. **New Item → Pipeline**. Name `webship-js`.
   - *Build Triggers*: `Poll SCM` `H/5 * * * *` or `GitHub hook trigger`.
   - *Pipeline*: `Pipeline script from SCM` → Git → repo URL → credential `github-creds` → branch `*/2.0.x` → script path `Jenkinsfile`.
6. **Save** → **Build Now**. First run pulls the Playwright image (~1 GB) — cached afterwards.

### Reports + screenshots

The `post { always }` block archives `tests/reports/cucumber_report.{html,pdf,json}` and any `screenshots/**`. Browse them per build in the Jenkins UI under "Build Artifacts".

### Badge

Jenkins has no public badge endpoint by default — the controller is usually private. If you expose Jenkins publicly, use the **Embeddable Build Status** plugin which provides `BASE/buildStatus/icon?job=webship-js&style=plastic` and paste that URL in `README.md`.

### Notes

- `args '-u root:root'` runs the container as root so `npm install` and `npx playwright install --with-deps` can touch system paths. Switch to a non-root image if you tighten security.
- The Playwright base image already has every browser dep, so `--with-deps` is a no-op — kept for symmetry with other lanes.
- Need parallelism? Wrap the `Test` stage in `parallel { stage('chromium') {...}; stage('firefox') {...} }` and switch the image to `mcr.microsoft.com/playwright` (latest) which includes all three browsers.

---

## Azure Pipelines

**File**: `azure-pipelines.yml` at repo root.

Microsoft's hosted CI, generous free tier for both public and private repos. Microsoft-hosted `ubuntu-latest` agents already have Node + most browser deps; the pipeline still calls `--with-deps` for safety.

### Setup steps — open account + connect repo

1. **Microsoft account**: if you do not already have one, create at <https://account.microsoft.com/>. Free.
2. **Sign in to Azure DevOps**: <https://dev.azure.com> → "Start free with GitHub" *or* sign in with the Microsoft account.
3. **Create an Organization**. Pick a unique slug (used in the URL `https://dev.azure.com/<org>/`). Example: `webship`.
4. **Create a Project**. Name `webship-js`. Visibility:
   - **Public** for open source — unlocks the free OSS tier (10 parallel jobs, unlimited minutes).
   - **Private** otherwise (1 free parallel job, 1,800 min/mo).
5. **Pipelines → Create Pipeline → GitHub**. Authorise the **Azure Pipelines** GitHub app, scope it to `webship/webship-js`.
6. **Configure your pipeline**: choose **"Existing Azure Pipelines YAML file"** → branch `2.0.x` → path `/azure-pipelines.yml` → **Continue → Run**.
7. **Request OSS free parallelism** (only for public projects): `Organization settings → Billing → Public project parallelism request`. Microsoft enables it manually within a day or two.

### Badge

After the first build runs, copy the badge URL from `Pipelines → … → Status badge`:

```markdown
[![Azure Pipelines](https://dev.azure.com/<org>/<project>/_apis/build/status/webship-js?branchName=2.0.x)](https://dev.azure.com/<org>/<project>/_build/latest?definitionId=<id>&branchName=2.0.x)
```

Replace `<org>`, `<project>`, `<id>`. Paste into `README.md` next to the other badges.

### Reports

The pipeline publishes two build artefacts:

- `cucumber-report` — `tests/reports/cucumber_report.{html,pdf,json}`
- `failure-screenshots` (only on failure) — every `screenshots/**/*` capture

Browse via **Pipelines → Run → Artifacts → 1 published**.

### Caching

Two `Cache@2` tasks are configured:

| Key | Path | Effect |
| --- | --- | --- |
| `npm \| <os> \| package.json` | `$(Pipeline.Workspace)/.npm` | Cuts `npm install` to seconds when `package.json` is unchanged. |
| `playwright \| <os>` | `$(HOME)/.cache/ms-playwright` | Skips the chromium download (~120 MB) on reruns. |

### Notes

- `trigger.tags` matches `2.0.*` so a tag push runs the pipeline once. Adjust if you tag differently.
- `pr.branches` triggers on PRs targeting `2.0.x` — Azure runs the PR head against the target branch.
- `npm start &` backgrounds the fixture server; `curl -sf` then fails fast if the bind never landed.
- If you want a per-browser matrix, replace `steps:` with `jobs:` + `strategy.matrix: { chromium: {BROWSER: chromium}, firefox: {BROWSER: firefox} }` and add `--with-deps $(BROWSER)`.
