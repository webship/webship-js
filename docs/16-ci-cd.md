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
| AWS CodeBuild | `buildspec.yml` | aws.amazon.com | indirect (via CloudWatch) |
| Google Cloud Build | `cloudbuild.yaml` | console.cloud.google.com | indirect (via shields.io endpoint) |
| TeamCity | `.teamcity/settings.kts` (+ `pom.xml`) | jetbrains.com/teamcity | yes (shields.io endpoint) |
| Semaphore | `.semaphore/semaphore.yml` | semaphoreci.com | yes |
| Drone CI | `.drone.yml` | self-hosted | yes (shields.io endpoint) |
| Woodpecker CI | reuses `.drone.yml` | self-hosted | yes |
| Forgejo Actions | reuses `.github/workflows/*` | Forgejo/Codeberg | yes |

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

---

## AWS CodeBuild

**File**: `buildspec.yml` at repo root.

AWS-managed build service. Free tier: 100 build-minutes per month on the `general1.small` compute class indefinitely. The 9-minute suite fits roughly 11 free runs / month — beyond that, each minute costs ~$0.005.

### Setup steps — open account + create project

1. **Create an AWS account** at <https://aws.amazon.com/>. Requires a credit card, phone verification, and an email confirmation. The 12-month free tier and the always-free CodeBuild tier both apply.
2. **Sign in to the AWS Console** → switch to a region close to you (e.g. `us-east-1`, `eu-west-1`).
3. **IAM → Roles → Create role**:
   - Trusted entity: **AWS service** → **CodeBuild**.
   - Permissions: attach `AmazonS3FullAccess` (artefact upload) and `CloudWatchLogsFullAccess`.
   - Name: `webship-js-codebuild-role`.
4. **S3 → Create bucket** for artefacts (e.g. `webship-js-reports`). Region must match the CodeBuild region.
5. **CodeBuild → Create build project**:
   - Project name: `webship-js`.
   - Source provider: **GitHub** → "Connect using OAuth" → authorise the AWS CodeBuild GitHub app → pick `webship/webship-js` → branch `2.0.x`.
   - Webhook: tick "Rebuild every time a code change is pushed".
   - Environment: **Managed image** → operating system **Ubuntu** → runtime **Standard** → image `aws/codebuild/standard:7.0` → privileged unchecked.
   - Service role: pick the existing `webship-js-codebuild-role` you just created.
   - Build spec: **Use a buildspec file** → buildspec name `buildspec.yml` (default).
   - Artifacts: **Amazon S3** → bucket `webship-js-reports` → name `webship-js-report-$(date)`.
   - Logs: tick CloudWatch Logs → group `/aws/codebuild/webship-js`.
6. **Create build project → Start build**.

### Badge

CodeBuild has no native badge endpoint. Two common patterns:

1. **GitHub commit status**: CodeBuild posts the build status to the GitHub commit, so the GitHub UI shows pass / fail next to each commit.
2. **shields.io custom badge**: write a tiny Lambda that polls CodeBuild's `BatchGetBuilds` API and exposes a JSON endpoint; shields.io renders it via `https://img.shields.io/endpoint?url=https://...`.

### Reports

`buildspec.yml` declares artefacts:

```
tests/reports/cucumber_report.html
tests/reports/cucumber_report.pdf
tests/reports/cucumber_report.json
screenshots/**/*
```

They land in the configured S3 bucket. Grant pre-signed URLs or make the bucket public if you want links you can share.

### Caching

`cache.paths` lists `node_modules`, `/root/.cache/ms-playwright`, and the npm cache. Enable caching in the CodeBuild project: **Artifacts → Additional configuration → Cache type → Local → Custom cache**. Skips most of `npm install` and the chromium download on reruns.

### Notes

- 9-min suite × $0.005/min ≈ $0.045 per build past the free tier — cheap unless you push hundreds of builds.
- For multi-AZ or multi-region resilience, place the buildspec in `aws-codebuild/buildspec.yml` and point the CodeBuild project at that path — the file is just a relative source path.
- CodeBuild can run inside a VPC if your dev server needs private network access — toggle in **VPC configuration** before starting the first build.

