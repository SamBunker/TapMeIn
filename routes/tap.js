const express = require('express');
const Card = require('../models/Card');
const Profile = require('../models/Profile');
const Activity = require('../models/Activity');
// Note: Install ua-parser-js package for production: npm install ua-parser-js

const router = express.Router();

// Helper function to get location data from IP
async function getLocationFromIP(ip) {
  // In a real application, you'd use a geolocation service like MaxMind or IP-API
  // For now, return a placeholder structure
  return {
    country: 'US',
    region: 'California',
    city: 'San Francisco',
    coordinates: {
      lat: 37.7749,
      lng: -122.4194
    }
  };
}

// Helper function to parse device info from user agent
function parseDeviceInfo(userAgent) {
  // Simple device detection without external library
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)(?!.*\bMobile\b)/i.test(userAgent);
  
  let deviceType = 'desktop';
  if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';
  
  // Extract OS info
  let os = 'Unknown';
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Mac/i.test(userAgent)) os = 'macOS';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad/i.test(userAgent)) os = 'iOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';
  
  // Extract browser info
  let browser = 'Unknown';
  if (/Chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Safari/i.test(userAgent)) browser = 'Safari';
  else if (/Edge/i.test(userAgent)) browser = 'Edge';
  else if (/Opera/i.test(userAgent)) browser = 'Opera';
  
  return {
    type: deviceType,
    os: os,
    browser: browser,
    userAgent: userAgent
  };
}

// @route   GET /tap/:cardUID
// @desc    Handle NFC tap - redirect to profile URL with full analytics
// @access  Public
router.get('/:cardUID', async (req, res, next) => {
  try {
    const { cardUID } = req.params;
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0];
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers.referer || req.headers.referrer || '';

    // Find card by UID with profile populated
    const card = await Card.findOne({ cardUID: cardUID.toUpperCase() })
      .populate('owner', 'email firstName lastName')
      .populate('profile');

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    // Check if card is activated
    if (!card.isActivated) {
      return res.status(400).json({
        success: false,
        error: 'Card not activated'
      });
    }

    // Parse device information
    const deviceInfo = parseDeviceInfo(userAgent);
    
    // Get location data (in production, use real IP geolocation)
    const locationData = await getLocationFromIP(clientIP);
    
    // Record the tap with enhanced analytics
    await card.recordTap();
    
    // Create comprehensive tap data for activity recording
    const tapData = {
      location: locationData,
      device: deviceInfo,
      network: {
        ip: clientIP,
        isp: 'Unknown', // Would be populated by geolocation service
        vpn: false
      },
      method: 'nfc', // Could be 'qr' or 'manual' based on route parameters
      referrer: referrer,
      duration: 0, // Will be updated if we track page engagement
      bounced: false,
      converted: false
    };

    // Create activity record for the tap
    try {
      await Activity.createCardTapActivity(card._id, tapData);
    } catch (activityError) {
      console.error('Failed to create tap activity:', activityError);
      // Don't fail the tap if activity creation fails
    }

    // Handle redirect logic based on profile
    if (card.profile) {
      const profile = card.profile;
      
      // Record tap on profile analytics
      try {
        await profile.recordTap();
      } catch (profileError) {
        console.error('Failed to record profile tap:', profileError);
      }
      
      // Determine redirect URL based on profile configuration
      const redirectContext = {
        timestamp: new Date(),
        location: locationData,
        device: deviceInfo.type,
        browser: deviceInfo.browser,
        'user-agent': userAgent,
        referrer: referrer
      };
      
      const redirectUrl = profile.getRedirectUrl(redirectContext);
      
      // For web browsers, redirect directly
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect(302, redirectUrl);
      }
      
      // For API calls, return redirect URL
      return res.json({
        success: true,
        message: 'Card tapped successfully',
        data: {
          card: {
            uid: card.cardUID,
            nickname: card.nickname,
            owner: card.owner ? card.owner.fullName : null,
            tapCount: card.tapCount
          },
          redirectUrl: redirectUrl,
          profile: {
            name: profile.name,
            description: profile.description
          },
          analytics: {
            location: locationData,
            device: deviceInfo
          }
        }
      });
    }

    // If no profile is associated, return card info
    const response = {
      success: true,
      message: 'Card tapped successfully',
      data: {
        card: {
          uid: card.cardUID,
          nickname: card.nickname,
          owner: card.owner ? card.owner.fullName : null,
          tapCount: card.tapCount,
          hasProfile: false
        },
        message: 'Card has no profile configured. Please set up a profile to enable redirects.',
        analytics: {
          location: locationData,
          device: deviceInfo
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Tap handling error:', error);
    next(error);
  }
});

// @route   GET /tap/:cardUID/qr
// @desc    Handle QR code tap (same logic but different method tracking)
// @access  Public
router.get('/:cardUID/qr', async (req, res, next) => {
  // Set method to QR for analytics
  req.tapMethod = 'qr';
  
  // Reuse the main tap handler
  return router.stack[0].handle(req, res, next);
});

// @route   POST /tap/:cardUID/analytics
// @desc    Record additional analytics data (engagement time, conversion, etc.)
// @access  Public
router.post('/:cardUID/analytics', async (req, res, next) => {
  try {
    const { cardUID } = req.params;
    const { duration, converted, bounced } = req.body;
    
    // Find the most recent tap activity for this card
    const recentActivity = await Activity.findOne({
      'relatedObjects.card': await Card.findOne({ cardUID: cardUID.toUpperCase() }).select('_id'),
      type: 'card_tap',
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
    }).sort({ createdAt: -1 });
    
    if (recentActivity) {
      // Update the analytics data
      if (duration !== undefined) recentActivity.metadata.tapData.duration = duration;
      if (converted !== undefined) recentActivity.metadata.tapData.converted = converted;
      if (bounced !== undefined) recentActivity.metadata.tapData.bounced = bounced;
      
      await recentActivity.save();
      
      res.json({
        success: true,
        message: 'Analytics updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Recent tap activity not found'
      });
    }
  } catch (error) {
    console.error('Analytics update error:', error);
    next(error);
  }
});

module.exports = router;