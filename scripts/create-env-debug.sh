#!/bin/bash
# This script creates .env.production during Amplify build
# Debug and create environment file

echo "=== Starting environment setup ==="

# Debug: Check if variables exist
echo "Checking if environment variables are set..."
[ -z "$NEXTAUTH_SECRET" ] && echo "WARNING: NEXTAUTH_SECRET is NOT set" || echo "✓ NEXTAUTH_SECRET is set"
[ -z "$DATABASE_URL" ] && echo "WARNING: DATABASE_URL is NOT set" || echo "✓ DATABASE_URL is set"
[ -z "$NEXTAUTH_URL" ] && echo "WARNING: NEXTAUTH_URL is NOT set" || echo "✓ NEXTAUTH_URL is set"

# Create .env.production file
echo "Creating .env.production file..."

cat > .env.production << 'EOL'
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
EOL

# Now substitute the actual values
envsubst < .env.production > .env.production.tmp
mv .env.production.tmp .env.production

echo "=== .env.production file created ==="

# Verify file exists and has content
if [ -f .env.production ]; then
    echo "File exists with $(wc -l < .env.production) lines"
    echo "First line check:"
    head -n 1 .env.production | sed 's/SECRET=.*/SECRET=***/'
else
    echo "ERROR: .env.production was not created!"
fi

echo "=== Environment setup complete ==="
