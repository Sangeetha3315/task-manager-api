pipeline {
    agent any

    triggers {
        githubPush()
    }

    options {
        skipDefaultCheckout(true)
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        IMAGE_NAME = 'task-manager-api'
        DEPLOY_CONTAINER = 'task-manager-api'
        DEPLOY_PORT = '3000'
        SONARQUBE_SERVER = 'SonarQubeServer'
        SONAR_SCANNER = 'SonarScanner'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test:report'
                sh 'npm run test:coverage'
            }
        }

        stage('Code Quality') {
            steps {
                script {
                    def scannerHome = tool env.SONAR_SCANNER
                    withSonarQubeEnv(env.SONARQUBE_SERVER) {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build --tag "$IMAGE_NAME:$BUILD_NUMBER" .'
            }
        }

        stage('Deploy') {
            when {
                expression {
                    env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main'
                }
            }
            steps {
                sh '''
                    if docker container inspect "$DEPLOY_CONTAINER" >/dev/null 2>&1; then
                        docker rm --force "$DEPLOY_CONTAINER"
                    fi

                    docker run --detach \
                        --name "$DEPLOY_CONTAINER" \
                        --restart unless-stopped \
                        --publish "$DEPLOY_PORT:3000" \
                        "$IMAGE_NAME:$BUILD_NUMBER"
                '''
            }
        }

        stage('Verify') {
            when {
                expression {
                    env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main'
                }
            }
            steps {
                timeout(time: 60, unit: 'SECONDS') {
                    waitUntil(initialRecurrencePeriod: 2000, quiet: true) {
                        return sh(
                            script: "node -e 'fetch(\"http://127.0.0.1:${env.DEPLOY_PORT}/health\").then((response) => { if (!response.ok) process.exit(1); return response.text(); }).then(console.log).catch(() => process.exit(1))'",
                            returnStatus: true
                        ) == 0
                    }
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'test-results.xml'
        }
    }
}
