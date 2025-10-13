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

async function testLogin() {
  const email = 'justin@hero.us.org';
  const password = 'P@r!s1121$';

  console.log('🔍 Testing login for:', email);
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
      console.log('❌ User not found');
      return { success: false, error: 'User not found' };
    }

    console.log('✅ User found:');
    console.log('   - ID:', user.id);
    console.log('   - Username:', user.username);
    console.log('   - Email:', user.email);
    console.log('   - Email Verified:', user.emailVerified ? 'Yes' : 'No');

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('\n❌ Email not verified');
      return { success: false, error: 'Please verify your email before logging in' };
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('\n🔑 Password valid:', validPassword ? 'Yes' : 'No');

    if (!validPassword) {
      console.log('❌ Invalid password');
      return { success: false, error: 'Invalid password' };
    }

    console.log('\n✅ LOGIN SUCCESSFUL!');
    console.log('User can login with these credentials.');

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        timezone: user.timezone || 'UTC'
      }
    };

  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

testLogin().then(result => {
  console.log('\n=====================================');
  console.log('Result:', JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});