# Bhakti Studio — Master Loop-Engineering Prompt

> **Purpose:** Build a production-ready business management web application for Bhakti Studio, covering customer orders, quotations, pricing, worker assignment, event execution, payments, notifications, inventory, and analytics.

---

## 0. LOOP ENGINEERING — MANDATORY DEVELOPMENT METHOD

You are a senior software architect, product designer, full-stack engineer, UI/UX designer, security engineer, QA engineer, and technical project manager.

Use **Loop Engineering** throughout the entire development process.

### LOOP

1. **UNDERSTAND**
   - Analyze the business requirements.
   - Identify actors.
   - Identify workflows.
   - Identify missing requirements.
   - Identify dependencies between features.
   - Identify security risks.
   - Identify edge cases.
   - Identify what should be configurable by Admin.

2. **ARCHITECT**
   - Design system architecture.
   - Design database schema.
   - Design API structure.
   - Design authentication/authorization.
   - Design frontend architecture.
   - Design business logic.
   - Design pricing engine.
   - Design notification architecture.
   - Design payment architecture.

3. **IMPLEMENT**
   - Build the smallest reliable feature set.
   - Keep modules loosely coupled.
   - Follow clean architecture principles.
   - Write maintainable and documented code.

4. **TEST**
   - Test happy paths.
   - Test invalid inputs.
   - Test authorization.
   - Test role isolation.
   - Test pricing calculations.
   - Test worker conflicts.
   - Test payment states.
   - Test event-date conflicts.
   - Test image uploads.
   - Test edge cases.

5. **REVIEW**
   - Review architecture.
   - Review UX.
   - Review security.
   - Review database normalization.
   - Review performance.
   - Review business logic.
   - Look for bugs and disconnected workflows.

6. **REFINE**
   - Fix identified issues.
   - Improve UX.
   - Improve validation.
   - Improve performance.
   - Improve code quality.

7. **REPEAT**

A feature is complete only when:

**UI → API → database → business logic → authorization → validation → error handling → notifications where necessary → audit/history → testing**

are connected and working.

---

# 1. PRODUCT VISION

Build a premium web application for **Bhakti Studio**, a professional studio/event-production and rental LED-wall business.

The application should function as a complete:

- Order Management System
- Quotation System
- Service & Equipment Catalog
- Pricing Engine
- Worker Management System
- Worker Assignment System
- Event Execution System
- Payment System
- Customer Management System
- Inventory/Availability System
- Notification System
- Analytics Dashboard

The complete workflow should be:

**Customer → Requirements → Estimated Quotation → Admin Review → Final Quotation → Worker Assignment → Worker Acceptance → Event Execution → Photos → Completion → Payment → Invoice → History/Analytics**

Do not build isolated CRUD features. Connect the entire business workflow.

---

# 2. USER ROLES

Create three completely separated role-based experiences:

1. **ADMIN**
2. **CUSTOMER**
3. **WORKER**

Use strict **Role-Based Access Control (RBAC)**.

## ADMIN

Admin has full business control:

- Manage users
- Manage workers
- Manage services
- Manage equipment
- Manage pricing
- Manage pricing formulas
- Manage orders
- Approve quotations
- Modify quotations
- Assign workers
- Monitor worker availability
- Manage payments
- Manage inventory/service availability
- View analytics
- View reports
- View audit logs
- Configure business settings

## CUSTOMER

Customer can:

- Google login
- Create order
- View available services
- Configure requirements
- View estimated quotation
- Submit order
- Choose payment method
- Make online payment if enabled
- View order status
- View event details
- View payment history
- Download invoice/receipt
- View previous orders

## WORKER

Worker can:

- Google login
- View worker profile
- View assigned orders
- Accept assignment
- Reject assignment with reason
- View upcoming work
- View event date/time/location
- View customer/order requirements
- Upload before-event/site photos
- Upload after-setup photos
- Update execution status
- Mark assigned tasks complete
- Report issues
- View work history

---

# 3. AUTHENTICATION

Use **Google OAuth**.

Important:

Google login does not automatically mean every Google account gets every role.

Implement secure role assignment.

### Customer

Google login → account created/recognized as CUSTOMER.

### Worker

Google login → account must be registered/approved by Admin as WORKER.

### Admin

Google login → Admin access only for explicitly authorized Admin accounts.

Never allow users to select "Admin" during registration.

Never trust role information coming from frontend.

Authorization must be enforced server-side.

Protect against:

