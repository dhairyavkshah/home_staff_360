# Home Staff 360 - Comprehensive Test Plan

**Version:** 4.0  
**Last Updated:** January 15, 2026

## Overview

This document outlines all end-to-end use cases for the Home Staff 360 application, covering both the mobile app and the super admin portal. Test cases are organized from system boundaries inward, with priority levels for execution.

**Priority Levels:**
- **P0 (Critical):** Core functionality that must work for app to be usable
- **P1 (High):** Important features for daily operations
- **P2 (Medium):** Enhancement features and edge cases
- **P3 (Low):** Cosmetic and analytics features

---

## Module 1: Authentication & Onboarding

### 1.1 Authentication Flow (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| AUTH-001 | New user registration | Enter phone → Request OTP → Verify OTP → Set password | User created, redirected to onboarding |
| AUTH-002 | Existing user login | Enter phone → Enter password | Login successful, go to home/launcher |
| AUTH-003 | OTP verification | Enter 6-digit OTP within 10 mins | OTP verified successfully |
| AUTH-004 | Invalid OTP | Enter wrong OTP 5 times | Account temporarily locked |
| AUTH-005 | Forgot password | Click forgot → Enter phone → OTP → Set new password | Password reset successful |
| AUTH-006 | Password validation | Enter password < 8 chars | Error shown, password not accepted |
| AUTH-007 | Phone number validation | Enter invalid format | Error shown with country-specific rules |
| AUTH-008 | Session persistence | Close app → Reopen | User remains logged in |
| AUTH-009 | Logout | Settings → Logout | Session cleared, return to auth screen |
| AUTH-010 | Remember me toggle | Uncheck remember me → Login → Close app | Phone not pre-filled on next open |

### 1.2 Permissions Flow (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| PERM-001 | Grant storage permission | Tap Allow on storage | Permission granted, proceed |
| PERM-002 | Grant media permission | Tap Allow on media | Permission granted, proceed |
| PERM-003 | Grant notifications | Tap Allow on notifications | Permission granted, proceed |
| PERM-004 | Skip optional permissions | Skip camera, location | Can proceed without these |
| PERM-005 | Deny required permission | Deny storage | Cannot proceed, must grant |
| PERM-006 | Unavailable permission (iframe) | View in preview | Shows "unavailable", can continue |
| PERM-007 | Back navigation blocked | Press back on permissions | Cannot escape onboarding flow |

### 1.3 Backup Restore Flow (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| BACKUP-001 | No backup found | Complete permissions | Shows "No backup found", options to browse or start fresh |
| BACKUP-002 | Backup detected | Has existing backup → Complete permissions | Shows backup date, restore/browse/fresh options |
| BACKUP-003 | Restore from backup | Click "Restore Data" | Data imported, skip to home |
| BACKUP-004 | Browse for backup file | Click Browse → Select .hs360 file | File picker opens, can select backup |
| BACKUP-005 | Invalid file format | Select non-.hs360 file | Error shown, file rejected |
| BACKUP-006 | Start fresh | Click "Start Fresh" | Proceed to role selection |
| BACKUP-007 | Corrupted backup | Try restore corrupted file | Error shown gracefully |

### 1.4 Role Selection & Onboarding (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| ROLE-001 | Select Home User mode | Tap "Home User" | Navigate to home user onboarding |
| ROLE-002 | Select Staff mode | Tap "Staff" | Navigate to staff onboarding |
| ROLE-003 | Complete onboarding | Fill required fields → Continue | Onboarding marked complete |
| ROLE-004 | Skip optional fields | Leave optional fields empty | Can still proceed |

### 1.5 PIN Security (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| PIN-001 | Setup PIN | Settings → Enable PIN → Enter 4-digit PIN | PIN enabled |
| PIN-002 | Confirm PIN mismatch | Enter different confirmation | Error, must match |
| PIN-003 | Enter correct PIN | Launch app → Enter PIN | Access granted |
| PIN-004 | Enter wrong PIN | Enter wrong PIN 3 times | Show warning/lockout |
| PIN-005 | Disable PIN | Settings → Disable PIN → Confirm password | PIN disabled |

---

## Module 2: Home User Mode

### 2.1 Dashboard/Home Screen (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| HOME-001 | View dashboard | Open app after login | Shows summary cards, quick actions |
| HOME-002 | View pending payables | Check payables card | Shows count of pending payments |
| HOME-003 | Quick add staff | Tap + on staff card | Navigate to add person |
| HOME-004 | Navigate to modules | Tap bottom nav items | Navigate to respective screens |
| HOME-005 | Pull to refresh | Pull down on home | Data refreshes |

