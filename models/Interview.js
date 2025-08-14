const mongoose = require('mongoose');

// Interview/Career tracking schema for professional networking follow-ups
const interviewSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Interview title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  
  company: {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxLength: [100, 'Company name cannot exceed 100 characters']
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Website must be a valid URL']
    },
    industry: {
      type: String,
      trim: true,
      maxLength: [50, 'Industry cannot exceed 50 characters']
    },
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      default: 'medium'
    }
  },
  
  // Position Details
  position: {
    title: {
      type: String,
      required: [true, 'Position title is required'],
      trim: true,
      maxLength: [100, 'Position title cannot exceed 100 characters']
    },
    department: {
      type: String,
      trim: true,
      maxLength: [50, 'Department cannot exceed 50 characters']
    },
    level: {
      type: String,
      enum: ['intern', 'entry', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'],
      default: 'mid'
    },
    salary: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'USD' },
      frequency: { type: String, enum: ['hourly', 'annual'], default: 'annual' }
    },
    remote: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'],
      default: 'hybrid'
    }
  },
  
  // Owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Interview Status & Progress
  status: {
    type: String,
    enum: ['lead', 'applied', 'phone_screen', 'interview_scheduled', 'interviewed', 'follow_up', 'offer', 'rejected', 'withdrawn'],
    default: 'lead',
    index: true
  },
  
  // Timeline & Dates
  timeline: {
    appliedAt: { type: Date },
    firstContactAt: { type: Date },
    phoneScreenAt: { type: Date },
    interviewAt: { type: Date },
    followUpDue: { type: Date },
    offerReceivedAt: { type: Date },
    responseDeadline: { type: Date },
    finalizedAt: { type: Date }
  },
  
  // Contact Information
  contacts: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: [100, 'Contact name cannot exceed 100 characters']
    },
    role: {
      type: String,
      trim: true,
      maxLength: [50, 'Contact role cannot exceed 50 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
    },
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*/, 'Please provide a valid LinkedIn URL']
    },
    notes: {
      type: String,
      trim: true,
      maxLength: [500, 'Notes cannot exceed 500 characters']
    }
  }],
  
  // NFC Card Connection
  cardConnection: {
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card'
    },
    sharedAt: { type: Date },
    tapCount: { type: Number, default: 0 },
    lastTapped: { type: Date },
    tapDetails: [{
      timestamp: { type: Date, default: Date.now },
      location: { type: String },
      device: { type: String },
      ip: { type: String }
    }]
  },
  
  // Interview Details
  interviewDetails: {
    format: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'panel', 'presentation'],
      default: 'video'
    },
    duration: { type: Number }, // minutes
    location: { type: String, trim: true },
    meetingLink: { type: String, trim: true },
    preparationNotes: { type: String, trim: true },
    questions: [{ type: String, trim: true }],
    feedback: {
      interviewerNotes: { type: String, trim: true },
      technicalAssessment: { type: String, trim: true },
      culturalFit: { type: Number, min: 1, max: 5 },
      overallRating: { type: Number, min: 1, max: 5 }
    }
  },
  
  // Follow-up & Reminders
  followUp: {
    nextAction: {
      type: String,
      enum: ['send_thank_you', 'follow_up_email', 'schedule_next', 'wait_for_response', 'negotiate_offer', 'accept_offer', 'decline_offer'],
      default: 'send_thank_you'
    },
    reminderAt: { type: Date },
    reminderSent: { type: Boolean, default: false },
    lastContactAt: { type: Date },
    notes: { type: String, trim: true }
  },
  
  // Application Materials
  materials: {
    resume: {
      version: { type: String, trim: true },
      uploadedAt: { type: Date },
      customized: { type: Boolean, default: false }
    },
    coverLetter: {
      customized: { type: Boolean, default: false },
      keyPoints: [{ type: String, trim: true }]
    },
    portfolio: {
      url: { type: String, trim: true },
      highlights: [{ type: String, trim: true }]
    }
  },
  
  // AI Assistant Insights
  aiInsights: {
    connectionScore: { type: Number, min: 0, max: 100 }, // Based on card taps and timing
    followUpSuggestions: [{ type: String, trim: true }],
    companyResearch: {
      recentNews: [{ type: String, trim: true }],
      keyPeople: [{ type: String, trim: true }],
      lastUpdated: { type: Date }
    },
    probabilityScore: { type: Number, min: 0, max: 100 }, // Success probability
    recommendedActions: [{
      action: { type: String, required: true },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      dueDate: { type: Date },
      completed: { type: Boolean, default: false }
    }]
  },
  
  // Priority & Tags
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  tags: [{ 
    type: String, 
    trim: true,
    maxLength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Activity Log
  activityLog: [{
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    details: { type: String },
    automated: { type: Boolean, default: false }
  }],
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'card_tap', 'linkedin', 'referral', 'job_board'],
      default: 'manual'
    },
    confidence: { type: Number, min: 0, max: 100, default: 100 },
    archived: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
interviewSchema.index({ owner: 1, status: 1 });
interviewSchema.index({ owner: 1, 'timeline.followUpDue': 1 });
interviewSchema.index({ owner: 1, priority: 1, status: 1 });
interviewSchema.index({ 'cardConnection.card': 1 });
interviewSchema.index({ 'company.name': 'text', 'position.title': 'text' });