- Privilege escalation
- Session hijacking
- CSRF where applicable
- XSS
- SQL injection
- Insecure direct object references
- Broken access control
- Mass assignment
- Unauthorized API access

Use environment variables for:

- OAuth credentials
- Database credentials
- Payment credentials
- WhatsApp API credentials
- JWT/session secrets
- Cloud-storage credentials

Never hardcode secrets.

---

# 4. PREMIUM APPLICATION LAUNCH EXPERIENCE

Whenever any user opens the application:

Show a premium animated launch/splash sequence.

Suggested flow:

**Background → Bhakti Studio logo → subtle logo animation → "Bhakti Studio" → short tagline → smooth transition to login**

Animation should feel:

- Premium
- Minimal
- Professional
- Cinematic
- Fast

Do not make it childish or overloaded.

Respect `prefers-reduced-motion` for accessibility.

---

# 5. LOGIN EXPERIENCE

Create a premium login gateway.

The login interface should visually communicate:

- Customer Login
- Worker Login
- Admin Login

Possible UI:

**Continue as**

- Customer
- Worker
- Admin

Then:

**Continue with Google**

Important:

The selected role should only determine the intended login flow.

Backend must verify the user's actual authorized role.

If an unauthorized user attempts Admin/Worker login, show a professional access-denied message.

Do not expose sensitive security information.

---

# 6. DESIGN SYSTEM

The application must support:

- Light Mode
- Dark Mode

Use a centralized design-token system.

Before finalizing the color palette:

**Search/reference Color Hunt palettes.**

Select 3–5 premium palettes satisfying:

- Premium
- Classic
- Minimal
- Professional
- Suitable for event production/studio business
- Excellent contrast
- Elegant in light mode
- Elegant in dark mode

### Important

Do **not** automatically choose one palette.

First show me the proposed palettes and ask:

> "Which palette should we use?"

Only continue after my confirmation.

The design should feel like a premium modern SaaS platform, not a generic college project.

Use where appropriate:

- Subtle gradients
- Refined shadows
- Generous spacing
- Strong typography hierarchy
- Micro-interactions
- Premium cards
- Clean tables
- Excellent empty states
- Skeleton loaders
- Meaningful animations
- Glassmorphism only where appropriate

Do not overuse animations.

---

# 7. CUSTOMER ORDER CREATION

Customer should be able to create an order.

## Customer Details

- Customer name
- Phone number
- Email
- Customer address

## Event Details

- Event date
- Event start time
- Event end time
- Event location
- Event/site address
- Event type
- Expected audience/guest count if useful
- Additional notes

## Service Requirements

Customer should be able to select required services.

Initial possible services:

- LED Wall
- Video Cameras
- Sound System
- YouTube Live / Live Streaming
- Photography
- Videography
- Stage Lighting
- Stage / Truss
- Projector / Display
- Microphones
- Mixer
- Control Room / Video Switching
- Power / Generator Requirement
- Technicians
- Transportation
- Setup / Installation
- Dismantling
- Other Custom Requirement

Do **not** assume Bhakti Studio owns all of these.

Admin must control:

- Available
- Unavailable

Customer should see only services enabled by Admin.

---

# 8. SERVICE / EQUIPMENT CATALOG

Create a powerful Admin-controlled catalog.

Each service/equipment item should support:

- ID
- Name
- Category
- Description
- Images
- Active/inactive
- Available/unavailable
- Rental/service type
- Unit
- Base price
- Pricing model
- Minimum quantity
- Maximum quantity
- Availability
- Setup charge
- Transportation charge
- Technician charge
- Security deposit if applicable
- Tax configuration
- Notes

Examples:

- LED Wall
- Camera
- Speaker
- Microphone
- Mixer
- Streaming setup
- Lighting
- Technician
- Transport

Admin controls everything.

---

# 9. LED WALL PRICING ENGINE

This is a critical feature.

Never hardcode prices into the frontend.

**Admin is the only authority for pricing.**

Example:

Admin may configure:

- LED Wall 12 × 8 ft = ₹X
- LED Wall 10 × 8 ft = ₹Y
- LED Wall 16 × 10 ft = ₹Z

For dimensions not explicitly configured, the system may calculate an estimate using an Admin-defined mathematical rule.

Possible rules:

### Area-based

`Area = width × height`

`Price = Area × Admin-defined rate`

### Tier/interpolation-based

Calculate based on configured size tiers.

But:

**DO NOT invent the business's pricing model.**

Create a flexible Pricing Engine supporting:

- Fixed pricing
- Per-square-foot pricing
- Per-unit pricing
- Quantity pricing
- Size-based pricing
- Tiered pricing
- Setup charge
- Transport charge
- Technician charge
- Custom formula

Example configurable values:

- LED base rate: ₹___ / sq ft
- Setup: ₹___
- Transport: ₹___ / km
- Technician: ₹___ / hour
- Minimum rental: ₹___

Admin must be able to change these without modifying source code.

Customer sees:

**Estimated Price**

Admin controls:

**Final Approved Price**

Customer must never be able to manipulate the final price.

---

# 10. QUOTATION SYSTEM

Separate:

**Estimated Quotation**

from:

**Admin-Approved Final Quotation**

Customer creates requirements.

System calculates:

- Subtotal
- Setup
- Transportation
- Technician
- Taxes
- Discounts
- Estimated total

Admin reviews.

Admin can modify:

- Quantity
- Pricing
- Discount
- Additional charges
- Tax
- Special charges
- Custom items

Then:

**Admin approves quotation.**

Quotation statuses:

- Pending
- Under Review
- Approved
- Rejected
- Expired

Implement quotation versioning.

Example:

Quotation V1 → ₹80,000

Admin changes requirements:

Quotation V2 → ₹92,000

Keep complete history.

---

# 11. ORDER STATUS STATE MACHINE

Do not implement order status as arbitrary strings.

Create a controlled state machine.

Possible lifecycle:

```text
DRAFT
↓
SUBMITTED
↓
UNDER_REVIEW
↓
QUOTATION_SENT
↓
AWAITING_CUSTOMER_CONFIRMATION
↓
CONFIRMED
↓
PAYMENT_PENDING
↓
PARTIALLY_PAID
↓
PAID
↓
WORKERS_PENDING
↓
WORKERS_ASSIGNED
↓
EVENT_UPCOMING
↓
SETUP_IN_PROGRESS
↓
EVENT_IN_PROGRESS
↓
SETUP_COMPLETED
↓
EVENT_COMPLETED
↓
FINAL_PAYMENT_PENDING
↓
COMPLETED
↓
CLOSED
```

Also support:

- CANCELLED
- REJECTED
- REFUND_PENDING
- REFUNDED

Not every order must pass every state.

Define valid state transitions.

---

# 12. WORKER MANAGEMENT

Admin can create/manage worker profiles.

Worker profile:

- Name
- Profile picture
- Phone
- Email
- Skills
- Specialization
- Experience
- Active/inactive
- Availability
- Assigned orders
- Upcoming events
- Completed jobs
- Rejected assignments
- Performance metrics

Possible specializations:

- LED Technician
- Camera Operator
- Sound Engineer
- Live Streaming Operator
- Lighting Technician
- General Technician

---

# 13. WORKER AVAILABILITY

Worker should have:

- AVAILABLE
- UNAVAILABLE
- ON LEAVE
- BUSY

Admin should see a calendar.

Example:

Worker A:

- August 15: 10 AM–8 PM → BUSY
- August 16 → AVAILABLE
- August 17 → ON LEAVE

When assigning an order, system should check:

- Date
- Time
- Existing assignments
- Leave
- Availability
- Skill requirement

Warn Admin if there is a conflict.

Future architecture should support automatic worker assignment.

Potential assignment score:

`availability + skill match + distance + workload + experience`

---

# 14. WORKER ASSIGNMENT

Admin can manually assign workers.

Example:

Order #BS-2026-00124 requires:

- 2 LED technicians
- 1 Camera Operator
- 1 Sound Engineer
- 1 Streaming Operator

Admin selects workers.

System validates availability.

After assignment:

Worker receives notification.

---

# 15. WHATSAPP NOTIFICATIONS

Design notification architecture so WhatsApp can be integrated.

Do not hardcode one provider throughout the codebase.

Create:

```text
NotificationService
    ├── WhatsAppProvider
    ├── EmailProvider
    └── InAppProvider
```

When worker is assigned:

WhatsApp message contains:

- Event date
- Event time
- Location
- Required role
- Order ID
- Secure accept/reject link

The link must not blindly perform the action.

Use secure tokenized confirmation.

Worker should authenticate or use a secure expiring action token.

If worker rejects:

- Require rejection reason
- Notify Admin
- Suggest replacement workers if possible

---

# 16. WORKER ACCEPT / REJECT FLOW

Assignment:

`PENDING`

↓

Worker receives notification

↓

**ACCEPT / REJECT**

If accepted:

