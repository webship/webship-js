// TeamCity Kotlin DSL for webship-js.
//
// Versioned settings file. TeamCity reads it on every commit to the
// configured branch and re-syncs the build configuration with what is in
// version control.
//
// Setup:
//   1. jetbrains.com/teamcity/cloud → sign in → start free trial.
//   2. Create project → connect VCS root (GitHub OAuth).
//   3. Project Settings → Versioned Settings → enable Kotlin DSL.
//      TeamCity will offer to generate this file the first time; we ship
//      a hand-crafted version below.
//
// Free tier: 600 build-minutes / month + 1 build agent + 100 build configs.
// The 9-minute suite fits ~66 runs / month.

import jetbrains.buildServer.configs.kotlin.v2019_2.*
import jetbrains.buildServer.configs.kotlin.v2019_2.buildSteps.script
import jetbrains.buildServer.configs.kotlin.v2019_2.triggers.vcs
import jetbrains.buildServer.configs.kotlin.v2019_2.buildFeatures.commitStatusPublisher

version = "2024.03"

project {
    description = "Webship-js — BDD on Playwright + Cucumber-js"

    buildType(WebshipJsTest)
}

object WebshipJsTest : BuildType({
    id("WebshipJsTest")
    name = "Test"

    params {
        param("env.FORCE_COLOR", "1")
        param("env.LAUNCH_URL",  "http://localhost:8080")
    }

    vcs {
        root(DslContext.settingsRoot)
        cleanCheckout = true
    }

    steps {
        script {
            name = "Install + test"
            scriptContent = """
                set -euo pipefail
                node --version
                npm --version
                npm install
                npx playwright install --with-deps chromium
                nohup npm start > /tmp/srv.log 2>&1 &
                sleep 3
                curl -sf http://localhost:8080/ > /dev/null
                npm test
            """.trimIndent()
            dockerImage      = "mcr.microsoft.com/playwright:v1.58.2-jammy"
            dockerPull       = true
            dockerRunParameters = "--user root:root --network host"
        }
    }

    triggers {
        vcs {
            branchFilter = """
                +:2.0.x
                +:refs/tags/2.0.*
            """.trimIndent()
        }
    }

    features {
        commitStatusPublisher {
            publisher = github {
                githubUrl = "https://api.github.com"
                authType = personalToken { token = "credentialsJSON:webship-js-github-token" }
            }
        }
    }

    artifactRules = """
        tests/reports/cucumber_report.html
        tests/reports/cucumber_report.pdf
        tests/reports/cucumber_report.json
        screenshots/** => screenshots
    """.trimIndent()

    requirements {
        contains("os.name", "Linux")
    }
})
