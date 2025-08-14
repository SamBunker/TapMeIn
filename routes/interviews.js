const express = require('express');
const { authenticateToken, requireSubscription } = require('../middleware/auth');
const Interview = require('../models/Interview');
const Card = require('../models/Card');
const Activity = require('../models/Activity');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @route   GET /api/interviews
// @desc    Get user's interviews with filtering and pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      company, 
      page = 1, 
      limit = 20,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;
    
    // Build query
    const query = { owner: req.user._id, 'metadata.archived': false };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (company) query['company.name'] = new RegExp(company, 'i');
    
    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const interviews = await Interview.find(query)
      .populate('cardConnection.card', 'cardUID nickname')
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const total = await Interview.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        interviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interviews'
    });
  }
});

// @route   GET /api/interviews/dashboard
// @desc    Get dashboard stats and recent interviews
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const [stats, recentInterviews, needingFollowUp] = await Promise.all([
      Interview.getDashboardStats(req.user._id),
      Interview.find({ 
        owner: req.user._id, 
        'metadata.archived': false 
      })
        .populate('cardConnection.card', 'cardUID nickname')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Interview.getNeedingFollowUp(req.user._id)
    ]);
    
    res.json({
      success: true,
      data: {
        stats,
        recentInterviews,
        needingFollowUp: needingFollowUp.slice(0, 5) // Limit to 5 most urgent
      }
    });
  } catch (error) {
    console.error('Interview dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview dashboard data'
    });
  }
});

// @route   GET /api/interviews/:id
// @desc    Get single interview with full details
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      owner: req.user._id
    }).populate('cardConnection.card');
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    res.json({
      success: true,
      data: { interview }
    });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview'
    });
  }
});

// @route   POST /api/interviews
// @desc    Create new interview
// @access  Private
router.post('/', requireSubscription('basic', 'interviews'), async (req, res) => {
  try {
    const {
      title,
      company,
      position,
      status = 'lead',
      priority = 'medium',
      timeline,
      contacts,
      cardId,
      interviewDetails,
      tags
    } = req.body;
    
    // Check subscription limits
    const interviewCount = await Interview.countDocuments({ 
      owner: req.user._id, 
      'metadata.archived': false 
    });
    
    const limits = {
      free: 5,
      basic: 25,
      standard: 100,
      premium: -1 // unlimited
    };
    
    const userLimit = limits[req.user.subscription.plan] || limits.free;
    
    if (userLimit !== -1 && interviewCount >= userLimit) {
      return res.status(402).json({
        success: false,
        error: `Your ${req.user.subscription.plan} plan allows maximum ${userLimit} interviews. Please upgrade to create more.`,
        currentPlan: req.user.subscription.plan,
        limit: userLimit
      });
    }
    
    // Validate card connection if provided
    let cardConnection = {};
    if (cardId) {
      const card = await Card.findOne({ _id: cardId, owner: req.user._id });
      if (card) {
        cardConnection = {
          card: cardId,
          sharedAt: new Date(),
          tapCount: 0,
          tapDetails: []
        };
      }
    }
    
    const interview = new Interview({
      title: title.trim(),
      company: {
        name: company.name.trim(),
        website: company.website,
        industry: company.industry,
        size: company.size || 'medium'
      },
      position: {
        title: position.title.trim(),
        department: position.department,
        level: position.level || 'mid',
        salary: position.salary,
        remote: position.remote || 'hybrid'
      },
      owner: req.user._id,
      status,
      priority,
      timeline: timeline || {},
      contacts: contacts || [],
      cardConnection,
      interviewDetails: interviewDetails || {},
      tags: tags || [],
      activityLog: [{
        action: 'interview_created',
        details: `Interview created for ${position.title} at ${company.name}`
      }]
    });
    
    await interview.save();
    
    // Create activity
    await Activity.create({
      type: 'interview_scheduled',
      title: `New interview: ${company.name}`,
      description: `Added ${position.title} interview opportunity`,
      owner: req.user._id,
      relatedObjects: { interview: interview._id },
      icon: 'bi-briefcase',
      color: '#345995',
      isSystemGenerated: true
    });
    
    res.status(201).json({
      success: true,
      data: { interview }
    });
  } catch (error) {
    console.error('Create interview error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors)[0].message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create interview'
    });
  }
});

