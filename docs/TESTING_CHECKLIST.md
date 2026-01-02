# Home Staff 360 - Quick Testing Checklist

## Pre-Release Checklist

### Phase 1: Staging (5 Testers, 3-5 Days)

#### Build Verification
- [ ] APK builds without errors
- [ ] App icon displays correctly
- [ ] Splash screen appears
- [ ] No crash on launch

#### Core Features - HOME Mode
- [ ] Create household
- [ ] Add staff member
- [ ] Record attendance (Full/Half/Absent)
- [ ] Record payment
- [ ] Record advance
- [ ] Record deduction
- [ ] Add expense
- [ ] Create laundry batch
- [ ] Attach document
- [ ] Export CSV report
- [ ] View dashboard

#### Core Features - STAFF Mode
- [ ] Create business
- [ ] Add client home
- [ ] Record work attendance
- [ ] Track earnings
- [ ] Create invoice
- [ ] Manage invoice status
- [ ] Track expenses

#### Data & Security
- [ ] Data persists after restart
- [ ] Backup/restore works
- [ ] PIN lock works
- [ ] Biometric works (if supported)

#### Multi-Currency
- [ ] Different currencies per entity
- [ ] Totals display separately

#### Multi-Language
- [ ] All 12 languages work
- [ ] RTL layout (Arabic)

#### Performance
- [ ] Launch < 3 seconds
- [ ] No memory leaks
- [ ] No ANR

---

### Phase 2: Internal Testing (20 Testers, 5-7 Days)

#### Google Play Console
- [ ] App bundle uploads successfully
- [ ] No policy warnings
- [ ] Internal testing track created
- [ ] All 20 testers invited
- [ ] All testers installed app

#### Device Coverage
- [ ] Android 14 (3 devices)
- [ ] Android 13 (5 devices)
- [ ] Android 12 (4 devices)
- [ ] Android 11 (4 devices)
- [ ] Android 10 (2 devices)
- [ ] Android 8/9 (2 devices)

#### Monitoring
- [ ] Android Vitals - no crashes
- [ ] Android Vitals - no ANRs
- [ ] All testers submitted feedback

---

### Phase 3: Closed Testing (50 Testers, 14+ Days)

#### Google Play Requirements
- [ ] Closed testing track created
- [ ] 12+ testers opted-in by Day 1
- [ ] 12+ testers maintained for 14 days
- [ ] Daily opt-in count verified

#### Day-by-Day Tracking

| Day | Opt-in Count | Crashes | ANRs | Issues |
|-----|--------------|---------|------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | |
| 10 | | | | |
| 11 | | | | |
| 12 | | | | |
| 13 | | | | |
| 14 | | | | |

#### Exit Criteria
- [ ] 14 consecutive days with 12+ testers
- [ ] Zero critical bugs
- [ ] Crash-free rate > 99.5%
- [ ] Production access application submitted

---

### Phase 4: Production (Staged Rollout)

#### Store Listing Complete
- [ ] App title (≤30 chars)
- [ ] Short description (≤80 chars)
- [ ] Full description (≤4000 chars)
- [ ] Screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] Privacy policy URL added
- [ ] Contact email added
- [ ] Data safety section completed
- [ ] Content rating completed

#### Staged Rollout

| Stage | % | Duration | Status | Issues |
|-------|---|----------|--------|--------|
| 1 | 5% | 3 days | [ ] | |
| 2 | 10% | 3 days | [ ] | |
| 3 | 25% | 3 days | [ ] | |
| 4 | 50% | 3 days | [ ] | |
| 5 | 100% | - | [ ] | |

---

## Compliance Checklist

### Google Play Policies
- [ ] Privacy policy accessible in-app
- [ ] Privacy policy URL in Play Console
- [ ] Data safety section accurate
- [ ] No deceptive behavior
- [ ] Appropriate content rating
- [ ] Target API 34+

### US Regulatory
- [ ] COPPA compliant (not for children)
- [ ] CCPA/CPRA compliant (no external data)
- [ ] Data deletion mechanism available
- [ ] No third-party data sharing
- [ ] No third-party AI data sharing

---

## Quick Bug Severity Guide

| Severity | Definition | Action |
|----------|------------|--------|
| **Critical** | Crash, data loss | Stop release, fix now |
| **High** | Major feature broken | Fix before next phase |
| **Medium** | Partial functionality | Fix before production |
| **Low** | Minor UI issue | Fix when possible |

---

## Tester Communication Templates

### Invitation Email
```
Subject: Join Home Staff 360 Beta Testing

Hi [Name],

You're invited to test Home Staff 360!

Please:
1. Click this link: [LINK]
2. Install the app
3. Use it daily for 14 days
4. Stay opted in (don't uninstall)

Thanks!
Dhairya Shah
```

### Weekly Check-in
```
Subject: Week [X] Testing Update

Hi testers,

How's the app working for you?

Please complete the weekly survey: [LINK]

Report any bugs to: [EMAIL]

Thanks for your help!
```

### Thank You Email
```
Subject: Thank You for Testing!

Hi [Name],

We've completed beta testing and your feedback was invaluable.

The app is now live on Google Play!

Thank you for being part of this journey.

Best,
Dhairya Shah (The Team 360)
```

---

*Crafted by Dhairya Shah (The Team 360)*
