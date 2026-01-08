# Home Staff 360 v1.0

## Overview
Home Staff 360 is a live, real-time household staff management platform designed for managing household staff and service businesses. Version 1.0 features full online collaboration with phone+password authentication, real-time messaging, and live data synchronization across all connected users.

It operates in two core modes:
- **Home User Mode**: For household managers to track domestic staff attendance, payments, expenses, and laundry batches with real-time collaboration.
- **Staff User Mode**: For service professionals to manage client homes, log attendance, track earnings, handle expenses, and create invoices.

The business vision is to provide a comprehensive, real-time solution for household and service staff management, enhancing efficiency and communication.

## User Preferences
- Simple language and clear explanations
- Iterative development with small, testable changes
- Ask before major architectural decisions
- Privacy and security remain priorities with live data

## System Architecture

### Live Real-Time Architecture
Home Staff 360 v1.0 is a fully live, cloud-connected application using a client-server architecture with real-time capabilities:
- **Client**: React with TanStack for UI and Socket.IO Client for live updates.
- **Server**: Express.js for REST APIs and Socket.IO Server for real-time events.
- **Database**: PostgreSQL as the primary data store.
- **Authentication**: JWT-based authentication with 30-day tokens.

### Authentication Flow
The system uses a phone+password authentication flow with OTP verification for phone ownership. Users can register or log in with their phone number and password. OTP is used for verification and password resets. Passwords require a minimum of 6 characters and are mandatory for all users.

### Session Persistence
- **Auto-Login**: JWT token stored in localStorage (`homestaff360_collab_token`) provides persistent auto-login until explicit logout
- **Profile Sync**: After login on a new device (reinstall), `syncProfileToLocalStorage()` fetches server profile and syncs to local storage
- **Returning Users**: If server shows `onboardingCompleted=true`, local settings are restored and onboarding is skipped
- **Permissions Required**: Device permissions (notifications, camera) still required on new device even for returning users
- **Logout Behavior**: Clears token but preserves phone number for quick re-login. User must re-enter password
- **Account Deletion**: `localStorage.clear()` wipes all data. Returning users are treated as completely fresh

