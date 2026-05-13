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
| Harness CI | `.harness/webship-js-pipeline.yml` | app.harness.io | yes |
| Bamboo Data Center | `bamboo-specs/bamboo.yml` | self-hosted (Atlassian) | yes |
| Codefresh | `codefresh.yml` | codefresh.io | yes |
| Octopus Deploy | (no test runner — CD only, see notes) | octopus.com | n/a |
| ~~Codeship~~ | retired 2023 — do not use | — | — |

Each provider's setup notes live in its own section below.

---

## GitHub Actions

**File**: `.github/workflows/github-actions.yml`.

GitHub's native CI/CD. #1 by adoption (~33% of all open-source repos according to JetBrains' 2024 Dev Ecosystem Survey). Free tier: 2,000 minutes per month for private repos, **unlimited** for public repos. Linux minutes count 1:1, macOS 10:1, Windows 2:1.

### Setup steps — open account + connect repo

1. **Sign up for GitHub** at <https://github.com/signup>. Free.
2. **Fork or push the repo**. Workflows under `.github/workflows/` are picked up automatically — no UI step needed.
3. **Enable Actions** if you forked: `repo → Settings → Actions → General → Allow all actions`. New repos have Actions enabled by default.
4. **Add secrets** (optional, only if a step needs them): `Settings → Secrets and variables → Actions → New repository secret`. None are required for the shipped workflow.

### Workflow contents

Single job `build` on `ubuntu-latest`:

1. `actions/checkout@v3` — pulls the repo.
2. `actions/setup-node@v3` — Node 20.x.
3. `npm install`.
4. `npx playwright install --with-deps chromium`.
5. `npm start &` — backgrounds the fixture server.
6. `sleep 3`.
7. `npm test`.

`FORCE_COLOR=1` is set on the job so cucumber-js v10 emits ANSI colours.

### Badge

Already shipped in `README.md`:

```markdown
[![Github Actions](https://github.com/webship/webship-js/actions/workflows/github-actions.yml/badge.svg?branch=2.0.x)](https://github.com/webship/webship-js/actions)
```

The badge follows the workflow file name and branch — no extra setup.

### Reports

The current workflow does not upload artefacts. To add them, append:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: cucumber-report
    path: |
      tests/reports/cucumber_report.html
      tests/reports/cucumber_report.pdf
      tests/reports/cucumber_report.json
      screenshots/
