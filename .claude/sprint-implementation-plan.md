# Claude Code Subagent Sprint Implementation Plan
## NFC Card Management System Development

### Executive Summary

This document provides a detailed 12-week sprint plan for implementing the NFC Card Management System using the specialized subagent architecture defined in the project documentation. The plan coordinates 10 specialized subagents across 3 development phases, with specific activation schedules, configuration templates, and collaboration patterns.

---

## Implementation Timeline Overview

### Phase 1: MVP Foundation (Weeks 1-4)
**Primary Goal**: Establish core authentication, basic card management, and essential infrastructure
**Active Subagents**: 6 core specialists
**Key Deliverables**: Working authentication, card activation, basic dashboard, static redirects

### Phase 2: Core Features (Weeks 5-8)
**Primary Goal**: Implement subscription system, payment processing, and advanced features
**Active Subagents**: 8 specialists with API integration focus
**Key Deliverables**: Payment system, time-based redirects, analytics, admin panel

### Phase 3: Premium Features (Weeks 9-12)
**Primary Goal**: Advanced functionality, optimization, and production readiness
**Active Subagents**: All 10 specialists in full collaboration
**Key Deliverables**: Geo-redirects, SMS, webhooks, custom branding, deployment

---

## Subagent Activation Schedule

### Week 1: Foundation Setup
**Activate First**:
1. **System Architecture & TDD Specialist** (Lead)
   - Initialize project structure
   - Design core database schemas
   - Establish testing framework
   - Define API contracts

2. **Database Design Specialist**
   - Design MongoDB schemas
   - Create index strategies
   - Plan data relationships
   - Set up validation rules

3. **Security & Authentication Specialist**
   - Design authentication flow
   - Plan security middleware
   - Set up JWT system
   - Configure password hashing

**Configuration Commands**:
```bash
# Initialize architecture specialist with project context
claude-code --agent=architecture-specialist --context="NFC card management system with Node.js/Express/MongoDB stack" --focus="FSM patterns, testing strategy, API design"

# Activate database specialist
claude-code --agent=database-specialist --context="MongoDB schemas for users, cards, profiles, analytics" --focus="schema design, indexing, relationships"

# Configure security specialist
claude-code --agent=security-specialist --context="JWT authentication, password security, API protection" --focus="bcrypt, middleware, rate limiting"
```

### Week 2: Backend Foundation
**Add to Active Team**:
4. **Backend Development Specialist**
   - Implement authentication APIs
   - Create user management
   - Build card activation system
   - Develop basic CRUD operations

5. **Testing & QA Specialist**
   - Create unit test suites
   - Develop API integration tests
   - Set up test automation
   - Establish coverage requirements

**Configuration Commands**:
```bash
# Activate backend specialist
claude-code --agent=backend-specialist --context="Express.js APIs, Mongoose models, JWT middleware" --focus="authentication, card management, RESTful design"

# Configure testing specialist
claude-code --agent=testing-specialist --context="Jest framework, Supertest for APIs, 80% coverage requirement" --focus="unit tests, integration tests, mocking"
```

### Week 3: Frontend Development
**Add to Active Team**:
6. **Frontend Development Specialist**
   - Create Handlebars templates
   - Build user dashboard
   - Implement card management UI
   - Develop responsive design

7. **UI/UX Design Specialist**
   - Design component system
   - Create responsive layouts
   - Implement accessibility features
   - Optimize for mobile

**Configuration Commands**:
```bash
# Activate frontend specialist
claude-code --agent=frontend-specialist --context="Handlebars templating, Bootstrap/CSS, JavaScript ES6+" --focus="dashboards, responsive design, AJAX"

# Configure UI/UX specialist
claude-code --agent=uiux-specialist --context="Mobile-first design, accessibility compliance, NFC dashboard themes" --focus="responsive grids, touch interfaces, user workflows"
```

### Week 4: MVP Integration & Testing
**All Phase 1 Specialists Active**
- Complete MVP feature integration
- Comprehensive testing
- Bug fixes and optimizations
- Documentation updates

### Week 5: Payment & Subscription Setup
**Add to Active Team**:
8. **API Design & Integration Specialist**
   - Stripe payment integration
   - Webhook handlers
   - Email service setup
   - Third-party API management

