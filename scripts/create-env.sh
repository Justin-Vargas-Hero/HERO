#!/bin/bash
# This script creates .env.production during Amplify build
# Amplify will have these variables during build time

cat > .env.production << EOF
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=$NEXTAUTH_URL
DATABASE_URL=$DATABASE_URL
NODE_ENV=production
REGION=$REGION
ACCESS_KEY_ID=$ACCESS_KEY_ID
SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY
S3_BUCKET_NAME=$S3_BUCKET_NAME
EMAIL_FROM=$EMAIL_FROM
APP_URL=$APP_URL
USE_S3=$USE_S3
EOF

echo ".env.production created with environment variables"
