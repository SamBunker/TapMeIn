const express = require('express');
const Card = require('../models/Card');

const router = express.Router();

// @route   GET /tap/:cardUID
// @desc    Handle NFC tap - redirect to profile URL
// @access  Public
router.get('/:cardUID', async (req, res, next) => {
  try {
    const { cardUID } = req.params;

    // Find card by UID
    const card = await Card.findOne({ cardUID: cardUID.toUpperCase() })
      .populate('owner', 'email firstName lastName');

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

    // Record the tap
    await card.recordTap();

    // TODO: Implement analytics recording
    // TODO: Implement redirect logic based on profile settings

    // If card has an associated profile, we could redirect
    // For now, return card info with tap success
    const response = {
      success: true,
      message: 'Card tapped successfully',
      data: {
        card: {
          uid: card.cardUID,
          nickname: card.nickname,
          owner: card.owner ? card.owner.fullName : null,
          tapCount: card.tapCount,
          hasProfile: !!card.profile
        }
      }
    };

    // If there's a profile associated, we could add redirect URL
    if (card.profile) {
      // TODO: Fetch profile and determine redirect URL
      response.data.redirectUrl = 'https://example.com'; // Placeholder
    }

    res.json(response);

  } catch (error) {
    next(error);
  }
});

module.exports = router;