**Configuration Commands**:
```bash
# Activate API integration specialist
claude-code --agent=api-integration-specialist --context="Stripe payments, SendGrid emails, Twilio SMS, webhook security" --focus="payment processing, subscription management, service integration"
```

### Week 6: Analytics & Reporting
**Add to Active Team**:
9. **Analytics & Reporting Specialist**
   - Analytics data collection
   - Reporting dashboards
   - Data visualization
   - Export functionality

**Configuration Commands**:
```bash
# Activate analytics specialist
claude-code --agent=analytics-specialist --context="Card tap analytics, Chart.js visualizations, CSV exports" --focus="data aggregation, real-time updates, dashboard widgets"
```

### Week 8: DevOps & Deployment Preparation
**Add to Active Team**:
10. **DevOps & Deployment Specialist**
    - Docker containerization
    - CI/CD pipeline setup
    - Environment management
    - Monitoring configuration

**Configuration Commands**:
```bash
# Activate DevOps specialist
claude-code --agent=devops-specialist --context="Docker containers, GitHub Actions, MongoDB Atlas, production deployment" --focus="CI/CD, monitoring, backup strategies, SSL"
```

---

## Sprint-by-Sprint Breakdown

### Sprint 1 (Week 1): Project Foundation
**Sprint Goal**: Establish project architecture and database foundation

**Daily Standup Participants**: Architecture Specialist (Lead), Database Specialist, Security Specialist

**Sprint Backlog**:
```
Epic: Project Foundation
├── Story: Project Structure Setup (8 pts)
│   ├── Task: Initialize Node.js/Express project
│   ├── Task: Configure MongoDB connection
│   ├── Task: Set up environment variables
│   └── Task: Create folder structure
├── Story: Database Schema Design (13 pts)
│   ├── Task: Design User model
│   ├── Task: Design Card model
│   ├── Task: Design Profile model
│   ├── Task: Create indexes and relationships
│   └── Task: Set up validation rules
└── Story: Security Architecture (8 pts)
    ├── Task: Configure JWT system
    ├── Task: Set up bcrypt hashing
    ├── Task: Design middleware structure
    └── Task: Plan rate limiting strategy
```

**Definition of Done**:
- [ ] Project structure follows defined architecture
- [ ] All database schemas defined and validated
- [ ] Security middleware designed and documented
- [ ] Unit tests for models created
- [ ] Architecture documentation updated

**Risk Assessment**:
- **Medium Risk**: Database schema complexity
- **Mitigation**: Daily reviews between Architecture and Database specialists

### Sprint 2 (Week 2): Authentication System
**Sprint Goal**: Implement complete user authentication and card activation flow

**Active Subagents**: Architecture (Lead), Database, Security, Backend, Testing

**Sprint Backlog**:
```
Epic: Authentication System
├── Story: User Registration & Login (8 pts)
│   ├── Task: POST /api/auth/register endpoint
│   ├── Task: POST /api/auth/login endpoint
│   ├── Task: JWT token generation
│   ├── Task: Password validation
│   └── Task: Email verification
├── Story: Card Activation System (13 pts)
│   ├── Task: POST /api/cards/activate endpoint
│   ├── Task: Activation code validation
│   ├── Task: Card-user linking logic
│   ├── Task: Trial period initiation
│   └── Task: Welcome email integration
└── Story: Authentication Middleware (5 pts)
    ├── Task: JWT verification middleware
    ├── Task: Role-based access control
    └── Task: Route protection
```

**Collaboration Pattern**:
1. **Security Specialist** → Defines authentication requirements
2. **Backend Specialist** → Implements API endpoints
3. **Testing Specialist** → Creates comprehensive test suite
4. **Architecture Specialist** → Reviews and validates implementation

**Quality Gates**:
- [ ] All authentication endpoints tested (unit + integration)
- [ ] Security review passed
- [ ] Card activation flow works end-to-end
- [ ] Performance benchmarks met (<500ms response time)

### Sprint 3 (Week 3): User Interface Development
**Sprint Goal**: Create responsive user dashboard and card management interface

**Active Subagents**: Frontend (Lead), UI/UX, Backend, Testing, Security

