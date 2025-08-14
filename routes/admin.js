const express = require('express');
const { authenticateToken, requireAdminWeb } = require('../middleware/auth');
const User = require('../models/User');
const Card = require('../models/Card');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdminWeb);

// Helper function to get admin statistics
async function getAdminStats() {
  try {
    const [userStats, cardStats] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [
                  { $gte: ['$lastLoginAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                  1,
                  0
                ]
              }
            },
            trialUsers: {
              $sum: {
                $cond: [{ $eq: ['$subscription.status', 'trial'] }, 1, 0]
              }
            },
            paidUsers: {
              $sum: {
                $cond: [{ $eq: ['$subscription.status', 'active'] }, 1, 0]
              }
            }
          }
        }
      ]),
      Card.aggregate([
        {
          $group: {
            _id: null,
            totalCards: { $sum: 1 },
            activatedCards: {
              $sum: {
                $cond: [{ $eq: ['$isActivated', true] }, 1, 0]
              }
            },
            totalTaps: { $sum: '$tapCount' }
          }
        }
      ])
    ]);

    const users = userStats[0] || { totalUsers: 0, activeUsers: 0, trialUsers: 0, paidUsers: 0 };
    const cards = cardStats[0] || { totalCards: 0, activatedCards: 0, totalTaps: 0 };

    return {
      totalUsers: users.totalUsers,
      activeCards: cards.activatedCards,
      openTickets: 0, // Placeholder for support tickets
      monthlyRevenue: Math.floor(users.paidUsers * 15) // Simplified calculation
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {
      totalUsers: 0,
      activeCards: 0,
      openTickets: 0,
      monthlyRevenue: 0
    };
  }
}

// ========================================
// VIEW ROUTES (HTML responses)
// ========================================

// @route   GET /admin
// @desc    Show admin dashboard
// @access  Admin
router.get('/', async (req, res) => {
  try {
    const stats = await getAdminStats();
    
    // Get recent users
    const recentUsers = await User.find({})
      .select('-passwordHash -refreshTokens')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get system activity (placeholder)
    const systemActivity = [
      {
        title: 'New User Registration',
        description: 'User john@example.com registered',
        timestamp: new Date(),
        icon: 'user-plus',
        color: 'primary'
      },
      {
        title: 'Card Activated',
        description: 'Card TEST0001 was activated',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        icon: 'credit-card',
        color: 'success'
      }
    ];
    
    res.render('admin/index', {
      title: 'Admin Dashboard',
      user: req.user,
      stats,
      recentUsers,
      systemActivity,
      layout: 'main'
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load admin dashboard',
      layout: 'main'
    });
  }
});

