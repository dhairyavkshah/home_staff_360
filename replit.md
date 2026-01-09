# Home Staff 360 v1.0

## Overview
Home Staff 360 is a professional staff management platform built as a hybrid mobile application (React + Capacitor) with a backend server. Originally designed for household staff management, this comprehensive solution is equally applicable to hospitality businesses, restaurants, and other staff-oriented operations. It provides real-time workforce management with live data synchronization across all connected users.

### Industry Applications
While designed with home staff management as the primary use case, Home Staff 360's architecture supports diverse industries:
- **Households**: Domestic staff, housekeepers, cooks, drivers, nannies
- **Hospitality**: Hotel housekeeping, room service, front desk staff
- **Restaurants**: Kitchen staff, servers, bartenders, hosts
- **Service Businesses**: Cleaning services, maintenance crews, field staff
- **Property Management**: Building staff, security personnel, maintenance teams

### Future Roadmap
We are continuously enhancing Home Staff 360 to better serve diverse industries with upcoming features including industry-specific templates, advanced scheduling, shift management, department structures, and integration with popular business tools.

### Operating Modes
The platform operates in two core modes:
- **Home User Mode**: For employers and managers to track staff attendance, payments, expenses, service batches, and notes with real-time collaboration.
- **Staff User Mode**: For service professionals to manage multiple clients, log attendance, track earnings, handle expenses, create invoices, and take notes.

## User Preferences
- Simple language and clear explanations
- Iterative development with small, testable changes
- Ask before major architectural decisions
- Privacy and security remain priorities with live data

## System Architecture

### Project Structure
```
home-staff-360/
├── android/                    # Capacitor Android project
├── assets/                     # App icons and splash screens
├── attached_assets/            # User-uploaded assets
├── client/                     # React frontend
│   └── src/
│       ├── components/         # Reusable UI components
│       │   ├── layout/         # AppLayout, Header, BottomNav
│       │   └── ui/             # Shadcn/ui components
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # Utilities and services
│       │   ├── storage.ts      # LocalStorage management
│       │   ├── navigation.tsx  # Screen navigation
│       │   ├── i18n/           # 21-language translations
│       │   └── realtime-provider.tsx  # Socket.IO context
│       ├── screens/            # Application screens
│       │   ├── auth/           # Authentication screens
│       │   ├── collaboration/  # Chat, connections, notifications
│       │   └── staff/          # Staff mode screens
│       └── pages/              # Admin panel pages
├── docs/                       # Privacy policy, documentation
├── migrations/                 # Drizzle database migrations
├── server/                     # Express.js backend
│   ├── db.ts                   # Database connection
│   ├── routes.ts               # REST API endpoints
│   ├── realtime.ts             # Socket.IO events
│   └── index.ts                # Server entry point
├── shared/                     # Shared types and schema
│   └── schema.ts               # Drizzle ORM schema + Zod validators
└── tests/                      # Automated test suites
```

### Frontend Screens (55 total)

**Core Screens:**
- SplashScreen, LauncherScreen, OnboardingScreen, RoleSelectionScreen
- HomeScreen (Home mode dashboard), StaffHomeScreen (Staff mode dashboard)
- SettingsScreen, ProfileSettingsScreen, BackupScreen, FeedbackScreen
- PrivacyPolicyScreen, SubscriptionScreen, PermissionsScreen
- PinSetupScreen, PinEntryScreen

**Home Mode Features:**
- HouseholdsScreen, PeopleScreen, PersonDetailScreen, PersonCalendarScreen
- AddPersonScreen (with duplicate phone validation)
- AttendanceScreen, AddAttendanceScreen
- PayablesScreen, TransactionsScreen, AddTransactionScreen
- ExpensesScreen, ExpenseCalendarScreen, AddExpenseScreen
- LaundryViewScreen, AddLaundryScreen
- ReportsScreen, ReportPreviewScreen
- DocumentsScreen, NotesScreen (20,000 char limit, full-screen mode)