`ASSIGNED → ACCEPTED`

If rejected:

`ASSIGNED → REJECTED`

Admin receives notification.

If rejected, system should suggest other available workers.

Future enhancement:

Worker assignment recommendation engine.

---

# 17. EVENT EXECUTION

For each order create an **Event Execution Workspace**.

Worker sees:

- Customer
- Event
- Location
- Timing
- Services
- Equipment
- Team members
- Special instructions
- Contact information

## Before Event

Worker uploads:

**BEFORE SETUP PHOTOS**

## After Setup

Worker uploads:

**AFTER SETUP PHOTOS**

Photos should store:

- Timestamp
- Uploader
- Order ID
- Optional GPS metadata if appropriate
- Upload time

Store files securely.

Do not store huge files directly in PostgreSQL.

Use object/cloud storage.

---

# 18. ORDER COMPLETION

Authorized Admin/Worker can update:

- Setup status
- Event status
- Completion status

Possible statuses:

- NOT_STARTED
- SETUP_STARTED
- SETUP_COMPLETED
- EVENT_RUNNING
- EVENT_COMPLETED
- DISMANTLING
- DISMANTLING_COMPLETED
- ORDER_COMPLETED

Require appropriate permissions for each transition.

---

# 19. PAYMENT SYSTEM

Customer has two options:

### Option 1

**PAY ONLINE**

### Option 2

**PAY AT EVENT LOCATION**

Admin controls whether each option is enabled.

Online payment should use an India-compatible payment gateway architecture.

Create:

```text
PaymentService
    ↓
Payment Gateway
```

Do not spread provider-specific code throughout the application.

Support:

- Pending
- Initiated
- Successful
- Failed
- Cancelled
- Refunded
- Partially Paid

Never mark payment successful only because frontend says so.

Verify server-side using:

- Gateway verification
- Webhook/signature verification
- Transaction ID

---

# 20. PAYMENT STRUCTURE

Support:

- Advance payment
- Remaining payment
- Full payment
- On-site payment

Example:

Final quotation = ₹1,00,000

Advance = ₹30,000

Remaining = ₹70,000

Status:

`PARTIALLY_PAID`

After final payment:

`PAID`

Maintain complete payment history.

---

# 21. INVOICE / RECEIPT

After successful payment, generate a professional invoice/receipt.

Include:

- Bhakti Studio
- Customer details
- Event details
- Order ID
- Services
- Quantities
- Pricing
- Discount
- Taxes
- Total
- Paid
- Remaining
- Payment method

Provide downloadable PDF.

---

# 22. ADMIN DASHBOARD

Admin dashboard is the command center.

Display:

- Today's events
- Upcoming events
- Pending orders
- Pending quotations
- Pending worker assignments
- Payment pending
- Revenue
- Upcoming workload
- Worker availability
- Equipment utilization
- Recent orders
- Recent payments
- Cancelled orders
- Alerts

Analytics:

- Revenue this month
- Orders this month
- Completed events
- Pending payments
- Most rented equipment
- Most requested services

---

# 23. ORDER MANAGEMENT

Admin can:

- Create
- View
- Edit
- Approve
- Reject
- Cancel
- Assign
- Reassign
- Update status
- Modify quotation
- Track payment
- View images
- View worker activity
- Download invoice
- View audit history

Professional order detail page:

```text
Order #BS-000124

Customer
Event
Requirements
Quotation
Workers
Timeline
Payments
Documents
Before Photos
After Photos
Activity Log
```

---

# 24. AUDIT LOG

Track:

- Who changed what
- When
- Old value
- New value
- IP/device metadata where appropriate

Examples:

`Admin changed quotation: ₹80,000 → ₹92,000`

`Worker accepted assignment`

`Customer submitted order`

`Payment received`

`Order status changed`

Ordinary users cannot delete audit logs.

---

# 25. DATABASE DESIGN

Use a normalized PostgreSQL database.

Potential entities:

- users
- roles
- customers
- workers
- worker_skills
- worker_availability
- worker_leaves
- services
- equipment
- equipment_categories
- pricing_rules
- pricing_versions
- orders
- order_items
- quotations
- quotation_versions
- order_workers
- worker_assignments
- payments
- payment_transactions
- notifications
- notification_templates
- event_photos
- documents
- invoices
- audit_logs
- addresses
- business_settings

Do not blindly create all tables.

Analyze relationships first.

Create:

- ER diagram
- Relationship explanation
- Primary keys
- Foreign keys
- Indexes
- Constraints
- Unique constraints
- Cascading strategy