// @route   POST /admin/create-cards
// @desc    Create batch of cards
// @access  Admin
router.post('/create-cards', async (req, res) => {
  try {
    const { batchSize, cardType, batchNumber, notes } = req.body;
    const size = parseInt(batchSize);
    
    if (size < 1 || size > 1000) {
      return res.status(400).render('admin/index', {
        title: 'Admin Dashboard',
        user: req.user,
        stats: await getAdminStats(),
        recentUsers: [],
        systemActivity: [],
        error: 'Batch size must be between 1 and 1000',
        layout: 'main'
      });
    }
    
    const cards = [];
    for (let i = 0; i < size; i++) {
      const cardUID = `${batchNumber}${String(i + 1).padStart(4, '0')}`;
      const activationCode = `ACT${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      cards.push({
        cardUID,
        activationCode,
        cardType,
        batchNumber,
        status: 'ready',
        metadata: {
          source: 'admin_batch',
          notes: notes || `Batch created by ${req.user.email}`
        }
      });
    }
    
    await Card.insertMany(cards);
    
    res.redirect('/admin?success=Cards created successfully');
  } catch (error) {
    console.error('Card creation error:', error);
    res.render('admin/index', {
      title: 'Admin Dashboard',
      user: req.user,
      stats: await getAdminStats(),
      recentUsers: [],
      systemActivity: [],
      error: 'Failed to create cards',
      layout: 'main'
    });
  }
});

// @route   GET /admin/cards
// @desc    Admin cards management page
// @access  Admin
router.get('/cards', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { cardUID: { $regex: search, $options: 'i' } },
        { activationCode: { $regex: search, $options: 'i' } },
        { nickname: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }

    // Get total count for pagination
    const totalCards = await Card.countDocuments(query);
    const totalPages = Math.ceil(totalCards / limit);
    const skip = (page - 1) * limit;

    // Get cards with pagination
    const cards = await Card.find(query)
      .populate('owner', 'firstName lastName email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Get filter options
    const statusOptions = await Card.distinct('status');

    res.render('admin/cards', {
      title: 'Cards Management',
      user: req.user,
      cards,
      pagination: {
        currentPage: page,
        totalPages,
        totalCards,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      },
      filters: {
        search,
        status,
        statusOptions,
        sortBy,
        sortOrder: req.query.sortOrder || 'desc'
      },
      layout: 'main'
    });
  } catch (error) {
    console.error('Admin cards error:', error);
    res.redirect('/admin?error=Unable to load cards');
  }
});

// @route   GET /admin/users
// @desc    Admin users management page
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const plan = req.query.plan || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (plan) {
      query['subscription.plan'] = plan;
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;

    // Get users with pagination and their card counts
    const users = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'cards',
          localField: '_id',
          foreignField: 'owner',
          as: 'cards'
        }
      },
      {
        $addFields: {
          cardCount: { $size: '$cards' },
          activeCardCount: {
            $size: {
              $filter: {
                input: '$cards',
                cond: { $eq: ['$$this.isActivated', true] }
              }
            }
          }
        }
      },
      { $project: { passwordHash: 0, refreshTokens: 0, cards: 0 } },
      { $sort: { [sortBy]: sortOrder } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get filter options
    const roleOptions = await User.distinct('role');
    const planOptions = await User.distinct('subscription.plan');

    res.render('admin/users', {
      title: 'Users Management',
      user: req.user,
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      },
      filters: {
        search,
        role,
        plan,
        roleOptions,
        planOptions,
        sortBy,
        sortOrder: req.query.sortOrder || 'desc'
      },
      layout: 'main'
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.redirect('/admin?error=Unable to load users');
  }
});

// @route   GET /admin/analytics
// @desc    Admin analytics page
// @access  Admin
router.get('/analytics', async (req, res) => {
  try {
    const stats = await getAdminStats();
    
    // Get growth data for charts
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [userGrowth, cardGrowth, tapAnalytics] = await Promise.all([
      User.aggregate([
        {
          $match: { createdAt: { $gte: thirtyDaysAgo } }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Card.aggregate([
        {
          $match: { createdAt: { $gte: thirtyDaysAgo } }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Card.aggregate([
        {
          $group: {
            _id: null,
            totalTaps: { $sum: '$tapCount' },
            avgTapsPerCard: { $avg: '$tapCount' },
            maxTaps: { $max: '$tapCount' }
          }
        }
      ])
    ]);

    res.render('admin/analytics', {
      title: 'System Analytics',
      user: req.user,
      stats,
      userGrowth,
      cardGrowth,
      tapAnalytics: tapAnalytics[0] || { totalTaps: 0, avgTapsPerCard: 0, maxTaps: 0 },
      layout: 'main'
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.redirect('/admin?error=Unable to load analytics');
  }
});

// @route   POST /admin/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Admin
router.post('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.redirect('/admin/users?error=User not found');
    }

    // Don't allow deactivating other admins
    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.redirect('/admin/users?error=Cannot deactivate other admin accounts');
    }

    user.isActive = !user.isActive;
    await user.save();

    res.redirect('/admin/users?success=User status updated successfully');
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.redirect('/admin/users?error=Failed to update user status');
  }
});

// @route   POST /admin/cards/:id/toggle-status
// @desc    Toggle card active status
// @access  Admin
router.post('/cards/:id/toggle-status', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.redirect('/admin/cards?error=Card not found');
    }

    card.isActivated = !card.isActivated;
    if (card.isActivated && card.status === 'ready') {
      card.status = 'activated';
    } else if (!card.isActivated && card.status === 'activated') {
      card.status = 'ready';
    }
    
    await card.save();

    res.redirect('/admin/cards?success=Card status updated successfully');
  } catch (error) {
    console.error('Toggle card status error:', error);
    res.redirect('/admin/cards?error=Failed to update card status');
  }
});

// ========================================
// API ROUTES (JSON responses)
// ========================================

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const User = require('../models/User');
    const Card = require('../models/Card');

    const [userStats, cardStats] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [
                  { $gte: ['$lastLoginAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                  1,
                  0
                ]
              }
            },
            trialUsers: {
              $sum: {
                $cond: [{ $eq: ['$subscription.status', 'trial'] }, 1, 0]
              }
            },
            paidUsers: {
              $sum: {
                $cond: [{ $eq: ['$subscription.status', 'active'] }, 1, 0]
              }
            }
          }
        }
      ]),
      Card.aggregate([
        {
          $group: {
            _id: null,
            totalCards: { $sum: 1 },
            activatedCards: {
              $sum: {
                $cond: [{ $eq: ['$isActivated', true] }, 1, 0]
              }
            },
            totalTaps: { $sum: '$tapCount' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        users: userStats[0] || { totalUsers: 0, activeUsers: 0, trialUsers: 0, paidUsers: 0 },
        cards: cardStats[0] || { totalCards: 0, activatedCards: 0, totalTaps: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const User = require('../models/User');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-passwordHash -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/admin/cards
// @desc    Get all cards
// @access  Admin
router.get('/cards', async (req, res) => {
  try {
    const Card = require('../models/Card');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cards = await Card.find({})
      .populate('owner', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Card.countDocuments();

    res.json({
      success: true,
      data: {
        cards,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCards: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;