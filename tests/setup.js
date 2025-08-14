const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Global test setup
let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_TEST_URI = mongoUri;
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  process.env.JWT_EXPIRE = '1h';
  process.env.JWT_REFRESH_EXPIRE = '7d';
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop in-memory MongoDB instance
  await mongoServer.stop();
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const User = require('../models/User');
    const defaultUser = {
      email: 'test@example.com',
      passwordHash: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      emailVerified: true
    };
    
    const user = new User({ ...defaultUser, ...userData });
    await user.save();
    return user;
  },
  
  // Create test admin
  createTestAdmin: async (userData = {}) => {
    const User = require('../models/User');
    const defaultAdmin = {
      email: 'admin@example.com',
      passwordHash: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      emailVerified: true,
      subscription: {
        plan: 'premium',
        status: 'active'
      }
    };
    
    const admin = new User({ ...defaultAdmin, ...userData });
    await admin.save();
    return admin;
  },
  
  // Create test card
  createTestCard: async (cardData = {}) => {
    const Card = require('../models/Card');
    const defaultCard = {
      cardUID: Math.random().toString(36).substr(2, 8).toUpperCase(),
      status: 'ready',
      activationCode: Math.random().toString(36).substr(2, 8).toUpperCase()
    };
    
    const card = new Card({ ...defaultCard, ...cardData });
    await card.save();
    return card;
  },
  
  // Generate JWT token for testing
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },
  
  // Generate auth header
  getAuthHeader: (token) => {
    return { Authorization: `Bearer ${token}` };
  },
  
  // Clean database
  cleanDatabase: async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};

// Suppress console.log during tests unless specifically needed
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = (...args) => {
    // Only log if it's a test-specific message
    if (args[0] && args[0].includes('TEST:')) {
      originalConsoleLog(...args);
    }
  };
  
  console.error = (...args) => {
    // Only log errors if it's a test-specific message
    if (args[0] && args[0].includes('TEST:')) {
      originalConsoleError(...args);
    }
  };
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});