**Staff Mode Features:**
- BusinessesScreen, StaffClientHomesScreen, StaffAddClientHomeScreen
- StaffLogAttendanceScreen, StaffAttendanceScreen
- StaffExpensesScreen, StaffAddExpenseScreen
- StaffLaundryScreen, StaffLogLaundryScreen
- StaffEarningsScreen, StaffReportsScreen
- StaffDocumentsScreen, StaffInvoicesScreen
- StaffAddInvoiceScreen, StaffInvoiceViewScreen

**Collaboration Features:**
- AuthScreen (phone+password login/register)
- CollaborationHubScreen (tabs: Connections, Messages, Shared Spaces)
- ConnectionsTab, MessagesTab, SharedSpacesTab
- ChatScreen, LinkAccountScreen, PhoneVerificationScreen
- NotificationCenterScreen, SyncActivityScreen, ApprovalDetailScreen

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.IO for live updates
- **Authentication**: JWT tokens (30-day user, 8-hour admin)
- **SMS/OTP**: Twilio integration

### Storage System (Hybrid)
- **Server-side (PostgreSQL)**: Users, collaboration links, messages, notifications, attendance, expenses, laundry, persons, approvals
- **Client-side (localStorage)**: Settings, accounts, notes, documents, invoices, cached profile data

### Authentication Flow
1. User enters phone number + password (min 6 chars)
2. Server sends OTP via Twilio SMS
3. User verifies OTP (10 min expiry, max 5 attempts)
4. JWT token issued and stored in localStorage
5. Auto-login on subsequent visits until logout

### Session Persistence
- **Auto-Login**: JWT token stored in localStorage (`homestaff360_collab_token`)
- **Profile Sync**: `syncProfileToLocalStorage()` fetches server profile on new device
- **Returning Users**: Skip onboarding if `onboardingCompleted=true`
- **Logout Behavior**: Clears token, preserves phone number for quick re-login

## Feature Specifications

### Notes Feature (NEW)
- Full-screen view and edit modes (no popup dialogs)
- 20,000 character limit per note
- 6 color options: yellow, blue, green, pink, purple, orange
- Pin notes to top of list
- Supports "All contexts" mode showing notes from all accounts
- Available in both Home and Staff dashboards

### Multi-Language Support
21 languages: English, Hindi, Spanish, French, Portuguese, Arabic, Bengali, Chinese (Simplified), German, Indonesian, Italian, Japanese, Korean, Malay, Russian, Tamil, Telugu, Thai, Turkish, Urdu, Vietnamese

### Multi-Currency Support
27 currencies: INR, USD, EUR, GBP, AUD, CAD, AED, BDT, BRL, CHF, CNY, EGP, IDR, JPY, KES, KRW, MXN, MYR, NGN, PHP, PKR, RUB, SAR, SGD, THB, TRY, ZAR

### Real-Time Collaboration
- Chat messaging with edit/delete (5-minute window)
- Connection invites with auto-connect by phone number
- Shared spaces for household-staff collaboration
- Live sync events for attendance, laundry, expenses

### Push Notifications
- Android: Capacitor LocalNotifications
- Web: Notifications API
- Events: Chat messages, connection invites (received/accepted/rejected)

### Subscription Model
- **Two Plans**: Monthly and Annual
- **Two Tiers**: Free (ad-supported), Premium (ad-free)
- **5-Tier Pricing** across 132 countries with local currency
- **Google Play Billing** integration for mobile

