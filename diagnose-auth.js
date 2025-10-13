const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📋 Environment Configuration:');
  console.log('=====================================');

  envContent.split('\n').forEach(line => {
    if (line.includes('DATABASE_URL')) {
      const [key, value] = line.split('=');
      console.log(`${key} = ${value}`);
      process.env[key] = value;
    }
    if (line.includes('NEXTAUTH_SECRET')) {
      console.log('NEXTAUTH_SECRET = [PRESENT]');
    }
  });
  console.log();
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function diagnoseAuth() {
  const email = 'justin@hero.us.org';
  const password = 'P@r!s1121$';

  console.log('🔍 Authentication Diagnostics');
  console.log('=====================================\n');

  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Find user
    console.log('2️⃣ Looking for user:', email);
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      console.log('❌ User not found\n');

      console.log('Checking all users in database:');
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          username: true
        }
      });
      console.log('Users found:', allUsers);
      return;
    }

    console.log('✅ User found');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   Name:', user.firstName, user.lastName);
    console.log('   Timezone:', user.timezone || 'UTC');
    console.log();

    // Check email verification
    console.log('3️⃣ Checking email verification...');
    if (!user.emailVerified) {
      console.log('❌ Email NOT verified');
      console.log('   User must verify email before logging in\n');
      return;
    }
    console.log('✅ Email verified on:', user.emailVerified);
    console.log();

    // Test password
    console.log('4️⃣ Testing password...');
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('❌ Password invalid\n');

      // Test if password hash is valid
      console.log('Testing password hash format...');
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log('✅ Password hash format is valid (bcrypt)');
      } else {
        console.log('❌ Password hash format is invalid');
      }
      return;
    }
    console.log('✅ Password is correct\n');

    // Check for active sessions
    console.log('5️⃣ Checking for existing sessions...');
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { expires: 'desc' },
      take: 3
    });

    if (sessions.length > 0) {
      console.log(`Found ${sessions.length} session(s):`);
      sessions.forEach((session, i) => {
        const expired = session.expires < new Date();
        console.log(`   Session ${i + 1}: ${expired ? '❌ Expired' : '✅ Active'} (expires: ${session.expires})`);
      });
    } else {
      console.log('No existing sessions found');
    }
    console.log();

    // Summary
    console.log('=====================================');
    console.log('📊 AUTHENTICATION STATUS SUMMARY:');
    console.log('=====================================');
    console.log('✅ Database connection: OK');
    console.log('✅ User exists: YES');
    console.log('✅ Email verified: YES');
    console.log('✅ Password valid: YES');
    console.log('✅ Ready to login: YES');
    console.log();
    console.log('🎉 This user can successfully login!');
    console.log();
    console.log('To login via the web interface:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Click "Sign in" button');
    console.log('3. Enter email: justin@hero.us.org');
    console.log('4. Enter password: P@r!s1121$');
    console.log('5. Click "Sign in"');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseAuth();