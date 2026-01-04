# Home Staff 360 - Comprehensive Test Cases

## Test Coverage Summary

| Category | Test Cases |
|----------|-----------|
| Home User Mode | 450 |
| Staff User Mode | 350 |
| Common Features | 200 |
| **Total** | **1000** |

---

## PART A: HOME USER MODE (450 Test Cases)

### A1. Onboarding & Setup (30 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| A1-001 | Fresh app launch | Open app for first time | Splash screen shows, then role selection |
| A1-002 | Select Home User mode | Tap "Home User" option | Onboarding carousel appears |
| A1-003 | Complete onboarding slides | Swipe through all slides | Setup screen appears |
| A1-004 | Skip onboarding | Tap "Skip" button | Setup screen appears |
| A1-005 | Enter household name | Type "My Home" | Name saved correctly |
| A1-006 | Select language - English | Choose English | App displays in English |
| A1-007 | Select language - Hindi | Choose Hindi | App displays in Hindi |
| A1-008 | Select language - Gujarati | Choose Gujarati | App displays in Gujarati |
| A1-009 | Select language - Tamil | Choose Tamil | App displays in Tamil |
| A1-010 | Select language - Telugu | Choose Telugu | App displays in Telugu |
| A1-011 | Select language - Kannada | Choose Kannada | App displays in Kannada |
| A1-012 | Select language - Malayalam | Choose Malayalam | App displays in Malayalam |
| A1-013 | Select language - Marathi | Choose Marathi | App displays in Marathi |
| A1-014 | Select language - Bengali | Choose Bengali | App displays in Bengali |
| A1-015 | Select language - Punjabi | Choose Punjabi | App displays in Punjabi |
| A1-016 | Select currency - INR | Choose INR | Currency symbol shows ₹ |
| A1-017 | Select currency - USD | Choose USD | Currency symbol shows $ |
| A1-018 | Select currency - EUR | Choose EUR | Currency symbol shows € |
| A1-019 | Select currency - GBP | Choose GBP | Currency symbol shows £ |
| A1-020 | Select currency - AED | Choose AED | Currency symbol shows د.إ |
| A1-021 | Custom currency symbol | Enter custom symbol "Kr" | Custom symbol displays |
| A1-022 | Set salary start day - 1st | Select day 1 | Salary cycle starts on 1st |
| A1-023 | Set salary start day - 15th | Select day 15 | Salary cycle starts on 15th |
| A1-024 | Set half-day percentage - 50% | Enter 50 | Half day calculates at 50% |
| A1-025 | Set half-day percentage - 40% | Enter 40 | Half day calculates at 40% |
| A1-026 | Complete setup | Tap "Get Started" | Home dashboard appears |
| A1-027 | Verify onboarding complete flag | Check localStorage | hasCompletedOnboarding = true |
| A1-028 | Re-launch app after setup | Close and reopen app | Goes directly to home screen |
| A1-029 | Language typeahead search | Type "Hin" in language selector | Hindi appears in filtered list |
| A1-030 | Currency typeahead search | Type "Rup" in currency selector | INR appears in filtered list |

### A2. Household Management (20 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| A2-001 | View households list | Navigate to Households | List shows all households |
| A2-002 | Add first household | Tap Add, enter "Main Home" | Household created |
| A2-003 | Add second household | Tap Add, enter "Beach House" | Second household added |
| A2-004 | Household limit check (10) | Try adding 11th household | Warning message appears |
| A2-005 | Edit household name | Tap edit, change name | Name updated |
| A2-006 | Delete household | Tap delete, confirm | Household removed |
| A2-007 | Delete household cascades | Delete household with staff | Staff also deleted |
| A2-008 | Switch active household | Tap different household | Context switches |
| A2-009 | Household with description | Add description field | Description saved |
| A2-010 | Empty household name validation | Submit empty name | Error shown |
| A2-011 | Duplicate household name | Add same name twice | Allowed (no restriction) |
| A2-012 | Household count display | View home screen | Shows "X households" |
| A2-013 | Default household auto-select | Create first household | Auto-selected as active |
| A2-014 | No household state | Delete all households | Prompt to create one |
| A2-015 | Household data isolation | Switch households | Different staff shown |
| A2-016 | Household in reports | Generate report | Shows household name |
| A2-017 | Household in backup | Export backup | Household data included |
| A2-018 | Restore household from backup | Import backup | Household restored |
| A2-019 | Show all contexts toggle ON | Enable "Show All" | All household data visible |
| A2-020 | Show all contexts toggle OFF | Disable "Show All" | Only active household data |

### A3. Staff Management (60 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| A3-001 | View empty staff list | Navigate to Staff | "No staff" message shown |
| A3-002 | Add staff - Maid | Add with role "Maid" | Staff created |
| A3-003 | Add staff - Cook | Add with role "Cook" | Staff created |
| A3-004 | Add staff - Driver | Add with role "Driver" | Staff created |
| A3-005 | Add staff - Nanny | Add with role "Nanny" | Staff created |
| A3-006 | Add staff - Gardener | Add with role "Gardener" | Staff created |
| A3-007 | Add staff - Watchman | Add with role "Watchman" | Staff created |
| A3-008 | Add staff - Custom role | Add with role "Helper" | Staff created |
| A3-009 | Staff name required | Submit without name | Error shown |
| A3-010 | Staff phone required | Submit without phone | Error shown |
| A3-011 | Staff phone validation | Enter 5 digits | Error for min 10 digits |
| A3-012 | Staff phone valid | Enter 10 digits | Accepted |
| A3-013 | Salary type - Monthly | Select Monthly | Monthly calculation used |
| A3-014 | Salary type - Daily | Select Daily | Daily calculation used |
| A3-015 | Salary type - Hourly | Select Hourly | Hourly calculation used |
| A3-016 | Base rate - Monthly 10000 | Enter 10000 | Saved correctly |
| A3-017 | Base rate - Daily 500 | Enter 500 | Saved correctly |
| A3-018 | Base rate - Hourly 100 | Enter 100 | Saved correctly |
| A3-019 | Half day percentage override | Set 60% for staff | Uses 60% not global |
| A3-020 | Staff notes field | Add detailed notes | Notes saved |
| A3-021 | Staff photo upload | Attach photo | Photo displayed |
| A3-022 | Staff photo compression | Upload large image | Compressed to 80% JPEG |
| A3-023 | Staff photo size limit | Upload 6MB image | Error or auto-compress |
| A3-024 | Edit staff name | Change name | Updated in list |
| A3-025 | Edit staff phone | Change phone | Updated |
| A3-026 | Edit staff salary | Change base rate | Updated |
| A3-027 | Edit staff role | Change role | Updated |
| A3-028 | Delete staff | Delete with confirm | Staff removed |
| A3-029 | Delete staff cascades attendance | Delete staff | Attendance records deleted |
| A3-030 | Delete staff cascades transactions | Delete staff | Transactions deleted |
| A3-031 | Mark staff inactive | Toggle isActive OFF | Staff hidden from active list |
| A3-032 | View inactive staff | Show inactive filter | Inactive staff visible |
| A3-033 | Reactivate staff | Toggle isActive ON | Staff appears in active list |
| A3-034 | Staff count on home | View home dashboard | Correct count shown |
| A3-035 | Staff list sorting | View list | Sorted alphabetically |
| A3-036 | Staff search | Type in search | Filtered results |
| A3-037 | Staff detail view | Tap staff card | Detail screen opens |
| A3-038 | Staff calendar view | Open calendar | Attendance calendar shown |
| A3-039 | Staff currency override | Set different currency | Staff uses own currency |
| A3-040 | Staff custom currency symbol | Set custom symbol | Custom symbol shown |
| A3-041 | Multiple staff same role | Add 3 maids | All shown correctly |
| A3-042 | Staff with zero salary | Enter 0 base rate | Allowed |
| A3-043 | Staff with high salary | Enter 1000000 | Allowed |
| A3-044 | Staff phone with country code | Enter +91XXXXXXXXXX | Accepted |
| A3-045 | Staff long name | Enter 100 char name | Accepted, truncated in UI |
| A3-046 | Staff special characters name | Enter "José García" | Accepted |
| A3-047 | Staff Arabic name | Enter Arabic script | Accepted |
| A3-048 | Staff Hindi name | Enter Devanagari | Accepted |
| A3-049 | Staff in multiple households | Switch context | Different staff per household |
| A3-050 | Staff photo remove | Delete existing photo | Photo removed |
| A3-051 | Staff joining date | View staff detail | Shows createdAt date |
| A3-052 | Staff balance calculation | View total due | Correct balance shown |
| A3-053 | Staff this month attendance | View dashboard | Current month stats |
| A3-054 | Staff this month earnings | View dashboard | Current month amount |
| A3-055 | Staff pending payments | View payables | Shows unpaid amounts |
| A3-056 | Staff payment history | View transactions | All payments listed |
| A3-057 | Staff attendance history | View attendance | All records listed |
| A3-058 | Staff documents | Attach ID document | Document saved |
| A3-059 | Staff multiple documents | Attach 3 documents | All saved |
| A3-060 | Staff document delete | Remove document | Document deleted |

### A4. Attendance Tracking (80 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| A4-001 | Mark attendance - Full Day | Select FULL for today | Recorded as full day |
| A4-002 | Mark attendance - Half Day | Select HALF for today | Recorded as half day |
| A4-003 | Mark attendance - Absent | Select ABSENT for today | Recorded as absent |
| A4-004 | Attendance for past date | Select yesterday | Allowed |
| A4-005 | Attendance for future date | Select tomorrow | NOT allowed (validation) |
| A4-006 | Attendance date picker max | Check date picker | Max date is today |
| A4-007 | Attendance with note | Add "Late arrival" note | Note saved |
| A4-008 | Edit existing attendance | Change FULL to HALF | Updated |
| A4-009 | Delete attendance | Remove record | Deleted |
| A4-010 | Attendance auto-calculation Monthly | Mark 20 FULL days | Calculates 20/30 earnings |
| A4-011 | Attendance auto-calculation Daily | Mark 10 FULL days | Calculates 10 * daily rate |
| A4-012 | Attendance auto-calculation Hourly | Mark 8 hours | Calculates 8 * hourly rate |
| A4-013 | Half day calculation 50% | Mark HALF with 50% | Half of daily rate |
| A4-014 | Half day calculation 40% | Mark HALF with 40% | 40% of daily rate |
| A4-015 | Multiple staff same day | Mark for 3 staff | All recorded |
| A4-016 | Bulk attendance entry | Quick entry mode | Multiple staff at once |
| A4-017 | Calendar view - current month | Open calendar | Current month displayed |
| A4-018 | Calendar view - past month | Navigate back | Past month shown |
| A4-019 | Calendar color coding - FULL | View calendar | Green for full days |
| A4-020 | Calendar color coding - HALF | View calendar | Yellow for half days |
| A4-021 | Calendar color coding - ABSENT | View calendar | Red for absent |
| A4-022 | Calendar tap to edit | Tap colored date | Edit screen opens |
| A4-023 | Attendance summary stats | View person detail | Shows FULL/HALF/ABSENT count |
| A4-024 | Monthly attendance count | View report | Correct totals |
| A4-025 | Attendance across months | Mark in Jan and Feb | Both months have data |
| A4-026 | Attendance record currency snapshot | Mark attendance | Records current currency |
| A4-027 | Attendance record rate snapshot | Mark attendance | Records current base rate |
| A4-028 | Duplicate attendance same day | Try marking twice | Updates existing record |
| A4-029 | Attendance list view | View all attendance | Chronological list |
| A4-030 | Filter attendance by person | Select staff filter | Only that staff shown |
| A4-031 | Filter attendance by date range | Select date range | Filtered results |
| A4-032 | Attendance export in report | Generate report | Attendance included |
| A4-033 | Attendance affects payable | Mark 25 FULL days | Payable amount increases |
| A4-034 | No attendance recorded | New staff, no marks | Shows 0 days |
| A4-035 | Attendance for inactive staff | Mark for inactive | Allowed |
| A4-036 | Hourly attendance with hours | Enter 4 hours | 4 * hourly rate calculated |
| A4-037 | Hourly attendance max hours | Enter 24 hours | Allowed |
| A4-038 | Hourly attendance 0 hours | Enter 0 hours | Not allowed |
| A4-039 | Attendance across year boundary | Dec 31 to Jan 1 | Both recorded correctly |
| A4-040 | Attendance timezone handling | Mark at 11:59 PM | Correct date saved |
| A4-041 | Leap year Feb 29 | Mark on Feb 29 | Recorded correctly |
| A4-042 | Attendance persistence | Mark, close app, reopen | Data persists |
| A4-043 | Attendance in backup | Export backup | Attendance included |
| A4-044 | Restore attendance | Import backup | Attendance restored |
| A4-045 | Attendance triggers recalculation | Mark attendance | Balance updated |
| A4-046 | Sunday attendance | Mark on Sunday | Allowed |
| A4-047 | Holiday attendance | Mark on holiday | Allowed (no special handling) |
| A4-048 | Attendance for day 1 of month | Mark on 1st | Recorded |
| A4-049 | Attendance for day 31 | Mark on 31st | Recorded |
| A4-050 | Attendance quick mark today | Home screen shortcut | Marks for today |
| A4-051 | Attendance today indicator | Calendar view | Today highlighted |
| A4-052 | Attendance yesterday indicator | Calendar view | Yesterday different style |
| A4-053 | Attendance streak display | View person | Consecutive days shown |
| A4-054 | Attendance gap detection | View person | Gap days visible |
| A4-055 | Salary cycle boundary | Mark around salary date | Correct period calculation |
| A4-056 | Salary cycle start day 1 | Calculate Jan 1-31 | Correct period |
| A4-057 | Salary cycle start day 15 | Calculate 15th-14th | Correct period |
| A4-058 | Mid-month joining | Staff joined 15th | Prorated calculation |
| A4-059 | Attendance affects report | Generate salary report | Uses attendance data |
| A4-060 | Attendance empty month | No marks for month | Shows 0 |
| A4-061 | Attendance all FULL month | 30 FULL days | Full salary |
| A4-062 | Attendance all ABSENT month | 30 ABSENT days | Zero earnings |
| A4-063 | Attendance mixed month | 15 FULL, 10 HALF, 5 ABSENT | Correct calculation |
| A4-064 | Attendance note long text | Enter 500 char note | Saved correctly |
| A4-065 | Attendance note special chars | Enter note with emojis | Saved (emojis stripped) |
| A4-066 | Attendance undo | Mark then undo | Reverted |
| A4-067 | Attendance validation error | Invalid date format | Error shown |
| A4-068 | Attendance loading state | Mark while saving | Loading indicator |
| A4-069 | Attendance offline mode | Mark with no network | Works (offline-first) |
| A4-070 | Attendance data size | 1000 records | App performs well |
| A4-071 | Attendance scroll performance | Scroll long list | Smooth scrolling |
| A4-072 | Attendance filter clear | Clear all filters | Shows all records |
| A4-073 | Attendance sort by date | Sort ascending | Oldest first |
| A4-074 | Attendance sort by date desc | Sort descending | Newest first |
| A4-075 | Attendance group by month | View grouped | Monthly sections |
| A4-076 | Attendance in show all mode | Enable show all | All households' attendance |
| A4-077 | Attendance per household | Switch household | Different records |
| A4-078 | Attendance record immutable rate | View old record | Shows original rate |
| A4-079 | Attendance affects home stats | Mark attendance | Dashboard updates |
| A4-080 | Attendance today status | View home | Shows who worked today |

### A5. Transactions/Payments (70 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| A5-001 | Add payment transaction | Amount: 10000, Category: Payment | Payment recorded |
| A5-002 | Add advance transaction | Amount: 2000, Category: Advance | Advance recorded |
| A5-003 | Add deduction transaction | Amount: 500, Category: Deduction | Deduction recorded |
| A5-004 | Add other transaction | Amount: 1000, Category: Other | Transaction recorded |
| A5-005 | Transaction description | Enter "Monthly salary" | Description saved |
| A5-006 | Transaction number | Enter "TXN123" | Reference saved |
| A5-007 | Transaction date - today | Select today | Today's date saved |
| A5-008 | Transaction date - past | Select last week | Past date saved |
| A5-009 | Transaction date - future | Select next week | NOT allowed |
| A5-010 | Transaction mark as paid | Toggle isPaid ON | Marked paid |
| A5-011 | Transaction mark as unpaid | Toggle isPaid OFF | Marked unpaid |
| A5-012 | Edit transaction amount | Change 10000 to 12000 | Updated |
| A5-013 | Edit transaction category | Change Payment to Advance | Updated |
| A5-014 | Delete transaction | Delete with confirm | Removed |
| A5-015 | Transaction for specific staff | Select staff | Linked correctly |
| A5-016 | Transaction affects balance | Add payment | Balance decreases |
| A5-017 | Advance increases balance | Add advance | Balance increases |
| A5-018 | Deduction decreases balance | Add deduction | Balance decreases |
| A5-019 | Transaction list view | View all transactions | Chronological list |
| A5-020 | Filter by staff | Select staff filter | Only that staff shown |
| A5-021 | Filter by category | Select Payment | Only payments shown |
| A5-022 | Filter by date range | Select range | Filtered results |
| A5-023 | Filter by paid status | Select unpaid | Only unpaid shown |
| A5-024 | Transaction currency snapshot | Add transaction | Records current currency |
| A5-025 | Transaction zero amount | Enter 0 | Not allowed |
| A5-026 | Transaction negative amount | Enter -1000 | Not allowed |
| A5-027 | Transaction large amount | Enter 10000000 | Allowed |
| A5-028 | Transaction decimal amount | Enter 1500.50 | Allowed |
| A5-029 | Transaction empty description | Submit without desc | Allowed |
| A5-030 | Transaction persistence | Add, close app, reopen | Data persists |
| A5-031 | Transaction in backup | Export backup | Transactions included |
| A5-032 | Restore transactions | Import backup | Transactions restored |
| A5-033 | Transaction summary | View totals | Correct sums |
| A5-034 | Payments vs Advances balance | View balance | (Attendance earnings) - (Payments) + (Advances) - (Deductions) |
| A5-035 | Transaction affects report | Generate report | Transactions included |
| A5-036 | Payables screen | View payables | Shows pending amounts |
| A5-037 | Pay from payables | Mark as paid | Updated to paid |
| A5-038 | Payables calculation | View calculated amount | Correct based on attendance |
| A5-039 | Bulk payment | Pay multiple at once | All marked paid |
| A5-040 | Transaction sort by date | Sort ascending | Oldest first |
| A5-041 | Transaction sort by amount | Sort by amount | Sorted correctly |
| A5-042 | Transaction group by month | View grouped | Monthly sections |
| A5-043 | Transaction for inactive staff | Add for inactive | Allowed |
| A5-044 | Delete staff with transactions | Delete staff | Transactions also deleted |
| A5-045 | Transaction across households | Switch household | Different transactions |
| A5-046 | Transaction in show all mode | Enable show all | All transactions visible |
| A5-047 | Transaction loading state | Save transaction | Loading indicator |
| A5-048 | Transaction offline mode | Add offline | Works |
| A5-049 | Transaction scroll performance | 500 records | Smooth scrolling |
| A5-050 | Transaction empty state | No transactions | "No transactions" message |
| A5-051 | Quick payment from dashboard | Dashboard shortcut | Payment screen opens |
| A5-052 | Payment method - Cash | Select Cash | Saved |
| A5-053 | Payment method - UPI | Select UPI | Saved |
| A5-054 | Payment method - Bank Transfer | Select Bank Transfer | Saved |
| A5-055 | Payment method - Card | Select Card | Saved |
| A5-056 | Payment history by staff | View staff detail | Staff's transactions |
| A5-057 | Total paid this month | View dashboard | Correct total |
| A5-058 | Total pending this month | View dashboard | Correct pending |
| A5-059 | Transaction date validation | Invalid date | Error shown |
| A5-060 | Transaction amount validation | Non-numeric input | Error shown |
| A5-061 | Transaction required fields | Submit incomplete | Validation errors |
| A5-062 | Transaction success toast | Save transaction | Success message |
| A5-063 | Transaction delete confirm | Tap delete | Confirmation dialog |
| A5-064 | Transaction cancel | Start then cancel | No changes saved |
| A5-065 | Transaction auto-save | Fill and close | Data preserved |
| A5-066 | Transaction duplicate | Add same twice | Both recorded |
| A5-067 | Transaction display currency | View transaction | Shows correct symbol |
| A5-068 | Transaction rate change | Change staff rate after | Old transactions show old rate |
| A5-069 | Transaction export CSV | Export | Transactions in CSV |
| A5-070 | Transaction data integrity | Multiple operations | No data corruption |

### A6. Laundry Tracking (50 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| A6-001 | Add laundry batch | Create new batch | Batch created |
| A6-002 | Batch auto-number | Create batch | Auto-generated number |
| A6-003 | Add item - Shirt | Add 5 shirts @ ₹15 | Item added |
| A6-004 | Add item - Pants | Add 3 pants @ ₹20 | Item added |
| A6-005 | Add item - Saree | Add 2 sarees @ ₹50 | Item added |
| A6-006 | Add item - Bedsheet | Add 4 bedsheets @ ₹40 | Item added |
| A6-007 | Add item - Blanket | Add 1 blanket @ ₹100 | Item added |
| A6-008 | Add item - Curtain | Add 2 curtains @ ₹80 | Item added |
| A6-009 | Custom item type | Add "Cushion Cover" | Custom type saved |
| A6-010 | Item quantity validation | Enter 0 | Not allowed |
| A6-011 | Item price validation | Enter negative | Not allowed |
| A6-012 | Total items calculation | Add multiple items | Correct total count |
| A6-013 | Total amount calculation | Add multiple items | Correct total amount |
| A6-014 | Batch status - Sent | Set status | Shows as sent |
| A6-015 | Batch status - Processing | Set status | Shows as processing |
| A6-016 | Batch status - Ready | Set status | Shows as ready |
| A6-017 | Batch status - Delivered | Set status | Shows as delivered |
| A6-018 | Sent date | Enter sent date | Saved |
| A6-019 | Received date | Enter received date | Saved |
| A6-020 | Received date validation | Before sent date | Error shown |
| A6-021 | Mark batch paid | Toggle isPaid | Updated |
| A6-022 | Edit batch items | Modify quantities | Updated |
| A6-023 | Remove item from batch | Delete item | Item removed |
| A6-024 | Delete entire batch | Delete batch | Batch removed |
| A6-025 | Batch list view | View all batches | Listed correctly |
| A6-026 | Filter by status | Select Pending | Filtered |
| A6-027 | Filter by payment | Select Unpaid | Filtered |
| A6-028 | Batch detail view | Tap batch | Details shown |
| A6-029 | Batch currency snapshot | Create batch | Records currency |
| A6-030 | Batch persistence | Add, reopen | Data persists |
| A6-031 | Batch in backup | Export | Batches included |
| A6-032 | Restore batches | Import | Batches restored |
| A6-033 | Batch affects expenses | View reports | Laundry in expenses |
| A6-034 | Batch empty state | No batches | "No laundry" message |
| A6-035 | Quick add batch | Dashboard shortcut | Create screen opens |
| A6-036 | Batch item types list | Open item selector | All types shown |
| A6-037 | Batch item search | Search "shirt" | Filtered |
| A6-038 | Batch notes | Add notes | Saved |
| A6-039 | Batch long notes | 500 char notes | Saved |
| A6-040 | Batch sort by date | Sort | Chronological |
| A6-041 | Batch sort by amount | Sort | By total |
| A6-042 | Batch per household | Switch household | Different batches |
| A6-043 | Batch offline | Add offline | Works |
| A6-044 | Batch loading state | Save | Loading shown |
| A6-045 | Batch validation | Incomplete data | Errors shown |
| A6-046 | Batch cancel | Start then cancel | No data saved |
| A6-047 | Batch today indicator | Today's batch | Highlighted |
| A6-048 | Laundry this month total | View dashboard | Correct total |
| A6-049 | Laundry pending count | View dashboard | Correct count |
| A6-050 | Batch in report | Generate report | Laundry included |

### A7. Expense Management (60 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| A7-001 | Add expense - Utilities | Category: Utilities | Expense created |
| A7-002 | Add expense - Groceries | Category: Groceries | Expense created |
| A7-003 | Add expense - Maintenance | Category: Maintenance | Expense created |
| A7-004 | Add expense - Supplies | Category: Supplies | Expense created |
| A7-005 | Add expense - Rent | Category: Rent | Expense created |
| A7-006 | Add expense - Insurance | Category: Insurance | Expense created |
| A7-007 | Add expense - Transport | Category: Transport | Expense created |
| A7-008 | Add expense - Recurring Bill | Category: Recurring Bill | Expense created |
| A7-009 | Add expense - Other | Category: Other | Expense created |
| A7-010 | Expense description | Enter "Electricity bill" | Description saved |
| A7-011 | Expense amount | Enter 5000 | Amount saved |
| A7-012 | Expense date - today | Select today | Saved |
| A7-013 | Expense date - past | Select last month | Saved |
| A7-014 | Expense date - future | Select next month | NOT allowed |
| A7-015 | Mark expense paid | Toggle isPaid | Updated |
| A7-016 | Recurrence - None | Select None | One-time expense |
| A7-017 | Recurrence - Daily | Select Daily | Daily recurring |
| A7-018 | Recurrence - Weekly | Select Weekly | Weekly recurring |
| A7-019 | Recurrence - Monthly | Select Monthly | Monthly recurring |
| A7-020 | Recurrence - Yearly | Select Yearly | Yearly recurring |
| A7-021 | Edit expense | Change amount | Updated |
| A7-022 | Edit expense category | Change category | Updated |
| A7-023 | Delete expense | Delete | Removed |
| A7-024 | Expense list view | View all | Listed |
| A7-025 | Filter by category | Select Utilities | Filtered |
| A7-026 | Filter by date range | Select range | Filtered |
| A7-027 | Filter by paid status | Select Unpaid | Filtered |
| A7-028 | Expense calendar view | Open calendar | Expenses on calendar |
| A7-029 | Calendar day tap | Tap day | Expenses for that day |
| A7-030 | Expense currency snapshot | Add expense | Records currency |
| A7-031 | Expense zero amount | Enter 0 | Not allowed |
| A7-032 | Expense negative | Enter -100 | Not allowed |
| A7-033 | Expense large amount | Enter 1000000 | Allowed |
| A7-034 | Expense decimal | Enter 1234.56 | Allowed |
| A7-035 | Expense persistence | Add, reopen | Persists |
| A7-036 | Expense in backup | Export | Included |
| A7-037 | Restore expenses | Import | Restored |
| A7-038 | Expense total by category | View breakdown | Correct totals |
| A7-039 | Expense total this month | View dashboard | Correct total |
| A7-040 | Expense pending count | View dashboard | Correct count |
| A7-041 | Expense affects reports | Generate report | Expenses included |
| A7-042 | Expense empty state | No expenses | "No expenses" message |
| A7-043 | Quick add expense | Dashboard shortcut | Create screen opens |
| A7-044 | Expense sort by date | Sort | Chronological |
| A7-045 | Expense sort by amount | Sort | By amount |
| A7-046 | Expense group by category | View grouped | Category sections |
| A7-047 | Expense group by month | View grouped | Monthly sections |
| A7-048 | Expense per household | Switch household | Different expenses |
| A7-049 | Expense offline | Add offline | Works |
| A7-050 | Expense loading state | Save | Loading shown |
| A7-051 | Expense validation | Incomplete | Errors shown |
| A7-052 | Expense cancel | Start then cancel | No data saved |
| A7-053 | Expense with attachment | Attach receipt | Saved |
| A7-054 | Expense attachment view | Tap attachment | Opens preview |
| A7-055 | Expense attachment delete | Delete attachment | Removed |
| A7-056 | Expense category icon | View list | Correct icons |
| A7-057 | Expense recurring indicator | View list | Icon for recurring |
| A7-058 | Expense overdue indicator | Past due date | Visual indicator |
| A7-059 | Expense search | Search "electric" | Filtered |
| A7-060 | Expense data integrity | Multiple ops | No corruption |

### A8. Documents (30 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| A8-001 | Upload document - Image | Upload JPG | Saved |
| A8-002 | Upload document - PNG | Upload PNG | Saved |
| A8-003 | Document compression | Upload 4MB image | Compressed |
| A8-004 | Document size limit | Upload 6MB | Error or compress |
| A8-005 | Document name | Set custom name | Saved |
| A8-006 | Document description | Add description | Saved |
| A8-007 | Link document to staff | Select staff | Linked |
| A8-008 | Link document to expense | Select expense | Linked |
| A8-009 | Document list view | View all | Listed |
| A8-010 | Document preview | Tap document | Preview shown |
| A8-011 | Document download | Tap download | Downloads |
| A8-012 | Document delete | Delete | Removed |
| A8-013 | Document filter by type | Filter images | Filtered |
| A8-014 | Document search | Search by name | Filtered |
| A8-015 | Document per household | Switch | Different docs |
| A8-016 | Document persistence | Upload, reopen | Persists |
| A8-017 | Document in backup | Export | Included |
| A8-018 | Restore documents | Import | Restored |
| A8-019 | Document empty state | No docs | Message shown |
| A8-020 | Document offline | Upload offline | Works |
| A8-021 | Document loading | Upload | Progress shown |
| A8-022 | Document cancel upload | Cancel | Aborted |
| A8-023 | Document validation | No file | Error |
| A8-024 | Multiple documents | Upload 10 | All saved |
| A8-025 | Document sort by date | Sort | Chronological |
| A8-026 | Document sort by name | Sort | Alphabetical |
| A8-027 | Document linked record delete | Delete staff | Document unlinked |
| A8-028 | Document max resolution | 4000x4000 | Resized to 1920 |
| A8-029 | Document Base64 storage | View localStorage | Base64 string |
| A8-030 | Document affects storage | View storage used | Counted |

### A9. Reports & Export (50 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| A9-001 | Generate salary report | Select Salary Report | Report generated |
| A9-002 | Generate attendance report | Select Attendance | Report generated |
| A9-003 | Generate expense report | Select Expenses | Report generated |
| A9-004 | Generate laundry report | Select Laundry | Report generated |
| A9-005 | Report date range - This month | Select current | Correct data |
| A9-006 | Report date range - Last month | Select previous | Correct data |
| A9-007 | Report date range - Custom | Select custom range | Correct data |
| A9-008 | Report filter by staff | Select specific staff | Filtered |
| A9-009 | Report filter by category | Select category | Filtered |
| A9-010 | Report preview | Generate | Preview shown |
| A9-011 | Export CSV | Tap Export CSV | CSV downloaded |
| A9-012 | CSV encoding | Open CSV | UTF-8, correct chars |
| A9-013 | CSV headers | Open CSV | Correct headers |
| A9-014 | CSV data rows | Open CSV | Correct data |
| A9-015 | CSV special characters | Name with comma | Properly escaped |
| A9-016 | CSV currency symbols | View amounts | Symbols included |
| A9-017 | CSV date format | View dates | YYYY-MM-DD format |
| A9-018 | CSV large export | 500 records | Exports successfully |
| A9-019 | Report empty state | No data | "No data" message |
| A9-020 | Report loading | Generate | Loading indicator |
| A9-021 | Report charts | View summary | Charts displayed |
| A9-022 | Attendance chart | View | Bar/pie chart |
| A9-023 | Expense chart | View | Category breakdown |
| A9-024 | Salary chart | View | Staff breakdown |
| A9-025 | Report totals | View | Correct sums |
| A9-026 | Report per household | Switch | Different data |
| A9-027 | Report show all mode | Enable | All household data |
| A9-028 | Report print | Tap Print | Print dialog |
| A9-029 | Report share | Tap Share | Share options |
| A9-030 | Report offline | Generate offline | Works |
| A9-031 | Report currency | View | Correct symbol |
| A9-032 | Report date localization | View | Correct format |
| A9-033 | Report number localization | View | Correct format |
| A9-034 | Report scroll | Long report | Scrollable |
| A9-035 | Report performance | Large data | Reasonable time |
| A9-036 | Export filename | Download | Descriptive name |
| A9-037 | Export timestamp | Check file | Includes date |
| A9-038 | Monthly summary report | Generate | Month overview |
| A9-039 | Yearly summary report | Generate | Year overview |
| A9-040 | Staff-wise summary | Generate | Per-staff breakdown |
| A9-041 | Category-wise expenses | Generate | Per-category breakdown |
| A9-042 | Pending payments report | Generate | Unpaid list |
| A9-043 | Report re-generate | Generate again | Fresh data |
| A9-044 | Report data accuracy | Compare source | Matches records |
| A9-045 | Report calculations | Verify totals | Mathematically correct |
| A9-046 | Report with attachments | Include | Attachment links |
| A9-047 | Export with filters | Apply then export | Filtered data |
| A9-048 | Export all data | Full export | Everything included |
| A9-049 | Report household name | View header | Household shown |
| A9-050 | Report date generated | View footer | Timestamp shown |

---

## PART B: STAFF USER MODE (350 Test Cases)

### B1. Staff Mode Onboarding (20 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| B1-001 | Select Staff mode | Tap "Staff User" | Staff onboarding starts |
| B1-002 | Staff mode carousel | Swipe slides | All slides shown |
| B1-003 | Enter vendor/business name | Type name | Saved |
| B1-004 | Staff mode setup currency | Select INR | Currency set |
| B1-005 | Staff mode setup language | Select Hindi | Language set |
| B1-006 | Complete staff setup | Tap Get Started | Staff home shown |
| B1-007 | Staff tour auto-start | First time | Tour begins |
| B1-008 | Skip staff tour | Tap Skip | Tour ends |
| B1-009 | Replay staff tour | Settings > Replay | Tour restarts |
| B1-010 | Staff mode flag | Check profile | type = "STAFF" |
| B1-011 | Switch to Home mode | Settings > Switch | Mode changes |
| B1-012 | Switch back to Staff | Settings > Switch | Mode changes |
| B1-013 | Default mode setting | Set Staff default | Opens to Staff |
| B1-014 | Staff mode bottom nav | View | Correct tabs |
| B1-015 | Staff home dashboard | View | Staff-specific data |
| B1-016 | Staff mode persistence | Reopen app | Stays in Staff |
| B1-017 | Staff mode data isolation | Switch modes | Different data |
| B1-018 | Staff vendor name display | View header | Name shown |
| B1-019 | Staff currency display | View amounts | Correct symbol |
| B1-020 | Staff language display | View app | Correct language |

### B2. Business/Client Home Management (40 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| B2-001 | Add client home | Create new | Client added |
| B2-002 | Client name | Enter "Sharma Family" | Name saved |
| B2-003 | Client address | Enter address | Saved |
| B2-004 | Client phone | Enter 10 digits | Saved |
| B2-005 | Client profession/service | Select "Maid Service" | Saved |
| B2-006 | Client profession - Cooking | Select | Saved |
| B2-007 | Client profession - Laundry | Select "Laundry Service" | Enables laundry features |
| B2-008 | Client profession - Driver | Select | Saved |
| B2-009 | Client profession - Other | Select | Saved |
| B2-010 | Client rate setting | Enter monthly rate | Saved |
| B2-011 | Client currency | Set AED | Uses AED |
| B2-012 | Client custom currency | Set custom | Custom symbol |
| B2-013 | Client notes | Add notes | Saved |
| B2-014 | Edit client | Modify | Updated |
| B2-015 | Delete client | Delete | Removed |
| B2-016 | Delete client cascades | With records | Records deleted |
| B2-017 | Client limit (10) | Try 11th | Warning shown |
| B2-018 | Client list view | View all | Listed |
| B2-019 | Client search | Search by name | Filtered |
| B2-020 | Client filter active | Filter | Active only |
| B2-021 | Mark client inactive | Toggle | Marked inactive |
| B2-022 | Reactivate client | Toggle | Active again |
| B2-023 | Switch active client | Tap different | Context switches |
| B2-024 | Client count dashboard | View home | Correct count |
| B2-025 | Client empty state | No clients | Message shown |
| B2-026 | Client persistence | Add, reopen | Persists |
| B2-027 | Client in backup | Export | Included |
| B2-028 | Restore clients | Import | Restored |
| B2-029 | Client detail view | Tap client | Details shown |
| B2-030 | Client earnings view | View client | Earnings shown |
| B2-031 | Client attendance view | View client | Attendance shown |
| B2-032 | Client phone validation | 5 digits | Error |
| B2-033 | Client name required | Empty | Error |
| B2-034 | Client duplicate name | Same name | Allowed |
| B2-035 | Client photo | Upload photo | Saved |
| B2-036 | Client joining date | View | CreatedAt shown |
| B2-037 | Client this month earnings | View | Calculated |
| B2-038 | Client this month attendance | View | Calculated |
| B2-039 | Client last payment | View | Date shown |
| B2-040 | Client documents | Attach docs | Saved |

### B3. Staff Self-Attendance (40 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| B3-001 | Log attendance today | Mark for today | Recorded |
| B3-002 | Select client for attendance | Choose client | Linked |
| B3-003 | Attendance FULL | Mark full | Recorded |
| B3-004 | Attendance HALF | Mark half | Recorded |
| B3-005 | Attendance ABSENT | Mark absent | Recorded |
| B3-006 | Past date attendance | Select yesterday | Allowed |
| B3-007 | Future date attendance | Select tomorrow | NOT allowed |
| B3-008 | Attendance with note | Add note | Saved |
| B3-009 | Edit self attendance | Modify | Updated |
| B3-010 | Delete self attendance | Remove | Deleted |
| B3-011 | Multiple clients same day | Mark for 2 clients | Both recorded |
| B3-012 | Attendance earnings calc | Mark FULL | Earnings updated |
| B3-013 | Attendance calendar view | Open | Calendar shown |
| B3-014 | Calendar color coding | View | FULL/HALF/ABSENT colors |
| B3-015 | Attendance list view | View | Listed |
| B3-016 | Filter by client | Select client | Filtered |
| B3-017 | Filter by date | Select range | Filtered |
| B3-018 | Attendance summary | View stats | Correct counts |
| B3-019 | Monthly attendance count | View | Correct |
| B3-020 | Attendance persistence | Log, reopen | Persists |
| B3-021 | Attendance in backup | Export | Included |
| B3-022 | Restore attendance | Import | Restored |
| B3-023 | Attendance currency snapshot | Log | Records currency |
| B3-024 | Attendance rate snapshot | Log | Records rate |
| B3-025 | Quick log today | Home shortcut | Today's screen |
| B3-026 | Attendance today indicator | Calendar | Today highlighted |
| B3-027 | Attendance empty state | No logs | Message shown |
| B3-028 | Attendance offline | Log offline | Works |
| B3-029 | Attendance loading | Save | Loading shown |
| B3-030 | Hourly attendance | Log hours | Hours saved |
| B3-031 | Hours validation | 0 hours | Error |
| B3-032 | Hours max | 24 hours | Allowed |
| B3-033 | Attendance sort | By date | Chronological |
| B3-034 | Attendance group by client | View | Client sections |
| B3-035 | Attendance group by month | View | Month sections |
| B3-036 | Total days this month | View dashboard | Correct |
| B3-037 | Total earnings this month | View dashboard | Correct |
| B3-038 | Attendance affects earnings | Log | Earnings updated |
| B3-039 | Attendance in report | Generate | Included |
| B3-040 | Attendance export | CSV | Included |

### B4. Staff Earnings (30 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| B4-001 | Record earning | Add earning | Recorded |
| B4-002 | Earning from client | Select client | Linked |
| B4-003 | Earning amount | Enter 5000 | Saved |
| B4-004 | Earning description | Enter desc | Saved |
| B4-005 | Earning date | Select date | Saved |
| B4-006 | Mark earning received | Toggle | Received |
| B4-007 | Edit earning | Modify | Updated |
| B4-008 | Delete earning | Remove | Deleted |
| B4-009 | Earnings list view | View all | Listed |
| B4-010 | Filter by client | Select | Filtered |
| B4-011 | Filter by received | Toggle | Filtered |
| B4-012 | Filter by date | Range | Filtered |
| B4-013 | Total earnings | View sum | Correct |
| B4-014 | Pending earnings | View pending | Correct |
| B4-015 | Earnings by client | View breakdown | Correct |
| B4-016 | Earnings this month | Dashboard | Correct |
| B4-017 | Earnings persistence | Add, reopen | Persists |
| B4-018 | Earnings in backup | Export | Included |
| B4-019 | Restore earnings | Import | Restored |
| B4-020 | Earnings currency | View | Correct symbol |
| B4-021 | Earnings empty state | None | Message |
| B4-022 | Quick add earning | Shortcut | Screen opens |
| B4-023 | Earnings sort | By date | Chronological |
| B4-024 | Earnings group month | View | Month sections |
| B4-025 | Earning validation | No amount | Error |
| B4-026 | Earning zero | Enter 0 | Error |
| B4-027 | Earning negative | Enter -100 | Error |
| B4-028 | Earning in report | Generate | Included |
| B4-029 | Earning export | CSV | Included |
| B4-030 | Earnings offline | Add offline | Works |

### B5. Staff Laundry Jobs (40 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| B5-001 | Add laundry job | Create | Job created |
| B5-002 | Laundry only for Laundry Service | Other profession | Restricted |
| B5-003 | Select client for job | Choose client | Linked |
| B5-004 | Job items | Add items | Items saved |
| B5-005 | Job item type | Shirt | Saved |
| B5-006 | Job quantity | 10 | Saved |
| B5-007 | Job price per item | 15 | Saved |
| B5-008 | Job total calculation | View | Correct total |
| B5-009 | Job pickup date | Set date | Saved |
| B5-010 | Job delivery date | Set date | Saved |
| B5-011 | Job status - Pending | Set | Status saved |
| B5-012 | Job status - In Progress | Set | Status saved |
| B5-013 | Job status - Completed | Set | Status saved |
| B5-014 | Job status - Delivered | Set | Status saved |
| B5-015 | Mark job paid | Toggle | Marked |
| B5-016 | Edit job | Modify | Updated |
| B5-017 | Delete job | Remove | Deleted |
| B5-018 | Jobs list view | View | Listed |
| B5-019 | Filter by client | Select | Filtered |
| B5-020 | Filter by status | Select | Filtered |
| B5-021 | Filter by paid | Toggle | Filtered |
| B5-022 | Job earnings total | View | Correct |
| B5-023 | Pending jobs count | View | Correct |
| B5-024 | Jobs this month | Dashboard | Correct |
| B5-025 | Jobs persistence | Add, reopen | Persists |
| B5-026 | Jobs in backup | Export | Included |
| B5-027 | Restore jobs | Import | Restored |
| B5-028 | Job currency | View | Correct symbol |
| B5-029 | Job empty state | None | Message |
| B5-030 | Quick add job | Shortcut | Screen opens |
| B5-031 | Jobs sort | By date | Chronological |
| B5-032 | Jobs group month | View | Month sections |
| B5-033 | Job validation | Incomplete | Error |
| B5-034 | Job notes | Add notes | Saved |
| B5-035 | Job in report | Generate | Included |
| B5-036 | Job export | CSV | Included |
| B5-037 | Jobs offline | Add offline | Works |
| B5-038 | Auto-populate role | Laundry service | Role = Laundry |
| B5-039 | Job affects earnings | Complete job | Earnings updated |
| B5-040 | Job client required | No client | Error |

### B6. Staff Expenses (30 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| B6-001 | Add staff expense | Create | Expense created |
| B6-002 | Expense category | Select | Saved |
| B6-003 | Expense amount | Enter 500 | Saved |
| B6-004 | Expense description | Enter | Saved |
| B6-005 | Expense date | Set | Saved |
| B6-006 | Link to client | Select client | Linked |
| B6-007 | Personal expense | No client | Allowed |
| B6-008 | Mark expense paid | Toggle | Marked |
| B6-009 | Edit expense | Modify | Updated |
| B6-010 | Delete expense | Remove | Deleted |
| B6-011 | Expenses list | View | Listed |
| B6-012 | Filter by client | Select | Filtered |
| B6-013 | Filter by category | Select | Filtered |
| B6-014 | Total expenses | View | Correct |
| B6-015 | Expenses this month | Dashboard | Correct |
| B6-016 | Net earnings calc | Earnings - Expenses | Correct |
| B6-017 | Expenses persistence | Add, reopen | Persists |
| B6-018 | Expenses in backup | Export | Included |
| B6-019 | Restore expenses | Import | Restored |
| B6-020 | Expense currency | View | Correct |
| B6-021 | Expense empty state | None | Message |
| B6-022 | Quick add expense | Shortcut | Opens |
| B6-023 | Expenses sort | By date | Chronological |
| B6-024 | Expense validation | Incomplete | Error |
| B6-025 | Expense receipt | Attach | Saved |
| B6-026 | Expense in report | Generate | Included |
| B6-027 | Expense export | CSV | Included |
| B6-028 | Expenses offline | Add offline | Works |
| B6-029 | Expense recurrence | Set monthly | Saved |
| B6-030 | Expense affects net | Add | Net updated |

### B7. Staff Invoices (50 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| B7-001 | Create invoice | New invoice | Invoice created |
| B7-002 | Invoice for client | Select client | Linked |
| B7-003 | Invoice number auto | View | Auto-generated |
| B7-004 | Invoice number sequential | Create 2 | Sequential numbers |
| B7-005 | Invoice date | Set date | Saved |
| B7-006 | Invoice due date | Set date | Saved |
| B7-007 | Add invoice item | Add service | Item added |
| B7-008 | Item description | Enter desc | Saved |
| B7-009 | Item quantity | Enter qty | Saved |
| B7-010 | Item rate | Enter rate | Saved |
| B7-011 | Item total calculation | View | qty * rate |
| B7-012 | Multiple items | Add 5 items | All saved |
| B7-013 | Remove item | Delete | Removed |
| B7-014 | Subtotal calculation | View | Sum of items |
| B7-015 | Tax rate setting | Enter 18% | Saved |
| B7-016 | Tax calculation | View | Subtotal * tax% |
| B7-017 | Invoice total | View | Subtotal + Tax |
| B7-018 | Invoice status - Draft | Set | Saved |
| B7-019 | Invoice status - Sent | Set | Saved |
| B7-020 | Invoice status - Paid | Set | Saved |
| B7-021 | Invoice status - Overdue | Set | Saved |
| B7-022 | Invoice status - Cancelled | Set | Saved |
| B7-023 | Edit invoice | Modify | Updated |
| B7-024 | Delete invoice | Remove | Deleted |
| B7-025 | Invoice list view | View all | Listed |
| B7-026 | Filter by client | Select | Filtered |
| B7-027 | Filter by status | Select | Filtered |
| B7-028 | Invoice detail view | Tap | Details shown |
| B7-029 | Invoice preview | View | Formatted preview |
| B7-030 | Invoice share | Share | Options shown |
| B7-031 | Invoice print | Print | Print dialog |
| B7-032 | Invoice PDF export | Export | PDF generated |
| B7-033 | Total invoiced | View sum | Correct |
| B7-034 | Pending invoices | View | Correct count |
| B7-035 | Paid invoices total | View | Correct |
| B7-036 | Invoices this month | Dashboard | Correct |
| B7-037 | Invoice persistence | Create, reopen | Persists |
| B7-038 | Invoices in backup | Export | Included |
| B7-039 | Restore invoices | Import | Restored |
| B7-040 | Invoice currency | View | Correct symbol |
| B7-041 | Invoice empty state | None | Message |
| B7-042 | Quick create invoice | Shortcut | Opens |
| B7-043 | Invoice sort | By date | Chronological |
| B7-044 | Invoice validation | Incomplete | Error |
| B7-045 | Invoice notes | Add notes | Saved |
| B7-046 | Invoice terms | Add terms | Saved |
| B7-047 | Invoice in report | Generate | Included |
| B7-048 | Invoice export CSV | Export | Included |
| B7-049 | Invoice offline | Create offline | Works |
| B7-050 | Invoice affects earnings | Mark paid | Earnings updated |

### B8. Staff Reports (30 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| B8-001 | Earnings report | Generate | Report shown |
| B8-002 | Attendance report | Generate | Report shown |
| B8-003 | Expense report | Generate | Report shown |
| B8-004 | Laundry report | Generate | Report shown |
| B8-005 | Invoice report | Generate | Report shown |
| B8-006 | Report date range | Set range | Filtered |
| B8-007 | Report by client | Filter | Filtered |
| B8-008 | Report preview | View | Preview shown |
| B8-009 | Export CSV | Export | Downloaded |
| B8-010 | Report charts | View | Charts displayed |
| B8-011 | Earnings vs Expenses | View | Comparison chart |
| B8-012 | Client-wise breakdown | View | Per-client data |
| B8-013 | Monthly comparison | View | Month-by-month |
| B8-014 | Report totals | View | Correct sums |
| B8-015 | Net earnings report | View | Earnings - Expenses |
| B8-016 | Report empty state | No data | Message |
| B8-017 | Report loading | Generate | Loading shown |
| B8-018 | Report offline | Generate | Works |
| B8-019 | Report currency | View | Correct symbol |
| B8-020 | Report accuracy | Verify | Matches records |
| B8-021 | Report share | Share | Options |
| B8-022 | Report print | Print | Dialog |
| B8-023 | Report scroll | Long | Scrollable |
| B8-024 | Report re-generate | Again | Fresh data |
| B8-025 | CSV headers | Open | Correct |
| B8-026 | CSV encoding | Open | UTF-8 |
| B8-027 | Report filename | Download | Descriptive |
| B8-028 | Report vendor name | Header | Shown |
| B8-029 | Report timestamp | Footer | Shown |
| B8-030 | Report calculations | Verify | Correct math |

### B9. Staff Documents (20 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| B9-001 | Upload document | Upload | Saved |
| B9-002 | Link to client | Select | Linked |
| B9-003 | Link to invoice | Select | Linked |
| B9-004 | Document name | Set | Saved |
| B9-005 | Document preview | View | Shown |
| B9-006 | Document delete | Remove | Deleted |
| B9-007 | Document list | View | Listed |
| B9-008 | Filter by type | Select | Filtered |
| B9-009 | Document persistence | Upload, reopen | Persists |
| B9-010 | Documents in backup | Export | Included |
| B9-011 | Restore documents | Import | Restored |
| B9-012 | Document empty state | None | Message |
| B9-013 | Document compression | Large image | Compressed |
| B9-014 | Document size limit | 6MB | Error |
| B9-015 | Multiple documents | Upload 5 | All saved |
| B9-016 | Document search | By name | Filtered |
| B9-017 | Document sort | By date | Chronological |
| B9-018 | Document offline | Upload offline | Works |
| B9-019 | Document download | Tap | Downloads |
| B9-020 | Document affects storage | View | Counted |

### B10. Staff Settings (50 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| B10-001 | Change vendor name | Edit | Updated |
| B10-002 | Change currency | Switch | Updated |
| B10-003 | Change language | Switch | Updated |
| B10-004 | Enable dark mode | Toggle | Dark theme |
| B10-005 | Disable dark mode | Toggle | Light theme |
| B10-006 | Enable PIN | Set PIN | Enabled |
| B10-007 | Enter PIN | On launch | Prompted |
| B10-008 | Wrong PIN | Enter wrong | Error |
| B10-009 | Correct PIN | Enter correct | Unlocks |
| B10-010 | Change PIN | Set new | Updated |
| B10-011 | Disable PIN | Turn off | Disabled |
| B10-012 | Biometric auth | Enable | Enabled |
| B10-013 | Switch to Home mode | Tap switch | Mode changes |
| B10-014 | Set default mode | Set Staff | Staff default |
| B10-015 | Replay guided tour | Tap | Tour starts |
| B10-016 | Haptic feedback on | Enable | Vibrates |
| B10-017 | Haptic feedback off | Disable | No vibration |
| B10-018 | Sound effects on | Enable | Sounds play |
| B10-019 | Sound effects off | Disable | No sounds |
| B10-020 | View app version | Check | Version shown |
| B10-021 | View storage used | Check | Usage shown |
| B10-022 | Clear all data | Confirm | All cleared |
| B10-023 | Export backup | Tap | Backup created |
| B10-024 | Import backup | Select file | Data restored |
| B10-025 | Backup file format | Check | JSON format |
| B10-026 | Backup includes all | Verify | Complete data |
| B10-027 | Restore to empty | Import | Data restored |
| B10-028 | Restore to existing | Import | Merged/replaced |
| B10-029 | Privacy policy link | Tap | Opens URL |
| B10-030 | Support developer | Tap | Donation screen |
| B10-031 | Settings persistence | Change, reopen | Persists |
| B10-032 | Settings in backup | Export | Included |
| B10-033 | Restore settings | Import | Restored |
| B10-034 | Show all contexts | Enable | All data shown |
| B10-035 | Show active only | Disable | Filtered |
| B10-036 | Record count warning | 900 records | Warning shown |
| B10-037 | Record limit prompt | 1000 records | Prompt to delete |
| B10-038 | Delete old records | Cleanup | Old data removed |
| B10-039 | Storage warning | Near limit | Banner shown |
| B10-040 | Language search | Type | Filtered list |
| B10-041 | Currency search | Type | Filtered list |
| B10-042 | Country detection | Auto | Country shown |
| B10-043 | Settings offline | Change | Works |
| B10-044 | About section | View | Info shown |
| B10-045 | Help section | View | Help shown |
| B10-046 | Feedback option | Tap | Options shown |
| B10-047 | Rate app prompt | After usage | Shown |
| B10-048 | Notification settings | View | Options shown |
| B10-049 | Data export all | Export | All data |
| B10-050 | Reset to defaults | Reset | Defaults restored |

---

## PART C: COMMON FEATURES (200 Test Cases)

### C1. Backup & Restore (40 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C1-001 | Export backup Home mode | Export | File created |
| C1-002 | Export backup Staff mode | Export | File created |
| C1-003 | Backup filename | Check | Includes date/time |
| C1-004 | Backup file format | Check | Valid JSON |
| C1-005 | Backup file size | Check | Reasonable size |
| C1-006 | Backup includes profile | Verify | Profile in backup |
| C1-007 | Backup includes accounts | Verify | Accounts in backup |
| C1-008 | Backup includes settings | Verify | Settings in backup |
| C1-009 | Backup includes people | Verify | People in backup |
| C1-010 | Backup includes attendance | Verify | Attendance in backup |
| C1-011 | Backup includes transactions | Verify | Transactions in backup |
| C1-012 | Backup includes expenses | Verify | Expenses in backup |
| C1-013 | Backup includes laundry | Verify | Laundry in backup |
| C1-014 | Backup includes documents | Verify | Documents in backup |
| C1-015 | Backup includes clients | Verify | Clients in backup |
| C1-016 | Backup includes earnings | Verify | Earnings in backup |
| C1-017 | Backup includes invoices | Verify | Invoices in backup |
| C1-018 | Import backup - fresh | Import to empty | All restored |
| C1-019 | Import backup - existing | Import with data | Merged/replaced |
| C1-020 | Import invalid file | Select wrong file | Error shown |
| C1-021 | Import corrupted JSON | Bad JSON | Error shown |
| C1-022 | Import old version backup | Older backup | Migration runs |
| C1-023 | Import empty backup | Empty file | Error shown |
| C1-024 | Restore profile | Verify | Profile restored |
| C1-025 | Restore accounts | Verify | Accounts restored |
| C1-026 | Restore settings | Verify | Settings restored |
| C1-027 | Restore people | Verify | People restored |
| C1-028 | Restore attendance | Verify | Attendance restored |
| C1-029 | Restore transactions | Verify | Transactions restored |
| C1-030 | Restore expenses | Verify | Expenses restored |
| C1-031 | Restore laundry | Verify | Laundry restored |
| C1-032 | Restore documents | Verify | Documents restored |
| C1-033 | Backup share option | Share | Share dialog |
| C1-034 | Backup download | Download | File downloads |
| C1-035 | Large backup | 1000 records | Works |
| C1-036 | Backup with photos | Has images | Images in backup |
| C1-037 | Restore with photos | Import | Images restored |
| C1-038 | Backup loading state | Export | Loading shown |
| C1-039 | Restore loading state | Import | Loading shown |
| C1-040 | Backup success message | Complete | Toast shown |

### C2. Import & Export CSV (30 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C2-001 | Export attendance CSV | Export | File created |
| C2-002 | Export transactions CSV | Export | File created |
| C2-003 | Export expenses CSV | Export | File created |
| C2-004 | Export staff list CSV | Export | File created |
| C2-005 | CSV filename format | Check | Descriptive name |
| C2-006 | CSV encoding UTF-8 | Open | Correct encoding |
| C2-007 | CSV headers present | Check | Headers in first row |
| C2-008 | CSV data rows | Check | All records |
| C2-009 | CSV special characters | Name with comma | Properly escaped |
| C2-010 | CSV currency symbols | Amounts | Symbols present |
| C2-011 | CSV date format | Dates | Consistent format |
| C2-012 | CSV Hindi text | Hindi names | Correct display |
| C2-013 | CSV Arabic text | Arabic content | Correct display |
| C2-014 | CSV large export | 500 records | Complete export |
| C2-015 | CSV empty export | No data | Headers only |
| C2-016 | CSV filtered export | With filters | Filtered data |
| C2-017 | CSV date range export | Range filter | Filtered |
| C2-018 | CSV by category export | Category filter | Filtered |
| C2-019 | CSV by staff export | Staff filter | Filtered |
| C2-020 | CSV download action | Tap | Downloads |
| C2-021 | CSV share action | Tap | Share options |
| C2-022 | CSV open in Excel | Open | Works |
| C2-023 | CSV open in Sheets | Open | Works |
| C2-024 | CSV loading state | Export | Loading shown |
| C2-025 | CSV success message | Complete | Toast shown |
| C2-026 | CSV file size | Check | Reasonable |
| C2-027 | CSV offline export | Offline | Works |
| C2-028 | CSV performance | Large data | Fast |
| C2-029 | CSV all reports | Export all | All work |
| C2-030 | CSV preserves precision | Decimals | Correct |

