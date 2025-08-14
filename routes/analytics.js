const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Card = require('../models/Card');
const Activity = require('../models/Activity');
const Category = require('../models/Category');
const Interview = require('../models/Interview');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/analytics/overview
// @desc    Get comprehensive analytics overview
// @access  Private
router.get('/overview', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days), 90); // Max 90 days
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysNum * 24 * 60 * 60 * 1000));
    
    // Get all key metrics in parallel
    const [
      cardStats,
      activityStats,
      categoryStats,
      interviewStats,
      tapTrends,
      topPerformingCards,
      recentActivities
    ] = await Promise.all([
      getCardAnalytics(req.user._id, startDate, endDate),
      getActivityAnalytics(req.user._id, startDate, endDate),
      getCategoryAnalytics(req.user._id, startDate, endDate),
      getInterviewAnalytics(req.user._id, startDate, endDate),
      getTapTrends(req.user._id, startDate, endDate),
      getTopPerformingCards(req.user._id, 5),
      Activity.getRecentActivities(req.user._id, 10)
    ]);
    
    res.json({
      success: true,
      data: {
        period: { days: daysNum, startDate, endDate },
        cards: cardStats,
        activities: activityStats,
        categories: categoryStats,
        interviews: interviewStats,
        trends: {
          taps: tapTrends
        },
        topCards: topPerformingCards,
        recentActivity: recentActivities
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics overview'
    });
  }
});

// @route   GET /api/analytics/cards
// @desc    Get detailed card analytics
// @access  Private
router.get('/cards', async (req, res) => {
  try {
    const { days = 30, cardId } = req.query;
    const daysNum = Math.min(parseInt(days), 90);
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysNum * 24 * 60 * 60 * 1000));
    
    if (cardId) {
      // Get specific card analytics
      const card = await Card.findOne({ _id: cardId, owner: req.user._id });
      if (!card) {
        return res.status(404).json({
          success: false,
          error: 'Card not found'
        });
      }
      
      const cardAnalytics = await getSpecificCardAnalytics(cardId, startDate, endDate);
      
      res.json({
        success: true,
        data: {
          card,
          analytics: cardAnalytics,
          period: { days: daysNum, startDate, endDate }
        }
      });
    } else {
      // Get all cards analytics
      const cardsAnalytics = await getCardAnalytics(req.user._id, startDate, endDate);
      const cardsList = await Card.find({ owner: req.user._id })
        .populate('category', 'name color')
        .select('cardUID nickname tapCount lastTapped status category')
        .sort({ tapCount: -1 });
      
      res.json({
        success: true,
        data: {
          analytics: cardsAnalytics,
          cards: cardsList,
          period: { days: daysNum, startDate, endDate }
        }
      });
    }
  } catch (error) {
    console.error('Card analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch card analytics'
    });
  }
});

// @route   GET /api/analytics/categories
// @desc    Get category performance analytics
// @access  Private
router.get('/categories', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days), 90);
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysNum * 24 * 60 * 60 * 1000));
    
    const categoriesWithStats = await Category.getUserCategoriesWithStats(req.user._id);
    
    res.json({
      success: true,
      data: {
        categories: categoriesWithStats,
        period: { days: daysNum, startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Category analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category analytics'
    });
  }
});

// @route   GET /api/analytics/trends
// @desc    Get trends and time-series data
// @access  Private
router.get('/trends', async (req, res) => {
  try {
    const { days = 30, granularity = 'day' } = req.query;
    const daysNum = Math.min(parseInt(days), 90);
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysNum * 24 * 60 * 60 * 1000));
    
    const trends = await getTrendsData(req.user._id, startDate, endDate, granularity);
    
    res.json({
      success: true,
      data: {
        trends,
        period: { days: daysNum, startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends data'
    });
  }
});

// @route   GET /api/analytics/geographic
// @desc    Get geographic analytics data
// @access  Private
router.get('/geographic', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days), 90);
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysNum * 24 * 60 * 60 * 1000));
    
    const geoData = await getGeographicData(req.user._id, startDate, endDate);
    
    res.json({
      success: true,
      data: {
        geographic: geoData,
        period: { days: daysNum, startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Geographic analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch geographic data'
    });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data in various formats
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days), 90);
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysNum * 24 * 60 * 60 * 1000));
    
    const exportData = await getExportData(req.user._id, startDate, endDate);
    
    if (format === 'csv') {
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tapme-analytics.csv');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: exportData,
        exportedAt: new Date().toISOString(),
        period: { days: daysNum, startDate, endDate }
      });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
});

// Helper Functions

