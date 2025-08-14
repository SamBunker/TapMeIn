const mongoose = require('mongoose');

// Category Schema for organizing NFC cards
const categorySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxLength: [50, 'Category name cannot exceed 50 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxLength: [200, 'Description cannot exceed 200 characters']
  },
  
  icon: {
    type: String,
    default: '📂'
  },
  
  color: {
    type: String,
    default: '#345995',
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
  },
  
  // Ownership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Category Type
  type: {
    type: String,
    enum: ['business', 'personal', 'music', 'social', 'event', 'custom'],
    default: 'custom'
  },
  
  // Category Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Settings
  settings: {
    // Auto-assign rules
    autoAssign: {
      enabled: { type: Boolean, default: false },
      rules: [{
        field: { type: String, enum: ['profile_type', 'card_name', 'url_pattern'] },
        operator: { type: String, enum: ['contains', 'equals', 'starts_with', 'ends_with'] },
        value: { type: String }
      }]
    },
    
    // Analytics preferences
    analytics: {
      trackConversions: { type: Boolean, default: true },
      goalUrl: { type: String },
      goalType: { type: String, enum: ['visit', 'signup', 'purchase', 'download'] }
    },
    
    // Notification settings
    notifications: {
      dailySummary: { type: Boolean, default: false },
      milestoneAlerts: { type: Boolean, default: true },
      thresholds: {
        lowActivity: { type: Number, default: 5 }, // Alert if less than X taps per day
        highActivity: { type: Number, default: 100 } // Alert if more than X taps per day
      }
    }
  },
  
  // Performance Tracking
  stats: {
    totalCards: { type: Number, default: 0 },
    totalTaps: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    lastActivityAt: { type: Date },
    
    // Daily aggregates (last 30 days)
    dailyStats: [{
      date: { type: Date, required: true },
      taps: { type: Number, default: 0 },
      uniqueVisitors: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    }]
  },
  
  // Metadata
  metadata: {
    tags: [{ type: String, trim: true }],
    priority: { type: Number, default: 0 }, // For sorting/organizing
    isDefault: { type: Boolean, default: false }, // Default category for new cards
    
    // Integration data
    integrations: {
      zapier: { webhookUrl: String, enabled: Boolean },
      slack: { webhookUrl: String, channel: String, enabled: Boolean },
      analytics: { 
        googleAnalytics: { trackingId: String, enabled: Boolean },
        facebookPixel: { pixelId: String, enabled: Boolean }
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
categorySchema.index({ owner: 1, name: 1 }, { unique: true });
categorySchema.index({ owner: 1, type: 1 });
categorySchema.index({ owner: 1, isActive: 1 });
categorySchema.index({ 'stats.lastActivityAt': -1 });

// Virtual for cards in this category
categorySchema.virtual('cards', {
  ref: 'Card',
  localField: '_id',
  foreignField: 'category'
});

// Virtual for performance metrics
categorySchema.virtual('performanceMetrics').get(function() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  // Calculate metrics from daily stats
  const recentStats = this.stats.dailyStats.filter(stat => stat.date >= thirtyDaysAgo);
  
  const totalTapsRecent = recentStats.reduce((sum, stat) => sum + stat.taps, 0);
  const totalVisitorsRecent = recentStats.reduce((sum, stat) => sum + stat.uniqueVisitors, 0);
  const totalConversionsRecent = recentStats.reduce((sum, stat) => sum + stat.conversions, 0);
  
  return {
    totalTaps: this.stats.totalTaps,
    totalCards: this.stats.totalCards,
    uniqueVisitors: this.stats.uniqueVisitors,
    conversionRate: totalVisitorsRecent > 0 ? (totalConversionsRecent / totalVisitorsRecent * 100) : 0,
    avgTapsPerDay: recentStats.length > 0 ? totalTapsRecent / recentStats.length : 0,
    trend: this.calculateTrend(),
    lastActivity: this.stats.lastActivityAt
  };
});

// Method to calculate trend (growth over last 7 vs previous 7 days)
categorySchema.methods.calculateTrend = function() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  
  const lastWeekStats = this.stats.dailyStats.filter(stat => 
    stat.date >= sevenDaysAgo && stat.date < now
  );
  const previousWeekStats = this.stats.dailyStats.filter(stat => 
    stat.date >= fourteenDaysAgo && stat.date < sevenDaysAgo
  );
  
  const lastWeekTaps = lastWeekStats.reduce((sum, stat) => sum + stat.taps, 0);
  const previousWeekTaps = previousWeekStats.reduce((sum, stat) => sum + stat.taps, 0);
  
  if (previousWeekTaps === 0) return lastWeekTaps > 0 ? 100 : 0;
  
  return ((lastWeekTaps - previousWeekTaps) / previousWeekTaps) * 100;
};

// Method to update stats when a card is tapped
categorySchema.methods.recordTap = async function(visitorId, conversion = false) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Update overall stats
  this.stats.totalTaps += 1;
  this.stats.lastActivityAt = new Date();
  
  // Update or create daily stat
  let dailyStat = this.stats.dailyStats.find(stat => 
    stat.date.getTime() === today.getTime()
  );
  
  if (!dailyStat) {
    dailyStat = { date: today, taps: 0, uniqueVisitors: 0, conversions: 0 };
    this.stats.dailyStats.push(dailyStat);
  }
  
  dailyStat.taps += 1;
  
  // Track unique visitor (simplified - in production, use more sophisticated tracking)
  if (visitorId && !this.hasVisitedToday(visitorId, today)) {
    dailyStat.uniqueVisitors += 1;
    this.stats.uniqueVisitors += 1;
  }
  
  // Track conversion
  if (conversion) {
    dailyStat.conversions += 1;
  }
  
  // Keep only last 90 days of daily stats
  const ninetyDaysAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
  this.stats.dailyStats = this.stats.dailyStats.filter(stat => stat.date >= ninetyDaysAgo);
  
  await this.save();
};

