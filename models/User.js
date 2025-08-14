const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  companyName: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'standard', 'premium'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'cancelled'],
      default: 'trial'
    },
    trialStartDate: {
      type: Date,
      default: Date.now
    },
    trialEndDate: {
      type: Date,
      default: function() {
        const trialDays = parseInt(process.env.TRIAL_DAYS) || 14;
        return new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      }
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },
  settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      webhook: {
        type: Boolean,
        default: false
      },
      tapAlerts: {
        type: Boolean,
        default: true
      },
      weeklyReports: {
        type: Boolean,
        default: true
      },
      interviewReminders: {
        type: Boolean,
        default: true
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  lastLoginAt: Date,
  lastLoginIP: String,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || this.email;
});

// Virtual for trial status
userSchema.virtual('isTrialActive').get(function() {
  return this.subscription.status === 'trial' && 
         this.subscription.trialEndDate > new Date();
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to check if user has feature access
userSchema.methods.hasFeatureAccess = function(feature) {
  const featureMatrix = {
    free: {
      maxCards: 1,
      analytics: false,
      timeBasedRedirects: false,
      geoBasedRedirects: false,
      webhooks: false,
      smsAlerts: false,
      emailReports: false,
      apiAccess: false,
      customBranding: false,
      prioritySupport: false,
      interviewTracking: false,
      aiEmailAssistant: false,
      calendarIntegration: false
    },
    basic: {
      maxCards: 3,
      analytics: true,
      timeBasedRedirects: true,
      geoBasedRedirects: false,
      webhooks: false,
      smsAlerts: false,
      emailReports: true,
      apiAccess: false,
      customBranding: false,
      prioritySupport: false,
      interviewTracking: true,
      aiEmailAssistant: false,
      calendarIntegration: false
    },
    standard: {
      maxCards: 10,
      analytics: true,
      timeBasedRedirects: true,
      geoBasedRedirects: true,
      webhooks: true,
      smsAlerts: false,
      emailReports: true,
      apiAccess: false,
      customBranding: false,
      prioritySupport: true,
      interviewTracking: true,
      aiEmailAssistant: true,
      calendarIntegration: true
    },
    premium: {
      maxCards: -1, // unlimited
      analytics: true,
      timeBasedRedirects: true,
      geoBasedRedirects: true,
      webhooks: true,
      smsAlerts: true,
      emailReports: true,
      apiAccess: true,
      customBranding: true,
      prioritySupport: true,
      interviewTracking: true,
      aiEmailAssistant: true,
      calendarIntegration: true
    }
  };

  const plan = this.subscription.plan;
  const isActive = this.subscription.status === 'active' || this.isTrialActive;
  
  if (!isActive) {
    return featureMatrix.free[feature] || false;
  }
  
  return featureMatrix[plan] ? featureMatrix[plan][feature] : false;
};

// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find user by email (case insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Export model
module.exports = mongoose.model('User', userSchema);