### C3. Report Generation (30 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C3-001 | Generate salary report | Select | Report shown |
| C3-002 | Generate attendance report | Select | Report shown |
| C3-003 | Generate expense report | Select | Report shown |
| C3-004 | Generate summary report | Select | Report shown |
| C3-005 | Report preview display | View | Formatted |
| C3-006 | Report date selection | Pick range | Filtered |
| C3-007 | Report filter by person | Select | Filtered |
| C3-008 | Report filter by category | Select | Filtered |
| C3-009 | Report charts render | View | Charts shown |
| C3-010 | Report pie chart | View | Correct slices |
| C3-011 | Report bar chart | View | Correct bars |
| C3-012 | Report line chart | View | Correct trend |
| C3-013 | Report totals accuracy | Verify | Correct sums |
| C3-014 | Report calculations | Verify | Correct math |
| C3-015 | Report empty state | No data | Message shown |
| C3-016 | Report loading state | Generate | Loading shown |
| C3-017 | Report scroll | Long report | Scrollable |
| C3-018 | Report print | Print | Print dialog |
| C3-019 | Report share | Share | Options shown |
| C3-020 | Report offline | Generate | Works |
| C3-021 | Report performance | Large data | Reasonable time |
| C3-022 | Report currency display | View | Correct symbol |
| C3-023 | Report localization | Language | Translated |
| C3-024 | Report regenerate | Again | Fresh data |
| C3-025 | Report household name | Header | Shown |
| C3-026 | Report timestamp | Footer | Shown |
| C3-027 | Report comparison | Two periods | Comparison shown |
| C3-028 | Report year-to-date | YTD | Correct |
| C3-029 | Report month summary | Monthly | Correct |
| C3-030 | Report data accuracy | Cross-check | Matches source |

### C4. Donations/Support Developer (50 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C4-001 | Open donation screen | Navigate | Screen shown |
| C4-002 | Screen layout | View | Clean design |
| C4-003 | Currency detection India | India IP | INR shown |
| C4-004 | Currency detection US | US IP | USD shown |
| C4-005 | Currency selector | Open | 23 currencies |
| C4-006 | Currency search | Type "Euro" | EUR filtered |
| C4-007 | Select INR | Tap | INR selected |
| C4-008 | Select USD | Tap | USD selected |
| C4-009 | Select EUR | Tap | EUR selected |
| C4-010 | Select GBP | Tap | GBP selected |
| C4-011 | Select AED | Tap | AED selected |
| C4-012 | INR preset amounts | View | 20,50,100,200,500,1000 |
| C4-013 | USD preset amounts | View | 1,2,5,10,20,50 |
| C4-014 | EUR preset amounts | View | 1,2,5,10,20,50 |
| C4-015 | GBP preset amounts | View | 1,2,5,10,20,50 |
| C4-016 | AED preset amounts | View | 5,10,20,50,100,200 |
| C4-017 | Custom amount option | Tap | Input shown |
| C4-018 | Enter custom amount | Type 75 | Amount set |
| C4-019 | Custom amount validation | Type 0 | Error |
| C4-020 | Select preset amount | Tap ₹100 | Selected |
| C4-021 | Change amount | Select different | Updated |
| C4-022 | Indian user - UPI only | Country IN | Only UPI shown |
| C4-023 | Nepal user - UPI only | Country NP | Only UPI shown |
| C4-024 | Bhutan user - UPI only | Country BT | Only UPI shown |
| C4-025 | Non-Indian - PayPal only | Country US | Only PayPal shown |
| C4-026 | UPI payment flow | Tap Pay with UPI | UPI app opens |
| C4-027 | UPI ID correct | Check | dhairyavkshah@icici |
| C4-028 | PayPal payment flow | Tap PayPal | PayPal opens |
| C4-029 | PayPal link correct | Check | Correct PayPal.me |
| C4-030 | Unsupported PayPal currency | CNY | Shows USD |
| C4-031 | Confirm payment done | Tap confirm | Thank you shown |
| C4-032 | Thank you animation | After confirm | Confetti shown |
| C4-033 | Supporter flag set | After donation | localStorage updated |
| C4-034 | Supporter badge | Settings | Badge shown |
| C4-035 | Cancel donation | Back | No changes |
| C4-036 | Donation offline | No network | Link still opens |
| C4-037 | Payment method icons | View | Correct icons |
| C4-038 | Amount formatting | View | Proper format |
| C4-039 | Currency symbol display | View | Correct symbol |
| C4-040 | Privacy notice | View | Shown |
| C4-041 | No account required | Check | True |
| C4-042 | Multiple donations | Donate twice | Both work |
| C4-043 | Donation persistence | Check localStorage | Recorded |
| C4-044 | Loading states | Tap pay | Loading shown |
| C4-045 | Error handling | Invalid | Error message |
| C4-046 | PayPal currency codes | All 22 | Correct codes |
| C4-047 | Donation accessibility | Screen reader | Accessible |
| C4-048 | Dark mode donation screen | Enable dark | Correct styling |
| C4-049 | Donation screen language | Switch language | Translated |
| C4-050 | Return from payment | Come back | State preserved |

### C5. App Security (30 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C5-001 | Enable PIN lock | Set PIN | Enabled |
| C5-002 | PIN 4 digits | Enter 4 | Accepted |
| C5-003 | PIN 6 digits | Enter 6 | Accepted |
| C5-004 | PIN required on launch | Reopen app | PIN screen shown |
| C5-005 | Enter correct PIN | Type PIN | Unlocks |
| C5-006 | Enter wrong PIN | Type wrong | Error |
| C5-007 | Multiple wrong PINs | 5 wrong | Still allows retry |
| C5-008 | Change PIN | Set new | Updated |
| C5-009 | Disable PIN | Turn off | No PIN on launch |
| C5-010 | PIN persistence | Enable, reopen | Still enabled |
| C5-011 | Biometric setup | Enable | Fingerprint prompt |
| C5-012 | Biometric unlock | Use fingerprint | Unlocks |
| C5-013 | Biometric + PIN fallback | Fingerprint fail | PIN option shown |
| C5-014 | Disable biometric | Turn off | Disabled |
| C5-015 | PIN in background | App background | Lock on return |
| C5-016 | Data encryption | Check storage | Sensitive data safe |
| C5-017 | No secrets in console | Check logs | No sensitive data |
| C5-018 | LocalStorage security | Inspect | Data present |
| C5-019 | Session timeout | Idle 30 min | Requires PIN |
| C5-020 | Clear data option | Tap clear | Confirmation shown |
| C5-021 | Clear data confirm | Confirm | All data cleared |
| C5-022 | Secure backup | Check backup | No plain passwords |
| C5-023 | WebAuthn support | Enable | Works |
| C5-024 | PIN masking | Type | Dots shown |
| C5-025 | PIN paste disabled | Try paste | Blocked |
| C5-026 | Security settings | View | Options shown |
| C5-027 | Lock now option | Tap | Immediately locks |
| C5-028 | Auto-lock setting | Configure | Works |
| C5-029 | PIN backup | Export | PIN not exported |
| C5-030 | PIN reset | Delete app data | PIN removed |

### C6. Offline & Performance (20 Cases)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| C6-001 | App works offline | Disable network | Fully functional |
| C6-002 | Data saves offline | Add data offline | Saved locally |
| C6-003 | No network errors | Use offline | No errors |
| C6-004 | LocalStorage persistence | Close app | Data persists |
| C6-005 | Large data performance | 1000 records | App responsive |
| C6-006 | Scroll performance | Long lists | Smooth |
| C6-007 | Screen transitions | Navigate | Smooth |
| C6-008 | Memory usage | Check | Reasonable |
| C6-009 | Battery usage | Check | Normal |
| C6-010 | App size | Check | Small |
| C6-011 | Cold start time | Launch | Fast |
| C6-012 | Warm start time | Resume | Instant |
| C6-013 | Search performance | Filter 1000 | Fast |
| C6-014 | Report generation speed | Large data | Reasonable |
| C6-015 | Backup export speed | Large data | Reasonable |
| C6-016 | Image loading | Many photos | Smooth |
| C6-017 | Form response | Type | No lag |
| C6-018 | Animation smoothness | Transitions | 60fps |
| C6-019 | Storage limit handling | Near limit | Warning shown |
| C6-020 | Recovery from limit | Delete data | Works again |

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Clear all localStorage data
- [ ] Clear browser cache
- [ ] Set device language to English
- [ ] Enable network connection
- [ ] Record device/browser info

### Test Run Information
- **Tester Name**: _______________
- **Date**: _______________
- **App Version**: _______________
- **Device/Browser**: _______________
- **OS Version**: _______________

### Summary
- **Total Test Cases**: 1000
- **Passed**: _____ / 1000
- **Failed**: _____
- **Blocked**: _____
- **Not Executed**: _____

---

## Notes
- All tests assume fresh app state unless otherwise specified
- Future date tests should use tomorrow's date
- Currency tests assume correct symbol display
- All data validation tests include boundary cases
- Performance tests measured on mid-range device