**Sprint Backlog**:
```
Epic: User Dashboard
├── Story: Dashboard Layout (8 pts)
│   ├── Task: Main dashboard template
│   ├── Task: Navigation components
│   ├── Task: Responsive grid system
│   └── Task: Mobile optimization
├── Story: Card Management UI (13 pts)
│   ├── Task: Card listing interface
│   ├── Task: Card activation form
│   ├── Task: Profile creation/editing
│   ├── Task: Static redirect configuration
│   └── Task: Real-time status updates
└── Story: User Authentication UI (5 pts)
    ├── Task: Login/registration forms
    ├── Task: Password reset interface
    └── Task: Email verification pages
```

**Collaboration Pattern**:
1. **UI/UX Specialist** → Designs responsive layouts and user flows
2. **Frontend Specialist** → Implements Handlebars templates and JavaScript
3. **Backend Specialist** → Provides API endpoints for frontend
4. **Testing Specialist** → Creates E2E tests for user workflows

### Sprint 4 (Week 4): MVP Integration & Testing
**Sprint Goal**: Complete MVP feature integration and comprehensive testing

**Active Subagents**: All Phase 1 specialists

**Sprint Backlog**:
```
Epic: MVP Completion
├── Story: End-to-End Integration (8 pts)
│   ├── Task: Complete user registration flow
│   ├── Task: Card activation integration
│   ├── Task: Dashboard data integration
│   └── Task: Static redirect testing
├── Story: Performance Optimization (5 pts)
│   ├── Task: Database query optimization
│   ├── Task: Frontend asset optimization
│   └── Task: API response time optimization
└── Story: Documentation & Deployment Prep (3 pts)
    ├── Task: API documentation
    ├── Task: User guide basics
    └── Task: Environment setup guide
```

**Quality Gates - MVP Release**:
- [ ] All core user stories completed
- [ ] 90%+ test coverage achieved
- [ ] Security audit passed
- [ ] Performance requirements met
- [ ] Documentation complete
- [ ] Staging deployment successful

### Sprint 5 (Week 5): Payment Integration
**Sprint Goal**: Implement Stripe payment system and subscription management

**Active Subagents**: API Integration (Lead), Backend, Security, Testing, Architecture

**Sprint Backlog**:
```
Epic: Payment System
├── Story: Stripe Integration (13 pts)
│   ├── Task: Stripe API setup
│   ├── Task: Payment intent creation
│   ├── Task: Subscription management
│   ├── Task: Webhook handlers
│   └── Task: Payment security
├── Story: Subscription Logic (8 pts)
│   ├── Task: Plan management system
│   ├── Task: Trial period logic
│   ├── Task: Feature gating
│   └── Task: Upgrade/downgrade flows
└── Story: Billing Dashboard (5 pts)
    ├── Task: Subscription status display
    ├── Task: Payment history
    └── Task: Plan comparison
```

**Risk Assessment**:
- **High Risk**: Payment webhook security
- **Mitigation**: Security specialist leads webhook implementation review

### Sprint 6 (Week 6): Advanced Analytics
**Sprint Goal**: Implement comprehensive analytics and reporting system

**Active Subagents**: Analytics (Lead), Backend, Frontend, Database, Testing

**Sprint Backlog**:
```
Epic: Analytics System
├── Story: Data Collection (8 pts)
│   ├── Task: Tap event tracking
│   ├── Task: Geolocation capture
│   ├── Task: Device/browser detection
│   └── Task: User journey tracking
├── Story: Analytics Dashboard (13 pts)
│   ├── Task: Chart.js integration
│   ├── Task: Real-time metrics
│   ├── Task: Geographic visualization
│   ├── Task: Time-series analysis
│   └── Task: Custom date ranges
└── Story: Data Export (5 pts)
    ├── Task: CSV export functionality
    ├── Task: PDF report generation
    └── Task: API access for premium
```

### Sprint 7 (Week 7): Time-Based Redirects
**Sprint Goal**: Implement dynamic redirect system with time-based rules

**Active Subagents**: Backend (Lead), Frontend, Database, Testing, UI/UX

**Sprint Backlog**:
```
Epic: Dynamic Redirects
├── Story: Time-Based Logic (8 pts)
│   ├── Task: Time slot configuration
│   ├── Task: Timezone handling
│   ├── Task: Day-of-week rules
│   └── Task: Holiday overrides
├── Story: Redirect Management UI (8 pts)
│   ├── Task: Rule configuration interface
│   ├── Task: Visual time slot editor
│   ├── Task: Rule testing tools
│   └── Task: Bulk operations
└── Story: Public Redirect Handler (5 pts)
    ├── Task: /tap/:cardUID optimization
    ├── Task: Redirect logic execution
    └── Task: Analytics tracking
```

