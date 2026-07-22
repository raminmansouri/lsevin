import hudson.model.User
import hudson.security.FullControlOnceLoggedInAuthorizationStrategy
import hudson.security.HudsonPrivateSecurityRealm
import jenkins.model.Jenkins

Jenkins instance = Jenkins.get()
String adminUser = System.getenv('JENKINS_ADMIN_USER') ?: 'admin'
File passwordFile = new File('/run/secrets/jenkins-admin-password')

if (!passwordFile.isFile()) {
    throw new IllegalStateException('Missing /run/secrets/jenkins-admin-password')
}

String adminPassword = passwordFile.text.trim()
if (adminPassword.length() < 20) {
    throw new IllegalStateException('Jenkins administrator password must contain at least 20 characters')
}

HudsonPrivateSecurityRealm realm
if (instance.securityRealm instanceof HudsonPrivateSecurityRealm) {
    realm = (HudsonPrivateSecurityRealm) instance.securityRealm
} else {
    realm = new HudsonPrivateSecurityRealm(false)
    instance.setSecurityRealm(realm)
}

if (User.getById(adminUser, false) == null) {
    realm.createAccount(adminUser, adminPassword)
    println("Created Jenkins administrator account: ${adminUser}")
}

FullControlOnceLoggedInAuthorizationStrategy authorization =
    new FullControlOnceLoggedInAuthorizationStrategy()
authorization.setAllowAnonymousRead(false)
instance.setAuthorizationStrategy(authorization)
instance.setSlaveAgentPort(-1)
instance.save()
