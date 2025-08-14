const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Activity = require('../models/Activity');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @route   GET /api/activities
// @desc    Get user's activity feed with filtering and pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      includeSystem = 'true',
      page = 1, 
      limit = 20,
      priority,
      unreadOnly = 'false'
    } = req.query;
    
    // Build query
    const query = { owner: req.user._id, isArchived: false };
    
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (unreadOnly === 'true') query.isRead = false;
    if (includeSystem === 'false') query.isSystemGenerated = false;
    
    // Execute query with pagination
    const activities = await Activity.find(query)
      .populate('relatedObjects.card', 'cardUID nickname')
      .populate('relatedObjects.category', 'name icon color')
      .populate('relatedObjects.interview', 'company.name position.title status')
      .sort({ importanceScore: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const total = await Activity.countDocuments(query);
    
    // Get unread count
    const unreadCount = await Activity.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities'
    });
  }
});

// @route   GET /api/activities/dashboard
// @desc    Get recent activities for dashboard display
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const { limit = 10, includeSystem = 'true' } = req.query;
    
    const activities = await Activity.getRecentActivities(
      req.user._id, 
      parseInt(limit), 
      includeSystem === 'true'
    );
    
    const unreadCount = await Activity.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      data: {
        activities,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get dashboard activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard activities'
    });
  }
});

// @route   GET /api/activities/stats
// @desc    Get activity statistics and trends
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days), 90); // Max 90 days
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysNum * 24 * 60 * 60 * 1000));
    
    // Get activity statistics
    const stats = await Activity.aggregate([
      {
        $match: {
          owner: req.user._id,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgImportance: { $avg: '$importanceScore' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get daily activity counts
    const dailyStats = await Activity.aggregate([
      {
        $match: {
          owner: req.user._id,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          types: { $addToSet: '$type' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // Get total counts
    const totalActivities = await Activity.countDocuments({
      owner: req.user._id,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    const unreadCount = await Activity.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      data: {
        period: { days: daysNum, startDate, endDate },
        totalActivities,
        unreadCount,
        typeBreakdown: stats,
        dailyActivity: dailyStats
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity statistics'
    });
  }
});

// @route   POST /api/activities/mark-read
// @desc    Mark activities as read
// @access  Private
router.post('/mark-read', async (req, res) => {
  try {
    const { activityIds } = req.body;
    
    // If no specific IDs provided, mark all as read
    const result = await Activity.markAsRead(req.user._id, activityIds);
    
    const unreadCount = await Activity.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      data: {
        markedCount: result.modifiedCount,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Mark activities read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark activities as read'
    });
  }
});

// @route   GET /api/activities/:id
// @desc    Get single activity details
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      owner: req.user._id
    })
      .populate('relatedObjects.card', 'cardUID nickname tapCount')
      .populate('relatedObjects.category', 'name icon color')
      .populate('relatedObjects.interview', 'company.name position.title status')
      .populate('relatedObjects.profile', 'firstName lastName');
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }
    
    // Mark as read if not already read
    if (!activity.isRead) {
      activity.isRead = true;
      activity.readAt = new Date();
      await activity.save();
    }
    
    res.json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity'
    });
  }
});

// @route   PUT /api/activities/:id
// @desc    Update activity (limited fields)
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }
    
    const { priority, isArchived } = req.body;
    
    // Only allow updating certain fields
    if (priority) activity.priority = priority;
    if (typeof isArchived === 'boolean') activity.isArchived = isArchived;
    
    await activity.save();
    
    res.json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update activity'
    });
  }
});

// @route   DELETE /api/activities/:id
// @desc    Archive activity (soft delete)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }
    
    // Soft delete
    activity.isArchived = true;
    await activity.save();
    
    res.json({
      success: true,
      message: 'Activity archived successfully'
    });
  } catch (error) {
    console.error('Archive activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive activity'
    });
  }
});

// @route   POST /api/activities/cleanup
// @desc    Clean up old activities (manual trigger)
// @access  Private
router.post('/cleanup', async (req, res) => {
  try {
    const result = await Activity.cleanupOldActivities();
    
    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        message: 'Old activities cleaned up successfully'
      }
    });
  } catch (error) {
    console.error('Cleanup activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old activities'
    });
  }
});

// @route   GET /api/activities/types/summary
// @desc    Get summary of activity types for filtering
// @access  Private
router.get('/types/summary', async (req, res) => {
  try {
    const summary = await Activity.aggregate([
      {
        $match: { 
          owner: req.user._id,
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          },
          latestActivity: { $max: '$createdAt' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: { activityTypes: summary }
    });
  } catch (error) {
    console.error('Get activity types summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity types summary'
    });
  }
});

module.exports = router;