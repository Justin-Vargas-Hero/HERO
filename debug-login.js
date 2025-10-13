const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Force use of local database
process.env.DATABASE_URL = 'postgresql://master:Hero123$@localhost:5432/hero-local';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function debugLogin() {
  const email = 'justin@hero.us.org';
  const password = 'P@r!s1121$';

  console.log('🔍 Debugging login for:', email);
  console.log('=====================================\n');

  try {
    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      console.log('❌ User not found with email:', email);
      console.log('\nChecking all users...');
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          username: true,
          emailVerified: true
        }
      });
      console.log('Found users:', allUsers);
      return;
    }

    console.log('✅ User found:');
    console.log('   - Username:', user.username);
    console.log('   - Email:', user.email);
    console.log('   - Email Verified:', user.emailVerified ? `Yes (${user.emailVerified})` : 'No');
    console.log('   - Created:', user.createdAt);

    if (!user.emailVerified) {
      console.log('\n⚠️  EMAIL NOT VERIFIED - This is why you cannot login!');
      console.log('    You need to verify your email before logging in.');

      // Check for verification token
      const token = await prisma.verificationToken.findFirst({
        where: {
          identifier: email.toLowerCase()
        }
      });

      if (token) {
        console.log('\n📧 Verification token exists:');
        console.log('   - Token expires:', token.expires);
        console.log('   - Is expired:', token.expires < new Date() ? 'Yes' : 'No');
      } else {
        console.log('\n📧 No verification token found');
      }
    }

    // Test password
    console.log('\n🔑 Testing password...');
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('   Password valid:', validPassword ? 'Yes' : 'No');

    if (!validPassword) {
      console.log('\n❌ Password does not match!');
      console.log('   The password you provided does not match the stored hash.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();