// Test password verification
/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { Redis } = require('@upstash/redis');

async function testLogin() {
  const email = 'demo@bugspotter.io';
  const password = '2xogPkPDRf4s2D3QQ9ys';

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    console.log('Testing login for:', email);
    
    const userData = await redis.get(`admin:${email}`);
    if (!userData) {
      console.log('❌ User not found');
      return;
    }

    const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
    console.log('✓ User found');
    console.log('  Password hash:', user.passwordHash);
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('\n  Password verification:', isValid ? '✓ VALID' : '❌ INVALID');
    
    if (isValid) {
      console.log('\n✅ Login should work!');
    } else {
      console.log('\n❌ Password does not match');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLogin();
