const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Determine which MongoDB URI to use based on environment
    let mongoURI;
    
    if (process.env.NODE_ENV === 'test') {
      mongoURI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tapmeinnfc_test';
    } else {
      mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tapmeinnfc_dev';
    }

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain a minimum of 2 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    // Log connection success (only in non-test environments)
    if (process.env.NODE_ENV !== 'test') {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
      console.log(`📊 Database: ${conn.connection.name}`);
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('⚠️ MongoDB disconnected');
      }
    });

    mongoose.connection.on('reconnected', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ MongoDB reconnected');
      }
    });

    // Graceful exit
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('📴 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return conn;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // In production, we might want to retry the connection
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Retrying database connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

// Database configuration for different environments
const dbConfig = {
  development: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tapmeinnfc_dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  test: {
    uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tapmeinnfc_test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  production: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 20,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }
  }
};

// Database seeding and initialization
const initializeDatabase = async () => {
  try {
    // Create default admin user if it doesn't exist
    const User = require('../models/User');
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists && process.env.NODE_ENV !== 'test') {
      const defaultAdmin = new User({
        email: process.env.ADMIN_EMAIL || 'admin@tapmeinnfc.com',
        passwordHash: process.env.ADMIN_PASSWORD || 'admin123456',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        emailVerified: true,
        subscription: {
          plan: 'premium',
          status: 'active'
        }
      });
      
      await defaultAdmin.save();
      console.log('👤 Default admin user created');
    }

    // Create database indexes
    await createIndexes();
    
    console.log('🏗️ Database initialization complete');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

// Create database indexes for better performance
const createIndexes = async () => {
  try {
    const User = require('../models/User');
    const Card = require('../models/Card');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ 'subscription.plan': 1 });
    await User.collection.createIndex({ 'subscription.status': 1 });
    await User.collection.createIndex({ createdAt: -1 });
    
    // Card indexes
    await Card.collection.createIndex({ cardUID: 1 }, { unique: true });
    await Card.collection.createIndex({ owner: 1 });
    await Card.collection.createIndex({ status: 1 });
    await Card.collection.createIndex({ activationCode: 1 }, { sparse: true, unique: true });
    await Card.collection.createIndex({ owner: 1, status: 1 });
    await Card.collection.createIndex({ lastTapped: -1 });
    
    if (process.env.NODE_ENV !== 'test') {
      console.log('📇 Database indexes created');
    }
    
  } catch (error) {
    // Indexes might already exist, this is usually not a critical error
    if (process.env.NODE_ENV !== 'test') {
      console.log('⚠️ Some indexes already exist or failed to create:', error.message);
    }
  }
};

// Clean up test database
const cleanupTestDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};

// Drop database (use with caution!)
const dropDatabase = async () => {
  if (process.env.NODE_ENV === 'test') {
    await mongoose.connection.dropDatabase();
    console.log('🗑️ Test database dropped');
  } else {
    throw new Error('Database dropping is only allowed in test environment');
  }
};

module.exports = {
  connectDB,
  dbConfig,
  initializeDatabase,
  createIndexes,
  cleanupTestDB,
  dropDatabase
};