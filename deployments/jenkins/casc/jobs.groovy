// Every job below reads its deployment pipeline from the corresponding Git
// repository. Jenkins stores only the repository URL, branch, and Jenkinsfile
// path here.

def githubCredentialsId = System.getenv('JENKINS_GITHUB_CREDENTIALS_ID') ?: ''

def applications = [
  [
    job: 'lsevin-main-production',
    description: 'Builds and deploys lsevin-api and lsevin-webapp from the main LSevin repository.',
    repository: System.getenv('JENKINS_MAIN_REPOSITORY_URL') ?: 'https://github.com/raminmansouri/lsevin.git',
    branch: System.getenv('JENKINS_MAIN_BRANCH') ?: 'Lsevin-New',
    scriptPath: 'deployments/jenkins/Jenkinsfile.main'
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

    // GitHub calls /github-webhook/ after each push. This trigger starts the
    // matching job without waiting for Jenkins to poll the repository.
    configure { project ->
      project / 'triggers' / 'com.cloudbees.jenkins.GitHubPushTrigger' {
        spec('')
      }
    }
  }
}
