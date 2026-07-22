pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    disableConcurrentBuilds()
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '10'))
    timeout(time: 90, unit: 'MINUTES')
  }

  environment {
    DEPLOY_BRANCH = 'Lsevin-New'
    APP_DIR = '/opt/lsevin/app'
    LSEVIN_RELEASE_ROOT = '/opt/lsevin/releases'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh '''
          set -Eeuo pipefail
          git rev-parse HEAD
          git status --short
        '''
      }
    }

    stage('Validate') {
      steps {
        sh 'bash  ./deployments/jenkins/validate.sh'
      }
    }

    stage('Deploy production') {
      steps {
        sh '''
          set -Eeuo pipefail
          current_branch="${GIT_BRANCH#origin/}"
          [ "$current_branch" = "$DEPLOY_BRANCH" ] || {
            echo "Refusing deployment from $current_branch; expected $DEPLOY_BRANCH" >&2
            exit 1
          }
          ./deployments/jenkins/deploy-local.sh
        '''
      }
    }
  }

  post {
    success {
      archiveArtifacts artifacts: 'deployments/jenkins/reports/**', allowEmptyArchive: true
    }
    always {
      deleteDir()
    }
  }
}