### UI/UX Design
- Microsoft Fluent 2 + Samsung One UI inspired
- "Squircle" corners (24px radius)
- Light and Dark mode support
- Primary color: Google Blue (#0B57D0)
- Bottom navigation with 5 tabs
- Safe area handling for Android notches

## Security Measures

### Authentication Security
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with configurable expiry
- OTP expiry: 10 minutes, max 5 attempts
- Phone number normalization for consistency

### Rate Limiting
- OTP requests: 10 per 15 minutes per IP
- Authentication: 20 per 15 minutes per IP
- Password reset: 5 per 15 minutes per IP
- Socket.IO: 30 connections per minute per IP

### Data Protection
- HTTPS/TLS for all transmissions
- GDPR and DPDP Act compliant design
- 7 critical operations wrapped in database transactions
- Standardized error codes (ERROR_CODES in server/routes.ts)

### Duplicate Prevention
- Phone number validation prevents adding duplicate staff/clients
- Normalizes phone numbers by removing non-digits
- Shows existing person's name in error message

## External Dependencies

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Real-time | Socket.IO (client + server) |
| UI | Tailwind CSS, Shadcn/ui, Radix UI |
| Routing | Wouter |
| State | TanStack Query v5 |
| Animations | Framer Motion |
| Icons | Lucide React, React Icons, Fluent UI |
| Mobile | Capacitor (Android) |
| SMS | Twilio |
| Forms | React Hook Form, Zod |

## Testing

### Automated Tests
- **Total**: 151 tests across 3 suites
- **Run**: `npx tsx tests/e2e/module-tests.ts && npx tsx tests/e2e/e2e-scenario-tests.ts && npx tsx tests/e2e/extended-module-tests.ts`
- **Bypass Rate Limiting**: Header `x-test-bypass: rate-limit-skip` (dev only)

### Test Coverage
- Authentication (registration, login, OTP, password reset)
- Home features (attendance, laundry, expenses, payments)
- Staff features (client management, attendance logging)
- Collaboration (connections, messaging, shared spaces)
- Admin panel (authorization enforcement)
- Real-time (Socket.IO events)

## Environment Secrets

| Secret | Purpose |
|--------|---------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | JWT token signing |
| TWILIO_ACCOUNT_SID | SMS/OTP service |
| TWILIO_AUTH_TOKEN | SMS/OTP service |
| TWILIO_PHONE_NUMBER | SMS sender number |
| ADMIN_DEFAULT_EMAIL | Admin panel login |
| ADMIN_DEFAULT_PASSWORD | Admin panel login |

## Deployment

### Replit Options
1. **Autoscale** (Recommended): Variable traffic, auto-scales
2. **Reserved VM**: Consistent performance, always-on WebSocket
3. **Static**: Not suitable (has server-side logic)

### Pre-Deployment Checklist
- [ ] All 151 automated tests passing
- [ ] Twilio credentials configured
- [ ] JWT_SECRET set for production
- [ ] Admin credentials configured
- [ ] PostgreSQL database connected
- [ ] Privacy Policy at docs/PRIVACY_POLICY.md

### Post-Deployment
- Use Replit's built-in PostgreSQL for persistent data
- Monitor Socket.IO connections for real-time health
- Subscription validation integrates with Google Play Billing

## Recent Changes (January 2026)

### Notes Feature
- Added sticky notes with full-screen view/edit modes
- 20,000 character limit (increased from 1,000)
- 6 color options with pin functionality
- Supports "All contexts" mode for cross-account notes
- Added to both Home and Staff dashboards

### Duplicate Phone Validation
- Prevents adding staff/clients with duplicate phone numbers
- Normalizes phone numbers for accurate comparison
- Shows existing person's name in error message

### File Size Limits Update
- Increased maximum file size for documents and images from 5 MB to 20 MB
- Removed automatic image compression for files under 20 MB
- Files are now stored at full quality without resizing

### Android Safe Area Improvements
- Modals, drawers, and sheets now properly respect Android safe areas when keyboard is open
- Select dropdowns and popovers dynamically adjust to keyboard visibility
- All UI components avoid bleeding into Android status bar and navigation bar

### Bug Fixes
- Fixed "All contexts" mode for notes display
- Fixed pin toggle synchronization in view mode
- Fixed accessibility warnings in dialogs

### Security Improvements
- PIN codes now hashed with SHA-256 (was plain text in localStorage)
- Automatic migration for existing users with plain text PINs
- PIN validation and setting methods are now async

### Icon & Branding Updates
- Added Android notification icon (ic_stat_notification.xml) as vector drawable
- Notification icon shows simplified house+person silhouette matching app logo
- Web notifications now use favicon.png
- Added PWA manifest.json with proper app icons
- Added apple-touch-icon for iOS home screen

### Android Rebuild Required
After icon changes, rebuild the Android app:
```bash
npx cap sync android
cd android && ./gradlew assembleRelease
```