### Sprint 8 (Week 8): Admin Panel & DevOps
**Sprint Goal**: Complete admin functionality and deployment preparation

**Active Subagents**: DevOps (Lead), Backend, Frontend, Security, Testing

**Sprint Backlog**:
```
Epic: Admin Panel
├── Story: User Management (8 pts)
│   ├── Task: User list/search interface
│   ├── Task: Subscription management
│   ├── Task: User activity logs
│   └── Task: Bulk operations
├── Story: System Analytics (5 pts)
│   ├── Task: Global metrics dashboard
│   ├── Task: Revenue tracking
│   └── Task: System health monitoring
└── Epic: Deployment Infrastructure (13 pts)
    ├── Task: Docker configuration
    ├── Task: CI/CD pipeline setup
    ├── Task: Environment management
    ├── Task: Database backup strategy
    └── Task: SSL and security setup
```

### Sprint 9 (Week 9): Geo-Based Features
**Sprint Goal**: Implement location-based redirects and SMS notifications

**Active Subagents**: API Integration (Lead), Backend, Frontend, Analytics, Testing

**Sprint Backlog**:
```
Epic: Geographic Features
├── Story: Geo-Location Integration (8 pts)
│   ├── Task: IPInfo API integration
│   ├── Task: Location data parsing
│   ├── Task: Geographic redirect logic
│   └── Task: Fallback handling
├── Story: SMS Notification System (8 pts)
│   ├── Task: Twilio integration
│   ├── Task: SMS template system
│   ├── Task: Notification preferences
│   └── Task: Rate limiting
└── Story: Geographic Analytics (5 pts)
    ├── Task: Location-based reports
    ├── Task: Geographic heatmaps
    └── Task: Regional performance metrics
```

### Sprint 10 (Week 10): Webhook System
**Sprint Goal**: Implement webhook infrastructure and custom branding

**Active Subagents**: API Integration (Lead), Backend, Security, Frontend, UI/UX

**Sprint Backlog**:
```
Epic: Webhook System
├── Story: Webhook Infrastructure (13 pts)
│   ├── Task: Webhook delivery system
│   ├── Task: Retry logic implementation
│   ├── Task: Authentication/signing
│   ├── Task: Payload customization
│   └── Task: Delivery tracking
├── Story: Custom Branding (8 pts)
│   ├── Task: Theme customization system
│   ├── Task: Logo upload functionality
│   ├── Task: Color scheme management
│   └── Task: White-label options
└── Story: Webhook Management UI (5 pts)
    ├── Task: Webhook configuration interface
    ├── Task: Testing tools
    └── Task: Delivery history
```

### Sprint 11 (Week 11): Performance & Testing
**Sprint Goal**: Optimize performance and complete comprehensive testing

**Active Subagents**: Testing (Lead), DevOps, Backend, Frontend, Architecture

**Sprint Backlog**:
```
Epic: Performance Optimization
├── Story: Backend Optimization (8 pts)
│   ├── Task: Database query optimization
│   ├── Task: Redis caching implementation
│   ├── Task: API response optimization
│   └── Task: Memory leak detection
├── Story: Frontend Optimization (5 pts)
│   ├── Task: Asset optimization
│   ├── Task: Code splitting
│   └── Task: Lazy loading
└── Story: Load Testing (8 pts)
    ├── Task: Artillery test scenarios
    ├── Task: Stress testing
    ├── Task: Performance benchmarking
    └── Task: Scalability validation
```

### Sprint 12 (Week 12): Production Deployment
**Sprint Goal**: Final production deployment and monitoring setup

**Active Subagents**: DevOps (Lead), All specialists for final validation

**Sprint Backlog**:
```
Epic: Production Deployment
├── Story: Production Environment (8 pts)
│   ├── Task: Production server setup
│   ├── Task: SSL certificate configuration
│   ├── Task: Domain configuration
│   └── Task: CDN setup
├── Story: Monitoring & Logging (8 pts)
│   ├── Task: Application monitoring
│   ├── Task: Error tracking setup
│   ├── Task: Performance monitoring
│   └── Task: Alert configuration
└── Story: Go-Live Activities (5 pts)
    ├── Task: Final smoke tests
    ├── Task: Production data migration
    ├── Task: DNS cutover
    └── Task: Post-deployment monitoring
```

