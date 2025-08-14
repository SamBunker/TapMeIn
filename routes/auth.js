const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  authenticateToken 
} = require('../middleware/auth');

const router = express.Router();

// Helper function to determine if request expects JSON
const expectsJSON = (req) => {
  return req.path.startsWith('/api/') || 
         req.headers.accept?.includes('application/json') || 
         req.headers['content-type']?.includes('application/json');
};

// ========================================
// VIEW ROUTES (HTML responses)
// ========================================

// @route   GET /auth/login
// @desc    Show login form
// @access  Public
router.get('/login', (req, res) => {
  // Redirect to dashboard if already logged in
  if (req.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('auth/login', {
    title: 'Login',
    hideNavbar: true,
    hideFooter: true,
    isDevelopment: process.env.NODE_ENV === 'development',
    layout: 'main'
  });
});

// @route   GET /auth/register
// @desc    Show registration form
// @access  Public
router.get('/register', (req, res) => {
  // Redirect to dashboard if already logged in
  if (req.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('auth/register', {
    title: 'Register',
    hideNavbar: true,
    hideFooter: true,
    layout: 'main'
  });
});

// @route   GET /auth/logout
// @desc    Logout user (GET for convenience)
// @access  Public
router.get('/logout', (req, res) => {
  // Clear session/cookies if using sessions
  if (req.session) {
    req.session.destroy();
  }
  
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.redirect('/auth/login?message=Logged out successfully');
});

// ========================================
// API ROUTES (JSON responses)
// ========================================

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be 1-50 characters'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const passwordResetValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const passwordUpdateValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// @route   POST /auth/register
// @desc    Register a new user (supports both form and API)
// @access  Public
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (expectsJSON(req)) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      } else {
        return res.render('auth/register', {
          title: 'Register',
          hideNavbar: true,
          hideFooter: true,
          error: errors.array()[0].msg,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          layout: 'main'
        });
      }
    }

    const { email, password, firstName, lastName, companyName, plan = 'free' } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      const errorMsg = 'User with this email already exists';
      if (expectsJSON(req)) {
        return res.status(400).json({
          success: false,
          error: errorMsg
        });
      } else {
        return res.render('auth/register', {
          title: 'Register',
          hideNavbar: true,
          hideFooter: true,
          error: errorMsg,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          layout: 'main'
        });
      }
    }

    // Create new user with selected plan
    const user = new User({
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      firstName,
      lastName,
      companyName,
      subscription: {
        plan: plan,
        status: plan === 'free' ? 'active' : 'trial'
      }
    });

    await user.save();

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date()
    });
    await user.save();

    // Remove sensitive information
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    delete userResponse.refreshTokens;

    if (expectsJSON(req)) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });
    } else {
      // Set cookies for web interface
      res.cookie('token', accessToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      res.cookie('refreshToken', refreshToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.redirect('/dashboard?welcome=true');
    }

  } catch (error) {
    next(error);
  }
});

// @route   POST /auth/login
// @desc    Login user (supports both form and API)
// @access  Public
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (expectsJSON(req)) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      } else {
        return res.render('auth/login', {
          title: 'Login',
          hideNavbar: true,
          hideFooter: true,
          error: errors.array()[0].msg,
          email: req.body.email,
          isDevelopment: process.env.NODE_ENV === 'development',
          layout: 'main'
        });
      }
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      const errorMsg = 'Invalid email or password';
      if (expectsJSON(req)) {
        return res.status(401).json({
          success: false,
          error: errorMsg
        });
      } else {
        return res.render('auth/login', {
          title: 'Login',
          hideNavbar: true,
          hideFooter: true,
          error: errorMsg,
          email: req.body.email,
          isDevelopment: process.env.NODE_ENV === 'development',
          layout: 'main'
        });
      }
    }

    // Check if account is locked
    if (user.isLocked) {
      const errorMsg = 'Account is temporarily locked due to too many failed login attempts';
      if (expectsJSON(req)) {
        return res.status(423).json({
          success: false,
          error: errorMsg
        });
      } else {
        return res.render('auth/login', {
          title: 'Login',
          hideNavbar: true,
          hideFooter: true,
          error: errorMsg,
          email: req.body.email,
          isDevelopment: process.env.NODE_ENV === 'development',
          layout: 'main'
        });
      }
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      const errorMsg = 'Invalid email or password';
      if (expectsJSON(req)) {
        return res.status(401).json({
          success: false,
          error: errorMsg
        });
      } else {
        return res.render('auth/login', {
          title: 'Login',
          hideNavbar: true,
          hideFooter: true,
          error: errorMsg,
          email: req.body.email,
          isDevelopment: process.env.NODE_ENV === 'development',
          layout: 'main'
        });
      }
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login info
    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip;
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date()
    });
    await user.save();

    // Remove sensitive information
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    delete userResponse.refreshTokens;

    if (expectsJSON(req)) {
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });
    } else {
      // Set cookies for web interface
      res.cookie('token', accessToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      res.cookie('refreshToken', refreshToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Redirect based on user role
      if (user.role === 'admin') {
        res.redirect('/admin');
      } else {
        res.redirect('/dashboard');
      }
    }

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(tokenObj => tokenObj.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }
    next(error);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate refresh token)
// @access  Private
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken) {
      // Remove specific refresh token
      user.refreshTokens = user.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );
    } else {
      // Remove all refresh tokens (logout from all devices)
      user.refreshTokens = [];
    }

    await user.save();

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', passwordResetValidation, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token and expiration (1 hour)
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // TODO: Send email with reset link
    // For now, we'll just return the token (remove this in production)
    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset URL:', resetUrl);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', passwordUpdateValidation, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token, password } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.passwordHash = password; // Will be hashed by pre-save middleware
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Clear all refresh tokens (logout from all devices)
    user.refreshTokens = [];
    
    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = req.user.toObject();
    delete user.passwordHash;
    delete user.refreshTokens;

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;