// Force environment variables for Amplify deployment
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '51329660874c337103ba1313c4f1125afc4ec27e33874533fee9c58a1a3';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'https://hero.us.org';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://master:Hero123$@hero-prod.c6bko2q8ilhi.us-east-1.rds.amazonaws.com:5432/hero';
process.env.NODE_ENV = 'production';