// Virtual for days since last contact
interviewSchema.virtual('daysSinceLastContact').get(function() {
  if (!this.followUp.lastContactAt) return null;
  
  const diffTime = Date.now() - this.followUp.lastContactAt.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for time until follow-up due
interviewSchema.virtual('followUpIn').get(function() {
  if (!this.followUp.reminderAt) return null;
  
  const diffTime = this.followUp.reminderAt.getTime() - Date.now();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `${days} days`;
});

// Method to record card tap for this interview
interviewSchema.methods.recordCardTap = async function(tapData = {}) {
  this.cardConnection.tapCount += 1;
  this.cardConnection.lastTapped = new Date();
  
  // Add tap details
  this.cardConnection.tapDetails.push({
    timestamp: new Date(),
    location: tapData.location || 'Unknown',
    device: tapData.device || 'Unknown',
    ip: tapData.ip || 'Unknown'
  });
  
  // Update AI insights
  this.updateConnectionScore();
  
  // Add to activity log
  this.activityLog.push({
    action: 'card_tapped',
    details: `Card tapped - ${tapData.device || 'Unknown device'}`,
    automated: true
  });
  
  await this.save();
};

// Method to update connection score based on card activity
interviewSchema.methods.updateConnectionScore = function() {
  let score = 0;
  
  // Base score from card taps
  score += Math.min(this.cardConnection.tapCount * 10, 40);
  
  // Bonus for recent activity
  if (this.cardConnection.lastTapped) {
    const daysSinceLastTap = (Date.now() - this.cardConnection.lastTapped.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastTap <= 1) score += 20;
    else if (daysSinceLastTap <= 7) score += 10;
  }
  
  // Bonus for follow-up compliance
  if (this.followUp.lastContactAt && this.daysSinceLastContact <= 3) {
    score += 15;
  }
  
  // Status-based scoring
  const statusScores = {
    'lead': 10,
    'applied': 20,
    'phone_screen': 40,
    'interview_scheduled': 60,
    'interviewed': 70,
    'follow_up': 75,
    'offer': 90,
    'rejected': 0,
    'withdrawn': 0
  };
  
  score += statusScores[this.status] || 0;
  
  this.aiInsights.connectionScore = Math.min(score, 100);
};

// Method to suggest next actions
interviewSchema.methods.generateFollowUpSuggestions = function() {
  const suggestions = [];
  const now = new Date();
  
  switch (this.status) {
    case 'applied':
      if (!this.followUp.lastContactAt || this.daysSinceLastContact > 7) {
        suggestions.push('Send a follow-up email to confirm receipt of application');
      }
      break;
      
    case 'phone_screen':
      suggestions.push('Send thank you email within 24 hours');
      suggestions.push('Connect with interviewer on LinkedIn');
      break;
      
    case 'interviewed':
      if (!this.followUp.lastContactAt || this.daysSinceLastContact === 0) {
        suggestions.push('Send thank you email with specific conversation references');
      }
      if (this.daysSinceLastContact > 5) {
        suggestions.push('Send polite follow-up on timeline and next steps');
      }
      break;
      
    case 'offer':
      suggestions.push('Negotiate terms if needed');
      suggestions.push('Request time to consider if deadline is tight');
      break;
  }
  
  // Card-based suggestions
  if (this.cardConnection.card && this.cardConnection.tapCount > 0) {
    if (this.daysSinceLastContact > 3) {
      suggestions.push('Reference the business card exchange in your follow-up');
    }
  }
  
  this.aiInsights.followUpSuggestions = suggestions;
  return suggestions;
};

// Static method to find interviews needing follow-up
interviewSchema.statics.getNeedingFollowUp = async function(userId) {
  const now = new Date();
  
  return await this.find({
    owner: userId,
    status: { $in: ['applied', 'phone_screen', 'interviewed', 'follow_up'] },
    $or: [
      { 'followUp.reminderAt': { $lte: now } },
      { 'followUp.lastContactAt': { $lte: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)) } }
    ],
    'metadata.archived': false
  }).populate('cardConnection.card', 'cardUID nickname').sort({ priority: -1, 'followUp.reminderAt': 1 });
};

// Static method to get dashboard stats
interviewSchema.statics.getDashboardStats = async function(userId) {
  const [
    totalInterviews,
    activeInterviews,
    needingFollowUp,
    thisWeekActivity
  ] = await Promise.all([
    this.countDocuments({ owner: userId, 'metadata.archived': false }),
    this.countDocuments({ 
      owner: userId, 
      status: { $in: ['applied', 'phone_screen', 'interview_scheduled', 'interviewed', 'follow_up'] },
      'metadata.archived': false
    }),
    this.countDocuments({ 
      owner: userId,
      'followUp.reminderAt': { $lte: new Date() },
      'metadata.archived': false
    }),
    this.countDocuments({
      owner: userId,
      createdAt: { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) }
    })
  ]);
  
  return {
    totalInterviews,
    activeInterviews,
    needingFollowUp,
    thisWeekActivity,
    successRate: totalInterviews > 0 ? Math.round((await this.countDocuments({ 
      owner: userId, 
      status: 'offer' 
    }) / totalInterviews) * 100) : 0
  };
};

// Pre-save middleware
interviewSchema.pre('save', function(next) {
  // Auto-update connection score
  if (this.isModified('cardConnection') || this.isModified('followUp') || this.isModified('status')) {
    this.updateConnectionScore();
  }
  
  // Auto-generate follow-up suggestions
  if (this.isModified('status') || this.isModified('followUp.lastContactAt')) {
    this.generateFollowUpSuggestions();
  }
  
  // Set follow-up reminder based on status
  if (this.isModified('status') && !this.followUp.reminderAt) {
    const reminderDays = {
      'applied': 7,
      'phone_screen': 1,
      'interviewed': 2,
      'follow_up': 5
    };
    
    if (reminderDays[this.status]) {
      this.followUp.reminderAt = new Date(Date.now() + (reminderDays[this.status] * 24 * 60 * 60 * 1000));
    }
  }
  
  next();
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;