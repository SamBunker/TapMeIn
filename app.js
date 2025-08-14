const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { engine } = require('express-handlebars');

// Load environment variables
dotenv.config();

// Import models (to register them with Mongoose)
require('./models/User');
require('./models/Card');
require('./models/Profile');
require('./models/Category');
require('./models/Interview');
require('./models/Activity');

// Import custom middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const cardRoutes = require('./routes/cards');
const profileRoutes = require('./routes/profiles');
const tapRoutes = require('./routes/tap');
const analyticsRoutes = require('./routes/analytics');
const subscriptionRoutes = require('./routes/subscription');
const interviewRoutes = require('./routes/interviews');
const categoriesRoutes = require('./routes/categories');
const activitiesRoutes = require('./routes/activities');
const dashboardRoutes = require('./routes/dashboard');

// Create Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.BASE_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup - Handlebars
app.engine('hbs', engine({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    // Helper functions for templates
    eq: (a, b) => a === b,
    ne: (a, b) => a !== b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    and: (a, b) => a && b,
    or: (a, b) => a || b,
    formatDate: (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    },
    formatDateTime: (date) => {
      if (!date) return '';
      return new Date(date).toLocaleString();
    },
    json: (context) => JSON.stringify(context),
    inc: (value) => parseInt(value) + 1,
    times: (n, block) => {
      let result = '';
      for (let i = 0; i < n; ++i) {
        result += block.fn(i);
      }
      return result;
    },
    substring: (str, start, end) => {
      if (!str) return '';
      return str.substring(start, end);
    },
    math: (lvalue, operator, rvalue) => {
      lvalue = parseFloat(lvalue);
      rvalue = parseFloat(rvalue);
      
      return {
        "+": lvalue + rvalue,
        "-": lvalue - rvalue,
        "*": lvalue * rvalue,
        "/": lvalue / rvalue,
        "%": lvalue % rvalue,
        "minus": lvalue - rvalue,
        "plus": lvalue + rvalue,
        "times": lvalue * rvalue,
        "divided": lvalue / rvalue
      }[operator];
    },
    round: (value) => {
      return Math.round(parseFloat(value) || 0);
    },
    gte: (a, b) => a >= b,
    lte: (a, b) => a <= b,
    buildQueryString: (filters) => {
      if (!filters) return '';
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      return params.toString();
    }
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    if (process.env.NODE_ENV !== 'test') {
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Auth routes (both API and web interface)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Admin routes (both web and API)
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/activities', activitiesRoutes);

// Public routes (no auth required)
app.use('/tap', tapRoutes);

// Dashboard routes (web interface)
app.use('/', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API documentation redirect
app.get('/api', (req, res) => {
  res.json({
    message: 'TapMeIn NFC API v1.0',
    documentation: `${process.env.BASE_URL}/docs`,
    health: `${process.env.BASE_URL}/api/health`,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      cards: '/api/cards',
      profiles: '/api/profiles',
      analytics: '/api/analytics',
      subscription: '/api/subscription',
      interviews: '/api/interviews',
      categories: '/api/categories',
      activities: '/api/activities',
      tap: '/tap/:cardUID'
    }
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Dashboard: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;