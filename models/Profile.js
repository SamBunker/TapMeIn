const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  name: {
    type: String,
    required: [true, 'Profile name is required'],
    trim: true,
    maxlength: [100, 'Profile name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: [50, 'Nickname cannot exceed 50 characters']
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL pointing to an image file'
    }
  },
  redirectUrl: {
    type: String,
    required: [true, 'Redirect URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+$/i.test(v);
      },
      message: 'Redirect URL must be a valid HTTP/HTTPS URL'
    }
  },
  cards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  }],
  redirectType: {
    type: String,
    enum: ['static', 'time-based', 'geo-based', 'conditional'],
    default: 'static'
  },
  // Time-based redirect rules
  timeBasedRedirects: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Time-based redirect name cannot exceed 100 characters']
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6,
      validate: {
        validator: Number.isInteger,
        message: 'Days of week must be integers between 0-6 (Sunday=0, Monday=1, etc.)'
      }
    }],
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+$/i.test(v);
        },
        message: 'URL must be a valid HTTP/HTTPS URL'
      }
    },
    active: {
      type: Boolean,
      default: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }],
  // Geographic-based redirect rules
  geoBasedRedirects: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Geo-based redirect name cannot exceed 100 characters']
    },
    country: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{2}$/, 'Country must be a 2-letter ISO country code']
    },
    region: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+$/i.test(v);
        },
        message: 'URL must be a valid HTTP/HTTPS URL'
      }
    },
    active: {
      type: Boolean,
      default: true
    },
    priority: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  // Conditional redirect rules
  conditionalRedirects: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Conditional redirect name cannot exceed 100 characters']
    },
    condition: {
      type: String,
      required: true,
      enum: ['device', 'browser', 'referrer', 'user-agent'],
      lowercase: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    },
    operator: {
      type: String,
      enum: ['equals', 'contains', 'starts-with', 'ends-with', 'regex'],
      default: 'contains'
    },
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+$/i.test(v);
        },
        message: 'URL must be a valid HTTP/HTTPS URL'
      }
    },
    active: {
      type: Boolean,
      default: true
    },
    priority: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  // Webhook configuration
  webhookUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+$/i.test(v);
      },
      message: 'Webhook URL must be a valid HTTP/HTTPS URL'
    }
  },
  webhookSecret: {
    type: String,
    trim: true
  },
  // Notification settings
  notifications: {
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    webhook: {
      type: Boolean,
      default: false
    },
    realTime: {
      type: Boolean,
      default: true
    }
  },
  // Customization options
  customization: {
    theme: {
      type: String,
      enum: ['default', 'dark', 'light', 'custom'],
      default: 'default'
    },
    primaryColor: {
      type: String,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Primary color must be a valid hex color']
    },
    logo: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(v);
        },
        message: 'Logo must be a valid HTTP/HTTPS URL pointing to an image file'
      }
    },
    customCss: {
      type: String,
      maxlength: [10000, 'Custom CSS cannot exceed 10,000 characters']
    }
  },
  // Analytics and tracking
  analytics: {
    totalTaps: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    lastTapped: Date,
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // SEO and metadata
  seo: {
    title: {
      type: String,
      trim: true,
      maxlength: [60, 'SEO title cannot exceed 60 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      maxlength: [50, 'Keywords cannot exceed 50 characters']
    }]
  },
  // Status and settings
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  requiresAuth: {
    type: Boolean,
    default: false
  },
  // A/B Testing
  variants: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    redirectUrl: {
      type: String,
      required: true,
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
profileSchema.index({ userId: 1 });
profileSchema.index({ cards: 1 });
profileSchema.index({ isActive: 1 });
profileSchema.index({ userId: 1, isActive: 1 });
profileSchema.index({ 'analytics.lastTapped': -1 });

// Virtual for profile URL
profileSchema.virtual('profileUrl').get(function() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/profile/${this._id}`;
});

// Virtual for total cards
profileSchema.virtual('totalCards').get(function() {
  return this.cards ? this.cards.length : 0;
});

// Virtual for redirect rules count
profileSchema.virtual('totalRedirectRules').get(function() {
  return (this.timeBasedRedirects?.length || 0) + 
         (this.geoBasedRedirects?.length || 0) + 
         (this.conditionalRedirects?.length || 0);
});

// Instance method to get effective redirect URL
profileSchema.methods.getRedirectUrl = function(context = {}) {
  if (this.redirectType === 'static') {
    return this.redirectUrl;
  }

  // Time-based redirects
  if (this.redirectType === 'time-based' && this.timeBasedRedirects.length > 0) {
    const activeTimeRule = this.getActiveTimeBasedRedirect(context.timestamp);
    if (activeTimeRule) {
      return activeTimeRule.url;
    }
  }

  // Geo-based redirects
  if (this.redirectType === 'geo-based' && this.geoBasedRedirects.length > 0) {
    const geoRule = this.getActiveGeoBasedRedirect(context.location);
    if (geoRule) {
      return geoRule.url;
    }
  }

  // Conditional redirects
  if (this.redirectType === 'conditional' && this.conditionalRedirects.length > 0) {
    const conditionalRule = this.getActiveConditionalRedirect(context);
    if (conditionalRule) {
      return conditionalRule.url;
    }
  }

  // Fallback to default URL
  return this.redirectUrl;
};

// Instance method to get active time-based redirect
profileSchema.methods.getActiveTimeBasedRedirect = function(timestamp = new Date()) {
  const now = new Date(timestamp);
  const currentDay = now.getDay(); // 0-6 (Sunday=0)
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return this.timeBasedRedirects
    .filter(rule => rule.active)
    .find(rule => {
      // Check if current day is in the rule's days
      if (rule.daysOfWeek.length > 0 && !rule.daysOfWeek.includes(currentDay)) {
        return false;
      }

      // Check if current time is within the rule's time range
      return currentTime >= rule.startTime && currentTime <= rule.endTime;
    });
};

// Instance method to get active geo-based redirect
profileSchema.methods.getActiveGeoBasedRedirect = function(location = {}) {
  return this.geoBasedRedirects
    .filter(rule => rule.active)
    .sort((a, b) => b.priority - a.priority) // Higher priority first
    .find(rule => {
      // Check country match
      if (rule.country && location.country !== rule.country) {
        return false;
      }

      // Check region match (if specified)
      if (rule.region && location.region !== rule.region) {
        return false;
      }

      // Check city match (if specified)
      if (rule.city && location.city !== rule.city) {
        return false;
      }

      return true;
    });
};

// Instance method to get active conditional redirect
profileSchema.methods.getActiveConditionalRedirect = function(context = {}) {
  return this.conditionalRedirects
    .filter(rule => rule.active)
    .sort((a, b) => b.priority - a.priority) // Higher priority first
    .find(rule => {
      const testValue = context[rule.condition] || '';
      const ruleValue = rule.value.toLowerCase();
      const testValueLower = testValue.toLowerCase();

      switch (rule.operator) {
        case 'equals':
          return testValueLower === ruleValue;
        case 'contains':
          return testValueLower.includes(ruleValue);
        case 'starts-with':
          return testValueLower.startsWith(ruleValue);
        case 'ends-with':
          return testValueLower.endsWith(ruleValue);
        case 'regex':
          try {
            const regex = new RegExp(rule.value, 'i');
            return regex.test(testValue);
          } catch (e) {
            return false;
          }
        default:
          return testValueLower.includes(ruleValue);
      }
    });
};

// Instance method to record tap
profileSchema.methods.recordTap = function() {
  this.analytics.totalTaps += 1;
  this.analytics.lastTapped = new Date();
  return this.save();
};

// Static method to find profiles by user
profileSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).populate('cards');
};

// Static method to find public profiles
profileSchema.statics.findPublic = function() {
  return this.find({ isPublic: true, isActive: true });
};

module.exports = mongoose.model('Profile', profileSchema);