# NFC Card Dashboard System - Complete Requirements Blueprint

## Executive Summary

A comprehensive NFC card management platform enabling users to activate, manage, and track NFC cards with dynamic redirects and analytics. The system supports both Admin and User roles with a subscription-based monetization model.

## System Architecture Overview

### Technology Stack
- **Backend**: Node.js with Express.js
- **Frontend**: Handlebars templating engine
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt for password hashing
- **Real-time Features**: Socket.io (optional)
- **External Services**: 
  - Twilio (SMS notifications)
  - SendGrid/Nodemailer (Email services)
  - IPInfo/GeoIP (Location tracking)
  - Stripe (Payment processing)

### Core Design Principles
- RESTful API architecture
- Role-based access control (RBAC)
- Mobile-responsive design
- Scalable microservices-ready structure
- Security-first approach

## Project Structure

```
nfc-dashboard/
│
├── models/
│   ├── User.js
│   ├── Card.js
│   ├── Profile.js
│   ├── Analytics.js
│   ├── Subscription.js
│   └── Interview.js
│
├── routes/
│   ├── auth.js
│   ├── admin.js
│   ├── user.js
│   ├── tap.js
│   ├── activate.js
│   ├── dashboard.js
│   ├── analytics.js
│   ├── subscription.js
│   └── interviews.js
│
├── middleware/
│   ├── auth.js
│   ├── roles.js
│   ├── rateLimiter.js
│   └── subscription.js
│
├── controllers/
│   ├── authController.js
│   ├── cardController.js
│   ├── analyticsController.js
│   ├── notificationController.js
│   ├── subscriptionController.js
│   └── interviewController.js
│
├── services/
│   ├── emailService.js
│   ├── smsService.js
│   ├── webhookService.js
│   ├── geoLocationService.js
│   ├── analyticsService.js
│   ├── aiEmailService.js
│   └── calendarService.js
│
├── views/
│   ├── layouts/
│   │   └── main.hbs
│   ├── partials/
│   │   ├── navbar.hbs
│   │   └── sidebar.hbs
│   ├── dashboard.hbs
│   ├── admin.hbs
│   ├── activateCard.hbs
│   ├── analytics.hbs
│   ├── subscription.hbs
│   └── interviews.hbs
│
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── images/
│
├── config/
│   ├── database.js
│   ├── auth.js
│   └── services.js
│
├── utils/
│   ├── validators.js
│   ├── helpers.js
│   └── constants.js
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env
├── .gitignore
├── app.js
├── package.json
└── README.md
```

## Database Schema