```

### Notes

- A deprecation warning fires on every run: `actions/checkout@v3` and `actions/setup-node@v3` use Node 20 internally; GitHub will force Node 24 on 2026-06-02. Bump to `@v4` (which targets Node 24) before then. We left them at `@v3` for now so existing forks do not need to rewrite YAML.
- The fixture server is a tiny `http-server` static site on port 8080 — no Docker daemon required on the runner.
- For per-browser matrix: add `strategy.matrix.browser: [chromium, firefox, webkit]` + `BROWSER: ${{ matrix.browser }}` to the env block, and replace `chromium` in the playwright install line with `${{ matrix.browser }}`.

---

## GitLab CI

**File**: `.gitlab-ci.yml`.

GitLab's first-party CI/CD. #3 by adoption (~19%). Free tier on GitLab.com: 400 compute-minutes per month on shared runners. Self-hosted GitLab gives unlimited minutes on your own runners.

### Setup steps — open account + connect repo

1. **Sign up for GitLab.com**: <https://gitlab.com/users/sign_up> (free) or stand up a self-hosted GitLab.
2. **Push the repo** (or mirror it from GitHub via `Settings → Repository → Mirroring repositories`).
3. **Enable CI/CD**: `repo → Settings → CI/CD → General pipelines`. On by default for new projects.
4. **Shared runners**: enabled by default on GitLab.com. Self-hosted? Register a runner via `gitlab-runner register` against the controller URL.
5. **Set CI/CD variables** (optional): `Settings → CI/CD → Variables`. None required for the shipped pipeline.

### Pipeline contents

Single job `test` running on the `node:20` image:

1. `npm install`.
2. `npx playwright install --with-deps chromium`.
3. `npm start &` + `sleep 3`.
4. `npm test`.

`FORCE_COLOR: "1"` is set in the job's `variables:` block.

### Badge

Already shipped in `README.md`:

```markdown
[![Gitlab CI](https://gitlab.com/webship/webship-js/badges/2.0.x/pipeline.svg?job=karma&key_text=Gitlab+CI&key_width=60)](https://gitlab.com/webship/webship-js/-/pipelines)
```

The `job=` query param targets a specific job's status; drop it to show the whole pipeline.

### Reports

Add artefacts to any job:

```yaml
test:
  artifacts:
    when: always
    expire_in: 30 days
    paths:
      - tests/reports/cucumber_report.html
      - tests/reports/cucumber_report.pdf
      - tests/reports/cucumber_report.json
      - screenshots/
    reports:
      junit: tests/reports/junit.xml      # if you add --format junit:
```

GitLab renders JUnit XML inline on the merge-request page.

### Notes

- The `node:20` Docker image is slim — installing chromium via `--with-deps` adds ~120 MB on the first run. Use `cache:` keyed on `package-lock.json` to skip on reruns.
- Merge-request pipelines (`workflow.rules`) trigger by default; add `rules:` to scope to specific branches.
- For self-hosted runners on macOS / Windows, set `tags:` on the job and on the runner registration so the right runner picks up the work.
- Per-browser matrix: use `parallel.matrix` with `BROWSER: [chromium, firefox, webkit]`.

---

## Bitbucket Pipelines

**File**: `bitbucket-pipelines.yml`.

Atlassian Bitbucket's native CI/CD. Free tier: 50 build-minutes per month for private repos, **unlimited** for public repos. Linked tightly to Jira / Confluence / Trello so handy in Atlassian-stack shops.

### Setup steps — open account + connect repo

1. **Sign up for Bitbucket**: <https://bitbucket.org/account/signup> → email or Google / Apple / Microsoft SSO.
2. **Create a workspace** (e.g. `webshipco`). Required — every repo lives inside a workspace.
3. **Create or import the repo**. Bitbucket can import from GitHub directly.
4. **Enable Pipelines**: `repo → Repository settings → Pipelines → Settings → Enable Pipelines`. Toggle is off by default until you read & accept the runner terms.
5. **(Optional) Self-hosted runners**: `Repository settings → Pipelines → Runners → Add runner`. Skips the free-tier minute cap.

### Pipeline contents

`bitbucket-pipelines.yml` defines a single default pipeline:

```yaml
image: node:20
pipelines:
  branches:
    2.0.x:
      - step:
          script:
            - npm install
            - npx playwright install --with-deps chromium
            - npm start &
            - sleep 3
            - npm test
```

`FORCE_COLOR=1` is set in the job's `variables:` block.

### Badge

Already shipped in `README.md`:

```markdown
[![Bitbucket Pipelines](https://img.shields.io/bitbucket/pipelines/webshipco/webship-js/2.0.x)](https://bitbucket.org/webshipco/webship-js/pipelines)
```

Uses shields.io as a proxy because Bitbucket does not expose a native SVG endpoint. Replace `webshipco/webship-js` with your workspace + repo slug.

### Reports

Add `artifacts:` to a step:

```yaml
- step:
    name: test
    script: [ npm test ]
    artifacts:
      - tests/reports/cucumber_report.html
      - tests/reports/cucumber_report.pdf
      - tests/reports/cucumber_report.json
      - screenshots/**
```

Artefacts live for 14 days on the free tier, 30 days on paid plans. Download from the build page.

### Notes

- Each step gets ~4 GB RAM and 2 vCPU by default — fine for the 9-minute suite. `size: 2x` bumps to 8 GB / 4 vCPU at 2× the minutes.
- `pipelines.branches.2.0.x` scopes the pipeline to that branch only; add `pull-requests:` for PR builds.
- Atlassian's Pipes (`pipe:`) catalogue covers Slack notifications, AWS deploys, Jira issue transitions, etc. — drop them into the `script:` section as named steps.
- Per-browser matrix: define three steps under `parallel:` with `BROWSER` env variations.

---

## CircleCI

**File**: `.circleci/config.yml`.

CircleCI ships with a free tier of 6,000 build-minutes per month on Linux x86 medium (4 GB / 2 vCPU). Fits ~666 runs of the 9-minute suite. Active badge on `webship.co`.

### Setup steps — open account + connect repo

1. **Sign up**: <https://circleci.com/signup/> → "Sign Up with GitHub" → authorise the CircleCI GitHub App on `webship/webship-js`.
2. **Choose an organisation** (your GitHub org / user). CircleCI mirrors the GitHub permissions model.
3. **Set up the project**: dashboard → `Projects → Set up project` → pick `webship-js` → "Use the .circleci/config.yml in my repo" → branch `2.0.x`.
4. **Pick a plan**: the **Free** plan covers OSS comfortably. The **Performance** plan adds Docker layer caching and more concurrency.

### Pipeline contents

`.circleci/config.yml` uses the `cimg/node:20.20` Docker executor (Node + npm preinstalled). Steps:

1. `checkout`.
2. `npm install`.
3. `npx playwright install --with-deps chromium`.
4. `npm start &` + `sleep 3`.
5. `npm test`.

`FORCE_COLOR: "1"` is exported in the job environment. Filter `branches.only: /^2.0.x/` keeps feature-branch pushes off the queue.

### Badge

Already shipped in `README.md`:

```markdown
[![CircleCI](https://circleci.com/gh/webship/webship-js/tree/2.0.x.svg?style=svg)](https://circleci.com/gh/webship/webship-js/tree/2.0.x)
```

`/gh/` is the legacy VCS path (still works); `/circleci/<org-slug>` is the newer form.

### Reports + screenshots

Add `store_artifacts` to the test step:

```yaml
- store_artifacts:
    path: tests/reports
    destination: cucumber-report
- store_artifacts:
    path: screenshots
    destination: failure-screenshots
    when: on_fail
```

Artefacts are retained for 30 days and rendered as downloadable links on the build page.

### Notes

- `cimg/node:20.20` is CircleCI's "convenience image" — much smaller cold-start than `node:20` from Docker Hub.
- The earlier config used `cimg/base:stable-20.04` with manual `apt upgrade` and a NodeSource curl-pipe. That path hit 200-package apt upgrades and PPA 503s (issue #280) and was replaced with the slim form documented above.
- Docker layer caching is gated behind the Performance plan — toggle in the executor block with `docker_layer_caching: true` when you upgrade.
- Per-browser matrix: use a `matrix` block under `jobs:` or duplicate the job per browser.

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

---

## Harness CI

**File**: `.harness/webship-js-pipeline.yml`.

Harness ships an enterprise Software Delivery Platform; Harness CI is the build/test module. The Developer (free) plan covers 90 build credits per day on hosted Linux-x86 builders — fits ~9 runs of the 9-minute suite.

### Setup steps — open account + connect repo

1. **Sign up**: <https://app.harness.io/auth/#/signup> → email or Google/Microsoft SSO → confirm via email.
2. **Onboarding wizard**: choose **Continuous Integration** as the first module. Harness creates a Project + Org with the names you pick. Record both IDs — they replace `<ORG_ID>` and `<PROJECT_ID>` in the shipped pipeline file.
3. **GitHub connector**: `Project Setup → Connectors → Create Connector → GitHub` → "Github App" or "OAuth" → install the **Harness GitHub App** on `webship/webship-js`. Save the connector ID and replace `<GITHUB_CONNECTOR_ID>` in the pipeline.
4. **Optional Docker / S3 connectors** (only if you want artefact upload):
   - `Connectors → Docker Registry → Docker Hub anonymous` (used by `plugins/s3`).
   - `Secrets → Add Encrypted Text → aws_access_key`, `aws_secret_key`.
5. **Import the pipeline**:
   - `Pipelines → New Pipeline → Import from Git`.
   - Repo `webship/webship-js`, branch `2.0.x`, file path `.harness/webship-js-pipeline.yml`.
   - Harness validates the YAML and renders the visual graph.
6. **Trigger**:
   - `Triggers → New Trigger → Webhook → GitHub → On Push`.
   - Branch regex `^2\.0\.x$`. Save.
   - First push runs the pipeline.

### Badge

Public dashboards are an Enterprise feature. For the free plan, expose status via the GitHub commit status that the Harness GitHub App posts automatically, or write a tiny shields.io endpoint backed by the Harness REST API (`GET /pipeline/api/pipelines/execution`).

### Reports

The shipped pipeline includes an optional `Upload report artefacts` step that uses the `plugins/s3` connector. Replace the secret IDs and bucket name; or rip the step out entirely and pull reports from Harness's built-in **CI Insights** tab (test logs are retained per-build).

### Notes

- `runtime.type: Cloud` uses Harness-hosted infra (no agents to manage). For self-hosted runners, switch to `runtime.type: KubernetesCluster` and point at a connector.
- Placeholders to fill before first run: `<ORG_ID>`, `<PROJECT_ID>`, `<GITHUB_CONNECTOR_ID>`, `<DOCKER_CONNECTOR_ID>`. Harness's UI does the substitution if you start from "Import from Git".
- `step.type: Background` is the Harness equivalent of `nohup ... &` — keeps `npm start` alive across following steps.
- The `reports.type: JUnit` block expects a junit XML; cucumber-js can emit one with `--format junit:tests/reports/junit.xml`. Add to a CI-only `WEBSHIP_REPORT_ARGS` env if you want it.

---

## Bamboo Data Center

**File**: `bamboo-specs/bamboo.yml`.

Atlassian's on-prem CI/CD. **Atlassian retired Bamboo Cloud on 2024-02-15** — only the self-hosted **Bamboo Data Center 9.x** remains. The shipped YAML targets the official YAML Specs format introduced in Bamboo 7+.

### Setup steps — open account + connect repo

There is no Atlassian-hosted Bamboo any more. You bring your own server.

1. **Buy a Bamboo Data Center licence** at <https://www.atlassian.com/software/bamboo/pricing>, or use the 30-day evaluation. Free starter tier was discontinued.
2. **Install Bamboo Data Center**:
   - Recommended path: official Docker image `atlassian/bamboo` on a host with at least 4 GB RAM and a persistent volume.
   - Database: PostgreSQL 13+ or MySQL 8+ is supported; SQLite for tiny installs.
   - Follow the Atlassian "Installing Bamboo" guide for your platform.
3. **Sign in as admin** at `https://bamboo.example.com` → run the setup wizard → activate the licence.
4. **Link the GitHub repository**: `Bamboo administration → Linked repositories → Add → Git`. Use HTTPS + a Personal Access Token, or SSH with a deploy key. Name the linked repo `webship-js`.
5. **Enable Bamboo Specs scanning** on that repo: `Bamboo administration → Specs → Repositories → Add`. Bamboo reads `bamboo-specs/bamboo.yml` on every push, recreating plan + permissions from the file.
6. **Build agent**: at least one Docker-capable agent must be online. The plan runs inside `mcr.microsoft.com/playwright:v1.58.2-jammy`, so the host needs Docker installed and the Bamboo agent needs the Docker plugin enabled.

### Badge

Bamboo emits chat-style status webhooks (Slack, MS Teams) but no native badge image. Two options:

1. **GitHub commit status** — install the *Bamboo for GitHub* add-on: `<https://marketplace.atlassian.com/apps/1214095/bamboo-for-github>`. Posts pass/fail on every build.
2. **shields.io endpoint** — wrap Bamboo's `/rest/api/latest/result/<key>-latest` REST call in a tiny proxy and embed `https://img.shields.io/endpoint?url=...`.

### Reports

`Cucumber.artifacts` declares four shared artefacts:

- `cucumber-report-html`  → `tests/reports/cucumber_report.html`
- `cucumber-report-pdf`   → `tests/reports/cucumber_report.pdf`
- `cucumber-report-json`  → `tests/reports/cucumber_report.json`
- `screenshots`           → `screenshots/**` (failure captures)

Browse per build under `Plan Result → Artifacts`. The `shared: true` flag makes them available to downstream plans and to the Bamboo REST API.

### Notes

- The YAML uses Bamboo's *two-document* format: the first document is the plan, the second is the plan permissions. Both are required by the Specs scanner.
- `docker.image` + `docker-run-arguments` runs every script task inside the Playwright image — no need to install Node or chromium on the agent itself.
- `triggers.polling` is used instead of webhook triggers; webhooks are also supported but need network access from GitHub to the Bamboo server.
- `branches.create: manually` and `delete: never` keep branch hygiene strict — flip if you want feature-branch builds.
- For per-browser matrix, duplicate the `Cucumber` job under `stages.Test.jobs` and override `BROWSER` per copy.

---

## Codefresh

**File**: `codefresh.yml` at repo root.

Kubernetes-native CI/CD. The Classic pipeline format reads `codefresh.yml` from the repo. Free tier: 100 build-minutes / month on shared infrastructure — fits ~11 runs of the 9-minute suite. Public OSS repos can apply for the Community plan for more capacity.

### Setup steps — open account + connect repo

1. **Sign up**: <https://g.codefresh.io/signup> → "Sign up with GitHub" → authorise the Codefresh GitHub App on `webship/webship-js`.
2. **Pick a runtime**: dashboard prompts you to "Add Runtime" → pick **Codefresh Hosted** for the managed free tier. (Self-hosted runtimes via `cf-runtime install` are also available but out of scope here.)
3. **Create a pipeline**:
   - `Pipelines → New Pipeline → From Git`.
   - Repository `webship/webship-js`, branch `2.0.x`.
   - Choose **"Inline YAML from repository"** → path `codefresh.yml`.
4. **Add a trigger**:
   - `Triggers → Git → push events on branch ^2\.0\.x$`.
   - First push runs the pipeline.

### Badge

```markdown
[![Codefresh build status](https://g.codefresh.io/api/badges/pipeline/<account>/webship-js?type=cf-1)](https://g.codefresh.io/pipelines/edit/new/builds?id=<pipeline-id>)
```

Replace `<account>` with the Codefresh account slug picked at signup and `<pipeline-id>` with the value from the URL of the pipeline editor.

### Reports

The `upload_reports` step copies `cucumber_report.{html,pdf,json}` + `screenshots/` to `/codefresh/volume/cucumber-report/` — a Codefresh-managed shared volume that persists across pipeline runs. From there you can:

1. Mount the same volume in a follow-up step that uploads to S3/GCS.
2. Browse via the **Codefresh storage browser** (Pro+ plans only).
3. Pipe to the built-in **Test Reports** feature by emitting JUnit XML — add a `--format junit:tests/reports/junit.xml` argument to the cucumber-js call.

### Notes

- `type: git-clone` + `working_directory: ${{main_clone}}` is the canonical Codefresh pattern; the variable expands to the path of the cloned repo on the runtime.
- Both `freestyle` steps reuse the Playwright base image to skip apt installs entirely.
- `successOnly` / `failureToo` inside `when.condition.any` is Codefresh's way of saying "always" — keeps the upload step running even when tests fail so artefacts are still collected.
- For per-browser matrix, replace `test_suite` with a parallel `steps` block (Codefresh 1.0 spec supports `mode: parallel`) and parameterise `BROWSER`.
- Codefresh's GitOps platform (Argo Workflows / Argo CD) reads a different format (`csdp` workflow definitions). This file is for the Classic pipeline runtime — the more common path.

---

## Octopus Deploy

**Files**: none — Octopus is **Continuous Deployment only**.

Octopus Deploy is a release-orchestration tool. It does not run unit / integration test suites — its job starts after a build artefact exists. Webship-js therefore does not ship an Octopus config file, but you can wire any of the CI lanes above to call Octopus once tests pass.

### When you might use Octopus alongside webship-js

- The webship-js test suite is part of a larger product release flow.
- You already use Octopus for production deployments and want a single pane of glass for release tracking.
- You need release approvals, audit logs, or environment-promotion gates that the CI tools above do not provide.

### Setup steps — open account

1. **Octopus Cloud** (SaaS): <https://octopus.com/start> → sign in with email or Google → free for 10 deployment targets. Trial covers everything; the always-free tier covers small teams.
2. **Octopus Server** (self-hosted): download the Windows / Linux installer from <https://octopus.com/downloads>. Free up to 10 deployment targets.

### Wire any CI lane into Octopus

After a webship-js CI build passes:

1. Package the report bundle (or the entire repo) as a NuGet / zip artefact.
2. Push it to Octopus's built-in repository or to an S3 / Azure Blob / Artifactory feed Octopus polls.
3. Trigger a release via the Octopus REST API or CLI:
   ```bash
   octo create-release \
     --project webship-js \
     --packageVersion $CI_BUILD_NUMBER \
     --server https://octopus.example.com \
     --apiKey API-XXXXXXXXXXXX \
     --deployTo Production
   ```

Plug that snippet into any of the YAML files we ship — Octopus does not care which CI triggered it.

### Why webship-js does not ship `.octopus/` configs

- The test-runner phase is done by the time Octopus picks up. Octopus reads its own `OctopusProjectFile` / `process.ocl` configs from a different repo (the "Octopus Project") in most installations — it is not driven by a YAML in the application repo.
- Even when Octopus Config-as-Code is enabled, the OCL files live in a project-scoped repo, not the application repo.

---

## Codeship

**Service retired by CloudBees on 2023-09-30.** Do not add a Codeship config. Existing `codeship-steps.yml` / `codeship-services.yml` files on the internet are dead. If a tutorial references Codeship, treat it as Tier-1 advice for **Travis** or **CircleCI** instead — both ship the same `npm test` pattern.
