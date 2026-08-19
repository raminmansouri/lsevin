node {
    ws('/opt/lsevin-providers/source') {
        withEnv([
            'PROVIDERS_RUNTIME_ENV_FILE=/etc/lsevin/projects/providers.env',
            'PROVIDERS_MIGRATION_ENV_FILE=/etc/lsevin/projects/providers-migration.env',
            'PROVIDERS_PUBLIC_HEALTH_URL=https://providers.lsevin.com/api/health',
            'PROVIDERS_PUBLIC_READY_URL=https://providers.lsevin.com/api/ready',
            'PROVIDERS_COMPOSE_FILE=deployment/docker/compose.production.yml'
        ]) {
            timestamps {
                stage('1. Checkout') {
                    deleteDir()
                    checkout scm
                }

                stage('2. Image tag') {
                    env.IMAGE_TAG = sh(
                        script: 'git rev-parse --short=12 HEAD',
                        returnStdout: true
                    ).trim()
                    echo "Publishing ${env.IMAGE_TAG}"
                }

                stage('3. Build immutable images') {
                    sh "docker build --target production --build-arg NEXT_PUBLIC_APP_URL=https://providers.lsevin.com --build-arg NEXT_PUBLIC_DEFAULT_LOCALE=fa-IR --build-arg NEXT_PUBLIC_DEFAULT_TIMEZONE=Asia/Tehran --build-arg NEXT_PUBLIC_LOCALE_COOKIE_DOMAIN=.lsevin.com -t lsevin-providers:${env.IMAGE_TAG} ."
                    sh "docker build -f deployment/database/Dockerfile -t lsevin-providers-db:${env.IMAGE_TAG} ."
                }

                stage('4. Validate Compose') {
                    sh "IMAGE_TAG=${env.IMAGE_TAG} docker compose -f ${env.PROVIDERS_COMPOSE_FILE} config --quiet"
                }

                stage('5. Publish database schema') {
                    retry(3) {
                        sh "IMAGE_TAG=${env.IMAGE_TAG} docker compose -f ${env.PROVIDERS_COMPOSE_FILE} run --rm --no-deps migrate"
                    }
                }

                deployReplica('6. Publish replica 1', 'web-1', 'lsevin-providers-1')
                deployReplica('7. Publish replica 2', 'web-2', 'lsevin-providers-2')

                stage('8. Verify public endpoints') {
                    sh "curl --fail --show-error --silent --location --connect-timeout 5 --max-time 10 ${env.PROVIDERS_PUBLIC_HEALTH_URL} >/dev/null"
                    sh "curl --fail --show-error --silent --location --connect-timeout 5 --max-time 10 ${env.PROVIDERS_PUBLIC_READY_URL} >/dev/null"
                }
            }
        }
    }
}

def deployReplica(String stageName, String serviceName, String containerName) {
    stage(stageName) {
        try {
            sh "IMAGE_TAG=${env.IMAGE_TAG} docker compose -f ${env.PROVIDERS_COMPOSE_FILE} up -d --no-deps --force-recreate ${serviceName}"

            timeout(time: 3, unit: 'MINUTES') {
                waitUntil {
                    sleep 5
                    return sh(
                        returnStatus: true,
                        script: "docker inspect --format='{{.State.Health.Status}}' ${containerName} | grep -qx healthy"
                    ) == 0
                }
            }
        } catch (err) {
            sh "IMAGE_TAG=${env.IMAGE_TAG} docker compose -f ${env.PROVIDERS_COMPOSE_FILE} logs --no-color --tail=300 ${serviceName} || true"
            sh "IMAGE_TAG=${env.IMAGE_TAG} docker compose -f ${env.PROVIDERS_COMPOSE_FILE} stop ${serviceName} || true"
            throw err
        }
    }
}