Prevent orphan records.

---

# 26. TECH STACK

Use a stack aligned with my current knowledge.

## Frontend

- React.js
- HTML
- CSS
- JavaScript ES6+
- Bootstrap where useful

## Backend

- Node.js
- Express.js

## Database

- PostgreSQL

## Authentication

- Google OAuth
- Secure session/JWT architecture

## ORM

Choose Prisma or another suitable PostgreSQL ORM if beneficial.

## Validation

Use a robust schema-validation library.

## File Uploads

Use secure multipart upload + cloud/object storage.

## Payments

Use an India-compatible gateway architecture.

## Notifications

- WhatsApp API abstraction
- Email
- In-app notifications

Do not introduce unnecessary technologies.

---

# 27. FRONTEND ARCHITECTURE

Use component-based architecture.

Suggested:

```text
components/
pages/
layouts/
hooks/
services/
api/
context/
utils/
types/
assets/
```

Separate layouts:

- AdminLayout
- CustomerLayout
- WorkerLayout

Protected routes:

- AdminRoute
- WorkerRoute
- CustomerRoute

Do not rely only on frontend route protection.

Backend must enforce authorization.

---

# 28. API DESIGN

Use RESTful APIs unless there is a strong reason otherwise.

Examples:

```text
/api/auth
/api/users
/api/customers
/api/workers
/api/services
/api/equipment
/api/pricing
/api/orders
/api/quotations
/api/assignments
/api/payments
/api/notifications
/api/uploads
/api/reports
/api/admin
```

Use:

- Correct HTTP methods
- Correct status codes
- Validation
- Authentication middleware
- Authorization middleware
- Error handling
- Pagination
- Filtering
- Sorting

Do not return sensitive fields.

---

# 29. SECURITY

Treat this as a real production application.

Implement:

- RBAC
- Input validation
- Rate limiting
- Secure headers
- CORS configuration
- Secure cookies
- OAuth state validation
- CSRF protection where applicable
- SQL injection prevention
- XSS prevention
- File type validation
- File size limits
- Secure file names
- Authorization checks
- Server-side price validation
- Payment webhook verification
- Audit logging

Never expose:

- Database credentials
- OAuth secrets
- Payment secrets
- API keys

in frontend code.

---

# 30. FILE STORAGE

Photos, documents, and invoices should not normally be stored as large blobs inside PostgreSQL.

Use object storage.

Database stores:

- File ID
- Order ID
- Uploader
- Type
- Storage key
- Metadata
- Created timestamp

Use signed URLs for private files.

---

# 31. CUSTOMER EXPERIENCE

Customer dashboard:

```text
Welcome, [Name]

Upcoming Event
Current Order Status
Payment Status
Quotation
Recent Orders
```

Order creation should be a guided wizard:

### STEP 1
Event Details

### STEP 2
Select Services

### STEP 3
Configure Requirements

### STEP 4
Estimated Price

### STEP 5
Review

### STEP 6
Payment Preference

### STEP 7
Submit Order

Do not create one huge form.

---

# 32. SMART PRICING UX

When customer changes:

- LED width
- LED height
- Quantity
- Camera count
- Sound system size
- Hours
- Streaming duration

show real-time estimated pricing.

Example:

```text
LED Wall

Width: 12 ft
Height: 8 ft

Area: 96 sq ft

Estimated rental: ₹XX,XXX
```

Clearly display:

> Final pricing is subject to Admin confirmation.

---

# 33. ML / INTELLIGENT FEATURES

Do not force ML everywhere.

Only use ML where it provides actual business value.

Potential future features:

## 1. Worker Assignment Recommendation

Inputs:

- Worker availability
- Skills
- Distance
- Workload
- Event requirements

Output:

Recommended workers

## 2. Demand Forecasting

Predict which services are likely to be requested during specific dates/seasons.

## 3. Revenue Forecasting

Predict future revenue from historical orders.

## 4. Equipment Demand Prediction

Predict future equipment requirements.

## 5. Smart Quotation Anomaly Detection

If Admin enters an unusually high/low price compared with historical data:

> "Price differs significantly from historical average."

## 6. Customer Requirement Recommendation

Example:

Customer selects large LED wall.

System can suggest:

- Additional technicians
- Sound system
- Backup power
- Live streaming
- Camera coverage

ML remains optional.

The core application must work without ML.

---

# 34. BUSINESS INTELLIGENCE

Admin analytics:

