const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/profiles
// @desc    Get user's profiles (placeholder)
// @access  Private
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Profiles endpoint - Coming soon',
    data: { profiles: [] }
  });
});

// @route   POST /api/profiles
// @desc    Create new profile (placeholder)
// @access  Private
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Create profile endpoint - Coming soon'
  });
});

module.exports = router;