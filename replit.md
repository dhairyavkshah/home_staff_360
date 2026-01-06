# Home Staff 360

## Overview
Home Staff 360 is a **100% free, offline-first mobile/web application** designed for managing household staff and service businesses. It offers dual modes: "Home User Mode" for tracking domestic staff attendance, payments, and expenses, and "Staff User Mode" for service professionals to manage clients, jobs, and earnings. The application emphasizes privacy by storing all user data locally, supports multi-currency and multi-language, and is entirely free and ad-free, sustained by optional donations. The project envisions evolving into a connected, collaborative platform while retaining its core privacy-first and offline-first principles.

## User Preferences
I prefer simple language and clear explanations. I want iterative development, with small, testable changes. Please ask before making any major architectural decisions or large-scale code changes. I value privacy and offline-first capabilities.

## System Architecture

### UI/UX Design
The application features a modern UI inspired by Samsung One UI and Material 3, utilizing "Squircle" corners (24px radius) for a soft aesthetic. It supports both Light and Dark modes, with Google Blue (#0B57D0) as the primary color. Navigation is handled via a bottom bar with 5 tabs.

### Technical Implementations
- **Offline-First Design**: All data is stored in browser `localStorage` with no server dependencies.
- **Dual Mode Operation**: Supports distinct "Home User Mode" and "Staff User Mode" with specific functionalities for each.
  - **Home User Mode**: Manages unlimited staff, tracks attendance, payments, expenses, and laundry batches.
  - **Staff User Mode**: Manages client homes, logs attendance across locations, tracks laundry earnings, and handles business expenses and invoices.
- **Security**: PIN-based app lock with optional WebAuthn biometric authentication and brute-force protection (30-minute lockout after 5 failed attempts).
- **Data Management**:
  - **Backup Validation**: Uses Zod for schema validation during backup imports.
  - **Data Scoping**: All data is filtered by an active account ID, with a "Show All Contexts" toggle.
  - **Cascade Deletes**: Deleting records automatically cleans up related data.
  - **Document Management**: Images are resized (max 1920x1920), compressed (80% JPEG), and stored as Base64.
- **Internationalization**:
  - **Multi-Language Support**: Complete translations for 21 languages, with a typeahead search selector.
  - **Multi-Currency Support**: Supports 27 general app currencies and specific donation currencies.
- **Invoicing System (STAFF Mode)**: Itemized invoices with sequential numbering, tax rates, and five statuses.
- **User Experience**: Remembers user's preferred app mode, includes guided onboarding tours, and provides a donation feature with multi-currency support and external payment method integration (UPI, PayPal).

### Feature Specifications
- **Limitations**: Soft limit of 1000 total records with warnings; 5MB per file for document storage.
- **Donation Feature**: Optional donations via UPI (India) or PayPal (International) with tiered amounts and custom options.

### Server-Side Components (v2.0)
The application now includes optional server-side features for cross-device collaboration while maintaining local storage as the primary data source:

- **User Authentication**: OTP-based phone verification via Twilio SMS
- **Database**: PostgreSQL with Drizzle ORM
- **API Endpoints**:
  - `/api/auth/request-otp` - Request OTP for phone verification
  - `/api/auth/verify-otp` - Verify OTP and get JWT token
  - `/api/user/profile` - Get/update user profile
  - `/api/devices/register` - Register device for sync
  - `/api/collaboration/*` - Create/accept collaboration links, sync messages
  - `/api/admin/*` - Admin dashboard endpoints (login, stats, user management)
- **Database Tables**: users, devices, collaboration_links, collaboration_messages, admin_users
- **Security**: JWT tokens (30-day expiry for users, 8-hour for admins), bcrypt password hashing

## External Dependencies

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Icons**: `lucide-react`, `react-icons`
- **Animation**: `framer-motion`
- **State Management**: React Context
- **Persistence**: Browser `localStorage` (primary), PostgreSQL (optional sync)
- **Biometric Authentication**: WebAuthn API
- **Backend**: Express.js with PostgreSQL
- **ORM**: Drizzle ORM
- **SMS Provider**: Twilio
- **Schema Validation**: Zod
- **Mobile Packaging**: Capacitor (Android)
- **CI/CD**: GitHub Actions

## Environment Variables/Secrets
- `DATABASE_URL` - PostgreSQL connection string
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token  
- `TWILIO_PHONE_NUMBER` - Twilio phone number for SMS
- `ADMIN_DEFAULT_EMAIL` - Default super admin email
- `ADMIN_DEFAULT_PASSWORD` - Default super admin password
- `JWT_SECRET` - JWT signing secret (optional, has default)