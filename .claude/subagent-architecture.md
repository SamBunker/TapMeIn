# Claude Code Subagent Architecture for NFC Card Management System

## Executive Summary

This document defines a specialized subagent architecture for Claude Code to efficiently develop the NFC Card Management System. The architecture provides domain-specific AI assistants that work collaboratively to handle different aspects of the full-stack web development process, from database design to deployment.

## Subagent Types Overview

### 1. System Architecture & Test-Driven Development Specialist
**Primary Role**: Lead system design and testing strategy
**Key Responsibilities**:
- Design robust, scalable architecture patterns
- Create comprehensive test strategies before implementation
- Ensure FSM (Finite State Machine) architectural compliance
- Define interfaces and contracts between components
- Plan dependency injection and management systems

**Specialized Capabilities**:
- MongoDB schema design and optimization
- Node.js/Express API architecture
- Microservices-ready structure planning
- Test-first development methodology
- Security architecture design
- Performance optimization strategies

**Interaction Pattern**: Works closely with Backend and DevOps specialists to ensure architectural decisions are implementable and testable.

---

### 2. Backend Development Specialist
**Primary Role**: Node.js/Express backend implementation
**Key Responsibilities**:
- Implement RESTful API endpoints
- Develop authentication and authorization systems
- Create database models and controllers
- Integrate third-party services (Stripe, SendGrid, Twilio)
- Implement webhook systems and real-time features

**Specialized Capabilities**:
- Express.js middleware development
- MongoDB/Mongoose operations
- JWT authentication implementation
- Role-based access control (RBAC)
- Payment processing integration
- Email/SMS service integration
- Socket.io real-time features
- API security and rate limiting

**Code Examples**:
```javascript
// User authentication middleware
const authenticateToken = (req, res, next) => {
  // JWT validation logic
};

// Role-based authorization
const requireRole = (roles) => {
  return (req, res, next) => {
    // Role validation logic
  };
};
```

---

### 3. Frontend Development Specialist
**Primary Role**: Handlebars templating and client-side development
**Key Responsibilities**:
- Create responsive UI components with Handlebars
- Implement client-side JavaScript functionality
- Develop admin and user dashboards
- Create mobile-responsive designs
- Implement real-time UI updates

**Specialized Capabilities**:
- Handlebars templating engine
- CSS frameworks and responsive design
- JavaScript ES6+ development
- AJAX and fetch API implementation
- DOM manipulation and event handling
- Chart.js for analytics visualization
- Bootstrap/Tailwind CSS integration

**Template Examples**:
```handlebars
{{#each cards}}
<div class="card-item" data-card-id="{{_id}}">
  <h3>{{nickname}}</h3>
  <span class="tap-count">{{tapCount}} taps</span>
  <span class="status {{status}}">{{status}}</span>
</div>
{{/each}}
```

---

### 4. Database Design Specialist
**Primary Role**: MongoDB schema design and optimization
**Key Responsibilities**:
- Design efficient database schemas
- Create indexes and optimization strategies
- Implement data relationships and constraints
- Plan data migration strategies
- Design backup and recovery procedures

**Specialized Capabilities**:
- MongoDB document design
- Mongoose schema definitions
- Index strategy planning
- Aggregation pipeline development
- Data validation rules
- Performance optimization
- Sharding and replication planning

**Schema Examples**:
```javascript
const cardSchema = new Schema({
  cardUID: { type: String, unique: true, required: true },
  owner: { type: ObjectId, ref: 'User', default: null },
  status: { 
    type: String, 
    enum: ['unassigned', 'ready', 'activated', 'suspended'],
    default: 'unassigned'
  }
});
```

---

### 5. Security & Authentication Specialist
**Primary Role**: Application security implementation
**Key Responsibilities**:
- Implement secure authentication flows
- Design authorization systems
- Create security middleware
- Implement data protection measures
- Plan compliance features (GDPR)

**Specialized Capabilities**:
- JWT token management
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting implementation
- CORS configuration
- Content Security Policy
- XSS and CSRF protection
- API key management

**Security Examples**:
```javascript
// Password hashing
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Input validation
const validateCardActivation = (req, res, next) => {
  // Validation logic
};
```

---