---

## Subagent Configuration Templates

### Architecture Specialist Configuration
```json
{
  "specialist_type": "architecture",
  "project_context": {
    "technology_stack": ["nodejs", "express", "mongodb", "handlebars"],
    "architecture_patterns": ["REST", "FSM", "microservices-ready"],
    "testing_strategy": "test-driven-development",
    "focus_areas": ["system_design", "api_contracts", "scalability"]
  },
  "responsibilities": [
    "Design system architecture",
    "Define API contracts",
    "Review architectural decisions",
    "Ensure FSM compliance",
    "Lead technical conflict resolution"
  ],
  "collaboration_priority": ["database", "backend", "testing", "security"],
  "deliverables": [
    "Architecture documentation",
    "API specifications",
    "System design diagrams",
    "Technical decision records"
  ]
}
```

### Backend Development Specialist Configuration
```json
{
  "specialist_type": "backend",
  "project_context": {
    "framework": "express",
    "database": "mongodb",
    "authentication": "jwt",
    "integrations": ["stripe", "sendgrid", "twilio", "ipinfo"]
  },
  "responsibilities": [
    "Implement REST APIs",
    "Database operations",
    "Authentication middleware",
    "Third-party integrations",
    "Business logic implementation"
  ],
  "coding_standards": {
    "linting": "eslint",
    "formatting": "prettier",
    "testing": "jest",
    "coverage_minimum": 80
  }
}
```

### Frontend Development Specialist Configuration
```json
{
  "specialist_type": "frontend",
  "project_context": {
    "templating": "handlebars",
    "css_framework": "bootstrap",
    "javascript": "es6+",
    "responsiveness": "mobile-first"
  },
  "responsibilities": [
    "Handlebars template development",
    "Client-side JavaScript",
    "AJAX implementations",
    "Responsive design",
    "User interaction handling"
  ],
  "performance_targets": {
    "page_load": "< 3 seconds",
    "interaction_response": "< 100ms",
    "mobile_optimization": "required"
  }
}
```

### Database Design Specialist Configuration
```json
{
  "specialist_type": "database",
  "project_context": {
    "database_type": "mongodb",
    "odm": "mongoose",
    "scaling_strategy": "indexing_and_aggregation"
  },
  "responsibilities": [
    "Schema design and optimization",
    "Index strategy planning",
    "Data relationship modeling",
    "Performance optimization",
    "Migration strategies"
  ],
  "performance_requirements": {
    "query_response": "< 100ms",
    "concurrent_users": 10000,
    "daily_operations": "1M+"
  }
}
```

### Security Specialist Configuration
```json
{
  "specialist_type": "security",
  "project_context": {
    "authentication": "jwt_with_refresh",
    "authorization": "role_based",
    "compliance": ["gdpr", "pci_dss_basic"]
  },
  "responsibilities": [
    "Authentication system design",
    "Security middleware implementation",
    "Vulnerability assessment",
    "Compliance planning",
    "Security best practices"
  ],
  "security_requirements": {
    "password_hashing": "bcrypt_10_rounds",
    "rate_limiting": "tier_based",
    "api_security": "cors_csp_headers"
  }
}
```

---

## Collaboration Patterns

### Feature Development Workflow
```
1. Architecture Specialist → Designs feature architecture
2. Database Specialist → Designs data layer (if needed)
3. Security Specialist → Reviews security implications
4. Backend Specialist → Implements API endpoints
5. Frontend Specialist → Implements UI components
6. Testing Specialist → Creates comprehensive tests
7. DevOps Specialist → Prepares deployment (final phases)
```

### Daily Standup Structure (15 minutes)
```
Format: What/Plan/Blockers/Help
- Architecture: System design decisions
- Backend: API implementation progress
- Frontend: UI development status
- Database: Schema/optimization work
- Security: Security reviews/implementations
- Testing: Test coverage and results
- Others: Phase-specific progress
```

### Code Review Process
```
1. Developer Specialist → Creates pull request
2. Architecture Specialist → Reviews technical architecture
3. Security Specialist → Reviews security implications
4. Testing Specialist → Validates test coverage
5. Peer Specialist → Reviews code quality
6. All → Automated tests must pass
7. Merge → After all approvals
```

