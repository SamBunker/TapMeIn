const express = require('express');
const { authenticateToken, requireSubscription } = require('../middleware/auth');
const Category = require('../models/Category');
const Card = require('../models/Card');
const Activity = require('../models/Activity');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @route   GET /api/categories
// @desc    Get user's categories with stats
// @access  Private
router.get('/', async (req, res) => {
  try {
    const categories = await Category.getUserCategoriesWithStats(req.user._id);
    
    res.json({
      success: true,
      data: {
        categories,
        total: categories.length
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category with detailed stats
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      owner: req.user._id
    }).populate('cards');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Get category performance metrics
    const performanceMetrics = category.performanceMetrics;
    
    res.json({
      success: true,
      data: {
        category: category.toObject(),
        performanceMetrics
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private
router.post('/', requireSubscription('basic', 'categories'), async (req, res) => {
  try {
    const { name, description, icon, color, type, settings } = req.body;
    
    // Check if category name already exists for this user
    const existingCategory = await Category.findOne({
      owner: req.user._id,
      name: name.trim()
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name already exists'
      });
    }
    
    // Check subscription limits
    const categoryCount = await Category.countDocuments({ 
      owner: req.user._id, 
      isActive: true 
    });
    
    const limits = {
      free: 2,
      basic: 5,
      standard: 15,
      premium: -1 // unlimited
    };
    
    const userLimit = limits[req.user.subscription.plan] || limits.free;
    
    if (userLimit !== -1 && categoryCount >= userLimit) {
      return res.status(402).json({
        success: false,
        error: `Your ${req.user.subscription.plan} plan allows maximum ${userLimit} categories. Please upgrade to create more.`,
        currentPlan: req.user.subscription.plan,
        limit: userLimit
      });
    }
    
    const category = new Category({
      name: name.trim(),
      description: description?.trim(),
      icon: icon || '📂',
      color: color || '#345995',
      type: type || 'custom',
      owner: req.user._id,
      settings: settings || {}
    });
    
    await category.save();
    
    // Create activity
    await Activity.create({
      type: 'category_created',
      title: `Created category: ${category.name}`,
      description: `New category "${category.name}" created`,
      owner: req.user._id,
      relatedObjects: { category: category._id },
      icon: 'bi-folder-plus',
      color: category.color,
      isSystemGenerated: true
    });
    
    res.status(201).json({
      success: true,
      data: { category }
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors)[0].message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { name, description, icon, color, settings } = req.body;
    
    const category = await Category.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Check if new name conflicts with existing categories
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        owner: req.user._id,
        name: name.trim(),
        _id: { $ne: category._id }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category with this name already exists'
        });
      }
    }
    
    // Update fields
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description?.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (settings) category.settings = { ...category.settings, ...settings };
    
    await category.save();
    
    res.json({
      success: true,
      data: { category }
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors)[0].message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category (soft delete)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Check if category has cards
    const cardCount = await Card.countDocuments({ category: category._id });
    
    if (cardCount > 0) {
      // Move cards to default category or uncategorized
      const defaultCategory = await Category.findOne({
        owner: req.user._id,
        'metadata.isDefault': true
      });
      
      if (defaultCategory) {
        await Card.updateMany(
          { category: category._id },
          { category: defaultCategory._id }
        );
      } else {
        await Card.updateMany(
          { category: category._id },
          { $unset: { category: 1 } }
        );
      }
    }
    
    // Soft delete
    category.isActive = false;
    await category.save();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
});

// @route   POST /api/categories/:id/assign-cards
// @desc    Assign multiple cards to category
// @access  Private
router.post('/:id/assign-cards', async (req, res) => {
  try {
    const { cardIds } = req.body;
    
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Card IDs array is required'
      });
    }
    
    const category = await Category.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isActive: true
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Update cards
    const result = await Card.updateMany(
      {
        _id: { $in: cardIds },
        owner: req.user._id
      },
      { category: category._id }
    );
    
    // Update category card count
    const totalCards = await Card.countDocuments({ 
      category: category._id,
      owner: req.user._id 
    });
    
    category.stats.totalCards = totalCards;
    await category.save();
    
    res.json({
      success: true,
      data: {
        assignedCount: result.modifiedCount,
        totalCardsInCategory: totalCards
      }
    });
  } catch (error) {
    console.error('Assign cards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign cards to category'
    });
  }
});

// @route   GET /api/categories/:id/analytics
// @desc    Get detailed analytics for category
// @access  Private
router.get('/:id/analytics', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days), 90); // Max 90 days
    
    const category = await Category.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Get cards in this category
    const cards = await Card.find({ 
      category: category._id,
      owner: req.user._id 
    }).select('cardUID nickname tapCount lastTapped');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysNum * 24 * 60 * 60 * 1000));
    
    // Filter daily stats for the requested period
    const dailyStats = category.stats.dailyStats.filter(stat => 
      stat.date >= startDate && stat.date <= endDate
    ).sort((a, b) => a.date - b.date);
    
    // Calculate growth metrics
    const totalTaps = dailyStats.reduce((sum, day) => sum + day.taps, 0);
    const totalVisitors = dailyStats.reduce((sum, day) => sum + day.uniqueVisitors, 0);
    const totalConversions = dailyStats.reduce((sum, day) => sum + day.conversions, 0);
    
    // Calculate trend
    const trend = category.calculateTrend();
    
    // Top performing cards
    const topCards = cards
      .sort((a, b) => b.tapCount - a.tapCount)
      .slice(0, 5)
      .map(card => ({
        id: card._id,
        cardUID: card.cardUID,
        nickname: card.nickname,
        tapCount: card.tapCount,
        lastTapped: card.lastTapped
      }));
    
    res.json({
      success: true,
      data: {
        category: {
          id: category._id,
          name: category.name,
          icon: category.icon,
          color: category.color
        },
        analytics: {
          period: { days: daysNum, startDate, endDate },
          totals: {
            cards: cards.length,
            taps: totalTaps,
            visitors: totalVisitors,
            conversions: totalConversions,
            conversionRate: totalVisitors > 0 ? (totalConversions / totalVisitors * 100) : 0
          },
          trend: {
            percentage: trend,
            direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
          },
          dailyStats,
          topCards
        }
      }
    });
  } catch (error) {
    console.error('Category analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category analytics'
    });
  }
});

// @route   POST /api/categories/initialize
// @desc    Create default categories for new user
// @access  Private
router.post('/initialize', async (req, res) => {
  try {
    // Check if user already has categories
    const existingCount = await Category.countDocuments({ 
      owner: req.user._id 
    });
    
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already has categories'
      });
    }
    
    const categories = await Category.createDefaultCategories(req.user._id);
    
    res.status(201).json({
      success: true,
      data: {
        categories,
        message: 'Default categories created successfully'
      }
    });
  } catch (error) {
    console.error('Initialize categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create default categories'
    });
  }
});

module.exports = router;