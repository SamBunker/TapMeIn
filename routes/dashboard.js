const express = require('express');
const { authenticateOptional, authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Card = require('../models/Card');

const router = express.Router();

// Helper function to get user statistics
async function getUserStats(userId) {
  try {
    const cards = await Card.find({ owner: userId });
    const activeCards = cards.filter(card => card.isActivated).length;
    const totalTaps = cards.reduce((sum, card) => sum + card.tapCount, 0);
    
    // Calculate this month's taps (simplified - would need analytics collection for real data)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthTaps = Math.floor(totalTaps * 0.3); // Approximation
    
    return {
      activeCards,
      totalTaps,
      thisMonthTaps,
      totalProfiles: cards.length // Simplified
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      activeCards: 0,
      totalTaps: 0,
      thisMonthTaps: 0,
      totalProfiles: 0
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
      
      // Get recent activity (placeholder - would come from activity log)
      const recentActivity = [];
      
      res.render('dashboard/index', {
        title: 'Dashboard',
        user: req.user,
        stats,
        recentActivity,
        welcome,
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
    
    res.render('dashboard/index', {
      title: 'Dashboard',
      user: req.user,
      stats,
      recentActivity: [],
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
        recentActivity: [],
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
      recentActivity: [],
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
    
    res.render('dashboard/analytics', {
      title: 'Analytics',
      user: req.user,
      stats,
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

module.exports = router;