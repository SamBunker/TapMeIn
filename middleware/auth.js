const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    // If no token in header, check cookies
    if (!token && req.cookies) {
      token = req.cookies.token;
    }

    if (!token) {
      // Check if this is a web request (expects HTML) or API request (expects JSON)
      const expectsJSON = req.path.startsWith('/api/') || 
                         req.headers.accept?.includes('application/json') || 
                         req.headers['content-type']?.includes('application/json');
      
      if (expectsJSON) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. No token provided.'
        });
      } else {
        return res.redirect('/auth/login');
      }
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and check if they still exist
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');
    
    if (!user) {
      const expectsJSON = req.path.startsWith('/api/') || 
                         req.headers.accept?.includes('application/json') || 
                         req.headers['content-type']?.includes('application/json');
      
      if (expectsJSON) {
        return res.status(401).json({
          success: false,
          error: 'Token invalid. User not found.'
        });
      } else {
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        return res.redirect('/auth/login?error=Invalid session');
      }
    }

    // Check if user account is locked
    if (user.isLocked) {
      const expectsJSON = req.path.startsWith('/api/') || 
                         req.headers.accept?.includes('application/json') || 
                         req.headers['content-type']?.includes('application/json');
      
      if (expectsJSON) {
        return res.status(423).json({
          success: false,
          error: 'Account is temporarily locked due to too many failed login attempts.'
        });
      } else {
        return res.redirect('/auth/login?error=Account temporarily locked');
      }
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    const expectsJSON = req.path.startsWith('/api/') || 
                       req.headers.accept?.includes('application/json') || 
                       req.headers['content-type']?.includes('application/json');
    
    if (error.name === 'JsonWebTokenError') {
      if (expectsJSON) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token.'
        });
      } else {
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        return res.redirect('/auth/login?error=Invalid session');
      }
    } else if (error.name === 'TokenExpiredError') {
      if (expectsJSON) {
        return res.status(401).json({
          success: false,
          error: 'Token expired.'
        });
      } else {
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        return res.redirect('/auth/login?error=Session expired');
      }
    } else {
      console.error('Authentication error:', error);
      if (expectsJSON) {
        return res.status(500).json({
          success: false,
          error: 'Server error during authentication.'
        });
      } else {
        return res.redirect('/auth/login?error=Authentication error');
      }
    }
  }
};

// Optional authentication - doesn't fail if no token
const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(' ')[1];
    
    // If no token in header, check cookies
    if (!token && req.cookies) {
      token = req.cookies.token;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokens');
    
    req.user = user || null;
    next();

  } catch (error) {
    req.user = null;
    next();
  }
};

// Require specific role(s)
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Require admin role
const requireAdmin = requireRole('admin');

// Require admin role for web requests (redirects instead of JSON)
const requireAdminWeb = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/auth/login?error=Admin access required');
  }

  if (req.user.role !== 'admin') {
    return res.redirect('/dashboard?error=Admin access denied');
  }

  next();
};

// Check subscription status and feature access
const requireSubscription = (requiredPlan = null, feature = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const user = req.user;
    const subscription = user.subscription;

    // Check if subscription is active or in trial
    const isActive = subscription.status === 'active' || user.isTrialActive;

    if (!isActive) {
      return res.status(402).json({
        success: false,
        error: 'Active subscription required. Please upgrade your plan.',
        subscriptionStatus: subscription.status,
        redirectTo: '/subscription/plans'
      });
    }

    // Check specific plan requirement
    if (requiredPlan) {
      const planHierarchy = ['free', 'basic', 'standard', 'premium'];
      const userPlanIndex = planHierarchy.indexOf(subscription.plan);
      const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);

      if (userPlanIndex < requiredPlanIndex) {
        return res.status(402).json({
          success: false,
          error: `This feature requires ${requiredPlan} plan or higher.`,
          currentPlan: subscription.plan,
          requiredPlan: requiredPlan,
          redirectTo: '/subscription/plans'
        });
      }
    }

    // Check specific feature access
    if (feature && !user.hasFeatureAccess(feature)) {
      return res.status(402).json({
        success: false,
        error: `Feature '${feature}' is not available in your current plan.`,
        currentPlan: subscription.plan,
        feature: feature,
        redirectTo: '/subscription/plans'
      });
    }

    next();
  };
};

// Check if user owns the resource
const requireOwnership = (resourceModel, resourceIdParam = 'id', ownerField = 'owner') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required.'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      const Model = require(`../models/${resourceModel}`);
      
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found.'
        });
      }

      // Check ownership
      const resourceOwnerId = resource[ownerField];
      if (!resourceOwnerId || resourceOwnerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You do not own this resource.'
        });
      }

      // Add resource to request for easy access
      req.resource = resource;
      next();

    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during ownership verification.'
      });
    }
  };
};

// Rate limiting by user
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next(); // Let global rate limiter handle anonymous requests
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (userRequests.has(userId)) {
      const userRequestList = userRequests.get(userId);
      const validRequests = userRequestList.filter(timestamp => timestamp > windowStart);
      userRequests.set(userId, validRequests);
    }

    // Check current user's request count
    const currentRequests = userRequests.get(userId) || [];
    
    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    currentRequests.push(now);
    userRequests.set(userId, currentRequests);

    next();
  };
};

// Validate API key for external access
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required.'
      });
    }

    // In a real implementation, you'd validate against a database
    // For now, we'll use a simple check
    const user = await User.findOne({ 'apiKey': apiKey });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key.'
      });
    }

    // Check if user has API access feature
    if (!user.hasFeatureAccess('apiAccess')) {
      return res.status(403).json({
        success: false,
        error: 'API access not available in your subscription plan.'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during API key validation.'
    });
  }
};

// Generate JWT token
const generateToken = (userId, expiresIn = '24h') => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  authenticateToken,
  authenticateOptional,
  requireRole,
  requireAdmin,
  requireAdminWeb,
  requireSubscription,
  requireOwnership,
  rateLimitByUser,
  validateApiKey,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};