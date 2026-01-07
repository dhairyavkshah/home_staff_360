# Release Notes

## Home Staff 360

---

## Version 2.0.0

**Release Date: January 2026**

### Full Release Notes (Developer Log)

---

#### Major New Features

**Multi-Tier Admin System**
- Super Admin role with full system access
- Admin role with user management capabilities
- Moderator role for content oversight
- Role-based access control (RBAC) for all admin functions
- Admin dashboard with comprehensive analytics
- User management interface with search and filtering

**Enhanced Advertising System**
- Full-screen video ad overlay with Fluent 2 design
- Skip button appears after 5 seconds of viewing
- Maximum ad duration: 30 seconds
- Equal weight distribution for fair ad rotation
- Click-through tracking for advertisers
- Admin interface for ad campaign management
- Comprehensive ad analytics dashboard
- User-friendly ad experience with non-intrusive timing (~5 min intervals)

**Donation Reminder System**
- Gentle periodic reminders to support development
- Multiple donation tiers: Small, Medium, Large, Custom
- UPI support for Indian users
- PayPal support for international users
- Easy dismiss and "remind me later" options
- Donation tracking and acknowledgment

---

#### Authentication & Security

**Phone + Password Authentication**
- Unified login and registration flow
- Phone number as primary identifier
- Password required for all accounts (minimum 6 characters)
- Passwords hashed with bcrypt (10 rounds)

**OTP Verification**
- SMS-based phone verification via Twilio
- 10-minute OTP expiry for security
- Maximum 5 attempts per code
- Rate limiting to prevent abuse

**Password Management**
- Forgot password flow with OTP verification
- Change password requires current password
- Secure password reset via verified phone

**Phone Number Changes**
- Change phone with current password verification
- OTP verification for new phone number
- Rate limited: maximum 3 changes per hour

**Session Security**
- JWT tokens with 30-day expiry for users
- 8-hour expiry for admin sessions
- Secure token refresh mechanism

---

#### Collaboration Features

**User Connections**
- Search and connect with other users
- Connection requests with accept/decline
- View connection profiles
- Disconnect option available

**Direct Messaging**
- Real-time messaging between connections
- Message history preservation
- Read receipts and timestamps
- Push notification support (optional)

**Shared Spaces**
- Share laundry batches for approval
- Collaborative editing with revisions
- Approval workflow with status tracking
- Sync activity log

**Notifications**
- Centralized notification center
- Connection requests
- Message alerts
- Approval requests
- Sync status updates

---

#### Localization

**21 Languages Supported**
- English
- Hindi (हिन्दी)
- Gujarati (ગુજરાતી)
- Kannada (ಕನ್ನಡ)
- Malayalam (മലയാളം)
- Marathi (मराठी)
- Punjabi (ਪੰਜਾਬੀ)
- Telugu (తెలుగు)
- Tamil (தமிழ்)
- Urdu (اردو)
- Bengali (বাংলা)
- Odia (ଓଡ଼ିଆ)
- Assamese (অসমীয়া)
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Arabic (العربية)
- Chinese (中文)
- Japanese (日本語)
- Portuguese (Português)
- Russian (Русский)

**27 Currencies Supported**
INR, USD, EUR, GBP, AUD, CAD, JPY, CNY, AED, SAR, SGD, MYR, THB, PHP, IDR, VND, KRW, BRL, MXN, ZAR, RUB, TRY, CHF, SEK, NOK, DKK, NZD

---

#### Security Improvements

- Enhanced rate limiting across all endpoints
- Generic error messages to prevent user enumeration
- Improved input validation and sanitization
- Secure OTP handling with automatic expiry
- Brute-force protection with 30-minute lockout after 5 failed attempts
- WebAuthn biometric authentication support
- PIN-based app lock with secure storage

---

#### UI/UX Enhancements

- Microsoft Fluent 2 design language
- Improved dark mode with better contrast
- Smoother animations and transitions
- Better accessibility support
- Responsive layout improvements
- Enhanced form validation feedback

---

#### Bug Fixes

- Fixed attendance calendar sync issues
- Resolved payment calculation edge cases
- Fixed laundry batch duplicate prevention
- Improved offline data persistence
- Fixed currency formatting inconsistencies
- Resolved notification delivery delays

---

#### Technical Improvements

- Upgraded to React 18
- TanStack Query v5 for data fetching
- Improved TypeScript coverage
- Better error handling and logging
- Optimized database queries
- Reduced app bundle size

---

### Google Play Console Format (500 characters max)

```
Version 2.0 - Major Update!

NEW FEATURES:
- Phone + password authentication with OTP verification
- Connect with other users & send messages
- Share laundry batches for approval
- Multi-tier admin system

IMPROVEMENTS:
- 21 languages now supported
- Enhanced security with biometric lock
- Better dark mode
- Smoother performance

Plus: Optional donation reminders to support development

Update now for the best experience!
```

**Character Count: 456**

---

### Short What's New (150 characters)

```
v2.0: Phone auth, user connections, messaging, shared spaces, 21 languages, enhanced security, and more!
```

**Character Count: 105**

---

### Version History

| Version | Date | Highlights |
|---------|------|------------|
| 2.0.0 | Jan 2026 | Phone auth, collaboration, 21 languages |
| 1.5.0 | - | Staff mode, invoices, multi-currency |
| 1.0.0 | - | Initial release, basic features |

---

*Home Staff 360 - Crafted with care by The Team 360*
