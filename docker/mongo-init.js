// MongoDB initialization script
// This runs when the MongoDB container starts for the first time

print('Creating TapMeIn database...');

// Switch to the app database
db = db.getSiblingDB('tapmeinnfc_dev');

// Create collections with indexes
print('Creating users collection...');
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "subscription.plan": 1 });
db.users.createIndex({ "subscription.status": 1 });
db.users.createIndex({ "createdAt": -1 });

print('Creating cards collection...');
db.createCollection('cards');
db.cards.createIndex({ "cardUID": 1 }, { unique: true });
db.cards.createIndex({ "owner": 1 });
db.cards.createIndex({ "status": 1 });
db.cards.createIndex({ "activationCode": 1 }, { sparse: true, unique: true });
db.cards.createIndex({ "owner": 1, "status": 1 });
db.cards.createIndex({ "lastTapped": -1 });

print('Creating profiles collection...');
db.createCollection('profiles');
db.profiles.createIndex({ "userId": 1 });
db.profiles.createIndex({ "cards": 1 });

print('Creating analytics collection...');
db.createCollection('analytics');
db.analytics.createIndex({ "cardId": 1 });
db.analytics.createIndex({ "userId": 1 });
db.analytics.createIndex({ "timestamp": -1 });
db.analytics.createIndex({ "cardId": 1, "timestamp": -1 });

print('Creating interviews collection...');
db.createCollection('interviews');
db.interviews.createIndex({ "userId": 1 });
db.interviews.createIndex({ "interview.date": -1 });

print('Creating subscriptions collection...');
db.createCollection('subscriptions');
db.subscriptions.createIndex({ "userId": 1 });
db.subscriptions.createIndex({ "status": 1 });

// Create admin user
print('Creating default admin user...');
db.users.insertOne({
  email: 'admin@tapmeinnfc.com',
  passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8.LQv3c1yqBWVHxkd0LH', // 'admin123'
  role: 'admin',
  firstName: 'System',
  lastName: 'Administrator',
  emailVerified: true,
  subscription: {
    plan: 'premium',
    status: 'active',
    trialStartDate: new Date(),
    trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  },
  settings: {
    notifications: {
      email: true,
      sms: false,
      webhook: false,
      tapAlerts: true,
      weeklyReports: true,
      interviewReminders: true
    },
    timezone: 'UTC',
    language: 'en',
    theme: 'light'
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create sample cards for testing
print('Creating sample cards...');
const sampleCards = [
  {
    cardUID: 'TEST0001',
    status: 'ready',
    activationCode: 'ACTIVE01',
    cardType: 'nfc',
    batchNumber: 'BATCH001',
    manufacturingDate: new Date(),
    isActivated: false,
    tapCount: 0,
    analytics: { totalTaps: 0, uniqueVisitors: 0 },
    metadata: { source: 'seed', notes: 'Sample card for testing' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cardUID: 'TEST0002',
    status: 'ready',
    activationCode: 'ACTIVE02',
    cardType: 'nfc',
    batchNumber: 'BATCH001',
    manufacturingDate: new Date(),
    isActivated: false,
    tapCount: 0,
    analytics: { totalTaps: 0, uniqueVisitors: 0 },
    metadata: { source: 'seed', notes: 'Sample card for testing' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cardUID: 'TEST0003',
    status: 'ready',
    activationCode: 'ACTIVE03',
    cardType: 'nfc',
    batchNumber: 'BATCH001',
    manufacturingDate: new Date(),
    isActivated: false,
    tapCount: 0,
    analytics: { totalTaps: 0, uniqueVisitors: 0 },
    metadata: { source: 'seed', notes: 'Sample card for testing' },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.cards.insertMany(sampleCards);

print('Database initialization complete!');
print('Admin credentials: admin@tapmeinnfc.com / admin123');
print('Sample activation codes: ACTIVE01, ACTIVE02, ACTIVE03');