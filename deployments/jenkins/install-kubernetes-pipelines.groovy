import jenkins.model.Jenkins
import org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition

def pipelines = [
  [
    job: 'lsevin-main-production',
    file: '/opt/lsevin/app/deployments/jenkins/Jenkinsfile.main',
    url: 'https://github.com/raminmansouri/lsevin',
    credentials: 'github-lsevin',
    branch: '*/Lsevin-New'
  ],
  [
    job: 'lsevin-crm-production',
    file: '/opt/lsevin-crm/Jenkinsfile',
    url: 'https://github.com/Mohammadjafariyan/CRM_New.git',
    credentials: '2536234a-3b30-490b-9bb2-b36d512ec6cd',
    branch: '*/master'
  ],
  [
    job: 'lsevin-providers-production',
    file: '/opt/lsevin-providers/Jenkinsfile',
    url: 'https://github.com/Mohammadjafariyan/lsevin-portal.git',
    credentials: 'github-lsevin',
    branch: '*/main'
  ]
]

pipelines.each { item ->
  def job = Jenkins.instance.getItemByFullName(item.job)
  if (job == null) {
    throw new IllegalStateException("Jenkins job not found: ${item.job}")
  }

  def checkout = "checkout([\$class: 'GitSCM', branches: [[name: '${item.branch}']], userRemoteConfigs: [[url: '${item.url}', credentialsId: '${item.credentials}']]])"
  def pipeline = new File(item.file).getText('UTF-8').replace('checkout scm', checkout)
  if (!pipeline.contains('k3s-deploy.sh')) {
    throw new IllegalStateException("Refusing to install non-Kubernetes pipeline for ${item.job}")
  }

  job.setDefinition(new CpsFlowDefinition(pipeline, false))
  job.save()
  println("Installed Kubernetes pipeline: ${item.job}")
}
