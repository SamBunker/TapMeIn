const mongoose = require('mongoose');

// Activity tracking schema for live activity feed
const activitySchema = new mongoose.Schema({
  // Activity Type
  type: {
    type: String,
    required: true,
    enum: [
      'card_tap',
      'card_activated', 
      'card_created',
      'profile_updated',
      'milestone_reached',
      'interview_scheduled',
      'interview_completed',
      'callback_received',
      'category_created',
      'goal_achieved',
      'system_event'
    ],
    index: true
  },
  
  // Activity Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxLength: [200, 'Description cannot exceed 200 characters']
  },
  
  // Owner of this activity
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Related Objects
  relatedObjects: {
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card'
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile'
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview'
    }
  },
  
  // Activity Metadata
  metadata: {
    // Geographic information
    location: {
      country: { type: String, trim: true },
      region: { type: String, trim: true },
      city: { type: String, trim: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    
    // Device information
    device: {
      type: { type: String, trim: true }, // mobile, desktop, tablet
      os: { type: String, trim: true },
      browser: { type: String, trim: true },
      userAgent: { type: String, trim: true }
    },
    
    // Network information
    network: {
      ip: { type: String, trim: true },
      isp: { type: String, trim: true },
      vpn: { type: Boolean, default: false }
    },
    
    // Tap-specific data
    tapData: {
      method: { type: String, enum: ['nfc', 'qr', 'manual'], default: 'nfc' },
      duration: { type: Number }, // seconds on page
      bounced: { type: Boolean, default: false },
      converted: { type: Boolean, default: false },
      referrer: { type: String, trim: true }
    },
    
    // Milestone data
    milestoneData: {
      type: { type: String, enum: ['tap_count', 'visitor_count', 'category_goal', 'time_based'] },
      threshold: { type: Number },
      currentValue: { type: Number },
      previousValue: { type: Number }
    },
    
    // Interview data
    interviewData: {
      company: { type: String, trim: true },
      position: { type: String, trim: true },
      stage: { type: String, trim: true },
      outcome: { type: String, enum: ['positive', 'negative', 'neutral'] }
    }
  },
  
  // Activity Priority & Display
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  icon: {
    type: String,
    default: 'bi-activity',
    trim: true
  },
  
  color: {
    type: String,
    default: '#345995',
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
  },
  
  // Privacy & Visibility
  isPublic: {
    type: Boolean,
    default: false
  },
  
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // System flags
  isSystemGenerated: {
    type: Boolean,
    default: false
  },
  
  // Read status for notifications
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: {
    type: Date
  },
  
  // Score for activity importance (used for filtering/sorting)
  importanceScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
activitySchema.index({ owner: 1, createdAt: -1 });
activitySchema.index({ owner: 1, type: 1, createdAt: -1 });
activitySchema.index({ owner: 1, isRead: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 }); // For cleanup jobs
activitySchema.index({ 'relatedObjects.card': 1 });
activitySchema.index({ importanceScore: -1, createdAt: -1 });

// Virtual for time ago display
activitySchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted location
activitySchema.virtual('formattedLocation').get(function() {
  if (!this.metadata.location) return 'Unknown location';
  
  const { city, region, country } = this.metadata.location;
  const parts = [city, region, country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown location';
});

// Method to calculate importance score
activitySchema.methods.calculateImportanceScore = function() {
  let score = 50; // Base score
  
  // Type-based scoring
  const typeScores = {
    'milestone_reached': 90,
    'interview_completed': 85,
    'callback_received': 80,
    'interview_scheduled': 70,
    'card_activated': 60,
    'goal_achieved': 75,
    'card_tap': 30,
    'profile_updated': 25,
    'card_created': 40,
    'category_created': 35,
    'system_event': 20
  };
  
  score = typeScores[this.type] || 50;
  
  // Recency boost
  const hoursOld = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursOld < 1) score += 20;
  else if (hoursOld < 6) score += 10;
  else if (hoursOld < 24) score += 5;
  
  // Special metadata boosts
  if (this.metadata.tapData?.converted) score += 15;
  if (this.metadata.interviewData?.outcome === 'positive') score += 20;
  if (this.metadata.milestoneData?.threshold >= 1000) score += 10;
  
  this.importanceScore = Math.min(Math.max(score, 0), 100);
  return this.importanceScore;
};

// Static method to create card tap activity
activitySchema.statics.createCardTapActivity = async function(cardId, tapData = {}) {
  const Card = mongoose.model('Card');
  const card = await Card.findById(cardId).populate('owner category');
  
  if (!card || !card.owner) return null;
  
  // Determine if this is a significant tap (first time, milestone, etc.)
  const isFirstTap = card.tapCount === 1;
  const isMilestone = card.tapCount % 100 === 0 && card.tapCount > 0;
  
  let title, description, type;
  
  if (isFirstTap) {
    title = `First tap on ${card.nickname || card.cardUID}!`;
    description = `Your ${card.category?.name || 'card'} just got its first tap`;
    type = 'milestone_reached';
  } else if (isMilestone) {
    title = `${card.tapCount} taps milestone!`;
    description = `${card.nickname || card.cardUID} reached ${card.tapCount} total taps`;
    type = 'milestone_reached';
  } else {
    title = `New tap: ${card.nickname || card.cardUID}`;
    description = `Card tapped from ${tapData.location || 'unknown location'}`;
    type = 'card_tap';
  }
  
  const activity = new this({
    type,
    title,
    description,
    owner: card.owner._id,
    relatedObjects: {
      card: cardId,
      category: card.category
    },
    metadata: {
      location: tapData.location ? {
        country: tapData.location.country,
        region: tapData.location.region,
        city: tapData.location.city,
        coordinates: tapData.location.coordinates
      } : undefined,
      device: tapData.device,
      network: tapData.network,
      tapData: {
        method: tapData.method || 'nfc',
        duration: tapData.duration,
        bounced: tapData.bounced || false,
        converted: tapData.converted || false,
        referrer: tapData.referrer
      },
      milestoneData: (isFirstTap || isMilestone) ? {
        type: 'tap_count',
        threshold: card.tapCount,
        currentValue: card.tapCount,
        previousValue: card.tapCount - 1
      } : undefined
    },
    icon: isFirstTap || isMilestone ? 'bi-trophy' : 'bi-hand-index',
    color: isFirstTap || isMilestone ? '#ffc914' : '#345995',
    isSystemGenerated: true
  });
  
  activity.calculateImportanceScore();
  return await activity.save();
};

// Static method to create interview activity
activitySchema.statics.createInterviewActivity = async function(interviewId, activityType, details = {}) {
  const Interview = mongoose.model('Interview');
  const interview = await Interview.findById(interviewId);
  
  if (!interview) return null;
  
  const activityTypes = {
    'scheduled': {
      title: `Interview scheduled: ${interview.company.name}`,
      description: `${interview.position.title} interview scheduled`,
      icon: 'bi-calendar-check',
      color: '#17a2b8'
    },
    'completed': {
      title: `Interview completed: ${interview.company.name}`,
      description: `Finished ${interview.position.title} interview`,
      icon: 'bi-check-circle',
      color: '#28a745'
    },
    'callback': {
      title: `Callback received: ${interview.company.name}`,
      description: `Positive response for ${interview.position.title}`,
      icon: 'bi-telephone-inbound',
      color: '#ffc914'
    }
  };
  
  const config = activityTypes[activityType];
  if (!config) return null;
  
  const activity = new this({
    type: activityType === 'scheduled' ? 'interview_scheduled' : 
          activityType === 'completed' ? 'interview_completed' : 'callback_received',
    title: config.title,
    description: config.description,
    owner: interview.owner,
    relatedObjects: {
      interview: interviewId
    },
    metadata: {
      interviewData: {
        company: interview.company.name,
        position: interview.position.title,
        stage: interview.status,
        outcome: details.outcome
      }
    },
    icon: config.icon,
    color: config.color,
    isSystemGenerated: true
  });
  
  activity.calculateImportanceScore();
  return await activity.save();
};

// Static method to create milestone activity
activitySchema.statics.createMilestoneActivity = async function(userId, milestoneData) {
  const activity = new this({
    type: 'milestone_reached',
    title: milestoneData.title,
    description: milestoneData.description,
    owner: userId,
    relatedObjects: milestoneData.relatedObjects || {},
    metadata: {
      milestoneData: {
        type: milestoneData.type,
        threshold: milestoneData.threshold,
        currentValue: milestoneData.currentValue,
        previousValue: milestoneData.previousValue
      }
    },
    icon: 'bi-trophy',
    color: '#ffc914',
    isSystemGenerated: true
  });
  
  activity.calculateImportanceScore();
  return await activity.save();
};

// Static method to get recent activities for dashboard
activitySchema.statics.getRecentActivities = async function(userId, limit = 10, includeSystem = true) {
  const query = { owner: userId, isArchived: false };
  
  if (!includeSystem) {
    query.isSystemGenerated = false;
  }
  
  return await this.find(query)
    .populate('relatedObjects.card', 'cardUID nickname')
    .populate('relatedObjects.category', 'name icon')
    .populate('relatedObjects.interview', 'company.name position.title')
    .sort({ importanceScore: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get unread count
activitySchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ 
    owner: userId, 
    isRead: false, 
    isArchived: false 
  });
};

// Static method to mark activities as read
activitySchema.statics.markAsRead = async function(userId, activityIds = null) {
  const query = { owner: userId, isRead: false };
  
  if (activityIds) {
    query._id = { $in: activityIds };
  }
  
  return await this.updateMany(query, { 
    isRead: true, 
    readAt: new Date() 
  });
};

// Pre-save middleware
activitySchema.pre('save', function(next) {
  // Auto-calculate importance score if not set
  if (this.isNew || this.isModified('type') || this.isModified('metadata')) {
    this.calculateImportanceScore();
  }
  
  next();
});

// Cleanup old activities (keep last 90 days)
activitySchema.statics.cleanupOldActivities = async function() {
  const ninetyDaysAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
  
  return await this.deleteMany({
    createdAt: { $lt: ninetyDaysAgo },
    isSystemGenerated: true,
    priority: { $in: ['low', 'normal'] }
  });
};

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;