### 1. User Model
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  passwordHash: String (required),
  role: String (enum: ['user', 'admin'], default: 'user'),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  companyName: String,
  createdAt: Date,
  updatedAt: Date,
  emailVerified: Boolean (default: false),
  phoneVerified: Boolean (default: false),
  subscription: {
    plan: String (enum: ['free', 'basic', 'standard', 'premium']),
    status: String (enum: ['active', 'trial', 'expired', 'cancelled']),
    trialStartDate: Date,
    trialEndDate: Date,
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  settings: {
    notifications: {
      email: Boolean (default: true),
      sms: Boolean (default: false),
      webhook: Boolean (default: false)
    },
    timezone: String (default: 'UTC'),
    language: String (default: 'en')
  }
}
```

### 2. Card Model
```javascript
{
  _id: ObjectId,
  cardUID: String (unique, required),
  owner: ObjectId (ref: 'User', default: null),
  status: String (enum: ['unassigned', 'ready', 'activated', 'suspended']),
  isActivated: Boolean (default: false),
  activationCode: String (unique),
  activatedAt: Date,
  nickname: String,
  tapCount: Number (default: 0),
  lastTapped: Date,
  qrCodeUrl: String,
  profile: ObjectId (ref: 'Profile'),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Profile Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  name: String (required),
  description: String,
  nickname: String,
  imageUrl: String,
  redirectUrl: String (required),
  cards: [ObjectId] (ref: 'Card'),
  redirectType: String (enum: ['static', 'time-based', 'geo-based', 'conditional']),
  timeBasedRedirects: [{
    name: String,
    startTime: String (HH:MM),
    endTime: String (HH:MM),
    daysOfWeek: [Number] (0-6),
    url: String,
    active: Boolean
  }],
  geoBasedRedirects: [{
    name: String,
    country: String,
    region: String,
    city: String,
    url: String,
    active: Boolean
  }],
  conditionalRedirects: [{
    name: String,
    condition: String (enum: ['device', 'browser', 'referrer']),
    value: String,
    url: String,
    active: Boolean
  }],
  webhookUrl: String,
  notifications: {
    email: Boolean (default: false),
    sms: Boolean (default: false),
    webhook: Boolean (default: false)
  },
  customization: {
    theme: String,
    primaryColor: String,
    logo: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Analytics Model
```javascript
{
  _id: ObjectId,
  cardId: ObjectId (ref: 'Card', required),
  profileId: ObjectId (ref: 'Profile'),
  userId: ObjectId (ref: 'User'),
  timestamp: Date (required),
  eventType: String (enum: ['tap', 'scan', 'redirect']),
  ipAddress: String,
  userAgent: String,
  device: {
    type: String (enum: ['mobile', 'tablet', 'desktop']),
    os: String,
    browser: String
  },
  location: {
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  referrer: String,
  redirectedTo: String,
  sessionId: String,
  duration: Number (seconds on page)
}
```

### 5. Subscription Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  plan: String (enum: ['free', 'basic', 'standard', 'premium'], required),
  status: String (enum: ['active', 'trial', 'expired', 'cancelled', 'pending']),
  features: {
    maxCards: Number,
    analytics: Boolean,
    timeBasedRedirects: Boolean,
    geoBasedRedirects: Boolean,
    webhooks: Boolean,
    smsAlerts: Boolean,
    emailReports: Boolean,
    apiAccess: Boolean,
    customBranding: Boolean,
    prioritySupport: Boolean,
    interviewTracking: Boolean,
    aiEmailAssistant: Boolean,
    calendarIntegration: Boolean
  },
  billing: {
    amount: Number,
    currency: String (default: 'USD'),
    interval: String (enum: ['monthly', 'yearly']),
    nextBillingDate: Date,
    lastPaymentDate: Date,
    stripeSubscriptionId: String,
    stripeCustomerId: String,
    paymentMethod: String
  },
  trialStartDate: Date,
  trialEndDate: Date,
  startDate: Date,
  endDate: Date,
  cancelledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Interview Model (New)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  cardId: ObjectId (ref: 'Card'), // If connection made via card tap
  company: {
    name: String (required),
    website: String,
    industry: String,
    size: String,
    linkedInUrl: String,
    glassdoorUrl: String
  },
  position: {
    title: String (required),
    department: String,
    level: String (enum: ['entry', 'mid', 'senior', 'executive']),
    type: String (enum: ['full-time', 'part-time', 'contract', 'internship']),
    jobPostingUrl: String
  },
  interview: {
    date: Date (required),
    time: String,
    duration: Number (minutes),
    type: String (enum: ['phone', 'video', 'in-person', 'technical', 'behavioral']),
    round: Number,
    location: String,
    meetingUrl: String
  },
  interviewers: [{
    name: String,
    title: String,
    email: String,
    linkedInUrl: String,
    notes: String
  }],
  followUps: [{
    type: String (enum: ['thank-you', 'check-in', 'final', 'custom']),
    scheduledDate: Date,
    sentDate: Date,
    status: String (enum: ['pending', 'sent', 'snoozed', 'dismissed']),
    emailContent: String,
    aiGenerated: Boolean,
    response: String,
    responseDate: Date
  }],
  notes: {
    preparation: String,
    questions: [String],
    answers: [String],
    impressions: String,
    nextSteps: String
  },
  outcome: String (enum: ['pending', 'next-round', 'offer', 'rejected', 'withdrawn']),
  aiContext: {
    companyResearch: Object, // Scraped/gathered company info
    cultureFit: String,
    keywords: [String],
    suggestedTalkingPoints: [String]
  },
  documents: [{
    type: String (enum: ['resume', 'cover-letter', 'portfolio', 'reference', 'other']),
    url: String,
    uploadedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## User Roles & Permissions

### Admin Role
- **Card Management**
  - Create and assign unique card UIDs
  - View all cards in the system
  - Mark cards as "ready for activation"
  - Suspend/reactivate cards
  - Bulk card operations
- **User Management**
  - View all users
  - Modify user subscriptions
  - Access global analytics
  - Send system-wide notifications
- **System Configuration**
  - Configure pricing tiers
  - Manage feature flags
  - Access system logs

### User Role
- **Card Operations**
  - Activate cards with activation code
  - Manage owned cards
  - Create/edit profiles
  - Set redirect URLs
- **Analytics Access**
  - View card tap statistics
  - Download reports (premium)
  - Real-time notifications
- **Profile Management**
  - Configure redirects (static, time-based, geo-based)
  - Set up webhooks (premium)
  - Customize branding (premium)

## Core Features

### 1. Authentication System
- **Registration Flow**
  - Email/password registration
  - Email verification
  - Optional phone verification
  - Social auth (future enhancement)
- **Login System**
  - JWT-based authentication
  - Remember me functionality
  - Password reset via email
  - Two-factor authentication (premium)

### 2. Card Activation Flow
```
1. User enters activation code
2. System validates code
3. Card linked to user account
4. Trial period initiated (7-14 days)
5. Premium features unlocked
6. Welcome email sent
```

### 3. Dashboard Features

#### User Dashboard
- **Overview Section**
  - Total cards owned
  - Total taps (last 30 days)
  - Active profiles
  - Quick stats
  - **Interview reminders widget** (New)
- **My Cards Section**
  - Card list with status
  - Tap count per card
  - Last tap timestamp
  - Quick edit actions
- **Analytics Section**
  - Tap frequency charts
  - Geographic heat map
  - Device/browser breakdown
  - Time-of-day analysis
- **Profile Management**
  - Create/edit profiles
  - Configure redirects
  - Notification settings
- **Career Center** (New)
  - Interview calendar
  - Follow-up reminders
  - Email templates
  - Networking connections
  - Application tracking

#### Admin Dashboard
- **System Overview**
  - Total users
  - Active cards
  - Revenue metrics
  - System health
- **Card Inventory**
  - Unassigned cards
  - Batch operations
  - Export capabilities
- **User Management**
  - User search/filter
  - Subscription management
  - Activity logs

### 4. Redirect System

#### Static Redirects
- Single URL per profile
- Instant redirect on tap

#### Time-Based Redirects
- Multiple time slots
- Day-of-week configuration
- Holiday overrides
- Timezone support

#### Geo-Based Redirects
- Country-level targeting
- City-level targeting (premium)
- Language-based redirects
- Regional campaigns

#### Conditional Redirects
- Device type (mobile/desktop)
- Browser detection
- Referrer-based
- Custom parameters

### 5. Analytics Features

#### Basic Analytics (Free)
- Total tap count
- Last 7 days history
- Basic device info

#### Advanced Analytics (Premium)
- Unlimited history
- Geographic distribution
- Device/OS breakdown
- User journey tracking
- Custom date ranges
- Export to CSV/PDF
- API access

### 6. Notification System

#### Email Notifications
- Tap alerts
- Daily/weekly summaries
- Monthly reports
- Account updates

#### SMS Notifications (Premium)
- Real-time tap alerts
- Daily summaries
- Custom triggers

#### Webhook Integration (Premium)
- POST to custom URL
- JSON payload
- Retry logic
- Authentication headers

### 7. Interview Follow-Up System (Career Module)

#### Interview Tracking
- **Manual Entry**
  - Add interview details (company, position, date, interviewer names)
  - Set interview type (phone, video, in-person)
  - Add notes and impressions
  - Upload related documents
- **Calendar Integration** (Premium)
  - Sync with Google Calendar/Outlook
  - Auto-detect interview appointments
  - Parse meeting details for context

#### Follow-Up Reminders
- **Smart Timing**
  - 24-hour follow-up reminder (thank you email)
  - 1-week follow-up reminder (check-in)
  - 2-week follow-up reminder (final follow-up)
  - Customizable reminder schedule
- **Dashboard Alerts**
  - Prominent reminder widget
  - Color-coded urgency levels
  - Snooze/dismiss options
  - Completed follow-up tracking

#### AI-Powered Email Assistant (Premium)
- **Context Gathering**
  - Company information scraping
  - Interview notes integration
  - Position details parsing
  - Interviewer LinkedIn profiles
- **Email Generation**
  - Multiple tone options (formal, friendly, enthusiastic)
  - Personalized content based on interview notes
  - Company culture alignment
  - Key points highlighting
- **Templates Library**
  - Thank you email templates
  - Follow-up templates
  - Second interview request
  - Reference check follow-up
- **Customization Options**
  - Edit generated content
  - Save custom templates
  - A/B testing suggestions
  - Multi-language support

## Subscription Tiers & Monetization

### Tier Structure

#### Free Tier
- 1 card limit
- Basic analytics (7 days)
- Static redirects only
- Email notifications
- Basic interview tracking (3 active)

#### Basic Tier ($9.99/month)
- Up to 3 cards
- 30-day analytics
- Time-based redirects
- QR code generation
- Email reports
- Interview tracking (10 active)
- Follow-up reminders

#### Standard Tier ($24.99/month)
- Up to 10 cards
- 90-day analytics
- Geo-based redirects
- Webhook integration
- Priority email support
- Unlimited interview tracking
- AI email assistant (5/month)
- Calendar integration

#### Premium Tier ($49.99/month)
- Unlimited cards
- Unlimited analytics
- All redirect types
- SMS notifications
- API access
- Custom branding
- White-label options
- Dedicated support
- Unlimited AI email generation
- Advanced career tools
- Company research automation

### Trial Period Logic
```javascript
// On card activation
{
  trialDays: 14,
  trialFeatures: ['all_premium_features'],
  postTrialPlan: 'free',
  gracePeriod: 3, // days after trial
  dataRetention: true, // Keep premium data after downgrade
}
```

## API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-email/:token
```

### Cards
```
GET    /api/cards                    // List user's cards
GET    /api/cards/:id                // Get card details
POST   /api/cards/activate           // Activate a card
PUT    /api/cards/:id                // Update card
DELETE /api/cards/:id                // Remove card
GET    /api/cards/:id/analytics      // Card analytics
```

### Profiles
```
GET    /api/profiles                 // List profiles
GET    /api/profiles/:id             // Get profile
POST   /api/profiles                 // Create profile
PUT    /api/profiles/:id             // Update profile
DELETE /api/profiles/:id             // Delete profile
POST   /api/profiles/:id/redirects   // Add redirect rule
```

### Analytics
```
GET    /api/analytics/overview       // Dashboard stats
GET    /api/analytics/cards/:id      // Card-specific stats
GET    /api/analytics/export         // Export data
POST   /api/analytics/custom         // Custom query
```

### Admin
```
GET    /api/admin/users              // List all users
GET    /api/admin/cards              // List all cards
POST   /api/admin/cards/bulk         // Bulk operations
GET    /api/admin/analytics          // System analytics
PUT    /api/admin/users/:id/subscription // Modify subscription
```

### Subscription
```
GET    /api/subscription/plans       // Available plans
GET    /api/subscription/current     // Current subscription
POST   /api/subscription/upgrade     // Upgrade plan
POST   /api/subscription/cancel      // Cancel subscription
POST   /api/subscription/webhook     // Stripe webhook
```

### Interviews
```
GET    /api/interviews                // List user's interviews
GET    /api/interviews/:id            // Get interview details
POST   /api/interviews                // Add new interview
PUT    /api/interviews/:id            // Update interview
DELETE /api/interviews/:id            // Delete interview
POST   /api/interviews/:id/followup   // Schedule follow-up
PUT    /api/interviews/:id/followup/:fid // Update follow-up status
POST   /api/interviews/:id/generate-email // Generate AI email
GET    /api/interviews/reminders      // Get pending reminders
POST   /api/interviews/import         // Import from calendar
```

### Public (No Auth)
```
GET    /tap/:cardUID                 // Handle NFC tap
GET    /qr/:cardUID                  // Handle QR scan
GET    /api/status                   // System status
```

## Security Requirements

### Authentication & Authorization
- Bcrypt for password hashing (min 10 rounds)
- JWT tokens with refresh mechanism
- Role-based middleware
- Session management
- Rate limiting on auth endpoints

### Data Protection
- HTTPS enforced
- MongoDB connection encryption
- Environment variables for secrets
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### API Security
- API key authentication for premium
- Rate limiting per tier
- Request signing for webhooks
- CORS configuration
- Content Security Policy

### Privacy & Compliance
- GDPR compliance features
- Data export functionality
- Account deletion
- Cookie consent
- Privacy policy integration
- Terms of service

## Third-Party Integrations

### Payment Processing (Stripe)
```javascript
{
  webhooks: [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ],
  products: {
    basic: 'price_xxxxx',
    standard: 'price_yyyyy',
    premium: 'price_zzzzz'
  }
}
```

### Email Service (SendGrid)
```javascript
{
  templates: {
    welcome: 'd-xxxxx',
    activation: 'd-yyyyy',
    tapAlert: 'd-zzzzz',
    weeklyReport: 'd-aaaaa',
    subscription: 'd-bbbbb',
    interviewReminder: 'd-ccccc',
    followUpGenerated: 'd-ddddd'
  }
}
```

### SMS Service (Twilio)
```javascript
{
  from: '+1234567890',
  templates: {
    tapAlert: 'Your card was just tapped!',
    dailySummary: 'You had {count} taps today',
    interviewReminder: 'Interview follow-up due for {company}'
  }
}
```

### AI Service (OpenAI/Claude API)
```javascript
{
  apiKey: process.env.AI_API_KEY,
  model: 'gpt-4' || 'claude-3',
  endpoints: {
    generateEmail: '/v1/completions',
    companyResearch: '/v1/embeddings',
    cultureFit: '/v1/analysis'
  },
  prompts: {
    thankYouEmail: 'Generate professional thank you...',
    followUpEmail: 'Create follow-up email...',
    companyContext: 'Analyze company culture...'
  }
}
```

### Calendar Integration (Google/Outlook)
```javascript
{
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scopes: ['calendar.readonly', 'calendar.events']
  },
  outlook: {
    clientId: process.env.OUTLOOK_CLIENT_ID,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
    scopes: ['calendars.read']
  }
}
```

### Geolocation (IPInfo)
```javascript
{
  apiKey: process.env.IPINFO_KEY,
  fields: ['country', 'region', 'city', 'loc']
}
```

## UI/UX Requirements

### Design System
- **Color Palette**
  - Primary: #00BCE5
  - Secondary: #47C761
  - Danger: #FF4444
  - Warning: #FFA500
  - Dark: #1a1a1a
  - Light: #f8f9fa

- **Typography**
  - Headers: Inter/Poppins
  - Body: Open Sans/Roboto
  - Monospace: Fira Code

- **Components**
  - Cards with hover effects
  - Smooth transitions
  - Loading states
  - Error boundaries
  - Toast notifications
  - Modal dialogs

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - Mobile: < 576px
  - Tablet: 576px - 992px
  - Desktop: > 992px
- Touch-friendly interfaces
- Swipe gestures for mobile

### Dashboard Layout
```
┌─────────────────────────────────────┐
│          Top Navigation             │
├──────┬──────────────────────────────┤
│      │                              │
│ Side │     Main Content Area        │
│ bar  │                              │
│      │                              │
│      │                              │
└──────┴──────────────────────────────┘
```

## Performance Requirements

### Page Load Times
- Initial load: < 3 seconds
- Subsequent navigation: < 1 second
- API response time: < 500ms
- Real-time updates: < 100ms

### Scalability
- Support 10,000 concurrent users
- Handle 1M taps per day
- Database indexing strategy
- Redis caching layer
- CDN for static assets

### Optimization
- Code splitting
- Lazy loading
- Image optimization
- Minification
- Gzip compression
- Browser caching

## Testing Strategy

### Unit Tests
- Model validation
- Controller logic
- Service functions
- Utility functions
- Middleware

### Integration Tests
- API endpoints
- Database operations
- Third-party services
- Authentication flow
- Payment processing

### End-to-End Tests
- User registration
- Card activation
- Dashboard navigation
- Redirect flows
- Subscription upgrade

## Deployment Configuration

### Environment Variables
```env
# Server
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb://...
REDIS_URL=redis://...

# Authentication
JWT_SECRET=...
JWT_REFRESH_SECRET=...
SESSION_SECRET=...

# Services
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
IPINFO_API_KEY=...

# Features
ENABLE_SMS=true
ENABLE_WEBHOOKS=true
TRIAL_DAYS=14
```

### Docker Configuration
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

### CI/CD Pipeline
1. Code push to GitHub
2. Run automated tests
3. Build Docker image
4. Push to registry
5. Deploy to staging
6. Run smoke tests
7. Deploy to production
8. Monitor and alert

## Marketing Integration Points

### Landing Page Requirements
- Hero section with CTA
- Feature comparison table
- Pricing cards
- Testimonials
- FAQ section
- Sign-up flow

### SEO Optimization
- Meta tags
- Structured data
- Sitemap
- Robots.txt
- Page speed optimization
- Mobile optimization

### Analytics Tracking
- Google Analytics 4
- Facebook Pixel
- Conversion tracking
- User behavior tracking
- A/B testing framework

## Support System

### Documentation
- User guide
- API documentation
- Video tutorials
- FAQ database
- Troubleshooting guide

### Customer Support
- In-app chat widget
- Email support
- Priority support for premium
- Knowledge base
- Community forum

## Future Enhancements

### Phase 2 Features
- Mobile app (React Native)
- Apple Wallet integration
- Google Pay integration
- Team accounts
- Reseller program
- Advanced automation
- AI-powered insights
- LinkedIn integration for networking
- Automated job application tracking
- Interview preparation assistant

### Phase 3 Features
- White-label solution
- Multi-language support
- Blockchain verification
- IoT device integration
- Voice assistant integration
- Augmented reality features
- AI-powered career coaching
- Salary negotiation tools
- Professional network mapping
- Recruitment platform integration

## Success Metrics

### Key Performance Indicators
- Monthly Active Users (MAU)
- Card Activation Rate
- Trial-to-Paid Conversion
- Customer Lifetime Value (CLV)
- Churn Rate
- Average Revenue Per User (ARPU)
- Net Promoter Score (NPS)

### Monitoring & Logging
- Application performance monitoring
- Error tracking (Sentry)
- User behavior analytics
- Server monitoring
- Database performance
- API usage metrics

## Development Guidelines

### Code Standards
- ESLint configuration
- Prettier formatting
- Commit conventions
- Branch naming
- PR templates
- Code review process

### Documentation Standards
- Inline code comments
- JSDoc for functions
- README files
- API documentation
- Architecture decisions

### Version Control
- Git flow strategy
- Semantic versioning
- Change logs
- Release notes
- Rollback procedures

---

## Implementation Priority

### MVP (Phase 1) - Weeks 1-4
1. Basic authentication
2. Card activation
3. Simple dashboard
4. Static redirects
5. Basic analytics
6. Email notifications

### Core Features (Phase 2) - Weeks 5-8
1. Subscription system
2. Payment integration
3. Time-based redirects
4. Advanced analytics
5. Admin panel
6. API development

### Premium Features (Phase 3) - Weeks 9-12
1. Geo-based redirects
2. SMS notifications
3. Webhook system
4. Custom branding
5. Bulk operations
6. White-label options

---

This blueprint provides a complete foundation for building the NFC Card Dashboard System. Each section can be expanded with more specific implementation details as needed during development.