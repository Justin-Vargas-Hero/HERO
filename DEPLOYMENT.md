# HERO AWS Amplify Deployment Guide

## 📋 Quick Start Checklist

### 1. Prerequisites
- [ ] AWS Account created
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js and npm installed
- [ ] Git repository with all code committed

### 2. Automated Setup (Choose One)

#### Option A: Windows PowerShell
```powershell
# Run from the hero directory
.\scripts\setup-aws.ps1
```

#### Option B: Manual AWS Setup
Follow steps 3-5 below

### 3. Create AWS Resources (If Manual)

#### 3.1 Create S3 Bucket for Uploads
```bash
# Replace YOUR_ACCOUNT_ID with your AWS account ID
aws s3api create-bucket --bucket hero-prod-assets-YOUR_ACCOUNT_ID --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket hero-prod-assets-YOUR_ACCOUNT_ID \
  --versioning-configuration Status=Enabled

# Configure CORS
aws s3api put-bucket-cors \
  --bucket hero-prod-assets-YOUR_ACCOUNT_ID \
  --cors-configuration file://scripts/cors.json
```

#### 3.2 Create RDS Database
```bash
# Create database
aws rds create-db-instance \
  --db-instance-identifier hero-prod-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username master \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --publicly-accessible

# Wait for creation (5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier hero-prod-db

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier hero-prod-db \
  --query "DBInstances[0].Endpoint.Address"
```

#### 3.3 Create IAM User
```bash
# Create user
aws iam create-user --user-name hero-prod-user

# Create access key
aws iam create-access-key --user-name hero-prod-user

# Attach S3 policy (save the policy JSON first)
aws iam put-user-policy \
  --user-name hero-prod-user \
  --policy-name HeroS3Policy \
  --policy-document file://scripts/s3-policy.json
```

### 4. Configure Environment Variables

Run the preparation script:
```bash
npm run prepare-deployment
```

Then update `.env.prod` with your AWS values:
```env
# Database (from RDS)
DATABASE_URL=postgresql://master:PASSWORD@ENDPOINT:5432/hero

# NextAuth
NEXTAUTH_URL=https://hero.us.org
NEXTAUTH_SECRET=your-generated-secret

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=hero-prod-assets-YOUR_ACCOUNT_ID

# Email
EMAIL_FROM=no-reply@hero.us.org
```

### 5. Deploy with Amplify

#### 5.1 Install Amplify CLI
```bash
npm install -g @aws-amplify/cli
amplify configure
```

#### 5.2 Initialize Amplify Project
```bash
amplify init

# Answer the prompts:
# ? Enter a name for the project: hero
# ? Choose your default editor: (your editor)
# ? Choose the type of app: javascript
# ? What javascript framework: react
# ? Source Directory Path: src
# ? Distribution Directory Path: .next
# ? Build Command: npm run amplify:build
# ? Start Command: npm run amplify:start
```

#### 5.3 Add Hosting
```bash
amplify add hosting

# Choose:
# ? Select the plugin module: Hosting with Amplify Console
# ? Choose a type: Continuous deployment (GitHub)
```

#### 5.4 Connect GitHub Repository
1. Amplify will open your browser
2. Connect your GitHub account
3. Select your repository
4. Choose the branch to deploy

#### 5.5 Configure Build Settings
In Amplify Console:
1. Go to "Build settings"
2. Verify `amplify.yml` is being used
3. Add environment variables from `.env.prod`

#### 5.6 Deploy
```bash
amplify push
amplify publish
```

### 6. Configure Custom Domain

In AWS Amplify Console:
1. Go to "Domain management"
2. Click "Add domain"
3. Enter `hero.us.org`
4. Follow DNS configuration instructions
5. Add CNAME records to your DNS provider
6. Wait for SSL certificate (15-30 minutes)

## 🚀 Post-Deployment

### Monitor Your App
- CloudWatch Logs: Check for errors
- Amplify Console: View deployment status
- RDS Console: Monitor database performance

### Update Your App
```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Amplify will auto-deploy
```

### Rollback if Needed
```bash
# In Amplify Console
# Go to "Deployments" → Select previous build → "Redeploy this version"
```

## 🔧 Troubleshooting

### Database Connection Issues
- Ensure RDS is publicly accessible
- Check security group allows port 5432
- Verify DATABASE_URL format
- Use connection pooling for serverless

### Upload Issues
- Check S3 bucket permissions
- Verify CORS configuration
- Ensure IAM user has S3 access

### Build Failures
- Check `amplify.yml` syntax
- Verify all dependencies in `package.json`
- Check build logs in Amplify Console

### Domain Issues
- Verify DNS records are correct
- Wait for propagation (up to 48 hours)
- Check SSL certificate status

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| NEXTAUTH_URL | Your app's URL | https://hero.us.org |
| NEXTAUTH_SECRET | Random secret for JWT | 64-character hex string |
| AWS_REGION | AWS region | us-east-1 |
| AWS_ACCESS_KEY_ID | IAM user access key | AKIA... |
| AWS_SECRET_ACCESS_KEY | IAM user secret | 40-character string |
| S3_BUCKET_NAME | S3 bucket for uploads | hero-prod-assets-123456 |
| EMAIL_FROM | Sender email address | no-reply@hero.us.org |

## 🎯 Quick Commands

```bash
# Local development
npm run dev

# Prepare for deployment
npm run prepare-deployment

# Build production
npm run build

# Database migrations
npm run db:push

# Check deployment status
amplify status

# View logs
amplify console
```

## 📞 Support Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Next.js on AWS](https://aws.amazon.com/blogs/mobile/amplify-next-js-13/)
- [RDS PostgreSQL Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [S3 CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)

---

**Last Updated**: October 2025
**Version**: 1.0.0
