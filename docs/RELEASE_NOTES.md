# Release Notes

## Home Staff 360

**Your Data, Your Device, Your Control**

---

## Version 4.0.0

**Release Date: January 15, 2026**

### What's New in Version 4.0

Home Staff 360 v4.0 introduces a **privacy-first hybrid storage architecture** that keeps your business data on your device while enabling seamless collaboration. This release also introduces our new monetization model with a dual-ad system for free users and a premium ad-free subscription.

---

### Highlights

**Privacy-First Hybrid Storage Architecture**
- All your business data (staff, attendance, payments, expenses, laundry, invoices, documents) stays **exclusively on your device**
- Server stores only minimal data needed for authentication and collaboration
- We cannot access, analyze, or monetize your business data - because we don't have it
- Complete data ownership and control

**Dual-Ad System for Free Users**
- First ad: 30 seconds, non-skippable - supports our development
- Second ad: Skippable after 5 seconds - respects your time
- Ads are NOT targeted based on your personal or business data
- Only anonymous, aggregate metrics collected

**Premium Ad-Free Experience**
- Upgrade to Premium for complete ad-free usage
- Priority support and future premium features
- Available via Google Play subscription

**Login Persistence Across Updates**
- Stay logged in even after app updates
- Android Auto-Backup preserves your authentication state
- No more re-entering credentials after every update

---

### Storage Architecture Details

| Storage Location | What Is Stored | Purpose |
|-----------------|----------------|---------|
| **Your Device** | Staff records, attendance, payments, expenses, laundry, invoices, documents, clients, households, notes, settings | All business/operational data |
| **Our Server** | Phone number, password hash, connections, chat messages, notifications | Authentication & collaboration only |

**Why This Matters:**
- Maximum privacy - sensitive data never leaves your device
- You own your data completely
- No data mining or selling to advertisers
- GDPR and DPDP Act compliant by design

---

### Backup Systems

**Local Auto-Backup (User-Controlled)**
- Activates only with your explicit consent
- Backup files stored locally on your device
- Configurable frequency: daily, weekly, or monthly
- You can disable or delete backups anytime

**Android Auto-Backup (System-Managed)**
- Automatic backup to Google Drive (encrypted)
- Preserves login state across updates and reinstalls
- 25MB limit, managed by Android system
- Seamless recovery when setting up new device

---

### Ad System Details

**For Free Users:**
1. **Launch Ad (First Ad)**: 30-second non-skippable video
   - Plays when app detects it's time for an ad
   - Loops if video is shorter than 30 seconds
   - Progress indicator shows time remaining
   
2. **Feature Ad (Second Ad)**: Skippable after 5 seconds
   - Skip button appears after 5-second countdown
   - Watch fully for advertiser support, or skip to continue
   - "Ad 1 of 2" and "Ad 2 of 2" indicators

**For Premium Users:**
- No ads ever displayed
- Immediate app access without interruption
- Premium badge in profile

**Privacy Commitment:**
- Ads are contextual, not targeted to your data
- No advertising profiles built from your usage
- No personal data shared with advertisers

---

### All v4.0 Features

#### Privacy & Security
- Hybrid storage model with local-first approach
- Enhanced data encryption for server-stored data
- Improved HTTPS/TLS security
- Bcrypt password hashing (10 rounds)
- JWT tokens with secure session management
- Optional biometric lock and PIN protection

#### Real-Time Collaboration
- Connect with staff or clients in real-time
- Instant messaging with edit/delete (within 5 minutes)
- Live updates across all connected devices
- Auto-connection system when adding people
- Push notifications for messages and updates

#### Global Accessibility
- 21 languages supported
- 120+ currencies for worldwide use
- Automatic currency detection based on location
- SMS verification works globally

#### Core Features
- Attendance tracking with calendar views
- Payment and salary management
- Expense tracking with categories and receipts
- Laundry batch management
- Invoice generation and sharing
- Document storage and management
- Comprehensive reports

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

### Migration from v3.x

**What Changes:**
- Your local data remains intact and unchanged
- Ad system will activate for free users
- Login state now persists across updates

**No Action Required:**
- All existing data is preserved
- Settings and preferences maintained
- Connections and chat history intact

**Optional:**
- Upgrade to Premium to remove ads
- Review and accept updated Privacy Policy

---

### Technical Improvements

- Optimized ad loading and playback
- Improved video looping logic for short ads
- Better countdown timer accuracy
- Enhanced error handling for ad failures
- Reduced memory usage during ad playback
- Improved app startup performance

---

### Bug Fixes

- Fixed backup configuration for Android 12+
- Resolved video playback issues on some devices
- Fixed countdown timer accuracy in ad overlay
- Improved ad completion detection
- Fixed edge cases in dual-ad sequencing

---

### Future Roadmap

**Upcoming in v4.x:**
- Industry-specific templates for hospitality
- Advanced scheduling and shift management
- Team hierarchy and department structures
- Enhanced analytics and reporting
- Integration with popular business tools
- iOS version (in development)

---

### Google Play Console Format (500 characters max)

```
v4.0 - Privacy-First Staff Management

NEW IN 4.0:
- Your data stays on YOUR device - we can't access it
- Login persists across app updates
- Free with ads, Premium for ad-free

FEATURES:
- Real-time collaboration & messaging
- Attendance, payments, expenses tracking
- 21 languages, 120+ currencies
- Perfect for homes, hotels, restaurants

Your Data, Your Device, Your Control!
```

**Character Count: 398**

---

### Short What's New (150 characters)

```
v4.0: Privacy-first design - your data stays on your device. Login persists across updates. Free with ads or go Premium. 21 languages supported!
```

**Character Count: 147**

---

### Version History

| Version | Date | Highlights |
|---------|------|------------|
| 4.0.0 | Jan 15, 2026 | Privacy-first hybrid storage, dual-ad system, login persistence, premium subscription |
| 3.0.0 | Jan 2026 | Enhanced collaboration, improved UI, bug fixes |
| 2.0.0 | Jan 2026 | Real-time messaging, auto-connections, admin system |
| 1.0.0 | Jan 2026 | Initial release with core staff management features |

---

*Last Updated: January 15, 2026*
