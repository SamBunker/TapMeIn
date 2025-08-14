const express = require('express');
const { authenticateToken, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', (req, res) => {
  try {
    const user = req.user.toObject();
    delete user.passwordHash;
    delete user.refreshTokens;

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, companyName, phoneNumber } = req.body;
    const user = req.user;

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (companyName !== undefined) user.companyName = companyName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    delete userResponse.refreshTokens;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/users/cards
// @desc    Get user's cards
// @access  Private
router.get('/cards', async (req, res) => {
  try {
    const Card = require('../models/Card');
    const cards = await Card.findByOwner(req.user._id);

    res.json({
      success: true,
      data: { cards }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;