---

## Google Cloud Build

**File**: `cloudbuild.yaml` at repo root.

Google's managed CI inside GCP. First $300 of usage is free for new accounts (90-day trial); after that the always-free tier covers ~120 build-minutes per day on the default `e2-standard-2` machine — about 13 runs of the 9-min suite per day.

### Setup steps — open account + connect repo

1. **Create a Google Cloud account** at <https://console.cloud.google.com/>. Sign in with a Google account, accept the terms, claim the $300 / 90-day credit (a card is required for verification but is not charged).
2. **Create a Project**: top bar → "Select a project" → "New project" → name `webship-js`. Note the project ID — Cloud Build references it implicitly.
3. **Enable billing** on the project: `Billing → Link a billing account`. Required even for free-tier-only usage.
4. **Enable the Cloud Build API**: `APIs & Services → Library → Cloud Build API → Enable`. Wait ~30 s.
5. **Create the artefact bucket**: `Cloud Storage → Buckets → Create` → name `webship-js-reports` (must be globally unique — prepend your project ID if taken) → region matching your build region.
6. **Grant Cloud Build write to the bucket**: bucket → `Permissions → Grant access` → principal `<project-number>@cloudbuild.gserviceaccount.com` → role `Storage Object Creator`.
7. **Connect GitHub**: `Cloud Build → Triggers → Manage repositories → Connect Repository` → GitHub (Cloud Build GitHub App) → install on `webship/webship-js`.
8. **Create a Trigger**:
   - Name `webship-js-2-0-x`.
   - Event: **Push to a branch**.
   - Source: select the GitHub repo + branch regex `^2\.0\.x$`.
   - Configuration: **Cloud Build configuration file (yaml or json)** → location `Repository` → `/cloudbuild.yaml`.
   - Service account: leave default (`<project-number>@cloudbuild.gserviceaccount.com`).
   - Substitution variables (optional): override `_ARTIFACT_BUCKET` if your bucket differs.
   - **Create**.
9. **Test**: `Run trigger` → first build pulls the Playwright image (~1 GB, cached on the build pool afterwards).

### Badge

Cloud Build has no native badge. Two workarounds:

1. **Custom shields.io endpoint**: deploy a Cloud Function that calls `builds.list` filtered by the trigger ID + branch, returns shields.io JSON, then embed `https://img.shields.io/endpoint?url=https://<region>-<project>.cloudfunctions.net/buildBadge`.
2. **Workflow Run badge via mirror**: if you mirror to GitHub Actions, the GH Actions badge already covers green/red status.

### Reports

The `artifacts.objects` section uploads the HTML / PDF / JSON to `gs://webship-js-reports/<BUILD_ID>/` on every run. Browse via Cloud Storage UI or share pre-signed URLs.

### Caching

Cloud Build does not have a first-class cache step. Common patterns:

1. **Kaniko image cache** for Docker-based builds (not what this pipeline does).
2. **Volume cache via `dir` + GCS sync**: copy `node_modules` and `~/.cache/ms-playwright` to GCS at the end of each build, restore at the start. Adds two extra steps but cuts a hot rerun from ~9 min to ~5 min.

### Notes

- `options.logging: CLOUD_LOGGING_ONLY` skips the legacy log bucket — saves a few cents per build and avoids the IAM warning Cloud Build prints by default.
- `timeout: 1800s` matches the 30-minute cap from other lanes; the suite finishes in ~9 min headless.
- `_BRANCH_NAME` and `_ARTIFACT_BUCKET` are substitution variables — override per-trigger to point at a different bucket without forking the YAML.
- For per-browser parallelism, replace the single `step` with three steps, each setting `BROWSER=chromium/firefox/webkit` — `--with-deps` will fetch the matching browser deps inside the container.

---

## TeamCity Cloud

**Files**: `.teamcity/settings.kts` + `.teamcity/pom.xml` at repo root.