### Conflict Resolution Protocol
```
1. Technical Disagreement Identified
2. Architecture Specialist → Technical arbitration
3. Testing Specialist → Validation of both approaches
4. Performance/Security Impact Assessment
5. Documentation of final decision
6. Implementation with agreed approach
```

---

## Quality Gates & Checkpoints

### Sprint-Level Quality Gates

#### Week 1 Checkpoint: Architecture Foundation
- [ ] Database schemas documented and validated
- [ ] Security architecture approved
- [ ] Project structure follows standards
- [ ] Development environment setup complete

#### Week 2 Checkpoint: Authentication System
- [ ] All authentication endpoints implemented
- [ ] Security review passed
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests passing

#### Week 4 Checkpoint: MVP Release
- [ ] End-to-end user flows working
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation complete
- [ ] Staging environment deployed

#### Week 8 Checkpoint: Core Features
- [ ] Payment system functional
- [ ] Admin panel operational
- [ ] Analytics dashboard working
- [ ] Advanced redirect system active

#### Week 12 Checkpoint: Production Ready
- [ ] Performance optimized
- [ ] Production deployed
- [ ] Monitoring active
- [ ] Load testing passed

### Code Quality Requirements (Continuous)
```
Technical Standards:
- ESLint compliance (zero warnings)
- Prettier formatting enforced
- JSDoc comments for public APIs
- Git commit message standards

Testing Standards:
- Unit test coverage ≥ 80%
- Integration test coverage ≥ 70%
- E2E test coverage for critical paths
- Performance tests for all APIs

Security Standards:
- Security vulnerability scan passed
- Authentication/authorization tested
- Input validation implemented
- Rate limiting configured

Performance Standards:
- API response time < 500ms
- Page load time < 3 seconds
- Database query optimization
- Memory leak detection passed
```

---

## Testing & Deployment Workflows

### Automated Testing Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Run ESLint
        run: npm run lint
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Security audit
        run: npm audit
      - name: Upload coverage
        run: npm run coverage:upload
```

### Deployment Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Build Docker image
        run: docker build -t nfc-dashboard .
      - name: Deploy to staging
        run: ./scripts/deploy-staging.sh
      - name: Run smoke tests
        run: npm run test:smoke
      - name: Deploy to production
        if: success()
        run: ./scripts/deploy-production.sh
```

### Subagent Testing Responsibilities

#### Testing Specialist
- **Unit Tests**: Model validation, utility functions, middleware
- **Integration Tests**: API endpoints, database operations, third-party services
- **E2E Tests**: Complete user workflows, payment flows, redirect systems
- **Performance Tests**: Load testing, stress testing, benchmark validation

#### Backend Specialist
- **API Tests**: Request/response validation, error handling, edge cases
- **Service Tests**: Business logic validation, integration points
- **Mock Tests**: Third-party service mocking, error scenario testing

#### Frontend Specialist
- **UI Tests**: Component testing, user interaction testing
- **Browser Tests**: Cross-browser compatibility, responsive design
- **Accessibility Tests**: WCAG compliance, keyboard navigation

#### DevOps Specialist
- **Infrastructure Tests**: Container testing, deployment validation
- **Security Tests**: Vulnerability scanning, penetration testing
- **Monitoring Tests**: Alert configuration, logging validation

---

## Command Reference for Subagent Management

### Activation Commands

#### Single Subagent Activation
```bash
# Activate architecture specialist for system design
claude-code --agent=architecture --context="NFC card management system design" --focus="FSM patterns, API contracts, scalability"

# Activate backend specialist for API development
claude-code --agent=backend --context="Express.js REST APIs with MongoDB" --focus="authentication, card management, subscriptions"

# Activate frontend specialist for UI development
claude-code --agent=frontend --context="Handlebars templates with responsive design" --focus="user dashboard, mobile optimization"
```

#### Multi-Agent Collaboration
```bash
# Sprint 1: Foundation team
claude-code --agents=architecture,database,security --task="design authentication system and database schemas"

# Sprint 5: Payment integration team
claude-code --agents=api-integration,backend,security,testing --task="implement Stripe payment system"

# Sprint 12: Production deployment team
claude-code --agents=devops,all --task="production deployment and monitoring setup"
```

