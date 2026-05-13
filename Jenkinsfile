// Jenkins declarative pipeline for webship-js.
//
// Runs the full BDD suite against an http-server fixture on port 8080.
// Uses the official Playwright image so chromium + all apt deps are baked in.
//
// Requirements on the Jenkins controller:
//   - Docker Pipeline plugin (built into the "suggested plugins" install)
//   - One executor with the docker daemon reachable
//
// Drop the file at repo root and configure a Pipeline job that points
// "Pipeline script from SCM" at this branch.

pipeline {
  agent {
    docker {
      image 'mcr.microsoft.com/playwright:v1.58.2-jammy'
      args  '-u root:root'
    }
  }
  options {
    timestamps()
    ansiColor('xterm')
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }
  environment {
    FORCE_COLOR = '1'
    LAUNCH_URL  = 'http://localhost:8080'
  }
  stages {
    stage('Install') {
      steps { sh 'npm install' }
    }
    stage('Browsers') {
      steps { sh 'npx playwright install --with-deps chromium' }
    }
    stage('Serve fixtures') {
      steps {
        sh 'nohup npm start > /tmp/srv.log 2>&1 &'
        sh 'sleep 3'
        sh 'curl -sf http://localhost:8080/ > /dev/null'
      }
    }
    stage('Test') {
      steps { sh 'npm test' }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'tests/reports/cucumber_report.html,tests/reports/cucumber_report.pdf,tests/reports/cucumber_report.json,screenshots/**/*',
                       allowEmptyArchive: true
    }
  }
}