JetBrains' CI server, available as Cloud (SaaS, no install) or self-hosted. Cloud free tier: 600 build-minutes / month + 1 build agent + 100 build configs forever. The 9-minute suite fits ~66 runs / month.

### Setup steps — open account + connect repo

1. **JetBrains account**: <https://account.jetbrains.com/> → sign up (free, OAuth via GitHub / Google / Microsoft also works).
2. **Start TeamCity Cloud trial**: <https://www.jetbrains.com/teamcity/cloud/> → "Start free trial" → confirm the JetBrains-issued instance URL (e.g. `https://webship.teamcity.com`). The trial collapses into the free tier when it ends.
3. **Create a Project**: top bar `Administration → Projects → Create project`. Pick "From a repository URL" → paste the GitHub HTTPS URL → "Proceed". TeamCity creates a VCS root.
4. **Authorise GitHub OAuth**: TeamCity asks for GitHub credentials the first time it touches the repo. Use a Personal Access Token with `repo` scope or the OAuth flow.
5. **Enable Versioned Settings**: open the project → `Versioned Settings → Synchronization enabled → Kotlin DSL`. TeamCity will offer to scan the repo for `.teamcity/settings.kts` — point it at the file we shipped. Commit any generated config UUIDs back to the repo so the next clone is identical.
6. **Add the GitHub token credential**: `Project → Connections → Add → GitHub.com` (used by the `commitStatusPublisher` feature). Name the credential `webship-js-github-token` to match the DSL reference.
7. **First build**: open the **Test** build configuration → **Run**. TeamCity pulls the Playwright Docker image (~1 GB once) and runs the script step.

### Badge

TeamCity has no native public badge. Common patterns:

1. **shields.io endpoint** wrapping `app/rest/builds/buildType:WebshipJsTest/status.json`.
2. **GitHub commit status** (already wired by the `commitStatusPublisher` feature in the DSL) — the GitHub UI shows pass / fail next to each commit.

### Reports

`artifactRules` archives `tests/reports/cucumber_report.{html,pdf,json}` plus any `screenshots/**` capture. Browse per build under `Artifacts` in the TeamCity UI.

### Notes

- `dockerImage = "mcr.microsoft.com/playwright:v1.58.2-jammy"` runs the script inside the official Playwright image — chromium and every apt dep are already there.
- `dockerRunParameters = "--user root:root --network host"` keeps the steps simple (no `sudo`, the local fixture server on `localhost:8080` is reachable without port mapping).
- `pom.xml` exists only so IntelliJ can resolve `configs-dsl-kotlin` types and give completion / inspections in the IDE. TeamCity Cloud ignores it at build time.
- Kotlin DSL version `2024.03` matches TeamCity Cloud at time of writing — TeamCity warns and offers an auto-upgrade when the server version moves past it.
- For per-browser matrix, wrap the `script` step in a `buildType.dependencies` chain or define three `BuildType` objects sharing a common parent — Kotlin DSL favours composition over YAML-style matrix.

---

## Semaphore

**File**: `.semaphore/semaphore.yml`.

Hosted CI with a developer-friendly UI and one of the fastest cold-build queues. Free tier: 1,300 build-minutes / month on `e1-standard-2` (2 vCPU, 4 GB). The 9-minute suite fits ~144 free runs / month. Open-source maintainers can request the Startup plan for additional minutes.

### Setup steps — open account + connect repo

1. **Sign up**: <https://semaphoreci.com/> → "Sign up with GitHub" → authorise the Semaphore GitHub App on `webship/webship-js`.
2. **Pick a plan**: the default "Free" plan is fine. Public OSS repos qualify for the Startup tier (more minutes + parallel jobs) — apply via `Account → Billing → Open source program`.
3. **Create project**: dashboard → "Create new project" → pick `webship-js` → branch `2.0.x` (Semaphore can auto-detect other branches later).
4. **Choose pipeline source**: select "Customise the workflow" → "I have a configuration file in my repository" → point at `.semaphore/semaphore.yml`. Semaphore validates the YAML and shows a graph preview.
5. **Add the project** → Semaphore queues the first run on a fresh worker. The `--with-deps` step pulls chromium apt deps; the cache stores `node_modules` + `~/.cache/ms-playwright` so reruns are fast.

