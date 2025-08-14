const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/subscription/plans
// @desc    Get available subscription plans
// @access  Private
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: {
        maxCards: 1,
        analytics: false,
        timeBasedRedirects: false,
        geoBasedRedirects: false,
        webhooks: false,
        smsAlerts: false,
        emailReports: false,
        apiAccess: false,
        customBranding: false,
        prioritySupport: false,
        interviewTracking: false,
        aiEmailAssistant: false,
        calendarIntegration: false
      }
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 9.99,
      features: {
        maxCards: 3,
        analytics: true,
        timeBasedRedirects: true,
        geoBasedRedirects: false,
        webhooks: false,
        smsAlerts: false,
        emailReports: true,
        apiAccess: false,
        customBranding: false,
        prioritySupport: false,
        interviewTracking: true,
        aiEmailAssistant: false,
        calendarIntegration: false
      }
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 24.99,
      features: {
        maxCards: 10,
        analytics: true,
        timeBasedRedirects: true,
        geoBasedRedirects: true,
        webhooks: true,
        smsAlerts: false,
        emailReports: true,
        apiAccess: false,
        customBranding: false,
        prioritySupport: true,
        interviewTracking: true,
        aiEmailAssistant: true,
        calendarIntegration: true
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 49.99,
      features: {
        maxCards: -1, // unlimited
        analytics: true,
        timeBasedRedirects: true,
        geoBasedRedirects: true,
        webhooks: true,
        smsAlerts: true,
        emailReports: true,
        apiAccess: true,
        customBranding: true,
        prioritySupport: true,
        interviewTracking: true,
        aiEmailAssistant: true,
        calendarIntegration: true
      }
    }
  ];

  res.json({
    success: true,
    data: { plans }
  });
});

// @route   GET /api/subscription/current
// @desc    Get current subscription
// @access  Private
router.get('/current', (req, res) => {
  res.json({
    success: true,
    data: { 
      subscription: req.user.subscription,
      isTrialActive: req.user.isTrialActive
    }
  });
});

module.exports = router;