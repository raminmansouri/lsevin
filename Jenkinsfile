pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    disableConcurrentBuilds()
    timestamps()
    buildDiscarder(
      logRotator(
        numToKeepStr: '30',
        artifactNumToKeepStr: '10'
      )
    )
    timeout(time: 90, unit: 'MINUTES')
  }

  environment {
    DEPLOY_BRANCH = 'Lsevin-New'

    PROD_ENV_FILE = '/etc/lsevin/projects/lsevin-main.env'

    COMPOSE_FILE = 'deployments/docker/docker-compose.server.yml'
    COMPOSE_PROJECT = 'docker'

    LSEVIN_RELEASE_ROOT = '/opt/lsevin/releases'
    APP_DIR = '/opt/lsevin/app'
  }

  stages {
    stage('Checkout') {
      steps {
        /*
         * This workspace is inside Jenkins home, so deleting it is safe.
         * It prevents files from an older build remaining in the checkout.
         */
        deleteDir()

        checkout scm

        sh '''
          set -Eeuo pipefail

          echo "Checked-out commit:"
          git rev-parse HEAD

          echo "Repository status:"
          git status --short
        '''
      }
    }

    stage('Verify deployment branch') {
      steps {
        sh '''
          set -Eeuo pipefail

          current_commit="$(git rev-parse HEAD)"
          expected_commit="$(git rev-parse "origin/${DEPLOY_BRANCH}")"

          echo "Current commit:  ${current_commit}"
          echo "Expected commit: ${expected_commit}"
          echo "Deploy branch:   ${DEPLOY_BRANCH}"

          if [ "${current_commit}" != "${expected_commit}" ]; then
            echo "ERROR: Jenkins did not check out origin/${DEPLOY_BRANCH}." >&2
            exit 1
          fi
        '''
      }
    }

    stage('Validate') {
      steps {
        /*
         * Calling the script through bash avoids executable-bit problems
         * when files were committed from Windows.
         */
        sh '''
          set -Eeuo pipefail

          test -r "${PROD_ENV_FILE}" || {
            echo "ERROR: Production environment file is missing or unreadable:" >&2
            echo "${PROD_ENV_FILE}" >&2
            exit 1
          }

          test -f "${COMPOSE_FILE}" || {
            echo "ERROR: Docker Compose file was not found:" >&2
            echo "${COMPOSE_FILE}" >&2
            exit 1
          }

          bash deployments/jenkins/validate.sh
        '''
      }
    }

    stage('Deploy production') {
      steps {
        sh '''
          set -Eeuo pipefail

          echo "Deploying commit $(git rev-parse HEAD)"
          echo "Compose project: ${COMPOSE_PROJECT}"
          echo "Compose file:    ${COMPOSE_FILE}"
          echo "Environment:     ${PROD_ENV_FILE}"

          bash deployments/jenkins/deploy-local.sh
        '''
      }
    }
  }

  post {
    success {
      archiveArtifacts(
        artifacts: 'deployments/jenkins/reports/**',
        allowEmptyArchive: true
      )
    }

    failure {
      echo 'Production deployment failed. Review the failed stage and console output.'
    }

    always {
      deleteDir()
    }
  }
}