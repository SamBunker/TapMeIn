const express = require('express');
const mongoose = require('mongoose');
const { authenticateOptional, authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Card = require('../models/Card');
const Activity = require('../models/Activity');

const router = express.Router();

// Helper function to get user statistics with real-time data
async function getUserStats(userId) {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get comprehensive card analytics with fallback queries
    const [cardAnalytics, monthlyTaps, weeklyTaps, recentActivities, unreadCount, profileCount, totalCards, activatedCards, totalTaps] = await Promise.all([
      Card.getAnalyticsSummary(userId).catch(() => []),
      Activity.countDocuments({
        owner: userId,
        type: 'card_tap',
        createdAt: { $gte: startOfMonth }
      }),
      Activity.countDocuments({
        owner: userId,
        type: 'card_tap',
        createdAt: { $gte: startOfWeek }
      }),
      Activity.getRecentActivities(userId, 5, true),
      Activity.getUnreadCount(userId),
      Card.countDocuments({ owner: userId, profile: { $ne: null } }),
      // Fallback queries for basic stats
      Card.countDocuments({ owner: userId }),
      Card.countDocuments({ owner: userId, isActivated: true }),
      Card.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalTaps: { $sum: '$tapCount' } } }
      ]).then(result => result[0]?.totalTaps || 0)
    ]);
    
    // Use aggregation result if available, otherwise use fallback queries
    const cardStats = cardAnalytics[0] || {
      totalCards: totalCards,
      totalTaps: totalTaps,
      activeCards: activatedCards,
      averageTapsPerCard: totalCards > 0 ? Math.round(totalTaps / totalCards) : 0
    };
    
    return {
      totalCards: cardStats.totalCards,
      activeCards: cardStats.activeCards,
      totalTaps: cardStats.totalTaps,
      thisMonthTaps: monthlyTaps,
      thisWeekTaps: weeklyTaps,
      totalProfiles: profileCount,
      averageTapsPerCard: Math.round(cardStats.averageTapsPerCard || 0),
      recentActivities: recentActivities,
      unreadActivities: unreadCount
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalCards: 0,
      activeCards: 0,
      totalTaps: 0,
      thisMonthTaps: 0,
      thisWeekTaps: 0,
      totalProfiles: 0,
      averageTapsPerCard: 0,
      recentActivities: [],
      unreadActivities: 0
    };
  }
}

// @route   GET /
// @desc    Landing page or dashboard
// @access  Public/Private
router.get('/', authenticateOptional, async (req, res) => {
  if (req.user) {
    // User is logged in, show dashboard
    try {
      const stats = await getUserStats(req.user._id);
      const welcome = req.query.welcome === 'true';
      
      // Get additional dashboard data
      const [chartData, topCards] = await Promise.all([
        getDashboardChartData(req.user._id),
        getTopPerformingCards(req.user._id, 3)
      ]);
      
      // Determine time of day for greeting
      const hour = new Date().getHours();
      const morning = hour >= 5 && hour < 12;
      const afternoon = hour >= 12 && hour < 17;
      
      res.render('dashboard/index', {
        title: 'Dashboard',
        user: req.user,
        stats,
        chartData,
        topCards,
        welcome,
        morning,
        afternoon,
        layout: 'main'
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Unable to load dashboard',
        layout: 'main'
      });
    }
  } else {
    // User not logged in, redirect to login
    res.redirect('/auth/login');
  }
});

// @route   GET /dashboard
// @desc    Dashboard (explicit route)
// @access  Private
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const stats = await getUserStats(req.user._id);
    
    // Get additional dashboard data
    const [chartData, topCards] = await Promise.all([
      getDashboardChartData(req.user._id),
      getTopPerformingCards(req.user._id, 3)
    ]);
    
    // Determine time of day for greeting
    const hour = new Date().getHours();
    const morning = hour >= 5 && hour < 12;
    const afternoon = hour >= 12 && hour < 17;
    
    res.render('dashboard/index', {
      title: 'Dashboard',
      user: req.user,
      stats,
      chartData,
      topCards,
      morning,
      afternoon,
      layout: 'main'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load dashboard',
      layout: 'main'
    });
  }
});

// @route   POST /dashboard/activate-card
// @desc    Activate a card
// @access  Private
router.post('/dashboard/activate-card', authenticateToken, async (req, res) => {
  try {
    const { activationCode, nickname } = req.body;
    
    // Find card by activation code
    const card = await Card.findOne({ 
      activationCode: activationCode.toUpperCase(),
      status: 'ready' 
    });
    
    if (!card) {
      return res.render('dashboard/index', {
        title: 'Dashboard',
        user: req.user,
        stats: await getUserStats(req.user._id),
        chartData: [],
        topCards: [],
        error: 'Invalid activation code or card already activated',
        layout: 'main'
      });
    }
    
    // Activate the card
    card.owner = req.user._id;
    card.status = 'activated';
    card.isActivated = true;
    card.activatedAt = new Date();
    card.nickname = nickname || null;
    card.activationCode = undefined; // Clear activation code
    
    await card.save();
    
    res.redirect('/dashboard?activated=true');
  } catch (error) {
    console.error('Card activation error:', error);
    res.render('dashboard/index', {
      title: 'Dashboard',
      user: req.user,
      stats: await getUserStats(req.user._id),
      chartData: [],
      topCards: [],
      error: 'Failed to activate card. Please try again.',
      layout: 'main'
    });
  }
});

