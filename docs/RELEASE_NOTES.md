# Release Notes

## Home Staff 360

---

## Version 3.0

**Release Date: January 13, 2026**

### What's New in Version 3.0

Version 3.0 brings significant stability improvements, enhanced platform detection, and refined push notification handling for a smoother mobile experience.

---

### Highlights

**Enhanced App Stability**
- Improved native platform detection for better Capacitor integration
- Refined push notification initialization with deferred loading
- Better session handling for mobile app restarts
- Reduced app crashes on Android devices

**Privacy-First Architecture**
- Hybrid storage model: Your business data stays on your device
- Server stores only authentication and collaboration data
- Complete data ownership and control

**Global Subscription Model**
- 5-tier regional pricing across 173 countries
- Monthly and Annual subscription options
- Google Play Billing integration
- Fair pricing based on regional purchasing power

**Profile Avatars**
- Upload profile images for collaboration features
- Images compressed to 512x512 pixels for efficiency
- Displayed across chat, connections, and notifications
- Cached locally for fast loading

---

### Version 3.0 Changes

#### Stability Improvements
- **Platform Detection**: Switched to window-based Capacitor detection for reliability
- **Push Notifications**: Deferred initialization by 500ms to prevent blocking app startup
- **Error Handling**: Added try-catch wrappers around push notification initialization
- **Session Management**: Skip session verification on native platforms where sessionStorage is unreliable

#### Technical Improvements
- Better error handling throughout the application
- Improved TypeScript type safety
- Refined collaboration service for native platforms
- Enhanced back button handling

---

### Previous Versions

---

## Version 2.0

**Release Date: January 2026**

### What's New in Version 2.0

Version 2.0 introduced the subscription model, profile avatars, WhatsApp-style auto-backup, and expanded currency support.

#### Major Features
- **Subscription Model**: Premium tier with ad-free experience
- **5-Tier Pricing**: Fair pricing across 173 countries
- **Profile Avatars**: Profile images for collaboration
- **Auto-Backup**: WhatsApp-style background backups
- **120+ Currencies**: Expanded from 27 to 120+ currencies

#### Push Notifications
- Firebase Cloud Messaging for Android
- Background notifications when app is closed
- Token registration on app start
- Web fallback using Notifications API

---

## Version 1.0

**Release Date: January 2026**

### What's New in Version 1.0

Home Staff 360 launched as a **fully live, real-time platform** for professional staff management. Originally designed for household staff management, this platform now serves a broader range of industries including hospitality, restaurants, and service-oriented businesses.

#### Major Features

**Real-Time Collaboration**
- Connect with staff or clients in real-time
- Instant messaging with message edit and delete (within 5 minutes)
- Live updates for attendance, services, and expenses across all devices
- Auto-connection system that creates links automatically when adding people

**Enhanced Security**
- Phone + password authentication with OTP verification
- Bcrypt password hashing (10 rounds)
- 30-day JWT tokens with secure session management
- Optional biometric lock and PIN protection

**Global Reach**
- 21 languages supported
- 27 currencies for international users
- Works worldwide with SMS verification

**Multi-Tier Admin System**
- Super Admin role with full system access
- Admin role with user management capabilities
- Moderator role for content oversight
- Role-based access control (RBAC) for all admin functions

---

### Industry Applications

**Household Management**
- Track domestic staff attendance and payments
- Manage laundry services with batch tracking
- Organize household expenses with approvals

**Hospitality & Hotels**
- Coordinate housekeeping and service staff
- Track attendance across departments
- Generate operational reports

**Restaurants & Food Service**
- Monitor kitchen and service personnel
- Track shift-based work hours
- Manage staff payments and tips

**Service Businesses**
- Manage field staff across client locations
- Track earnings and create invoices
- Handle expense reimbursements

---

### Localization

**21 Languages Supported**
English, Hindi, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Telugu, Tamil, Urdu, Bengali, Odia, Assamese, Spanish, French, German, Arabic, Chinese, Japanese, Portuguese, Russian

**120+ Currencies Supported**
Comprehensive currency support for all 173 countries with automatic detection based on setup location.

---

### Google Play Console Format (500 characters max)

```
Version 3.0 - Enhanced Stability & Performance

IMPROVEMENTS:
- Better app stability on Android devices
- Refined push notification handling
- Improved platform detection
- Smoother app startup experience

FEATURES:
- Real-time collaboration for homes & businesses
- 5-tier subscription pricing across 173 countries
- 21 languages, 120+ currencies
- Privacy-first: Your data stays on your device

Manage your team professionally!
```

**Character Count: 468**

---

### Short What's New (150 characters)

```
v3.0: Enhanced stability, refined push notifications, improved platform detection. Better performance on Android. Your data, your device, your control!
```

**Character Count: 150**

---

### Version History

| Version | Date | Highlights |
|---------|------|------------|
| 3.0 | Jan 13, 2026 | Stability improvements, refined push notifications, platform detection fixes |
| 2.0 | Jan 2026 | Subscription model, profile avatars, auto-backup, 120+ currencies |
| 1.0 | Jan 2026 | Live platform for homes, hospitality, restaurants & service businesses |

---

*Last Updated: January 13, 2026*