### UI/UX Design
The UI is modern, inspired by Microsoft Fluent 2 and Samsung One UI, featuring "squircle" corners (24px radius) for a soft aesthetic. It supports both Light and Dark modes. The primary color is Google Blue (#0B57D0), and navigation is handled via a bottom navigation bar with 5 tabs.

### Feature Specifications
- **Multi-Language Support**: Supports 21 languages, including English, Hindi, Spanish, French, and more.
- **Multi-Currency Support**: Supports 27 currencies, including INR, USD, EUR, GBP, AUD, and CAD.
- **Real-Time Collaboration**: Includes a chat system with message edit/delete within a 5-minute window, real-time message delivery, and live events for attendance, laundry, and expense updates.
- **Auto-Connection System**: Automatically creates connection invites based on phone numbers, resolving pending links upon user registration.

### Subscription Model
- **Two Plan Options**: Monthly and Annual subscriptions available
- **Google Play Billing**: All subscriptions managed through Google Play services - prices are fetched dynamically from Play Store at runtime via queryProductDetailsAsync()
- **5-Tier Pricing System** (132 countries with local currency prices):
  - **Tier 1** (~$1/mo, ~$11/yr - 27 countries): India (90 INR), Bangladesh (120 BDT), Pakistan (300 PKR), Nepal, Sri Lanka, Vietnam, Nigeria, Kenya, Tanzania, Uganda, Rwanda, Senegal, Cambodia, Laos, Myanmar, Haiti, Nicaragua, Bolivia, Paraguay, Mozambique, Zambia, Zimbabwe, and West African CFA countries
  - **Tier 2** (~$1.8/mo, ~$20/yr - 26 countries): Indonesia (28,000 IDR), Philippines (100 PHP), Thailand (70 THB), Egypt, Morocco, Tunisia, Algeria, Armenia, Georgia, Ukraine, Moldova, Ghana, Cameroon, Angola, Honduras, Guatemala, El Salvador, Ecuador, Peru, Colombia, Uzbekistan, Kyrgyzstan, Tajikistan, Turkmenistan, Papua New Guinea, Cape Verde
  - **Tier 3** (~$2.5/mo, ~$27/yr - 27 countries): Brazil (13 BRL), Mexico (45 MXN), Argentina, Chile, Costa Rica, Panama, Dominican Republic, Turkey, Kazakhstan, Azerbaijan, Malaysia, South Africa, Romania, Bulgaria, Serbia, Bosnia & Herzegovina, North Macedonia, Albania, Namibia, Mauritius, Jamaica, Uruguay, Trinidad & Tobago, Gabon, Botswana, Belize, Macau
  - **Tier 4** (~$3/mo, ~$33/yr - 27 countries): US (3 USD), UK (2.50 GBP), Canada (4 CAD), Australia (4.50 AUD), New Zealand, Japan (450 JPY), South Korea (4,000 KRW), Israel, Taiwan, Spain, Italy, Portugal, Greece, Poland, Czechia, Slovakia, Slovenia, Croatia, Estonia, Latvia, Lithuania, Cyprus, Malta, Hungary, Aruba, Bahamas, Antigua & Barbuda
  - **Tier 5** (~$4/mo, ~$44/yr - 25 countries): Switzerland (4 CHF), Norway (45 NOK), Denmark (30 DKK), Sweden (45 SEK), Finland, Iceland, Luxembourg, Netherlands, Belgium, Germany, France, Austria, Ireland, Monaco, Liechtenstein, San Marino, Singapore (5.50 SGD), Hong Kong (32 HKD), UAE (15 AED), Qatar, Kuwait, Bahrain, Saudi Arabia, Oman, Gibraltar
- **Local Currency Pricing**: Each country has specific local currency prices stored in COUNTRY_PRICING (shared/schema.ts) with currency, monthly, and annual amounts
- **Hybrid Pricing Model**: Google Play is source of truth for mobile (localized prices via Billing Library), app stores local currency fallback values for web/testing
- **Subscription Endpoints**: /api/subscriptions/validate, /api/subscriptions/status, /api/subscriptions/check, /api/subscriptions/prices (returns tier, currency, fallback amounts)
- **Country Auto-Detection**: Country is auto-detected from Google Play Store and displayed as read-only Badge in settings (not editable by users)
- **Ad System**: Disabled (code preserved for future use via AD_FEATURE_ENABLED flag)

### Security Measures
- **Authentication**: Passwords are hashed with bcrypt (10 rounds), JWT tokens are used (30-day user, 8-hour admin), and OTPs expire in 10 minutes with a max of 5 attempts.
- **Rate Limiting**: IP-based rate limiting implemented for sensitive actions like OTP requests, authentication, and password resets. Socket.IO connections also have per-IP rate limiting (30 connections/minute).
- **Data Security**: All data is transmitted over HTTPS/TLS, server-side data is encrypted at rest, and the system is designed to be GDPR and DPDP Act compliant.
- **Transaction Safety**: 7 critical multi-table operations wrapped in database transactions for data integrity.
- **Standardized Error Handling**: Consistent API error responses with error codes (see ERROR_CODES in server/routes.ts).
- **Frontend Error Boundaries**: Global error boundary catches rendering errors with user-friendly recovery options.

### Testing (Development Only)
- **Test Bypass Header**: In non-production environments, the header `x-test-bypass: rate-limit-skip` can be used to bypass rate limiting for automated testing.
- **Total Automated Tests**: 151 tests across 3 test suites (module-tests.ts, e2e-scenario-tests.ts, extended-module-tests.ts).
- **Run Tests**: `npx tsx tests/e2e/module-tests.ts && npx tsx tests/e2e/e2e-scenario-tests.ts && npx tsx tests/e2e/extended-module-tests.ts`

## External Dependencies

- **Database**: PostgreSQL
- **SMS/OTP Service**: Twilio
- **Frontend Framework**: React 18 with TypeScript
- **Backend Framework**: Express.js with TypeScript
- **ORM**: Drizzle ORM
- **Real-time Communication**: Socket.IO (client and server)
- **UI Components**: Tailwind CSS, Shadcn/ui
- **Routing**: Wouter
- **Data Fetching**: TanStack Query v5
- **Animations**: Framer Motion
- **Icons**: Lucide React, React Icons
- **Mobile Packaging**: Capacitor (for Android)
- **CI/CD**: GitHub Actions

## UAT Testing Summary (January 2026)

### Testing Status
- **All 151 automated tests passing at 100%** (60 module + 43 e2e scenario + 48 extended module)
- **Authentication**: Registration, login, OTP verification, password reset - all working
- **Home Features**: Attendance, laundry, expenses, payments - all working
- **Staff Features**: Client management, attendance logging - working via localStorage
- **Collaboration**: Connection invites, messaging, shared spaces - all working
- **Admin Panel**: Authorization properly enforced (401 for unauthenticated)
- **Real-time**: Socket.IO events for attendance, laundry, expenses verified

### Bugs Fixed During UAT
1. **Onboarding data not persisting**: Fixed complete-onboarding endpoint to save displayName, userType, preferredLanguage
2. **Collaboration link creation failing**: Fixed NULL constraint issue with staff_account_id
3. **Auto-connect TypeScript errors**: Fixed schema mismatches (targetPhone, isResolved) and undefined personId

### Known Limitations (Non-Critical)
- Staff invoices/earnings use localStorage (no backend endpoints yet)
- Minor TypeScript warnings in test files (tests run correctly)
- google-libphonenumber types not installed (runtime works)

### Deployment Readiness
The application is **production-ready** for MVP deployment with:
- Core authentication and user management
- Real-time collaboration and messaging
- Home user and staff user feature sets
- Security measures (rate limiting, JWT, bcrypt)
- Error handling and recovery flows

## Production Deployment Guide

### Replit Deployment Options
1. **Autoscale Deployment** (Recommended): Ideal for this app with variable traffic, auto-scales based on demand
2. **Reserved VM Deployment**: For consistent performance with always-on WebSocket connections
3. **Static Deployment**: Not suitable (app has server-side logic)

### Pre-Deployment Checklist
- [ ] All 151 automated tests passing
- [ ] Rate limiting configured (OTP: 10/15min, Auth: 20/15min, Password Reset: 5/15min)
- [ ] Twilio credentials configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
- [ ] JWT_SECRET set for production
- [ ] ADMIN_DEFAULT_EMAIL and ADMIN_DEFAULT_PASSWORD configured
- [ ] Privacy Policy at docs/PRIVACY_POLICY.md (GDPR/DPDP compliant)
- [ ] PostgreSQL database connected via DATABASE_URL

### Required Environment Secrets
| Secret | Purpose |
|--------|---------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | JWT token signing |
| TWILIO_ACCOUNT_SID | SMS/OTP service |
| TWILIO_AUTH_TOKEN | SMS/OTP service |
| TWILIO_PHONE_NUMBER | SMS sender number |
| ADMIN_DEFAULT_EMAIL | Admin login |
| ADMIN_DEFAULT_PASSWORD | Admin login |

### Post-Deployment Notes
- Use Replit's built-in PostgreSQL for persistent data (filesystem is ephemeral on Autoscale/Reserved VM)
- Monitor Socket.IO connections for real-time feature health
- Subscription validation integrates with Google Play Billing