### 6. API Design & Integration Specialist
**Primary Role**: Third-party service integration
**Key Responsibilities**:
- Design and implement API integrations
- Create webhook handlers
- Implement payment processing
- Develop email/SMS services
- Create geolocation services

**Specialized Capabilities**:
- Stripe payment integration
- SendGrid email services
- Twilio SMS integration
- IPInfo geolocation API
- OpenAI/Claude AI integration
- Calendar API integration (Google/Outlook)
- Webhook security and verification

**Integration Examples**:
```javascript
// Stripe webhook handler
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  // Webhook verification and processing
};

// AI email generation
const generateFollowUpEmail = async (interviewData) => {
  // AI API integration for email generation
};
```

---

### 7. Testing & Quality Assurance Specialist
**Primary Role**: Comprehensive testing strategy implementation
**Key Responsibilities**:
- Create unit test suites
- Develop integration tests
- Implement end-to-end testing
- Create mock data and scenarios
- Establish CI/CD testing pipelines

**Specialized Capabilities**:
- Jest/Mocha test framework implementation
- Supertest for API testing
- Puppeteer for E2E testing
- Mock data generation
- Test coverage analysis
- Performance testing
- Load testing with Artillery

**Testing Examples**:
```javascript
// Unit test for card activation
describe('Card Activation', () => {
  test('should activate card with valid code', async () => {
    // Test implementation
  });
});

// Integration test for API endpoint
describe('POST /api/cards/activate', () => {
  test('should return 200 with valid activation code', async () => {
    // API integration test
  });
});
```

---

### 8. DevOps & Deployment Specialist
**Primary Role**: Infrastructure and deployment management
**Key Responsibilities**:
- Create Docker configurations
- Implement CI/CD pipelines
- Manage environment configurations
- Plan monitoring and logging
- Implement backup strategies

**Specialized Capabilities**:
- Docker containerization
- GitHub Actions CI/CD
- Environment variable management
- Server monitoring setup
- Log aggregation
- Database backup automation
- SSL certificate management

**DevOps Examples**:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

---

### 9. Analytics & Reporting Specialist
**Primary Role**: Analytics implementation and reporting features
**Key Responsibilities**:
- Implement analytics data collection
- Create reporting dashboards
- Develop data visualization components
- Design export functionality
- Create real-time analytics

**Specialized Capabilities**:
- Analytics data modeling
- Chart.js implementation
- CSV/PDF export generation
- Real-time data streaming
- Geographic data visualization
- Time-series analysis
- Custom query builders

**Analytics Examples**:
```javascript
// Analytics aggregation pipeline
const getCardAnalytics = async (cardId, dateRange) => {
  return await Analytics.aggregate([
    { $match: { cardId, timestamp: { $gte: dateRange.start } } },
    { $group: { _id: '$eventType', count: { $sum: 1 } } }
  ]);
};
```

---

### 10. UI/UX Design Specialist
**Primary Role**: User experience and interface design
**Key Responsibilities**:
- Create responsive design systems
- Implement accessibility features
- Design user-friendly workflows
- Create interactive components
- Optimize for mobile devices

**Specialized Capabilities**:
- CSS Grid and Flexbox layouts
- Responsive design patterns
- Accessibility (WCAG) compliance
- Animation and transitions
- User workflow optimization
- Touch-friendly interfaces
- Cross-browser compatibility

**Design Examples**:
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## Subagent Collaboration Workflows

### 1. Feature Development Workflow
```
Architecture Specialist → Database Design → Backend Development → Frontend Development → Testing → DevOps
```

### 2. Sprint Planning Workflow
```
Project Manager → Architecture Specialist → All Development Specialists → Testing Specialist
```

### 3. Bug Resolution Workflow
```
Testing Specialist → Architecture Specialist → Relevant Development Specialist → Testing Verification
```

### 4. Security Review Workflow
```
Security Specialist → Architecture Review → Code Review → Testing → Deployment
```

## Implementation Phase Mapping

### Phase 1: MVP (Weeks 1-4)
**Primary Subagents**:
- System Architecture Specialist (lead)
- Backend Development Specialist
- Database Design Specialist
- Frontend Development Specialist
- Security Specialist

**Focus Areas**:
- Basic authentication system
- Card activation flow
- Simple dashboard
- Static redirects
- Basic analytics