// @route   PUT /api/interviews/:id
// @desc    Update interview
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    const {
      title,
      company,
      position,
      status,
      priority,
      timeline,
      contacts,
      interviewDetails,
      followUp,
      tags
    } = req.body;
    
    // Track status changes for activity log
    const oldStatus = interview.status;
    
    // Update fields
    if (title) interview.title = title.trim();
    if (company) interview.company = { ...interview.company, ...company };
    if (position) interview.position = { ...interview.position, ...position };
    if (status) interview.status = status;
    if (priority) interview.priority = priority;
    if (timeline) interview.timeline = { ...interview.timeline, ...timeline };
    if (contacts) interview.contacts = contacts;
    if (interviewDetails) interview.interviewDetails = { ...interview.interviewDetails, ...interviewDetails };
    if (followUp) interview.followUp = { ...interview.followUp, ...followUp };
    if (tags) interview.tags = tags;
    
    // Add activity log entry
    if (status && status !== oldStatus) {
      interview.activityLog.push({
        action: 'status_changed',
        details: `Status changed from ${oldStatus} to ${status}`
      });
      
      // Create activity for significant status changes
      if (['interviewed', 'offer', 'rejected'].includes(status)) {
        await Activity.createInterviewActivity(interview._id, 
          status === 'interviewed' ? 'completed' : 
          status === 'offer' ? 'callback' : 'completed',
          { outcome: status === 'offer' ? 'positive' : status === 'rejected' ? 'negative' : 'neutral' }
        );
      }
    }
    
    await interview.save();
    
    res.json({
      success: true,
      data: { interview }
    });
  } catch (error) {
    console.error('Update interview error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors)[0].message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update interview'
    });
  }
});

// @route   DELETE /api/interviews/:id
// @desc    Archive interview (soft delete)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    // Soft delete
    interview.metadata.archived = true;
    interview.activityLog.push({
      action: 'interview_archived',
      details: 'Interview archived'
    });
    
    await interview.save();
    
    res.json({
      success: true,
      message: 'Interview archived successfully'
    });
  } catch (error) {
    console.error('Archive interview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive interview'
    });
  }
});

// @route   POST /api/interviews/:id/card-tap
// @desc    Record card tap for interview tracking
// @access  Private
router.post('/:id/card-tap', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    const { location, device, ip } = req.body;
    
    await interview.recordCardTap({ location, device, ip });
    
    // Create activity if this is a significant tap
    if (interview.cardConnection.tapCount === 1) {
      await Activity.create({
        type: 'callback_received',
        title: `First contact: ${interview.company.name}`,
        description: `Your business card was accessed for the first time`,
        owner: req.user._id,
        relatedObjects: { 
          interview: interview._id,
          card: interview.cardConnection.card 
        },
        icon: 'bi-hand-index',
        color: '#ffc914',
        isSystemGenerated: true
      });
    }
    
    res.json({
      success: true,
      data: {
        tapCount: interview.cardConnection.tapCount,
        connectionScore: interview.aiInsights.connectionScore
      }
    });
  } catch (error) {
    console.error('Record card tap error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record card tap'
    });
  }
});

// @route   GET /api/interviews/:id/insights
// @desc    Get AI insights and suggestions for interview
// @access  Private
router.get('/:id/insights', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    // Generate fresh insights
    const suggestions = interview.generateFollowUpSuggestions();
    
    res.json({
      success: true,
      data: {
        connectionScore: interview.aiInsights.connectionScore,
        followUpSuggestions: suggestions,
        recommendedActions: interview.aiInsights.recommendedActions,
        probabilityScore: interview.aiInsights.probabilityScore,
        daysSinceLastContact: interview.daysSinceLastContact,
        followUpIn: interview.followUpIn
      }
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights'
    });
  }
});

// @route   POST /api/interviews/:id/follow-up
// @desc    Mark follow-up action as completed
// @access  Private
router.post('/:id/follow-up', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    const { action, notes } = req.body;
    
    // Update follow-up information
    interview.followUp.lastContactAt = new Date();
    interview.followUp.notes = notes || interview.followUp.notes;
    
    // Add to activity log
    interview.activityLog.push({
      action: 'follow_up_completed',
      details: `Completed: ${action}${notes ? ` - ${notes}` : ''}`
    });
    
    // Mark recommended action as completed if it exists
    const recommendedAction = interview.aiInsights.recommendedActions.find(ra => 
      ra.action === action && !ra.completed
    );
    if (recommendedAction) {
      recommendedAction.completed = true;
    }
    
    await interview.save();
    
    res.json({
      success: true,
      data: { interview }
    });
  } catch (error) {
    console.error('Complete follow-up error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete follow-up action'
    });
  }
});

// @route   GET /api/interviews/follow-up/pending
// @desc    Get all interviews needing follow-up
// @access  Private
router.get('/follow-up/pending', async (req, res) => {
  try {
    const interviews = await Interview.getNeedingFollowUp(req.user._id);
    
    res.json({
      success: true,
      data: { interviews }
    });
  } catch (error) {
    console.error('Get pending follow-ups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending follow-ups'
    });
  }
});

module.exports = router;