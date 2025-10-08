#!/bin/bash
# This script generates runtime-env.ts with actual environment values during build

echo "=== Generating runtime environment configuration ==="

# Create the runtime-env.ts file with actual values
cat > src/lib/runtime-env.ts << EOF
// Auto-generated during build - DO NOT EDIT
// Generated at: $(date)

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '${NEXTAUTH_SECRET}';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || '${NEXTAUTH_URL}';
process.env.DATABASE_URL = process.env.DATABASE_URL || '${DATABASE_URL}';
process.env.NODE_ENV = 'production';
process.env.REGION = process.env.REGION || '${REGION}';
process.env.ACCESS_KEY_ID = process.env.ACCESS_KEY_ID || '${ACCESS_KEY_ID}';
process.env.SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY || '${SECRET_ACCESS_KEY}';
process.env.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '${S3_BUCKET_NAME}';
process.env.EMAIL_FROM = process.env.EMAIL_FROM || '${EMAIL_FROM}';
process.env.APP_URL = process.env.APP_URL || '${APP_URL}';
process.env.USE_S3 = process.env.USE_S3 || '${USE_S3}';

console.log('Runtime environment loaded');
EOF

echo "Runtime environment file generated"

# Also create .env.production for Next.js
cat > .env.production << EOF
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${NEXTAUTH_URL}
DATABASE_URL=${DATABASE_URL}
NODE_ENV=production
REGION=${REGION}
ACCESS_KEY_ID=${ACCESS_KEY_ID}
SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}
S3_BUCKET_NAME=${S3_BUCKET_NAME}
EMAIL_FROM=${EMAIL_FROM}
APP_URL=${APP_URL}
USE_S3=${USE_S3}
EOF

echo ".env.production created"

# Verify critical variables
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "ERROR: NEXTAUTH_SECRET is empty - Amplify environment variables not loading!"
    echo "Check Amplify Console > App settings > Environment variables"
    exit 1
fi

echo "=== Environment setup complete ==="
