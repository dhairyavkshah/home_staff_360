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

### UI/UX Design
The UI is modern, inspired by Microsoft Fluent 2 and Samsung One UI, featuring "squircle" corners (24px radius) for a soft aesthetic. It supports both Light and Dark modes. The primary color is Google Blue (#0B57D0), and navigation is handled via a bottom navigation bar with 5 tabs.

### Feature Specifications
- **Multi-Language Support**: Supports 21 languages, including English, Hindi, Spanish, French, and more.
- **Multi-Currency Support**: Supports 27 currencies, including INR, USD, EUR, GBP, AUD, and CAD.
- **Real-Time Collaboration**: Includes a chat system with message edit/delete within a 5-minute window, real-time message delivery, and live events for attendance, laundry, and expense updates.
- **Auto-Connection System**: Automatically creates connection invites based on phone numbers, resolving pending links upon user registration.

### Subscription Model
- **Annual Subscription**: Users must subscribe to access the app
- **Google Play Billing**: All subscriptions managed through Google Play services
- **Pricing**: India: 300 INR/year, US: $30/year, other countries based on equivalent USD pricing
- **International Pricing**: Defined for 27 currencies in SUBSCRIPTION_PRICES constant
- **Subscription Endpoints**: /api/subscriptions/validate, /api/subscriptions/status, /api/subscriptions/check, /api/subscriptions/prices
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
- **Share households/businesses feature**: Disabled for MVP (code preserved in SharedSpacesTab.tsx for future use)

### Deployment Readiness
The application is ready for MVP deployment with:
- Core authentication and user management
- Real-time collaboration and messaging
- Home user and staff user feature sets
- Security measures (rate limiting, JWT, bcrypt)
- Error handling and recovery flows