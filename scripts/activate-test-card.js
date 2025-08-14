// Script to activate a test card for development
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Card = require('../models/Card');
const User = require('../models/User');

async function activateTestCard() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/tapmeinnfc_dev?authSource=admin');
    console.log('✅ Connected to MongoDB');

    // Find or create admin user
    let admin = await User.findOne({ email: 'admin@tapmeinnfc.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    console.log('✅ Found admin user:', admin.email);

    // Find TEST0001 card
    const card = await Card.findOne({ cardUID: 'TEST0001' });
    if (!card) {
      console.log('❌ TEST0001 card not found');
      process.exit(1);
    }
    console.log('✅ Found card TEST0001');

    // Activate the card
    if (!card.isActivated) {
      // Clear the activation code when activating (it's no longer needed)
      card.owner = admin._id;
      card.status = 'activated';
      card.isActivated = true;
      card.activatedAt = new Date();
      card.nickname = 'Demo Card';
      card.activationCode = undefined; // Remove activation code after activation
      await card.save();
      console.log('✅ Card TEST0001 activated successfully!');
    } else {
      console.log('ℹ️ Card TEST0001 is already activated');
    }

    // Show card details
    console.log('\n📇 Card Details:');
    console.log('  UID:', card.cardUID);
    console.log('  Status:', card.status);
    console.log('  Owner:', admin.email);
    console.log('  Nickname:', card.nickname);
    console.log('  Tap Count:', card.tapCount);
    console.log('\n🔗 Test URL: http://localhost:3000/tap/TEST0001');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

activateTestCard();