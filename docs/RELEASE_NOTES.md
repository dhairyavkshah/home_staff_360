# Release Notes

## Home Staff 360

---

## Version 1.0.0

**Release Date: January 2026**

### What's New in Version 1.0

Home Staff 360 is now a **fully live, real-time platform** for household and staff management. This major update transforms the app from a local tool to a connected collaboration platform.

---

### Highlights

**Live Real-Time Collaboration**
- Connect with household staff or clients in real-time
- Instant messaging with message edit and delete (within 5 minutes)
- Live updates for attendance, laundry, and expenses across all devices
- Auto-connection system that creates links automatically when adding people

**Enhanced Security**
- Phone + password authentication with OTP verification
- Bcrypt password hashing (10 rounds)
- 30-day JWT tokens with secure session management
- Optional biometric lock and PIN protection

**Global Reach**
- 21 languages supported
- 27 currencies for international users
- Works worldwide with SMS verification via Twilio

---

### Full Release Notes

#### Major New Features

**Real-Time Messaging System**
- Direct messaging between connected users
- Message history with timestamps
- Edit or delete messages within 5 minutes of sending
- Mobile-friendly tap-to-reveal actions
- Desktop hover interactions
- Push notification support

**Live Collaboration Events**
- Real-time attendance updates between employers and staff
- Instant laundry batch approvals and rejections
- Live expense sharing and approval workflows
- Socket.IO-powered event broadcasting
- Dual delivery pattern for reliability

**Auto-Connection System**
- Automatically creates connection invites when adding staff/clients
- Pending phone links for users not yet registered
- Auto-resolves connections when users sign up
- Seamless onboarding for new connections

**Multi-Tier Admin System**
- Super Admin role with full system access
- Admin role with user management capabilities
- Moderator role for content oversight
- Role-based access control (RBAC) for all admin functions
- Admin dashboard with comprehensive analytics
- User management interface with search and filtering

**Subscription Model**
- Annual subscription required for app access
- India: INR 300/year, US: $30/year
- 27 currencies supported with localized pricing
- Google Play Billing integration
- Subscription validation and status APIs

**Features Reserved for Future Releases**
The following features have been built but are disabled for MVP:
- **Share Households/Businesses**: Code preserved in SharedSpacesTab.tsx for future collaborative space sharing
- **Advertising System**: Full ad infrastructure ready (AD_FEATURE_ENABLED flag) for potential ad-supported tier

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

#### Localization

**21 Languages Supported**
- English
- Hindi
- Gujarati
- Kannada
- Malayalam
- Marathi
- Punjabi
- Telugu
- Tamil
- Urdu
- Bengali
- Odia
- Assamese
- Spanish
- French
- German
- Arabic
- Chinese
- Japanese
- Portuguese
- Russian

**27 Currencies Supported**
INR, USD, EUR, GBP, AUD, CAD, JPY, CNY, AED, SAR, SGD, MYR, THB, PHP, IDR, VND, KRW, BRL, MXN, ZAR, RUB, TRY, CHF, SEK, NOK, DKK, NZD

---

#### UI/UX Enhancements

- Microsoft Fluent 2 design language
- Improved dark mode with better contrast
- Smoother animations and transitions
- Better accessibility support
- Responsive layout improvements
- Enhanced form validation feedback
- Mobile-friendly message actions (tap to reveal)

---

#### Bug Fixes

- Fixed attendance calendar sync issues
- Resolved payment calculation edge cases
- Fixed laundry batch duplicate prevention
- Improved data persistence reliability
- Fixed currency formatting inconsistencies
- Resolved notification delivery delays
- Fixed branding consistency (Home Staff 360)

---

#### Technical Improvements

- Upgraded to React 18
- TanStack Query v5 for data fetching
- Socket.IO for real-time communication
- Improved TypeScript coverage
- Better error handling and logging
- Optimized database queries
- Reduced app bundle size

---

### Google Play Console Format (500 characters max)

```
Version 1.0 - Now Live & Real-Time!

MAJOR UPDATE:
- Live real-time collaboration with staff and clients
- Instant messaging with edit/delete support
- Auto-connect when adding new people
- Phone + password secure authentication

FEATURES:
- 21 languages supported
- Enhanced biometric security
- Beautiful Fluent 2 design
- Smoother dark mode

Connect and collaborate with your household team instantly!
```

**Character Count: 438**

---

### Short What's New (150 characters)

```
v1.0: Live real-time collaboration! Instant messaging, auto-connections, 21 languages, enhanced security. Manage staff together!
```

**Character Count: 129**

---

### Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | Jan 2026 | Live real-time platform, collaboration, messaging |

---

*Last Updated: January 8, 2026*