### 2.2 Staff/People Management (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| STAFF-001 | Add new staff | People → + → Fill details → Save | Staff created |
| STAFF-002 | View staff list | Navigate to People | Shows all staff |
| STAFF-003 | View staff detail | Tap on staff | Shows full profile |
| STAFF-004 | Edit staff | Detail → Edit → Update → Save | Staff updated |
| STAFF-005 | Delete staff | Detail → Delete → Confirm | Staff removed |
| STAFF-006 | Add staff photo | Add/Edit → Select photo | Photo uploaded (512x512) |
| STAFF-007 | Duplicate phone check | Add staff with existing phone | Error: duplicate prevented |
| STAFF-008 | Search/filter staff | Use search bar | Filters list |
| STAFF-009 | Self-connection prevention | Add own phone number | Error: cannot add yourself |

### 2.3 Attendance Tracking (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| ATT-001 | Mark attendance present | Attendance → Select staff → Mark present | Attendance logged |
| ATT-002 | Mark attendance absent | Attendance → Select staff → Mark absent | Absence logged |
| ATT-003 | Add check-in time | Mark present with time | Time recorded |
| ATT-004 | Add check-out time | Add checkout to existing | Times recorded |
| ATT-005 | View attendance history | Attendance → View calendar | Shows attendance by date |
| ATT-006 | Edit attendance | Tap entry → Edit → Save | Entry updated |
| ATT-007 | Delete attendance | Tap entry → Delete → Confirm | Entry removed |
| ATT-008 | Filter by date | Select date range | Shows filtered results |
| ATT-009 | Filter by staff | Select staff | Shows that staff only |

### 2.4 Transactions/Payments (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| TXN-001 | Add salary payment | Add transaction → Type: Payment | Transaction recorded |
| TXN-002 | Add advance | Add transaction → Type: Advance | Advance recorded |
| TXN-003 | Add deduction | Add transaction → Type: Deduction | Deduction recorded |
| TXN-004 | View payables | Payables screen | Shows pending amounts |
| TXN-005 | Quick pay | Tap "Pay" on payable | Pre-filled payment form |
| TXN-006 | View transaction history | Transactions screen | Shows all transactions |
| TXN-007 | Filter transactions | Apply date/type filters | Filtered results |
| TXN-008 | Multi-currency support | Set different currency | Displays correct symbol |

### 2.5 Laundry Tracking (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| LAUNDRY-001 | Add laundry batch | Add laundry → Select items → Submit | Batch created |
| LAUNDRY-002 | Track laundry status | View batch → Check status | Shows current status |
| LAUNDRY-003 | Update laundry status | Edit batch → Change status | Status updated |
| LAUNDRY-004 | View laundry history | Laundry screen | Shows all batches |
| LAUNDRY-005 | Associate with staff | Add laundry for staff | Linked to staff profile |

### 2.6 Expenses (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| EXP-001 | Add expense | Expenses → + → Fill details → Save | Expense recorded |
| EXP-002 | Add expense with receipt | Add expense → Attach photo | Photo attached |
| EXP-003 | Categorize expense | Select category | Category saved |
| EXP-004 | View expense calendar | Calendar view | Shows expenses by date |
| EXP-005 | Edit expense | Tap → Edit → Save | Expense updated |
| EXP-006 | Delete expense | Tap → Delete → Confirm | Expense removed |
| EXP-007 | Filter by category | Apply category filter | Filtered results |

### 2.7 Documents (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| DOC-001 | Add document | Documents → + → Select file → Save | Document stored |
| DOC-002 | View document | Tap document | Opens viewer |
| DOC-003 | Delete document | Long press → Delete | Document removed |
| DOC-004 | Associate with staff | Add doc for staff | Linked to profile |
| DOC-005 | Search documents | Use search | Filters results |

### 2.8 Notes (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| NOTE-001 | Add note | Notes → + → Type content → Save | Note created |
| NOTE-002 | Edit note | Tap note → Edit → Save | Note updated |
| NOTE-003 | Delete note | Note → Delete → Confirm | Note removed |
| NOTE-004 | Pin note | Tap pin icon | Note pinned to top |
| NOTE-005 | Color code note | Select color | Color applied |
| NOTE-006 | Character limit | Type 20,000+ chars | Shows limit reached |

### 2.9 Households (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| HOUSE-001 | Add household | Households → + → Fill details | Household created |
| HOUSE-002 | Edit household | Tap → Edit → Save | Household updated |
| HOUSE-003 | Delete household | Tap → Delete → Confirm | Household removed |
| HOUSE-004 | Assign staff to household | Edit household → Select staff | Staff assigned |

### 2.10 Reports (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| RPT-001 | Generate attendance report | Reports → Attendance → Generate | Report created |
| RPT-002 | Generate payment report | Reports → Payments → Generate | Report created |
| RPT-003 | Generate expense report | Reports → Expenses → Generate | Report created |
| RPT-004 | Export to Excel | Report → Export | .xlsx downloaded |
| RPT-005 | Share report | Report → Share | Share dialog opens |
| RPT-006 | Filter report by date | Select date range | Filtered data |

