const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireOwnership } = require('../middleware/auth');
const Card = require('../models/Card');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation rules
const activationValidation = [
  body('activationCode')
    .notEmpty()
    .isLength({ min: 6, max: 8 })
    .withMessage('Activation code must be 6-8 characters')
];

// @route   POST /api/cards/activate
// @desc    Activate a card with activation code
// @access  Private
router.post('/activate', activationValidation, async (req, res, next) => {
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

    const { activationCode } = req.body;
    const userId = req.user._id;

    // Find card by activation code
    const card = await Card.findByActivationCode(activationCode);
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Invalid activation code'
      });
    }

    // Check if user has reached card limit
    const userCards = await Card.countDocuments({ owner: userId });
    const maxCards = req.user.hasFeatureAccess('maxCards');
    
    if (maxCards !== -1 && userCards >= maxCards) {
      return res.status(400).json({
        success: false,
        error: `You have reached your card limit of ${maxCards}. Please upgrade your plan.`,
        redirectTo: '/subscription/plans'
      });
    }

    // Activate the card
    await card.activate(userId);

    res.json({
      success: true,
      message: 'Card activated successfully',
      data: { card }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/cards
// @desc    Get user's cards
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const cards = await Card.findByOwner(req.user._id);

    res.json({
      success: true,
      data: { cards }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/cards/:id
// @desc    Get specific card details
// @access  Private (owner only)
router.get('/:id', requireOwnership('Card'), async (req, res, next) => {
  try {
    const card = req.resource; // Set by requireOwnership middleware

    res.json({
      success: true,
      data: { card }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/cards/:id
// @desc    Update card details
// @access  Private (owner only)
router.put('/:id', requireOwnership('Card'), async (req, res, next) => {
  try {
    const card = req.resource;
    const { nickname, description } = req.body;

    // Update fields if provided
    if (nickname !== undefined) card.nickname = nickname;
    if (description !== undefined) card.description = description;

    await card.save();

    res.json({
      success: true,
      message: 'Card updated successfully',
      data: { card }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/cards/:id/analytics
// @desc    Get card analytics
// @access  Private (owner only)
router.get('/:id/analytics', requireOwnership('Card'), async (req, res, next) => {
  try {
    const card = req.resource;
    
    // TODO: Implement analytics aggregation
    const analytics = {
      totalTaps: card.tapCount,
      lastTapped: card.lastTapped,
      activityStatus: card.activityStatus,
      daysSinceActivation: card.daysSinceActivation
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;