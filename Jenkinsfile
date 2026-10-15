pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        string(name: 'AWS_REGION', defaultValue: 'ap-south-1', description: 'AWS region containing ECR and the EC2 instance')
        string(name: 'ECR_REPOSITORY', defaultValue: 'campusmart', description: 'Base name for the frontend and backend ECR repositories')
        string(name: 'EC2_HOST', defaultValue: '', description: 'Public DNS name or IP address of the EC2 instance')
        string(name: 'EC2_USER', defaultValue: 'ec2-user', description: 'SSH user on the EC2 instance')
        string(name: 'SSH_CREDENTIALS_ID', defaultValue: 'campusmart-ec2-key', description: 'Jenkins SSH private-key credential ID')
        string(name: 'DEPLOY_PATH', defaultValue: '/opt/campusmart', description: 'Application directory on the EC2 instance')
    }

    stages {
        stage('Validate deployment parameters') {
            steps {
                script {
                    if (!params.EC2_HOST?.trim()) {
                        error('Set the EC2_HOST build parameter before deploying.')
                    }
                }
            }
        }

        stage('Validate and test') {
            steps {
                sh '''
                    set -eu
                    cp .env.example .env
                    docker compose build
                    docker compose run --rm backend python manage.py check
                '''
            }
        }

        stage('Build and push images') {
            steps {
                sh '''
                    set -eu
                    : "${AWS_REGION:?Set AWS_REGION}"
                    : "${ECR_REPOSITORY:?Set ECR_REPOSITORY}"
                    ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
                    REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                    BACKEND_REPO="${ECR_REPOSITORY}-backend"
                    FRONTEND_REPO="${ECR_REPOSITORY}-frontend"

                    for REPOSITORY in "$BACKEND_REPO" "$FRONTEND_REPO"; do
                        if ! aws ecr describe-repositories --region "$AWS_REGION" --repository-names "$REPOSITORY" >/dev/null 2>&1; then
                            aws ecr create-repository --region "$AWS_REGION" --repository-name "$REPOSITORY" >/dev/null
                        fi
                    done

                    aws ecr get-login-password --region "$AWS_REGION" |
                        docker login --username AWS --password-stdin "$REGISTRY"

                    docker tag campusmart-backend:local "$REGISTRY/$BACKEND_REPO:$BUILD_NUMBER"
                    docker tag campusmart-backend:local "$REGISTRY/$BACKEND_REPO:latest"
                    docker tag campusmart-frontend:local "$REGISTRY/$FRONTEND_REPO:$BUILD_NUMBER"
                    docker tag campusmart-frontend:local "$REGISTRY/$FRONTEND_REPO:latest"

                    docker push "$REGISTRY/$BACKEND_REPO:$BUILD_NUMBER"
                    docker push "$REGISTRY/$BACKEND_REPO:latest"
                    docker push "$REGISTRY/$FRONTEND_REPO:$BUILD_NUMBER"
                    docker push "$REGISTRY/$FRONTEND_REPO:latest"
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    withEnv([
                        "AWS_REGION=${params.AWS_REGION}",
                        "ECR_REPOSITORY=${params.ECR_REPOSITORY}",
                        "EC2_HOST=${params.EC2_HOST}",
                        "EC2_USER=${params.EC2_USER}",
                        "DEPLOY_PATH=${params.DEPLOY_PATH}"
                    ]) {
                        sshagent(credentials: [params.SSH_CREDENTIALS_ID]) {
                            sh '''
                                set -eu
                                ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
                                REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                                BACKEND_IMAGE="$REGISTRY/${ECR_REPOSITORY}-backend:$BUILD_NUMBER"
                                FRONTEND_IMAGE="$REGISTRY/${ECR_REPOSITORY}-frontend:$BUILD_NUMBER"

                                scp -o StrictHostKeyChecking=yes docker-compose.yml \
                                    "$EC2_USER@$EC2_HOST:$DEPLOY_PATH/docker-compose.yml"
                                ssh -o StrictHostKeyChecking=yes "$EC2_USER@$EC2_HOST" \
                                    "cd '$DEPLOY_PATH' && aws ecr get-login-password --region '$AWS_REGION' | docker login --username AWS --password-stdin '$REGISTRY' && BACKEND_IMAGE='$BACKEND_IMAGE' FRONTEND_IMAGE='$FRONTEND_IMAGE' docker compose pull && BACKEND_IMAGE='$BACKEND_IMAGE' FRONTEND_IMAGE='$FRONTEND_IMAGE' docker compose up -d --remove-orphans"
                            '''
                        }
                    }
                }
            }
        }
    }
}