### 2.11 Settings (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| SET-001 | Change language | Settings → Language → Select | UI updates to selected |
| SET-002 | Change currency | Settings → Currency → Select | Currency symbol changes |
| SET-003 | Toggle dark mode | Settings → Theme → Dark | App switches to dark |
| SET-004 | Enable backup | Settings → Auto backup → Enable | Backup scheduled |
| SET-005 | Set backup frequency | Select daily/weekly/monthly | Frequency saved |
| SET-006 | Enable attendance reminder | Settings → Reminders → Enable | Reminder scheduled |
| SET-007 | Set reminder time | Select time | Time saved |
| SET-008 | View privacy policy | Settings → Privacy Policy | Policy displayed |
| SET-009 | View subscription | Settings → Subscription | Shows plan details |

### 2.12 Backup & Restore (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| BKP-001 | Manual backup | Backup → Create backup | .hs360 file created |
| BKP-002 | Restore from backup | Backup → Restore → Select file | Data restored |
| BKP-003 | Auto backup runs | Wait for scheduled time | Backup created automatically |
| BKP-004 | Export data | Backup → Export | Data exported |

---

## Module 3: Staff User Mode

### 3.1 Staff Dashboard (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| SHOME-001 | View staff dashboard | Login as staff | Shows staff-specific dashboard |
| SHOME-002 | View earnings summary | Check earnings card | Shows total/pending amounts |
| SHOME-003 | Quick log attendance | Tap log attendance | Opens attendance form |

### 3.2 Client Homes (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| SCLIENT-001 | Add client home | Client homes → + → Fill → Save | Client created |
| SCLIENT-002 | View client list | Client homes screen | Shows all clients |
| SCLIENT-003 | Edit client | Tap → Edit → Save | Client updated |
| SCLIENT-004 | Delete client | Tap → Delete → Confirm | Client removed |
| SCLIENT-005 | Duplicate phone check | Add existing phone | Error: duplicate |

### 3.3 Staff Attendance (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| SATT-001 | Log attendance | Log attendance → Select client → Submit | Attendance logged |
| SATT-002 | View attendance history | Attendance screen | Shows all entries |
| SATT-003 | Edit attendance | Tap → Edit → Save | Entry updated |
| SATT-004 | Delete attendance | Tap → Delete → Confirm | Entry removed |

### 3.4 Staff Earnings (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| SEARN-001 | View earnings | Earnings screen | Shows payment history |
| SEARN-002 | Filter by client | Select client filter | Shows filtered |
| SEARN-003 | Filter by date | Select date range | Shows filtered |

### 3.5 Staff Invoices (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| SINV-001 | Create invoice | Invoices → + → Fill → Save | Invoice created |
| SINV-002 | View invoices | Invoices screen | Shows all invoices |
| SINV-003 | Edit invoice | Tap → Edit → Save | Invoice updated |
| SINV-004 | Delete invoice | Tap → Delete → Confirm | Invoice removed |
| SINV-005 | Share invoice | Invoice → Share | Share dialog opens |

### 3.6 Staff Expenses (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| SEXP-001 | Add expense | Expenses → + → Fill → Save | Expense recorded |
| SEXP-002 | View expenses | Expenses screen | Shows all expenses |
| SEXP-003 | Edit expense | Tap → Edit → Save | Expense updated |
| SEXP-004 | Delete expense | Tap → Delete → Confirm | Expense removed |

### 3.7 Staff Laundry (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| SLAUND-001 | Log laundry | Log laundry → Fill → Submit | Laundry logged |
| SLAUND-002 | View laundry history | Laundry screen | Shows all batches |
| SLAUND-003 | Edit laundry | Tap → Edit → Save | Entry updated |

### 3.8 Staff Documents & Reports (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| SDOC-001 | Add document | Documents → + → Upload | Document stored |
| SRPT-001 | Generate report | Reports → Select type → Generate | Report created |

---

## Module 4: Collaboration Features

### 4.1 Connections (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| CONN-001 | Search for user | Connections → Search → Enter phone | User found or not |
| CONN-002 | Send invite | Search → Send invite | Invite sent |
| CONN-003 | Receive invite | Other user sends | Shows in received invites |
| CONN-004 | Accept invite | Received → Accept | Connection established |
| CONN-005 | Reject invite | Received → Reject | Invite rejected |
| CONN-006 | View connections | Connections tab | Shows all connections |
| CONN-007 | Remove connection | Connection → Remove → Confirm | Connection removed |

### 4.2 Chat/Messages (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| CHAT-001 | Send message | Open chat → Type → Send | Message sent |
| CHAT-002 | Receive message | Other user sends | Message appears |
| CHAT-003 | View message history | Open chat | Shows all messages |
| CHAT-004 | Real-time updates | Other sends while viewing | Instant update |
| CHAT-005 | Message with profile pic | Send message | Shows sender avatar |