- Revenue
- Orders
- Average order value
- Most popular services
- Most profitable services
- Worker utilization
- Cancellation rate
- Payment collection
- Outstanding payments
- Monthly revenue
- Yearly revenue
- Equipment utilization

Use charts carefully.

---

# 35. SEARCH / FILTERING

Admin can search orders by:

- Order ID
- Customer name
- Phone
- Event date
- Location
- Worker
- Status
- Payment status

Filters:

- Date range
- Status
- Payment
- Service
- Worker

---

# 36. NOTIFICATION CENTER

Centralized notifications.

## Admin

- New order received
- Worker rejected assignment
- Payment received
- Payment failed
- Upcoming event
- Quotation awaiting approval

## Worker

- New assignment
- Assignment accepted
- Assignment rejected
- Event reminder
- Order updated

## Customer

- Order submitted
- Quotation approved
- Payment received
- Order confirmed
- Event reminder
- Order completed

---

# 37. EVENT REMINDERS

Create reminder architecture.

Examples:

- 7 days before event
- 1 day before event
- 2 hours before event

Do not hardcode timing.

Admin should eventually be able to configure reminder timing.

---

# 38. CONFLICT DETECTION

Critical business logic.

Prevent:

- Same worker assigned to overlapping events.

Warn about:

- Same equipment allocated to overlapping events.
- Insufficient equipment quantity.

Example:

Bhakti Studio has:

`LED 12×8 → 2 units`

Order A:

`1 unit`

Order B:

`2 units`

System detects:

`Requested = 3`

`Available = 2`

Show:

> Insufficient inventory for this date.

Admin can override if necessary, but the override must be logged.

---

# 58. QR CODE SYSTEM

Introduce a secure QR-code system only where it provides genuine operational value.

Do NOT add decorative or unnecessary QR codes.

## A. ORDER QR CODE

Every confirmed order should have a unique QR code.

The QR should resolve to a secure order-specific route such as:

`/orders/{orderId}/quick-access`

Possible uses:

- Admin scans to open the order
- Worker scans at the event site to access assigned event information
- Quick access to event execution workspace
- View setup checklist
- Upload before/after photos
- Update permitted execution status

Important:

The QR must NOT expose sensitive customer information to an unauthenticated person.

Use a secure, short-lived or permission-aware token where appropriate.

The backend must still enforce RBAC.

A QR scan must never bypass authorization.

## B. EQUIPMENT / ASSET QR CODE

For physical equipment that is worth individually tracking, generate a unique QR code.

Example:

`LED-PANEL-001`
`CAMERA-007`
`SPEAKER-014`

Scanning an equipment QR can show an authorized user:

- Equipment name
- Asset ID
- Category
- Current status
- Condition
- Maintenance status
- Current/next booking
- Assigned order
- Last maintenance date
- Notes

Possible equipment lifecycle:

`AVAILABLE → RESERVED → DISPATCHED → IN_USE → RETURNED → MAINTENANCE`

When equipment is scanned during dispatch/return, create an audit event.

This can later become the foundation for:

- Inventory tracking
- Equipment check-in/check-out
- Damage reporting
- Maintenance tracking
- QR-based asset verification

## C. INVOICE / PAYMENT QR

Where useful, provide a QR on invoices/payment screens.

For online payments, use the selected payment gateway's supported payment mechanism.

If UPI is implemented, generate a proper UPI/payment QR only from validated payment data.

Never trust payment confirmation from the QR scan itself.

Payment must still be verified server-side.

## D. WORKER / EVENT CHECK-IN QR

For event execution, optionally provide an event check-in QR.

Worker scans the event QR to:

- Check in
- Confirm arrival
- Start assigned work
- View event instructions

Record:

- Worker
- Order
- Timestamp
- Check-in/check-out status

If location verification is implemented later, treat it as an optional enhancement and respect privacy requirements.

## E. QR SECURITY

QR codes are NOT authentication by themselves.

Never encode:

- Passwords
- Database IDs alone where sensitive access is involved
- API keys
- Payment secrets
- Long-lived authorization tokens

Prefer:

- Signed tokens
- Expiring tokens
- Permission-aware routes
- Server-side validation
- Revocation where appropriate

If an order is cancelled or a worker loses access, previously issued sensitive QR access must stop working where applicable.

## F. ADMIN QR MANAGEMENT

Admin should be able to:

- Generate QR
- Regenerate QR
- Revoke QR
- Download/print QR
- View QR status
- See QR scan history where appropriate

QR scan history can record:

- QR type
- Order/equipment/asset
- User
- Timestamp
- Action performed
- Result

Do not collect unnecessary personal/device data.

# 39. INVENTORY / EQUIPMENT MANAGEMENT

Admin can manage:

- Equipment
- Quantity
- Availability
- Maintenance
- Condition
- Currently rented
- Reserved
- Available
- Damaged
- Under maintenance

Distinguish where necessary between:

**Equipment Type**

and

**Physical Equipment Unit**

Example:

`LED Panel Type A → 100 panels`

Individual physical units may later have:

- Asset ID
- QR/barcode
- Condition
- Maintenance history

---

# 58. RESPONSIVE DESIGN

Application must work on:

- Desktop
- Laptop
- Tablet
- Mobile

Admin dashboard can prioritize desktop.

Worker interface should be strongly mobile-friendly because workers may use phones at event sites.

---

# 58. UX DETAILS

Implement:

- Loading states
- Empty states
- Error states
- Success states
- Confirmation dialogs
- Toast notifications
- Skeleton loaders
- Form validation
- Autosave where useful
- Breadcrumbs
- Search
- Filters
- Pagination

Never leave users wondering:

> "Did my order submit?"

Always show clear status.

---

# 58. PERFORMANCE

Optimize:

- Database indexes
- API queries
- Pagination
- Image loading
- Lazy loading
- React rendering
- Caching where useful
- Compression
- File uploads

Do not load thousands of orders at once.

---

# 58. ADMIN BUSINESS SETTINGS

Create a Settings section.

Admin controls:

- Business name
- Logo
- Contact information
- Tax settings
- Payment settings
- Notification settings
- WhatsApp settings
- Pricing settings
- Service availability
- Order rules
- Cancellation policy
- Reminder timing
- Theme configuration

---

# 58. FUTURE-PROOF ARCHITECTURE

Design architecture so future features can be added without rewriting the application.

Possible future features:

- Mobile app
- Automatic worker assignment
- Advanced ML
- Customer loyalty
- Coupons
- CRM
- Inventory barcode/QR
- GPS
- Route optimization
- Multiple studio branches
- Multi-tenant architecture
- WhatsApp chatbot
- AI customer support
- AI quotation assistant

Do not implement unnecessary future features now.

Design extension points instead.

---

# 58. ERROR HANDLING

Create centralized backend error handling.

Use structured error responses.

Frontend should convert errors into human-readable messages.

Never expose stack traces in production.

---

# 58. SEED DATA

Create realistic development seed data.

Example Admin:

`admin@bhaktistudio.com`

Workers:

- LED Technician
- Camera Operator
- Sound Engineer
- Streaming Operator

Services:

- LED Wall
- Camera
- Sound
- Live Streaming
- Lighting
- Technician
- Transport

Create realistic sample orders.

Do not use production secrets.

---

# 58. DOCUMENTATION

Generate:

- README
- Setup instructions
- Environment variables documentation
- Database setup
- Migration instructions
- Seed instructions
- Google OAuth setup
- Payment integration setup
- WhatsApp integration setup
- Cloud storage setup
- Deployment instructions
- API documentation
- Architecture explanation

Also explain **why** each major architectural decision was made.

---

# 58. DEPLOYMENT

Prepare architecture for production deployment.

Frontend and backend can be deployed separately if appropriate.

Database:

**PostgreSQL**

Use environment-specific configuration:

- Development
- Staging
- Production

Never put secrets into Git.

Create:

`.env.example`

---

# 58. IMPORTANT BUSINESS RULE

The **ADMIN is the final authority**.

Admin controls:

- Services
- Equipment
- Availability
- Pricing
- Pricing formulas
- Discounts
- Taxes
- Quotations
- Final prices
- Worker accounts
- Worker assignments
- Payments
- Order statuses
- Business settings

Customer can:

**REQUEST**

Admin can:

**APPROVE / MODIFY / REJECT**

Worker can:

**EXECUTE / UPDATE ASSIGNED WORK**

This distinction must be enforced technically.

---

# 58. DO NOT OVERENGINEER

The initial version should remain manageable.

## MVP

Prioritize:

- Authentication
- Role management
- Customer orders
- Service selection
- Pricing engine
- Quotation
- Admin approval
- Worker management
- Worker assignment
- Worker accept/reject
- Order tracking
- Photos
- Payment status
- Online payment architecture
- Notifications
- Admin dashboard
- Customer dashboard
- Worker dashboard
- Audit logs

