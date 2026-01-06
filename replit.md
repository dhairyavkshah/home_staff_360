# Home Staff 360 v2.0

## Overview
Home Staff 360 is a **privacy-first, offline-capable mobile/web application** designed for managing household staff and service businesses. Version 2.0 adds **online-first collaboration** with phone+password authentication while maintaining local storage as the primary data source.

### Core Modes
- **Home User Mode**: For household managers to track domestic staff attendance, payments, expenses, and laundry batches.
- **Staff User Mode**: For service professionals to manage client homes, log attendance, track earnings, handle expenses, and create invoices.

## User Preferences
- Simple language and clear explanations
- Iterative development with small, testable changes
- Ask before major architectural decisions
- Privacy and offline-first capabilities are priorities

---

## System Architecture

### Authentication Flow (v2.0)
1. **Phone Check**: User enters phone number → server checks if account exists
2. **Password Login/Setup**: 
   - Existing users: Enter password to login
   - New users: Set password during registration
3. **OTP Verification**: Verify phone ownership via SMS code (Twilio)
4. **Profile Setup**: Display name captured during onboarding, synced to server

**Password Requirements**:
- Minimum 6 characters
- Required for all users (set during sign-up)
- Current password required to change password or phone number
- Forgot password: OTP-based password reset

### Data Architecture
```
┌─────────────────────────────────────────────────────┐
│                    CLIENT                           │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  localStorage   │  │  collaboration-service  │  │
│  │  (Primary Data) │  │  (Server Sync)          │  │
│  └─────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                    SERVER                           │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  PostgreSQL     │  │  JWT Authentication     │  │
│  │  (Collaboration)│  │  (30-day tokens)        │  │
│  └─────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### UI/UX Design
- Modern UI inspired by Samsung One UI and Material 3
- "Squircle" corners (24px radius) for soft aesthetic
- Light and Dark mode support
- Primary color: Google Blue (#0B57D0)
- Bottom navigation bar with 5 tabs

---

## API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/check-phone` | POST | Check if phone number is registered |
| `/api/auth/login` | POST | Login with phone + password |
| `/api/auth/register` | POST | Register new user with phone + password |
| `/api/auth/request-otp` | POST | Request OTP for phone verification |
| `/api/auth/verify-otp` | POST | Verify OTP and complete auth |
| `/api/auth/forgot-password` | POST | Request password reset OTP |
| `/api/auth/reset-password` | POST | Reset password with OTP |

### User Profile
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/profile` | GET | Get user profile |
| `/api/user/profile` | PATCH | Update display name, preferences |
| `/api/user/password` | PUT | Change password (requires current password) |
| `/api/user/phone/request-change` | POST | Request phone change (rate limited) |
| `/api/user/phone/confirm` | POST | Confirm phone change with OTP |

### Collaboration
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connections` | GET/POST | Manage connections between users |
| `/api/messages` | GET/POST | Direct messaging between connections |
| `/api/notifications` | GET | Get user notifications |
| `/api/shared-*` | Various | Shared data management (laundry, etc.) |

### Admin (Protected)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/login` | POST | Admin login (email + password) |
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/admin/users` | GET | List/manage users |

---

## Database Schema (PostgreSQL)

### Core Tables
- `server_users`: User accounts (phone, displayName, passwordHash, userType)
- `otp_codes`: OTP codes for verification (phone, code, expiresAt, verified)
- `devices`: Registered devices for sync
- `admin_users`: Admin dashboard users

### Collaboration Tables
- `collab_connections`: Bidirectional connections between users
- `direct_messages`: Messages between connected users
- `notifications`: User notifications

### Shared Data Tables
- `shared_laundry`: Laundry batches shared for approval
- `shared_laundry_revisions`: Revision history for shared laundry

---

## Security Measures

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 30-day expiry (users), 8-hour (admins)
- OTP expiry: 10 minutes
- OTP max attempts: 5 before requiring new code

### Rate Limiting
- Phone change requests: Max 3 per hour per user
- OTP requests: Throttled via in-memory limiter
- Generic error messages to prevent user enumeration

### Local Security
- PIN-based app lock (optional)
- WebAuthn biometric authentication (optional)
- Brute-force protection: 30-minute lockout after 5 failed attempts

---

## Local Storage Keys

```typescript
const STORAGE_KEYS = {
  SETTINGS: 'hm_settings',
  HOME_SETTINGS: 'hm_home_settings', 
  STAFF_SETTINGS: 'hm_staff_settings',
  PROFILE: 'hm_profile',
  ACCOUNTS: 'hm_accounts',
  PEOPLE: 'hm_people',
  ATTENDANCE: 'hm_attendance',
  TRANSACTIONS: 'hm_transactions',
  LAUNDRY: 'hm_laundry',
  EXPENSES: 'hm_expenses',
};
```

---

## Technical Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS + Shadcn/ui
- Wouter (routing)
- TanStack Query v5 (data fetching)
- Framer Motion (animations)
- Lucide React + React Icons

### Backend
- Express.js with TypeScript
- Drizzle ORM + PostgreSQL
- Twilio (SMS/OTP)
- JWT (jsonwebtoken)
- Bcrypt (password hashing)

### Mobile
- Capacitor (Android packaging)
- GitHub Actions (CI/CD)

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number for SMS |
| `ADMIN_DEFAULT_EMAIL` | Default super admin email |
| `ADMIN_DEFAULT_PASSWORD` | Default super admin password |
| `JWT_SECRET` | JWT signing secret (has default) |

---

## Feature Specifications

### Limitations
- Soft limit: 1000 total records with warnings
- Document storage: 5MB per file (resized to max 1920x1920)

### Multi-Language Support
21 languages: English, Hindi, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Telugu, Tamil, Urdu, Bengali, Odia, Assamese, Spanish, French, German, Arabic, Chinese, Japanese, Portuguese, Russian

### Multi-Currency Support
27 currencies including INR, USD, EUR, GBP, AUD, CAD, and more.

### Donation Feature
Optional donations via UPI (India) or PayPal (International) with tiered amounts.

---

## Key Screens

### Authentication
- `AuthScreen`: Unified login/register with phone, password, OTP
- `ProfileSettingsScreen`: Edit name, change password, change phone

### Home Mode
- `HomeScreen`: Dashboard with staff overview
- `PeopleScreen`: Staff management
- `AttendanceScreen`: Attendance tracking
- `ExpensesScreen`: Household expenses
- `SettingsScreen`: App configuration

### Staff Mode
- `StaffHomeScreen`: Dashboard with earnings
- `StaffClientHomesScreen`: Client management
- `StaffAttendanceScreen`: Attendance logging
- `StaffInvoicesScreen`: Invoice creation
- `StaffExpensesScreen`: Business expenses

### Collaboration (v2.0)
- `CollaborationHubScreen`: Connections, messages, shared spaces
- `NotificationCenterScreen`: All notifications
- `MessagesTab`: Direct messaging

---

## Development Notes

### Running Locally
```bash
npm run dev  # Starts Express + Vite on port 5000
```

### Database Commands
```bash
npm run db:push  # Push schema changes
npm run db:push --force  # Force push (use carefully)
```

### Code Conventions
- Use `@/` imports for client components
- Use `@shared/` imports for shared types
- Follow existing Shadcn component patterns
- Add `data-testid` attributes to interactive elements