### Badge

Open the project → `Settings → Badge`. Semaphore emits the markdown directly:

```markdown
[![Build Status](https://<org>.semaphoreci.com/badges/webship-js/branches/2.0.x.svg)](https://<org>.semaphoreci.com/projects/webship-js)
```

Replace `<org>` with the organisation slug you picked at signup. Paste in `README.md`.

### Reports

`epilogue.always` uploads `cucumber_report.{html,pdf,json}` to the per-job artefact store (`Artifacts` tab in the UI). `epilogue.on_failure` adds the `screenshots/` capture. `--expire-in 30d` keeps storage costs down by purging after a month — bump to `90d` or `--retain` for longer retention.

### Caching

Two cache slots are populated in the `Install` block and restored in `prologue` for every job:

| Key | Path |
| --- | --- |
| `node-modules-$(checksum package.json)` | `node_modules` |
| `ms-playwright` | `~/.cache/ms-playwright` |

`checksum` busts the cache automatically when `package.json` changes.

### Notes

- `sem-version node 20` is Semaphore's runtime switcher — preinstalled on every `os_image: ubuntu2204` agent.
- `agent.machine.type: e1-standard-2` is the free-tier default; bumping to `e2-standard-4` halves wall time but costs more minutes.
- `nohup npm start > /tmp/srv.log 2>&1 &` keeps the fixture server alive after the `commands` block exits; `curl -sf` is the same ready-probe as the other lanes.
- Add a `promotions` block (e.g. tag release, deploy to staging) once the test pipeline is stable — see Semaphore docs for the `auto_promote` shape.
- For per-browser matrix, add three jobs under the `Test` task and parameterise via env (`BROWSER=chromium` etc.) — Semaphore runs them in parallel within the free-tier concurrency limit.

---

## Drone CI

**File**: `.drone.yml` at repo root.

Open-source CI/CD that pipelines via simple YAML and runs steps in Docker containers. Drone Cloud (drone.io) moved to a paid model in 2023, so the open-source path is **self-host**. The shipped `.drone.yml` is provider-agnostic — anyone running a Drone server can enable the repo and go.

### Setup steps — open account + bring up a server

There is **no SaaS sign-up** for the free version. You have two routes:

#### Route A — self-host Drone (recommended for OSS)

1. Pick a host with Docker + a TLS-terminated domain (e.g. `ci.example.com`).
2. Create a GitHub OAuth App at <https://github.com/settings/developers> →
   New OAuth App → Homepage `https://ci.example.com` →
   Authorization callback `https://ci.example.com/login`.
   Save the Client ID and Client Secret.
3. Generate a shared secret: `openssl rand -hex 16`.
4. Run the server:
   ```bash
   docker run -d \
     -e DRONE_GITHUB_CLIENT_ID=... \
     -e DRONE_GITHUB_CLIENT_SECRET=... \
     -e DRONE_RPC_SECRET=... \
     -e DRONE_SERVER_HOST=ci.example.com \
     -e DRONE_SERVER_PROTO=https \
     -p 80:80 -p 443:443 \
     -v /var/lib/drone:/data \
     --restart=always --name=drone drone/drone:2
   ```
5. Run at least one runner (Docker is the common choice):
   ```bash
   docker run -d \
     -e DRONE_RPC_PROTO=https \
     -e DRONE_RPC_HOST=ci.example.com \
     -e DRONE_RPC_SECRET=... \
     -e DRONE_RUNNER_CAPACITY=2 \
     -v /var/run/docker.sock:/var/run/docker.sock \
     --restart=always --name=drone-runner drone/drone-runner-docker:1
   ```
6. Visit `https://ci.example.com` → sign in with GitHub → **Activate** `webship/webship-js`. Drone reads `.drone.yml` on the next push.

#### Route B — Drone Cloud (paid)

<https://drone.io> → "Sign up" → pick a paid plan. Then point at the same `.drone.yml`. No further config differences.

