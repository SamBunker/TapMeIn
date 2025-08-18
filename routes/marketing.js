const express = require('express');
const router = express.Router();

// @route   GET /
// @desc    Marketing homepage
// @access  Public
router.get('/', (req, res) => {
  res.render('marketing/index', {
    title: 'TAP ME IN! - Smart NFC Networking Cards',
    hideNavbar: true,
    hideFooter: false,
    layout: 'main',
    isMarketing: true
  });
});

// @route   GET /features
// @desc    Features page
// @access  Public
router.get('/features', (req, res) => {
  res.render('marketing/features', {
    title: 'Features - TAP ME IN!',
    hideNavbar: true,
    hideFooter: false,
    layout: 'main',
    isMarketing: true
  });
});

// @route   GET /pricing
// @desc    Pricing page
// @access  Public
router.get('/pricing', (req, res) => {
  res.render('marketing/pricing', {
    title: 'Pricing - TAP ME IN!',
    hideNavbar: true,
    hideFooter: false,
    layout: 'main',
    isMarketing: true
  });
});

// @route   GET /about
// @desc    About page
// @access  Public
router.get('/about', (req, res) => {
  res.render('marketing/about', {
    title: 'About - TAP ME IN!',
    hideNavbar: true,
    hideFooter: false,
    layout: 'main',
    isMarketing: true
  });
});

// @route   GET /demo
// @desc    Demo dashboard with fake data
// @access  Public
router.get('/demo', (req, res) => {
  // Generate fake demo data
  const demoStats = {
    totalCards: 3,
    activeCards: 2,
    totalTaps: 847,
    thisMonthTaps: 142,
    thisWeekTaps: 38,
    totalProfiles: 2,
    averageTapsPerCard: 282,
    recentActivities: [
      {
        icon: 'hand-index',
        title: 'Card tapped',
        description: 'Someone viewed your profile from San Francisco',
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        icon: 'person-plus',
        title: 'New connection',
        description: 'Sarah M. saved your contact info',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        icon: 'graph-up',
        title: 'Weekly milestone',
        description: 'You reached 50 taps this week!',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ],
    unreadActivities: 3
  };
  
  const demoUser = {
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@tapmein.online',
    accountType: 'student',
    subscription: {
      plan: 'free',
      status: 'trial'
    }
  };
  
  res.render('dashboard/index', {
    title: 'Demo Dashboard - TAP ME IN!',
    user: demoUser,
    stats: demoStats,
    chartData: [],
    topCards: [],
    morning: false,
    afternoon: true,
    isDemo: true,
    layout: 'main'
  });
});

module.exports = router;