## PHASE 2

- Inventory
- Advanced worker scheduling
- WhatsApp automation
- Analytics
- ML recommendations

## PHASE 3

- AI features
- Demand forecasting
- Automatic assignment
- Advanced business intelligence

---

# 58. DEVELOPMENT PHASES

### PHASE 0
Requirement analysis

### PHASE 1
System architecture + ER diagram

### PHASE 2
Authentication + RBAC

### PHASE 3
Admin service/equipment/pricing management

### PHASE 4
Customer order wizard

### PHASE 5
Pricing + quotation engine

### PHASE 6
Worker management + availability

### PHASE 7
Worker assignment

### PHASE 8
Order execution + photos

### PHASE 9
Payments

### PHASE 10
Notifications

### PHASE 11
Analytics

### PHASE 12
Security hardening

### PHASE 13
Testing

### PHASE 14
Deployment

---

# 58. BEFORE CODING

Do **not** write the full application immediately.

First produce:

1. Requirement analysis
2. Actors and permissions matrix
3. Complete user journeys
4. System architecture
5. Database ER diagram
6. Database tables
7. API architecture
8. Pricing engine design
9. Order state machine
10. Worker assignment architecture
11. Payment architecture
12. Notification architecture
13. Security architecture
14. Folder structure
15. Development phases
16. MVP vs Phase 2 vs Phase 3
17. Potential edge cases
18. Potential contradictions/missing requirements

Then ask me for confirmation.

---

# 58. LOOP CHECKPOINT

At the end of every major phase, provide:

### DONE
What was implemented.

### DECISIONS
What architectural decisions were made.

### RISKS
What could go wrong.

### TESTS
What was tested.

### NEXT
What should be built next.

### BLOCKERS
What information is still required from me.

Do not silently assume important business rules.

If a decision affects:

- Money
- Security
- Permissions
- Inventory
- Customer data

ASK FOR CONFIRMATION.

---

# 58. BUSINESS OWNER QUESTIONS

Before implementing the pricing engine, ask me for:

- LED sizes
- LED prices
- Camera types/prices
- Sound system types/prices
- Streaming packages/prices
- Lighting/prices
- Technician charges
- Transportation charges
- Setup charges
- Taxes
- Discount rules
- Advance payment percentage
- Cancellation policy
- Available equipment quantity
- Worker categories

If I provide only a few pricing examples:

**DO NOT invent business prices.**

Instead create an Admin-configurable pricing system.

---

# 58. FINAL PRODUCT QUALITY

The finished product should feel like:

**Premium SaaS Platform  
+ Event Management System  
+ Rental Management System  
+ CRM  
+ Quotation System  
+ Worker Management System**

It should NOT feel like:

- A college CRUD project
- A generic template dashboard
- A simple Bootstrap admin panel
- A collection of disconnected pages

Visual quality target:

- Premium
- Minimal
- Classic
- Professional
- Fast
- Clean
- Trustworthy

---

# 58. FINAL INSTRUCTION

Think like:

**Senior Software Architect  
+ Product Manager  
+ UX Designer  
+ Backend Engineer  
+ Frontend Engineer  
+ Database Engineer  
+ Security Engineer  
+ QA Engineer  
+ DevOps Engineer**

Whenever two apparently separate requirements should actually be connected, connect them.

For example:

```text
Order
  ↓
Event Date
  ↓
Required Services
  ↓
Equipment Availability
  ↓
Worker Skills
  ↓
Worker Availability
  ↓
Assignment
  ↓
WhatsApp Notification
  ↓
Worker Acceptance
  ↓
Event Execution
  ↓
Before Photos
  ↓
Setup
  ↓
After Photos
  ↓
Completion
  ↓
Payment
  ↓
Invoice
  ↓
Analytics
```

Do not build isolated features.

Build a connected business workflow.

The application should have a clear source of truth for every piece of business data.

Do not duplicate business logic between frontend and backend.

**Backend is authoritative.**

**Prices are authoritative from Admin configuration.**

**Permissions are authoritative from backend RBAC.**

**Payment status is authoritative from verified payment records.**

**Order status follows a controlled state machine.**

---

# 58. START NOW

## LOOP 1 — UNDERSTAND

Do **NOT** generate code yet.

Analyze the complete requirements.

Tell me:

- What you understood
- What you think the product should become
- Actors
- Core workflows
- Missing requirements
- Risks
- Suggested features
- Recommended architecture
- MVP scope

Then wait for my confirmation before proceeding to architecture.
