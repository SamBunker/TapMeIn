// Script to reset database and create fresh test data
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Card = require('../models/Card');
const User = require('../models/User');

async function resetDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/tapmeinnfc_dev?authSource=admin';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Card.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Collections cleared');

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = new User({
      email: 'admin@tapmeinnfc.com',
      passwordHash: 'admin123', // Will be hashed by pre-save middleware
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      emailVerified: true,
      subscription: {
        plan: 'premium',
        status: 'active'
      }
    });
    await admin.save();
    console.log('✅ Admin user created');

    // Create test cards
    console.log('🎴 Creating test cards...');
    const cards = [
      {
        cardUID: 'TEST0001',
        status: 'ready',
        activationCode: 'ACTIVE01',
        cardType: 'nfc',
        batchNumber: 'BATCH001',
        isActivated: false,
        tapCount: 0
      },
      {
        cardUID: 'TEST0002',
        status: 'ready',
        activationCode: 'ACTIVE02',
        cardType: 'nfc',
        batchNumber: 'BATCH001',
        isActivated: false,
        tapCount: 0
      },
      {
        cardUID: 'TEST0003',
        status: 'ready',
        activationCode: 'ACTIVE03',
        cardType: 'nfc',
        batchNumber: 'BATCH001',
        isActivated: false,
        tapCount: 0
      }
    ];

    await Card.insertMany(cards);
    console.log('✅ Test cards created');

    // Activate first card for demo
    console.log('🔓 Activating TEST0001 for demo...');
    const demoCard = await Card.findOne({ cardUID: 'TEST0001' });
    demoCard.owner = admin._id;
    demoCard.status = 'activated';
    demoCard.isActivated = true;
    demoCard.activatedAt = new Date();
    demoCard.nickname = 'Demo Card';
    demoCard.activationCode = undefined; // Clear activation code
    await demoCard.save();
    console.log('✅ TEST0001 activated');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Database Reset Complete!');
    console.log('='.repeat(50));
    console.log('\n👤 Admin User:');
    console.log('   Email: admin@tapmeinnfc.com');
    console.log('   Password: admin123');
    console.log('\n🎴 Test Cards:');
    console.log('   TEST0001 - ACTIVATED (Demo Card)');
    console.log('   TEST0002 - Ready (Code: ACTIVE02)');
    console.log('   TEST0003 - Ready (Code: ACTIVE03)');
    console.log('\n🔗 Test URLs:');
    console.log('   Tap: http://localhost:3000/tap/TEST0001');
    console.log('   API: http://localhost:3000/api');
    console.log('   Health: http://localhost:3000/api/health');
    console.log('\n✅ Ready for testing!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Add timeout to prevent hanging
setTimeout(() => {
  console.error('❌ Script timeout - exiting');
  process.exit(1);
}, 10000);

resetDatabase();