async function getCardAnalytics(userId, startDate, endDate) {
  const [totalCards, activeCards, totalTaps, avgTapsPerCard] = await Promise.all([
    Card.countDocuments({ owner: userId }),
    Card.countDocuments({ 
      owner: userId, 
      lastTapped: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    Card.aggregate([
      { $match: { owner: userId } },
      { $group: { _id: null, total: { $sum: '$tapCount' } } }
    ]).then(result => result[0]?.total || 0),
    Card.aggregate([
      { $match: { owner: userId } },
      { $group: { _id: null, avg: { $avg: '$tapCount' } } }
    ]).then(result => Math.round(result[0]?.avg || 0))
  ]);

  return {
    totalCards,
    activeCards,
    totalTaps,
    avgTapsPerCard,
    activationRate: totalCards > 0 ? Math.round((activeCards / totalCards) * 100) : 0
  };
}

async function getActivityAnalytics(userId, startDate, endDate) {
  const [totalActivities, unreadCount, typeBreakdown] = await Promise.all([
    Activity.countDocuments({ 
      owner: userId, 
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    Activity.getUnreadCount(userId),
    Activity.aggregate([
      {
        $match: { 
          owner: userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);

  return {
    totalActivities,
    unreadCount,
    typeBreakdown
  };
}

async function getCategoryAnalytics(userId, startDate, endDate) {
  const categories = await Category.getUserCategoriesWithStats(userId);
  
  return {
    totalCategories: categories.length,
    categories: categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      totalCards: cat.stats.totalCards,
      totalTaps: cat.stats.totalTaps,
      trend: cat.performanceMetrics.trend
    }))
  };
}

async function getInterviewAnalytics(userId, startDate, endDate) {
  const stats = await Interview.getDashboardStats(userId);
  return stats;
}

async function getTapTrends(userId, startDate, endDate) {
  // Get daily tap counts for trend analysis
  return await Activity.aggregate([
    {
      $match: {
        owner: userId,
        type: 'card_tap',
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
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
}

async function getTopPerformingCards(userId, limit = 5) {
  return await Card.find({ owner: userId })
    .populate('category', 'name color')
    .sort({ tapCount: -1 })
    .limit(limit)
    .select('cardUID nickname tapCount lastTapped category');
}

async function getSpecificCardAnalytics(cardId, startDate, endDate) {
  const tapsByDay = await Activity.aggregate([
    {
      $match: {
        'relatedObjects.card': cardId,
        type: 'card_tap',
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
        taps: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  return { tapsByDay };
}

async function getTrendsData(userId, startDate, endDate, granularity) {
  const groupBy = granularity === 'hour' ? {
    year: { $year: '$createdAt' },
    month: { $month: '$createdAt' },
    day: { $dayOfMonth: '$createdAt' },
    hour: { $hour: '$createdAt' }
  } : {
    year: { $year: '$createdAt' },
    month: { $month: '$createdAt' },
    day: { $dayOfMonth: '$createdAt' }
  };

  const [tapTrends, activityTrends] = await Promise.all([
    Activity.aggregate([
      {
        $match: {
          owner: userId,
          type: 'card_tap',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]),
    Activity.aggregate([
      {
        $match: {
          owner: userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          types: { $addToSet: '$type' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ])
  ]);

  return { taps: tapTrends, activities: activityTrends };
}

async function getGeographicData(userId, startDate, endDate) {
  return await Activity.aggregate([
    {
      $match: {
        owner: userId,
        type: 'card_tap',
        createdAt: { $gte: startDate, $lte: endDate },
        'metadata.location.country': { $exists: true }
      }
    },
    {
      $group: {
        _id: {
          country: '$metadata.location.country',
          region: '$metadata.location.region',
          city: '$metadata.location.city'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

async function getExportData(userId, startDate, endDate) {
  const [cards, activities, categories] = await Promise.all([
    Card.find({ owner: userId }).populate('category', 'name'),
    Activity.find({ 
      owner: userId, 
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('relatedObjects.card', 'cardUID nickname'),
    Category.find({ owner: userId })
  ]);

  return { cards, activities, categories };
}

function convertToCSV(data) {
  // Simple CSV conversion for cards data
  const cards = data.cards || [];
  const headers = ['Card UID', 'Nickname', 'Tap Count', 'Status', 'Category', 'Last Tapped'];
  const rows = cards.map(card => [
    card.cardUID,
    card.nickname || '',
    card.tapCount,
    card.status,
    card.category?.name || 'Uncategorized',
    card.lastTapped ? card.lastTapped.toISOString() : ''
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

module.exports = router;