#### Phase-Specific Auto-Selection
```bash
# MVP phase agents
claude-code --phase=mvp --auto-select-agents --context="authentication, card activation, basic dashboard"

# Core features phase agents
claude-code --phase=core --auto-select-agents --context="payments, analytics, admin panel"

# Premium features phase agents
claude-code --phase=premium --auto-select-agents --context="geo-redirects, webhooks, optimization"
```

### Context Configuration Commands

#### Project-Specific Context
```bash
# Set global project context
claude-code --set-context project="NFC Card Management System" tech-stack="Node.js,Express,MongoDB,Handlebars" architecture="REST,FSM"

# Set sprint-specific context
claude-code --set-context sprint="5" focus="payment-integration" primary-agent="api-integration"

# Set feature-specific context
claude-code --set-context feature="subscription-system" requirements="stripe,webhook,trial-period" priority="high"
```

#### Specialist Configuration
```bash
# Configure backend specialist with integrations
claude-code --configure agent=backend integrations="stripe,sendgrid,twilio" auth="jwt" database="mongodb"

# Configure testing specialist with coverage requirements
claude-code --configure agent=testing framework="jest" coverage="80%" types="unit,integration,e2e"

# Configure security specialist with compliance requirements
claude-code --configure agent=security compliance="gdpr,pci" auth="jwt-refresh" hashing="bcrypt"
```

### Workflow Management Commands

#### Sprint Management
```bash
# Start new sprint with team selection
claude-code --sprint start --week=1 --agents=architecture,database,security --goal="foundation setup"

# Sprint checkpoint review
claude-code --sprint checkpoint --week=4 --validate="mvp-requirements" --agents=all-active

# Sprint retrospective
claude-code --sprint retrospective --week=8 --focus="core-features" --improvements="performance,testing"
```

#### Task Assignment
```bash
# Assign specific task to specialist
claude-code --assign task="implement user authentication API" agent=backend priority=high dependencies="security-review"

# Create collaborative task
claude-code --assign task="design payment system" agents=api-integration,backend,security collaboration=true

# Assign phase task
claude-code --assign task="MVP integration testing" phase=1 agents=testing,backend,frontend
```

---

## Success Metrics & Monitoring

### Development Velocity Metrics
```
Sprint Velocity:
- Story points completed per sprint
- Feature completion rate
- Code review turnaround time (target: < 24 hours)
- Bug resolution time (target: < 48 hours)

Quality Metrics:
- Test coverage maintenance (≥ 80%)
- Code quality scores (ESLint: zero warnings)
- Security vulnerability count (target: zero critical)
- Performance benchmark compliance
```

### Collaboration Effectiveness
```
Handoff Efficiency:
- Time between specialist handoffs (target: < 4 hours)
- Rework rate due to miscommunication (target: < 5%)
- Documentation completeness score
- Cross-specialist knowledge sharing frequency

Conflict Resolution:
- Technical disagreement resolution time (target: < 1 day)
- Architecture decision documentation rate
- Consensus achievement rate
```

### Subagent Performance Tracking
```
Specialist Productivity:
- Tasks completed per sprint per specialist
- Code contribution quality scores
- Review feedback incorporation rate
- Knowledge base contribution frequency

System Health:
- Automated test pass rate (target: ≥ 95%)
- Deployment success rate (target: 100%)
- Performance regression detection
- Security scan pass rate
```

---

## Maintenance & Evolution

### Monthly Subagent Reviews
```
Review Schedule:
- Week 4: MVP phase retrospective
- Week 8: Core features phase retrospective  
- Week 12: Full system retrospective
- Ongoing: Weekly mini-retrospectives per sprint

Review Areas:
- Specialist effectiveness assessment
- Technology stack updates
- Process optimization opportunities
- Tool and framework evolution
```

### Continuous Improvement Process
```
Knowledge Base Updates:
- New pattern documentation
- Lessons learned integration
- Best practices evolution
- Technology updates incorporation

Specialist Evolution:
- Capability assessments
- New technology integration
- Performance optimization
- Cross-training opportunities
```

---

This comprehensive sprint implementation plan provides the framework for successfully developing the NFC Card Management System using specialized Claude Code subagents. Each phase builds upon the previous foundation while introducing new complexity and capabilities, ensuring a robust and scalable final product.

The plan emphasizes clear communication, defined quality gates, and collaborative workflows that leverage each specialist's expertise while maintaining system coherence and architectural integrity throughout the 12-week development cycle.