### Phase 2: Core Features (Weeks 5-8)
**Primary Subagents**:
- API Integration Specialist (lead)
- Backend Development Specialist
- Analytics Specialist
- Testing Specialist
- DevOps Specialist

**Focus Areas**:
- Subscription system
- Payment integration
- Time-based redirects
- Advanced analytics
- Admin panel

### Phase 3: Premium Features (Weeks 9-12)
**Primary Subagents**:
- All Specialists (collaborative)
- UI/UX Specialist (lead)
- API Integration Specialist
- Analytics Specialist

**Focus Areas**:
- Geo-based redirects
- SMS notifications
- Webhook system
- Custom branding
- Performance optimization

## Subagent Communication Protocols

### 1. Proactive Activation Triggers
Subagents automatically activate when encountering:
- **Architecture Specialist**: System design discussions, API contracts, scalability concerns
- **Backend Specialist**: Express.js code, API endpoints, MongoDB operations, authentication logic
- **Frontend Specialist**: Handlebars templates, CSS/JavaScript, UI components, responsive design
- **Database Specialist**: Schema definitions, queries, indexing, data relationships
- **Security Specialist**: Authentication code, password handling, API security, middleware
- **API Integration Specialist**: Third-party services (Stripe, SendGrid), webhooks, payment code
- **Testing Specialist**: Test files, testing discussions, quality assurance, coverage analysis
- **DevOps Specialist**: Docker files, deployment configs, CI/CD, environment setup
- **Analytics Specialist**: Data visualization, reporting, metrics, Chart.js implementations
- **UI/UX Specialist**: Design discussions, accessibility, user experience, mobile optimization

### 2. Handoff Procedures
Each subagent must provide:
- Clear deliverable specifications
- Dependency requirements
- Testing criteria
- Integration points
- Documentation updates

### 2. Code Review Process
```
Developer Subagent → Architecture Review → Security Review → Testing Review → Approval
```

### 3. Conflict Resolution
When subagents have conflicting recommendations:
1. Architecture Specialist provides technical arbitration
2. Testing Specialist validates both approaches
3. Performance impact assessment
4. Final decision documentation

## Quality Gates

### Code Quality Requirements
- All code must pass ESLint standards
- Minimum 80% test coverage
- Security scan approval
- Performance benchmark compliance
- Documentation completeness

### Integration Requirements
- API contract compliance
- Database schema validation
- Security vulnerability assessment
- Cross-browser compatibility
- Mobile responsiveness verification

## Configuration Templates

### Subagent Activation Commands
```bash
# Activate specific subagent for current context
claude-code --agent=backend-specialist --context=user-authentication

# Multi-agent collaboration
claude-code --agents=architecture,backend,testing --task=implement-payment-system

# Phase-specific agent selection
claude-code --phase=mvp --auto-select-agents
```

### Environment Configuration
```json
{
  "subagents": {
    "architecture": {
      "expertise": ["system-design", "testing-strategy", "fsm-patterns"],
      "frameworks": ["nodejs", "express", "mongodb"],
      "testing": ["jest", "supertest", "integration"]
    },
    "backend": {
      "expertise": ["express-apis", "authentication", "payment-processing"],
      "integrations": ["stripe", "sendgrid", "twilio"],
      "security": ["jwt", "rbac", "rate-limiting"]
    }
  }
}
```

## Success Metrics

### Development Velocity
- Feature completion rate per sprint
- Code review turnaround time
- Bug resolution speed
- Test coverage maintenance

### Code Quality
- Static analysis scores
- Security vulnerability count
- Performance benchmarks
- Documentation completeness

### Collaboration Effectiveness
- Handoff efficiency between specialists
- Conflict resolution time
- Knowledge sharing frequency
- Cross-training completion

## Maintenance and Evolution

### Subagent Updates
- Regular capability assessments
- New technology integration
- Performance optimization
- Knowledge base updates

### Architecture Evolution
- Quarterly architecture reviews
- Technology stack assessments
- Scalability planning
- Security updates

This subagent architecture provides a comprehensive framework for developing the NFC Card Management System with specialized expertise in each critical domain while maintaining collaborative workflows and quality standards throughout the development lifecycle.