### 4.3 Shared Spaces (P2)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| SHARE-001 | Create shared space | Shared spaces → Create | Space created |
| SHARE-002 | Share attendance | Submit attendance for approval | Sent to connected user |
| SHARE-003 | Share laundry | Submit laundry for approval | Sent to connected user |

### 4.4 Approvals (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| APPR-001 | View pending approvals | Approvals → Pending | Shows items needing action |
| APPR-002 | Approve item | View → Approve | Item approved |
| APPR-003 | Reject item | View → Reject | Item rejected |
| APPR-004 | Approval notification | Item approved/rejected | Notification sent |

### 4.5 Notifications (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| NOTIF-001 | View notifications | Notification center | Shows all notifications |
| NOTIF-002 | Mark as read | Tap notification | Marked read |
| NOTIF-003 | Mark all read | Mark all as read | All marked |
| NOTIF-004 | Delete notification | Swipe → Delete | Notification removed |
| NOTIF-005 | Clear all | Clear all | All removed |

---

## Module 5: Super Admin Portal

### 5.1 Admin Authentication (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| ADMIN-001 | Admin login | Enter credentials → Submit | Logged in to dashboard |
| ADMIN-002 | Invalid credentials | Wrong email/password | Error shown |
| ADMIN-003 | Change password | Profile → Change password | Password updated |
| ADMIN-004 | Session timeout | Idle for period | Logged out |

### 5.2 Dashboard (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| DASH-001 | View user stats | Open dashboard | Shows total users, active, etc |
| DASH-002 | View subscription stats | Dashboard | Shows subscriber counts |
| DASH-003 | View charts | Dashboard | Charts render correctly |
| DASH-004 | Refresh data | Refresh | Data updates |

### 5.3 User Management (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| USER-001 | View user list | Users menu | Shows all users |
| USER-002 | Search users | Search by phone/name | Filtered results |
| USER-003 | View user detail | Click user | Shows full info |
| USER-004 | Suspend user | User → Suspend | User suspended |
| USER-005 | Reactivate user | User → Reactivate | User active again |
| USER-006 | Filter by status | Select filter | Filtered results |
| USER-007 | Export user list | Export | CSV/Excel downloaded |

### 5.4 Backups (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| ABKP-001 | View backups | Backups menu | Shows backup stats |
| ABKP-002 | Manage backup settings | Settings | Can configure |

### 5.5 Maintenance Mode (P0)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| MAINT-001 | Enable maintenance | Toggle on | App shows maintenance banner |
| MAINT-002 | Disable maintenance | Toggle off | App works normally |
| MAINT-003 | Set maintenance message | Enter message | Message displayed |
| MAINT-004 | Schedule maintenance | Set date/time | Scheduled |

### 5.6 Ads Management (P2)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| ADS-001 | View ad placements | Ads menu | Shows all placements |
| ADS-002 | Configure ad | Select → Configure | Settings saved |
| ADS-003 | Enable/disable ads | Toggle | Ads toggled |

### 5.7 Roles & Permissions (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| ROLE-001 | View roles | Roles menu | Shows all roles |
| ROLE-002 | Create role | + → Fill → Save | Role created |
| ROLE-003 | Edit permissions | Role → Edit perms | Permissions updated |
| ROLE-004 | Delete role | Role → Delete | Role removed |

### 5.8 Team Management (P1)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| TEAM-001 | View team members | Team menu | Shows all admins |
| TEAM-002 | Add team member | + → Fill → Save | Member added |
| TEAM-003 | Edit member | Member → Edit | Member updated |
| TEAM-004 | Remove member | Member → Remove | Member removed |
| TEAM-005 | Assign role | Member → Assign role | Role assigned |

---

## Test Execution Priority

### Phase 1: Critical Path (P0)
Execute all P0 tests first to ensure core functionality works:
- Authentication flow
- Permissions flow
- Backup restore flow
- Core CRUD operations (Staff, Attendance, Transactions)
- Admin login and dashboard
- Maintenance mode

### Phase 2: High Priority (P1)
- Collaboration features
- Settings and preferences
- Reports and exports
- Staff mode operations
- Admin user management

### Phase 3: Medium Priority (P2)
- Shared spaces
- Ads management
- Edge cases and error handling

### Phase 4: Low Priority (P3)
- Cosmetic features
- Analytics accuracy
- Performance optimization

---

## Acceptance Criteria

Each test should verify:
1. **UI Response:** Correct visual feedback with data-testid selectors
2. **Data Persistence:** Changes saved to local storage/server
3. **Error Handling:** Graceful error messages for failures
4. **Navigation:** Correct screen transitions
5. **Side Effects:** Notifications, backups, reminders triggered appropriately
