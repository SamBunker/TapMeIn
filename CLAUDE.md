# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Primary development command (Docker-based)
docker run -v "D:/Development Projects/TapMeIn/:/app" -w /app -p 3000:3000 node:18-slim bash -c "npm install && node app.js"

# Interactive development environment
docker run -it -v "D:/Development Projects/TapMeIn/:/app" -w /app -p 3000:3000 node:18-slim bash

# Standard npm commands
npm run dev      # Development with nodemon
npm test         # Jest test suite with coverage
npm run lint     # ESLint code linting
npm start        # Production server
```

## Architecture Overview

**TapMeIn** is an NFC Card Management System with dynamic redirect capabilities. The application follows a layered MVC architecture serving both web interface and REST API endpoints.

### Core Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Template Engine**: Handlebars
- **Testing**: Jest with Supertest

### Database Models & Business Logic

#### User Model (`/models/User.js`)
- **Subscription-based feature access**: `user.hasFeatureAccess(feature)` method
- **Role-based permissions**: `user`, `admin` roles
- **Trial management**: 14-day trial period with automatic expiration
- **Security features**: Account locking, login attempt tracking

#### Card Model (`/models/Card.js`)
- **Lifecycle management**: `unassigned` → `ready` → `activated` → `suspended`
- **Analytics tracking**: Tap counts, unique visitors, activity status
- **Activation system**: Automatic activation code generation

#### Profile Model (`/models/Profile.js`)
- **Dynamic redirects**: Static, time-based, geo-based, conditional redirects
- **A/B testing**: Multiple variants with weight distribution
- **Advanced features**: Webhook integration, custom themes

### Authentication & Authorization System

**Multi-layered security** implemented in `/middleware/auth.js`:

- `authenticateToken`: Core JWT authentication for both web and API
- `requireRole(...roles)`: Role-based access control
- `requireSubscription(plan, feature)`: Subscription tier validation
- `requireOwnership(model, param, field)`: Resource ownership checks
- `requireAdminWeb`: Web-specific admin authentication with redirects

**Dual Response Pattern**: Routes automatically detect JSON vs HTML requests and respond appropriately (JSON for API calls, redirects/renders for web interface).

### API Structure

**Dual Interface Design** - same routes serve both web interface and REST API:

```
/auth/*          ← Authentication (forms + API)
/dashboard/*     ← Web dashboard interface
/admin/*         ← Admin web interface with comprehensive management
/api/auth/*      ← Authentication API endpoints
/api/admin/*     ← Admin API endpoints
/tap/:cardUID    ← Public NFC tap handling (no auth required)
```

**Smart Response Handling**: Controllers check `req.path.startsWith('/api/')` or `req.headers.accept` to determine response format.

### Subscription & Feature Matrix

**Tier-based access control**:
- **Free**: 1 card, basic features
- **Basic**: 3 cards, analytics, time-based redirects  
- **Standard**: 10 cards, geo-redirects, webhooks
- **Premium**: Unlimited cards, full feature set

Access validation: `if (!user.hasFeatureAccess('geoRedirects')) return res.status(402)...`

### Admin Dashboard System

**Comprehensive admin interface** with unified TAP ME IN! branding:
- **Cards Management**: Full CRUD with filtering, pagination, status management
- **Users Management**: User administration, subscription management, impersonation
- **Analytics**: System-wide metrics, performance monitoring
- **Role Protection**: `requireAdminWeb` middleware for web routes

### Docker Development Environment

**Optimized for Windows development** with volume mounting for live reload:
- MongoDB and Redis services in docker-compose
- Volume mounting: `"D:/Development Projects/TapMeIn/:/app"`
- Port mapping: `3000:3000` for local development

### Testing Strategy

**Comprehensive test setup** with Jest:
- **Coverage requirements**: 70% minimum across all metrics
- **Test database**: MongoDB Memory Server for isolation
- **Integration tests**: Supertest for API endpoint testing
- **Test command**: `npm test` runs full suite with coverage

### Handlebars Helpers

**Custom helpers** configured in `app.js`:
- `eq`, `ne`, `gt`, `lt`, `gte`, `lte`: Comparison operators
- `math`: Mathematical operations (`{{math a "plus" b}}`)
- `formatDate`, `formatDateTime`: Date formatting
- `buildQueryString`: URL parameter building for pagination
- `substring`: String manipulation
- `times`: Loop iteration helper

### Error Handling & Security

**Comprehensive security layers**:
- **Rate limiting**: Express rate limit middleware
- **Input validation**: Express-validator for API endpoints
- **Security headers**: Helmet.js with CSP configuration
- **Account security**: bcrypt hashing, account locking, session management

### Key Development Patterns

1. **Authentication Flow**: Always use middleware functions, never implement auth logic in routes
2. **Database Operations**: Leverage model static and instance methods rather than raw queries
3. **Response Handling**: Use dual-response pattern for web/API compatibility
4. **Feature Gating**: Check subscription access using `user.hasFeatureAccess(feature)`
5. **Error Responses**: Consistent error format with success/error flags and proper HTTP status codes

### Configuration Requirements

**Environment variables** for development:
```
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/tapmeinnfc_dev
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
STRIPE_SECRET_KEY=your-stripe-secret-key
BASE_URL=http://localhost:3000
```

### NFC Tap Flow

**Public endpoint** `/tap/:cardUID`:
1. Validates card existence and activation status
2. Records tap analytics (IP, user agent, timestamp)
3. Processes redirect logic based on profile configuration
4. Supports complex routing: static, time-based, geo-based, conditional
5. No authentication required for seamless user experience