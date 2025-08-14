const mongoose = require('mongoose');
const crypto = require('crypto');

const cardSchema = new mongoose.Schema({
  cardUID: {
    type: String,
    required: [true, 'Card UID is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]{8,16}$/, 'Card UID must be 8-16 alphanumeric characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['unassigned', 'ready', 'activated', 'suspended'],
    default: 'unassigned'
  },
  isActivated: {
    type: Boolean,
    default: false
  },
  activationCode: {
    type: String,
    unique: true,
    sparse: true, // allows multiple null values
    uppercase: true,
    match: [/^[A-Z0-9]{6,8}$/, 'Activation code must be 6-8 alphanumeric characters']
  },
  activatedAt: Date,
  nickname: {
    type: String,
    trim: true,
    maxlength: [50, 'Nickname cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  tapCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastTapped: Date,
  qrCodeUrl: String,
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    default: null
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  // Card physical properties
  cardType: {
    type: String,
    enum: ['nfc', 'qr', 'hybrid'],
    default: 'nfc'
  },
  batchNumber: {
    type: String,
    trim: true
  },
  manufacturingDate: Date,
  // Usage statistics
  analytics: {
    totalTaps: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    lastAnalyticsUpdate: Date
  },
  // Security features
  securityFeatures: {
    tamperEvident: {
      type: Boolean,
      default: false
    },
    encryptedUID: {
      type: Boolean,
      default: false
    }
  },
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['bulk-import', 'manual', 'api', 'seed'],
      default: 'manual'
    },
    notes: String,
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
cardSchema.index({ cardUID: 1 });
cardSchema.index({ owner: 1 });
cardSchema.index({ status: 1 });
cardSchema.index({ activationCode: 1 }, { sparse: true });
cardSchema.index({ isActivated: 1 });
cardSchema.index({ createdAt: -1 });
cardSchema.index({ lastTapped: -1 });
cardSchema.index({ batchNumber: 1 });

// Compound indexes
cardSchema.index({ owner: 1, status: 1 });
cardSchema.index({ status: 1, createdAt: -1 });

// Virtual for card URL
cardSchema.virtual('cardUrl').get(function() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/tap/${this.cardUID}`;
});

// Virtual for QR code URL
cardSchema.virtual('qrUrl').get(function() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/qr/${this.cardUID}`;
});

// Virtual for activation status
cardSchema.virtual('canBeActivated').get(function() {
  return this.status === 'ready' && !this.isActivated && this.activationCode;
});

// Virtual for days since activation
cardSchema.virtual('daysSinceActivation').get(function() {
  if (!this.activatedAt) return null;
  const diffTime = Math.abs(new Date() - this.activatedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for activity status
cardSchema.virtual('activityStatus').get(function() {
  if (!this.lastTapped) return 'never-used';
  
  const daysSinceLastTap = Math.ceil((new Date() - this.lastTapped) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastTap <= 1) return 'active';
  if (daysSinceLastTap <= 7) return 'recent';
  if (daysSinceLastTap <= 30) return 'moderate';
  return 'inactive';
});

// Pre-save middleware to generate activation code
cardSchema.pre('save', function(next) {
  // Generate activation code when status changes to 'ready'
  if (this.isModified('status') && this.status === 'ready' && !this.activationCode) {
    this.activationCode = this.generateActivationCode();
  }
  
  // Update analytics when tap count changes
  if (this.isModified('tapCount')) {
    this.analytics.totalTaps = this.tapCount;
    this.analytics.lastAnalyticsUpdate = new Date();
  }
  
  next();
});

// Instance method to generate activation code
cardSchema.methods.generateActivationCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Instance method to activate card
cardSchema.methods.activate = function(userId) {
  this.owner = userId;
  this.status = 'activated';
  this.isActivated = true;
  this.activatedAt = new Date();
  this.activationCode = undefined; // Remove activation code after use
  return this.save();
};

// Instance method to deactivate card
cardSchema.methods.deactivate = function() {
  this.status = 'suspended';
  return this.save();
};

// Instance method to record tap
cardSchema.methods.recordTap = function() {
  this.tapCount += 1;
  this.lastTapped = new Date();
  return this.save();
};

// Instance method to reset card
cardSchema.methods.reset = function() {
  this.owner = null;
  this.profile = null;
  this.status = 'ready';
  this.isActivated = false;
  this.activatedAt = undefined;
  this.nickname = undefined;
  this.description = undefined;
  this.tapCount = 0;
  this.lastTapped = undefined;
  this.activationCode = this.generateActivationCode();
  this.analytics = {
    totalTaps: 0,
    uniqueVisitors: 0,
    lastAnalyticsUpdate: new Date()
  };
  return this.save();
};

// Static method to find cards by owner
cardSchema.statics.findByOwner = function(userId) {
  return this.find({ owner: userId }).populate('profile');
};

// Static method to find available cards
cardSchema.statics.findAvailable = function() {
  return this.find({ 
    status: { $in: ['unassigned', 'ready'] },
    isActivated: false 
  });
};

// Static method to find cards by batch
cardSchema.statics.findByBatch = function(batchNumber) {
  return this.find({ batchNumber });
};

// Static method to get analytics summary
cardSchema.statics.getAnalyticsSummary = async function(userId) {
  return this.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalCards: { $sum: 1 },
        totalTaps: { $sum: '$tapCount' },
        activeCards: {
          $sum: {
            $cond: [
              { $gte: ['$lastTapped', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        },
        averageTapsPerCard: { $avg: '$tapCount' }
      }
    }
  ]);
};

// Static method to bulk create cards
cardSchema.statics.bulkCreate = function(cardUIDs, options = {}) {
  const cards = cardUIDs.map(uid => ({
    cardUID: uid.toUpperCase(),
    status: options.status || 'unassigned',
    batchNumber: options.batchNumber,
    manufacturingDate: options.manufacturingDate || new Date(),
    cardType: options.cardType || 'nfc',
    metadata: {
      source: 'bulk-import',
      notes: options.notes,
      tags: options.tags || []
    }
  }));
  
  return this.insertMany(cards, { ordered: false });
};

// Static method to find card by activation code
cardSchema.statics.findByActivationCode = function(code) {
  return this.findOne({ 
    activationCode: code.toUpperCase(),
    status: 'ready',
    isActivated: false 
  });
};

module.exports = mongoose.model('Card', cardSchema);