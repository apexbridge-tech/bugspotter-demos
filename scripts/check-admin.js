// Quick script to check admin user in Redis
/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');

async function checkAdmin() {
  const email = 'demo@bugspotter.io';

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    console.log('Checking admin user:', email);
    const userData = await redis.get(`admin:${email}`);
    
    if (!userData) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✓ Admin user found:');
    console.log(JSON.stringify(userData, null, 2));
    
    // Check the structure
    const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
    console.log('\nParsed user object:');
    console.log('  Email:', user.email);
    console.log('  Has passwordHash:', !!user.passwordHash);
    console.log('  totpEnabled:', user.totpEnabled);
    console.log('  twoFactorEnabled:', user.twoFactorEnabled);
    console.log('  createdAt:', user.createdAt);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAdmin();