// Helper method to check if visitor has visited today (simplified implementation)
categorySchema.methods.hasVisitedToday = function(visitorId, date) {
  // In production, this would query a separate VisitorTracking collection
  // For now, simplified logic
  return false;
};

// Static method to get user's categories with performance data
categorySchema.statics.getUserCategoriesWithStats = async function(userId, limit = null) {
  const query = this.find({ owner: userId, isActive: true })
    .populate('cards', 'isActivated status')
    .sort({ 'stats.totalTaps': -1, name: 1 });
  
  if (limit) {
    query.limit(limit);
  }
  
  const categories = await query.exec();
  
  // Calculate card counts for each category
  return categories.map(category => {
    const categoryObj = category.toObject();
    categoryObj.stats.activeCards = category.cards ? 
      category.cards.filter(card => card.isActivated).length : 0;
    return categoryObj;
  });
};

// Static method to create default categories for new users
categorySchema.statics.createDefaultCategories = async function(userId) {
  const defaultCategories = [
    {
      name: 'Business Cards',
      description: 'Professional networking and business contacts',
      icon: '💼',
      color: '#345995',
      type: 'business',
      owner: userId,
      metadata: { isDefault: true }
    },
    {
      name: 'Personal',
      description: 'Personal sharing and social connections',
      icon: '👤',
      color: '#28a745',
      type: 'personal',
      owner: userId
    },
    {
      name: 'Social Media',
      description: 'Instagram, LinkedIn, and social profiles',
      icon: '🔗',
      color: '#17a2b8',
      type: 'social',
      owner: userId
    }
  ];
  
  return await this.insertMany(defaultCategories);
};

// Pre-save middleware
categorySchema.pre('save', function(next) {
  // Ensure stats object exists
  if (!this.stats) {
    this.stats = {
      totalCards: 0,
      totalTaps: 0,
      uniqueVisitors: 0,
      conversionRate: 0,
      dailyStats: []
    };
  }
  
  // Ensure settings object exists
  if (!this.settings) {
    this.settings = {
      autoAssign: { enabled: false, rules: [] },
      analytics: { trackConversions: true },
      notifications: { 
        dailySummary: false, 
        milestoneAlerts: true,
        thresholds: { lowActivity: 5, highActivity: 100 }
      }
    };
  }
  
  next();
});

// Post-save middleware to update card counts
categorySchema.post('save', async function() {
  if (this.isModified('isActive')) {
    // Update card counts when category is activated/deactivated
    const Card = mongoose.model('Card');
    const cardCount = await Card.countDocuments({ 
      category: this._id, 
      owner: this.owner 
    });
    
    if (this.stats.totalCards !== cardCount) {
      this.stats.totalCards = cardCount;
      await this.save();
    }
  }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;