// @route   GET /dashboard/cards
// @desc    Show user cards
// @access  Private
router.get('/dashboard/cards', authenticateToken, async (req, res) => {
  try {
    const cards = await Card.find({ owner: req.user._id }).sort({ createdAt: -1 });
    
    res.render('dashboard/cards', {
      title: 'My Cards',
      user: req.user,
      cards,
      layout: 'main'
    });
  } catch (error) {
    console.error('Cards page error:', error);
    res.redirect('/dashboard?error=Unable to load cards');
  }
});

// @route   GET /dashboard/profiles
// @desc    Show user profiles
// @access  Private
router.get('/dashboard/profiles', authenticateToken, async (req, res) => {
  try {
    res.render('dashboard/profiles', {
      title: 'Edit Profile',
      user: req.user,
      layout: 'main'
    });
  } catch (error) {
    console.error('Profiles page error:', error);
    res.redirect('/dashboard?error=Unable to load profiles');
  }
});

// @route   GET /dashboard/analytics
// @desc    Show analytics
// @access  Private
router.get('/dashboard/analytics', authenticateToken, async (req, res) => {
  try {
    const stats = await getUserStats(req.user._id);
    
    // Get detailed analytics data
    const [chartData, cardsList, deviceBreakdown, locationBreakdown] = await Promise.all([
      getDashboardChartData(req.user._id),
      getTopPerformingCards(req.user._id, 10),
      getDeviceBreakdown(req.user._id),
      getLocationBreakdown(req.user._id)
    ]);
    
    res.render('dashboard/analytics', {
      title: 'Analytics',
      user: req.user,
      stats,
      chartData,
      cardsList,
      deviceBreakdown,
      locationBreakdown,
      layout: 'main'
    });
  } catch (error) {
    console.error('Analytics page error:', error);
    res.redirect('/dashboard?error=Unable to load analytics');
  }
});

// @route   GET /dashboard/support
// @desc    Show support page
// @access  Private
router.get('/dashboard/support', authenticateToken, async (req, res) => {
  try {
    res.render('dashboard/support', {
      title: 'Support',
      user: req.user,
      layout: 'main'
    });
  } catch (error) {
    console.error('Support page error:', error);
    res.redirect('/dashboard?error=Unable to load support');
  }
});

// @route   GET /dashboard/subscription
// @desc    Show subscription page
// @access  Private
router.get('/dashboard/subscription', authenticateToken, async (req, res) => {
  try {
    res.render('dashboard/subscription', {
      title: 'Subscription',
      user: req.user,
      layout: 'main'
    });
  } catch (error) {
    console.error('Subscription page error:', error);
    res.redirect('/dashboard?error=Unable to load subscription');
  }
});

// @route   GET /dashboard/settings
// @desc    Show settings page
// @access  Private
router.get('/dashboard/settings', authenticateToken, async (req, res) => {
  try {
    res.render('dashboard/settings', {
      title: 'Settings',
      user: req.user,
      layout: 'main'
    });
  } catch (error) {
    console.error('Settings page error:', error);
    res.redirect('/dashboard?error=Unable to load settings');
  }
});

// Helper function to get dashboard chart data
async function getDashboardChartData(userId) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get daily tap counts for the last 30 days
    const tapData = await Activity.aggregate([
      {
        $match: {
          owner: userId,
          type: 'card_tap',
          createdAt: { $gte: thirtyDaysAgo }
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
    
    // Convert to chart-friendly format
    return tapData.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      taps: item.count
    }));
  } catch (error) {
    console.error('Error getting chart data:', error);
    return [];
  }
}

// Helper function to get top performing cards
async function getTopPerformingCards(userId, limit = 3) {
  try {
    return await Card.find({ owner: userId, isActivated: true })
      .populate('category', 'name color')
      .sort({ tapCount: -1 })
      .limit(limit)
      .select('cardUID nickname tapCount lastTapped category')
      .lean();
  } catch (error) {
    console.error('Error getting top cards:', error);
    return [];
  }
}

// Helper function to get device breakdown analytics
async function getDeviceBreakdown(userId) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return await Activity.aggregate([
      {
        $match: {
          owner: userId,
          type: 'card_tap',
          createdAt: { $gte: thirtyDaysAgo },
          'metadata.device.type': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$metadata.device.type',
          count: { $sum: 1 },
          browsers: { $addToSet: '$metadata.device.browser' },
          os: { $addToSet: '$metadata.device.os' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
  } catch (error) {
    console.error('Error getting device breakdown:', error);
    return [];
  }
}

// Helper function to get location breakdown analytics
async function getLocationBreakdown(userId) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return await Activity.aggregate([
      {
        $match: {
          owner: userId,
          type: 'card_tap',
          createdAt: { $gte: thirtyDaysAgo },
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
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
  } catch (error) {
    console.error('Error getting location breakdown:', error);
    return [];
  }
}

module.exports = router;