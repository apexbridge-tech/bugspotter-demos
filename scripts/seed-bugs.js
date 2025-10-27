// Script to seed test bugs for demo purposes
require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const testBugs = [
  {
    subdomain: 'acme-demo',
    errorMessage: 'Payment processing failed - Card declined',
    stackTrace: 'Error: Payment declined\n    at processPayment (payment.ts:45)\n    at handleCheckout (checkout.ts:123)',
    severity: 'critical',
    demo: 'kazbank',
    elementId: 'checkout-btn',
  },
  {
    subdomain: 'acme-demo',
    errorMessage: 'Failed to load user profile',
    stackTrace: 'TypeError: Cannot read property "name" of undefined\n    at UserProfile.render (profile.tsx:12)',
    severity: 'high',
    demo: 'kazbank',
    elementId: 'user-profile',
  },
  {
    subdomain: 'techcorp-test',
    errorMessage: 'Application submission timeout',
    stackTrace: 'Error: Request timeout after 30000ms\n    at submitApplication (apply.ts:67)',
    severity: 'high',
    demo: 'talentflow',
    elementId: 'submit-application',
  },
  {
    subdomain: 'techcorp-test',
    errorMessage: 'Resume upload failed - File too large',
    stackTrace: 'Error: File size exceeds 5MB limit\n    at validateFile (upload.ts:23)',
    severity: 'medium',
    demo: 'talentflow',
  },
  {
    subdomain: 'retail-demo',
    errorMessage: 'Cart total calculation incorrect',
    stackTrace: 'Error: Tax calculation mismatch\n    at calculateTotal (cart.ts:89)\n    at updateCart (cart.ts:45)',
    severity: 'critical',
    demo: 'quickmart',
    elementId: 'cart-total',
  },
  {
    subdomain: 'retail-demo',
    errorMessage: 'Product image failed to load',
    stackTrace: 'Error: 404 - Image not found\n    at loadImage (product.tsx:34)',
    severity: 'low',
    demo: 'quickmart',
    elementId: 'product-image',
  },
  {
    subdomain: 'startup-xyz',
    errorMessage: 'Login authentication error',
    stackTrace: 'Error: Invalid credentials\n    at authenticate (auth.ts:56)',
    severity: 'critical',
    demo: 'kazbank',
    elementId: 'login-form',
  },
  {
    subdomain: 'startup-xyz',
    errorMessage: 'Search results not displaying',
    stackTrace: 'TypeError: Cannot read property "results" of null\n    at displayResults (search.tsx:78)',
    severity: 'medium',
    demo: 'quickmart',
  },
];

async function createSession(subdomain, company) {
  const now = Date.now();
  const SESSION_TTL = 2 * 60 * 60; // 2 hours
  
  const session = {
    subdomain,
    company,
    createdAt: now,
    expiresAt: now + SESSION_TTL * 1000,
    events: 0,
    bugs: 0,
  };

  await redis.setex(`session:${subdomain}`, SESSION_TTL, JSON.stringify(session));
  console.log(`✅ Created session: ${subdomain}`);
}

async function storeBug(bug) {
  const bugEvent = {
    ...bug,
    id: `bug-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now() - Math.floor(Math.random() * 3600000), // Random time within last hour
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  };

  const SESSION_TTL = 2 * 60 * 60;

  // Store bug in list
  await redis.lpush(`bugs:${bug.subdomain}`, JSON.stringify(bugEvent));

  // Update bug count in session
  const sessionData = await redis.get(`session:${bug.subdomain}`);
  if (sessionData) {
    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    session.bugs += 1;
    await redis.setex(`session:${bug.subdomain}`, SESSION_TTL, JSON.stringify(session));
  }

  // Set expiration on bugs list
  await redis.expire(`bugs:${bug.subdomain}`, SESSION_TTL);

  return bugEvent;
}

async function seedData() {
  try {
    console.log('🌱 Seeding test data...\n');

    // Create demo sessions
    const sessions = [
      { subdomain: 'acme-demo', company: 'Acme Corporation' },
      { subdomain: 'techcorp-test', company: 'TechCorp Industries' },
      { subdomain: 'retail-demo', company: 'Retail Solutions Inc' },
      { subdomain: 'startup-xyz', company: 'Startup XYZ' },
    ];

    for (const session of sessions) {
      await createSession(session.subdomain, session.company);
    }

    console.log('\n📊 Storing test bugs...\n');

    // Store bugs
    for (const bug of testBugs) {
      await storeBug(bug);
      console.log(`  ✓ ${bug.severity.toUpperCase()}: ${bug.errorMessage.substring(0, 50)}...`);
    }

    console.log('\n✅ Seeding complete!');
    console.log(`\nCreated:`);
    console.log(`  - ${sessions.length} demo sessions`);
    console.log(`  - ${testBugs.length} test bugs`);
    console.log(`\nYou can now view them in the admin panel at https://demo.bugspotter.io/admin`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
