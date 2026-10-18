// Every job below reads its deployment pipeline from the corresponding Git
// repository. Jenkins stores only the repository URL, branch, and Jenkinsfile
// path here.

def githubCredentialsId = System.getenv('JENKINS_GITHUB_CREDENTIALS_ID') ?: ''

// Optional repository polling, e.g. 'H/5 * * * *'. Needed where GitHub cannot call the /github-webhook/ endpoint
// (the Iran server): Jenkins asks GitHub for new commits itself. Empty = webhook only (the default).
def pollScmSpec = System.getenv('JENKINS_POLL_SCM') ?: ''
// Only these jobs poll (comma separated). Private repositories need JENKINS_GITHUB_CREDENTIALS_ID before they can.
def pollScmJobs = (System.getenv('JENKINS_POLL_SCM_JOBS') ?: 'lsevin-main-production').split(',')*.trim()

def applications = [
  [
    job: 'lsevin-main-production',
    description: 'Builds and deploys lsevin-api and lsevin-webapp from the main LSevin repository.',
    repository: System.getenv('JENKINS_MAIN_REPOSITORY_URL') ?: 'https://github.com/raminmansouri/lsevin.git',
    branch: System.getenv('JENKINS_MAIN_BRANCH') ?: 'Lsevin-New',
    scriptPath: 'deployments/jenkins/Jenkinsfile.main'
  ],
  [
    job: 'lsevin-main-development',
    description: 'Runs the fast web build from develop for dev.lsevin.com without deploying into production.',
    repository: System.getenv('JENKINS_MAIN_REPOSITORY_URL') ?: 'https://github.com/raminmansouri/lsevin.git',
    branch: System.getenv('JENKINS_MAIN_DEVELOP_BRANCH') ?: 'develop',
    scriptPath: 'deployments/jenkins/Jenkinsfile.develop'
  ],
  [
    job: 'lsevin-crm-production',
    description: 'Deploys the CRM application.',
    repository: System.getenv('JENKINS_CRM_REPOSITORY_URL') ?: 'https://github.com/Mohammadjafariyan/CRM_New.git',
    branch: System.getenv('JENKINS_CRM_BRANCH') ?: 'main',
    scriptPath: 'Jenkinsfile'
  ],
  [
    job: 'lsevin-providers-production',
    description: 'Deploys the Providers application.',
    repository: System.getenv('JENKINS_PROVIDERS_REPOSITORY_URL') ?: 'https://github.com/Mohammadjafariyan/lsevin-portal.git',
    branch: System.getenv('JENKINS_PROVIDERS_BRANCH') ?: 'main',
    scriptPath: 'Jenkinsfile'
  ],
  [
    job: 'lsevin-shop-production',
    description: 'Deploys the Shop application.',
    repository: System.getenv('JENKINS_SHOP_REPOSITORY_URL') ?: 'https://github.com/Mohammadjafariyan/lsevin-shop.git',
    branch: System.getenv('JENKINS_SHOP_BRANCH') ?: 'main',
    scriptPath: 'Jenkinsfile'
  ]
]

applications.each { application ->
  pipelineJob(application.job) {
    description(application.description)

    // Never allow two production deployments of the same application to run
    // simultaneously.
    properties {
      disableConcurrentBuilds()
    }

    logRotator {
      numToKeep(30)
      artifactNumToKeep(10)
    }

    definition {
      cpsScm {
        scriptPath(application.scriptPath)
        lightweight(true)

        scm {
          git {
            remote {
              url(application.repository)

              if (githubCredentialsId) {
                credentials(githubCredentialsId)
              }
            }

            branches("*/${application.branch}")
          }
        }
      }
    }

    if (pollScmSpec && application.job in pollScmJobs) {
      triggers {
        scm(pollScmSpec)
      }
    }

    // GitHub calls /github-webhook/ after each push. This trigger starts the
    // matching job without waiting for Jenkins to poll the repository.
    configure { project ->
      project / 'triggers' / 'com.cloudbees.jenkins.GitHubPushTrigger' {
        spec('')
      }
    }
  }
}
