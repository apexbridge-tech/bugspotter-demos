// Script to manually create admin users
// Usage: node scripts/create-admin.js <email> <password>

/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { Redis } = require('@upstash/redis');

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password>');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters');
    process.exit(1);
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    // Check if admin already exists
    const existing = await redis.get(`admin:${email}`);
    if (existing) {
      console.error(`Error: Admin user ${email} already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = {
      email,
      passwordHash,
      totpEnabled: false,
      createdAt: Date.now(),
    };

    await redis.set(`admin:${email}`, JSON.stringify(adminUser));

    console.log('✓ Admin user created successfully!');
    console.log(`  Email: ${email}`);
    console.log(`  Login at: http://localhost:3000/admin`);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