### Badge

```markdown
[![Build Status](https://ci.example.com/api/badges/webship/webship-js/status.svg?branch=2.0.x)](https://ci.example.com/webship/webship-js)
```

Replace `ci.example.com` with your server hostname.

### Reports

The `archive-reports` step tars `tests/reports/` + `screenshots/` into `/var/lib/drone/artifacts/cucumber-report-<build>.tar.gz` on the host. Serve the directory via a static file server (e.g. `python3 -m http.server` behind nginx) or copy to S3/GCS via an extra step.

### Notes

- Pull-request runs are filtered out by `trigger.ref.exclude: refs/pull/**` — flip to allow forks once you have secret management figured out.
- The `archive-reports` step uses a host-mounted volume; if your runner is ephemeral (e.g. Kubernetes), swap the volume for an `s3` plugin or `drone/s3-cache`.
- `DRONE_BUILD_NUMBER` is provided by the server. Other handy vars: `DRONE_COMMIT_SHA`, `DRONE_BRANCH`, `DRONE_TAG`.
- Per-browser matrix: duplicate the `test` step three times with different `BROWSER` env values, or use the `matrix` keyword (Drone 1.x style).

---

## Woodpecker CI

**File**: reuses `.drone.yml`.

Woodpecker is a community-driven fork of Drone 0.8 that preserves the original Apache-2 licence. The pipeline syntax is a near-superset of `.drone.yml` — most files (ours included) run unchanged. Self-hosted only.

### Setup steps

1. Self-host Woodpecker: <https://woodpecker-ci.org/docs/administration/getting-started>. The Docker Compose example takes ~5 minutes to bring up.
2. Enable the repo in the Woodpecker UI and trigger a build.
3. If Woodpecker complains about Drone-specific keys, rename `.drone.yml` → `.woodpecker.yml` (or `.woodpecker/*.yml` for split pipelines). Most projects keep both as symlinks.

### Badge

```markdown
[![Build Status](https://ci.example.com/api/badges/webship/webship-js/status.svg?branch=2.0.x)](https://ci.example.com/repos/webship/webship-js)
```

### Notes

- Woodpecker reads the same `trigger`, `steps`, `image`, `commands` keys we already use.
- `when:` syntax matches Drone 1.x.
- For maximum compatibility, prefer `.woodpecker.yml`; some Drone-only keywords (e.g. `kind: pipeline` is optional in Woodpecker but tolerated).

---

## Forgejo Actions

**Files**: reuses `.github/workflows/*.yml`.

Forgejo is a hard fork of Gitea (used by Codeberg.org and many self-hosted shops). It implements a GitHub Actions-compatible runner via the [act_runner](https://forgejo.org/docs/latest/admin/actions/) project, so the existing `.github/workflows/github-actions.yml` runs without modification.

### Setup steps

1. Push the repo to a Forgejo instance (e.g. <https://codeberg.org/> for OSS — sign up with email).
2. Enable Actions: `Repo Settings → Actions → Enable Repository Actions`.
3. Make sure at least one `act_runner` is registered against the instance. Codeberg provides shared runners for OSS; self-hosted instances need a manual `act_runner register` step (see Forgejo docs).
4. Push to branch `2.0.x` — the existing GitHub workflow YAML runs on the Forgejo runner.

### Badge

```markdown
[![Build Status](https://codeberg.org/webship/webship-js/badges/workflows/github-actions.yml/badge.svg?branch=2.0.x)](https://codeberg.org/webship/webship-js/actions)
```

Adjust to your Forgejo host.

### Notes

- `uses: actions/checkout@v3` and friends are pulled from the public GitHub registry by default — Forgejo proxies them. If you need to pin actions to a private registry, set `ACTIONS_RUNNER_HOOK_*` env vars on the runner.
- Forgejo does not run reusable workflows (`workflow_call`) yet (as of Forgejo 7) — split shared logic into shell scripts under `scripts/` and call them from the YAML if you need portability.
- Secret handling, matrix builds, and concurrency groups all work the same way as on GitHub.
