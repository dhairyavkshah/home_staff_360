# Home Staff 360 - Functional Test Cases (Mobile App)

## Part 3: Home Mode - Transactions, Payments & Laundry (TC441-TC680)

---

## Section 6: Transactions & Payments (TC441-TC560)

### 6.1 Record Payment (TC441-TC480)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC441 | Payment - Navigate | Open payment screen | Home mode, staff exists | Payment form shown | Pass |
| TC442 | Payment - Select Staff | Select staff for payment | Multiple staff | Staff selected | Pass |
| TC443 | Payment - Amount Entry | Enter payment amount | Staff selected | Amount accepted | Pass |
| TC444 | Payment - Amount Zero | Enter zero amount | Payment form | Error: "Amount must be greater than 0" | Pass |
| TC445 | Payment - Amount Negative | Enter negative amount | Payment form | Rejected or error | Pass |
| TC446 | Payment - Amount Large | Enter large amount | Payment form | Amount formatted | Pass |
| TC447 | Payment - Amount Decimal | Enter decimal amount | Payment form | Decimals accepted | Pass |
| TC448 | Payment - Type Salary | Select salary payment | Payment type dropdown | Salary selected | Pass |
| TC449 | Payment - Type Advance | Select advance payment | Payment type dropdown | Advance selected | Pass |
| TC450 | Payment - Type Bonus | Select bonus payment | Payment type dropdown | Bonus selected | Pass |
| TC451 | Payment - Type Reimbursement | Select reimbursement | Payment type dropdown | Reimbursement selected | Pass |
| TC452 | Payment - Type Other | Select other type | Payment type dropdown | Other with note | Pass |
| TC453 | Payment - Date Today | Date defaults to today | Payment form | Today's date shown | Pass |
| TC454 | Payment - Date Past | Select past date | Date picker | Past date allowed | Pass |
| TC455 | Payment - Date Future | Select future date | Date picker | Future date blocked | Pass |
| TC456 | Payment - Mode Cash | Select cash payment | Payment modes | Cash selected | Pass |
| TC457 | Payment - Mode UPI | Select UPI payment | Payment modes | UPI selected | Pass |
| TC458 | Payment - Mode Bank | Select bank transfer | Payment modes | Bank selected | Pass |
| TC459 | Payment - Mode Cheque | Select cheque payment | Payment modes | Cheque selected | Pass |
| TC460 | Payment - Reference | Enter reference number | Payment form | Reference saved | Pass |
| TC461 | Payment - Notes | Add payment notes | Payment form | Notes saved | Pass |
| TC462 | Payment - Attach Receipt | Attach receipt image | Payment form | Image uploaded | Pass |
| TC463 | Payment - Save Success | Save payment | Valid data | Payment saved | Pass |
| TC464 | Payment - Save Loading | Loading on save | Saving payment | Loading indicator | Pass |
| TC465 | Payment - Balance Update | Balance updated after save | Payment saved | Balance recalculated | Pass |
| TC466 | Payment - Real-time Sync | Payment synced to staff | Staff connected | Staff sees payment | Pass |
| TC467 | Payment - Notification | Staff notified of payment | Staff connected | Push notification | Pass |
| TC468 | Payment - Quick Pay | Quick pay from staff card | Staff list | Quick payment form | Pass |
| TC469 | Payment - Full Salary | Pay full monthly salary | Staff detail | Amount pre-filled | Pass |
| TC470 | Payment - Partial Payment | Pay partial amount | Payment form | Partial allowed | Pass |
| TC471 | Payment - Duplicate Warning | Warn on duplicate | Similar recent payment | Warning shown | Pass |
| TC472 | Payment - Validation | Form validation errors | Invalid data | Errors highlighted | Pass |
| TC473 | Payment - Cancel | Cancel payment entry | Form has data | Changes discarded | Pass |
| TC474 | Payment - Edit Payment | Edit existing payment | Payment exists | Edit form opened | Pass |
| TC475 | Payment - Edit Save | Save edited payment | Edit made | Changes saved | Pass |
| TC476 | Payment - Delete Payment | Delete payment record | Payment exists | Confirmation dialog | Pass |
| TC477 | Payment - Delete Confirm | Confirm deletion | Delete dialog | Payment removed | Pass |
| TC478 | Payment - Currency Format | Amount in selected currency | Currency set | Formatted correctly | Pass |
| TC479 | Payment - Haptic Feedback | Haptic on save | Payment saved | Brief vibration | Pass |
| TC480 | Payment - Sound Feedback | Sound on save | Sounds enabled | Confirmation sound | Pass |

### 6.2 Transaction History (TC481-TC520)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC481 | History - Navigate | Open transaction history | Payments exist | History list shown | Pass |
| TC482 | History - List View | View all transactions | Multiple payments | All listed | Pass |
| TC483 | History - Empty State | No transactions | New account | Empty state | Pass |
| TC484 | History - Card Display | Transaction card info | Transactions exist | Staff, amount, date shown | Pass |
| TC485 | History - Type Badge | Payment type indicator | Various types | Type badges shown | Pass |
| TC486 | History - Mode Icon | Payment mode icon | Various modes | Mode icons shown | Pass |
| TC487 | History - Amount Color | Credit/debit coloring | Mixed transactions | Green/red colors | Pass |
| TC488 | History - Filter Staff | Filter by staff | Multiple staff | Single staff shown | Pass |
| TC489 | History - Filter Type | Filter by type | Various types | Matching type only | Pass |
| TC490 | History - Filter Mode | Filter by mode | Various modes | Matching mode only | Pass |
| TC491 | History - Filter Date | Filter by date range | Date range | Matching dates only | Pass |
| TC492 | History - Sort Date Desc | Sort newest first | Multiple records | Newest at top | Pass |
| TC493 | History - Sort Date Asc | Sort oldest first | Multiple records | Oldest at top | Pass |
| TC494 | History - Sort Amount | Sort by amount | Multiple records | Amount sorted | Pass |
| TC495 | History - Search | Search transactions | Multiple records | Matching found | Pass |
| TC496 | History - Tap Detail | Tap transaction for detail | Transaction in list | Detail view opened | Pass |
| TC497 | History - View Receipt | View attached receipt | Receipt attached | Image displayed | Pass |
| TC498 | History - Download Receipt | Download receipt image | Receipt attached | Image downloaded | Pass |
| TC499 | History - Edit Transaction | Edit from history | Transaction detail | Edit form | Pass |
| TC500 | History - Delete Transaction | Delete from history | Transaction detail | Delete confirmation | Pass |
| TC501 | History - Running Balance | Show running balance | Multiple transactions | Cumulative balance | Pass |
| TC502 | History - Period Summary | Show period summary | Date range selected | Sum displayed | Pass |
| TC503 | History - Export History | Export transaction history | Data exists | Export options | Pass |
| TC504 | History - Export PDF | Export as PDF | Data exists | PDF downloaded | Pass |
| TC505 | History - Export Excel | Export as Excel | Data exists | Excel downloaded | Pass |
| TC506 | History - Share History | Share history | Data exists | Share sheet | Pass |
| TC507 | History - Print History | Print history | Data exists | Print dialog | Pass |
| TC508 | History - Pagination | Load more on scroll | Many transactions | Next page loaded | Pass |
| TC509 | History - Pull Refresh | Pull to refresh | History view | Data reloaded | Pass |
| TC510 | History - Loading State | Loading transactions | Fetching data | Loading skeleton | Pass |
| TC511 | History - Error State | Load error | Server error | Error message | Pass |
| TC512 | History - Grouped View | Group by day/week/month | Multiple records | Grouped display | Pass |
| TC513 | History - Today Section | Today's transactions | Recent payments | Today section | Pass |
| TC514 | History - Week Section | This week section | Recent payments | Week grouped | Pass |
| TC515 | History - Month Section | This month section | Recent payments | Month grouped | Pass |
| TC516 | History - Older Section | Older transactions | Historical data | Older section | Pass |
| TC517 | History - Quick Actions | Swipe actions on row | Transaction row | Edit/delete options | Pass |
| TC518 | History - Duplicate Entry | Duplicate transaction | Transaction selected | Copy with new date | Pass |
| TC519 | History - Real-time Update | Live new transactions | Staff connected | New appear live | Pass |
| TC520 | History - Offline Access | View history offline | No network | Cached data shown | Pass |

### 6.3 Balance & Summary (TC521-TC560)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC521 | Balance - Dashboard | View balance dashboard | Staff with payments | Dashboard shown | Pass |
| TC522 | Balance - Per Staff | View individual balance | Multiple staff | Each staff balance | Pass |
| TC523 | Balance - Total Payable | Total amount payable | Unpaid salaries | Sum calculated | Pass |
| TC524 | Balance - Overdue | Highlight overdue | Past due date | Overdue flagged | Pass |
| TC525 | Balance - Advance | Show advance payments | Advances made | Advance total | Pass |
| TC526 | Balance - Net Balance | Calculate net balance | Mixed transactions | Net calculated | Pass |
| TC527 | Balance - Monthly Spend | Monthly spending total | Month data | Sum displayed | Pass |
| TC528 | Balance - Trend Chart | Spending trend chart | Historical data | Chart displayed | Pass |
| TC529 | Balance - Compare Months | Compare month spending | Multiple months | Comparison shown | Pass |
| TC530 | Balance - By Category | Spending by category | Categorized payments | Category breakdown | Pass |
| TC531 | Balance - By Staff | Spending by staff | Multiple staff | Staff breakdown | Pass |
| TC532 | Balance - Budget Set | Set monthly budget | Balance page | Budget saved | Pass |
| TC533 | Balance - Budget Alert | Alert when near budget | 80% spent | Warning shown | Pass |
| TC534 | Balance - Over Budget | Alert when over budget | 100%+ spent | Alert shown | Pass |
| TC535 | Balance - Projection | Project next month | Historical data | Projection shown | Pass |
| TC536 | Balance - Quick Pay | Quick pay due amount | Balance shown | Payment initiated | Pass |
| TC537 | Balance - Reminder Set | Set payment reminder | Due date known | Reminder scheduled | Pass |
| TC538 | Balance - Reminder Alert | Receive reminder alert | Reminder set | Notification shown | Pass |
| TC539 | Balance - Generate Statement | Generate statement | Transaction data | Statement created | Pass |
| TC540 | Balance - Share Statement | Share statement | Statement ready | Share sheet | Pass |
| TC541 | Balance - Email Statement | Email statement | Statement ready | Email composed | Pass |
| TC542 | Balance - Print Statement | Print statement | Statement ready | Print dialog | Pass |
| TC543 | Balance - Fiscal Year | Select fiscal year | Balance page | Year selected | Pass |
| TC544 | Balance - Tax Report | Generate tax report | Year data | Report generated | Pass |
| TC545 | Balance - Insights | Financial insights | Sufficient data | Insights shown | Pass |
| TC546 | Balance - Recurring | Set up recurring payment | Balance page | Recurring saved | Pass |
| TC547 | Balance - Recurring Execute | Auto-execute recurring | Schedule met | Payment created | Pass |
| TC548 | Balance - Recurring Notify | Notify before recurring | Day before | Reminder sent | Pass |
| TC549 | Balance - Currency Convert | Show in alternate currency | Multiple currencies | Conversion shown | Pass |
| TC550 | Balance - Real-time Update | Live balance update | Payment made | Balance refreshes | Pass |
| TC551 | Balance - Loading State | Loading balance | Fetching data | Loading indicator | Pass |
| TC552 | Balance - Error State | Balance load error | Server error | Error message | Pass |
| TC553 | Balance - Pull Refresh | Pull to refresh | Balance view | Data reloaded | Pass |
| TC554 | Balance - Date Range | Filter by date range | Balance view | Range applied | Pass |
| TC555 | Balance - Export Summary | Export summary | Data exists | Export options | Pass |
| TC556 | Balance - Analytics | View analytics | Sufficient data | Charts displayed | Pass |
| TC557 | Balance - Goals | Set savings goals | Balance page | Goal tracked | Pass |
| TC558 | Balance - Goal Progress | View goal progress | Goal set | Progress shown | Pass |
| TC559 | Balance - Alerts Config | Configure balance alerts | Settings | Alerts configured | Pass |
| TC560 | Balance - Widget | Home screen widget | Android widget | Balance displayed | Pass |

---

## Section 7: Laundry Management (TC561-TC680)

### 7.1 Create Laundry Batch (TC561-TC600)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC561 | Laundry - Navigate | Open laundry module | Home mode active | Laundry screen shown | Pass |
| TC562 | Laundry - New Batch | Create new batch | Laundry module | Batch form opened | Pass |
| TC563 | Laundry - Batch Date | Set batch date | New batch form | Date selected | Pass |
| TC564 | Laundry - Select Staff | Select laundry person | Staff exists | Staff selected | Pass |
| TC565 | Laundry - Add Item | Add laundry item | Batch form | Item added | Pass |
| TC566 | Laundry - Item Type | Select item type | Adding item | Type selected | Pass |
| TC567 | Laundry - Item Shirt | Add shirt item | Item types | Shirt added | Pass |
| TC568 | Laundry - Item Pants | Add pants item | Item types | Pants added | Pass |
| TC569 | Laundry - Item Saree | Add saree item | Item types | Saree added | Pass |
| TC570 | Laundry - Item Bedsheet | Add bedsheet item | Item types | Bedsheet added | Pass |
| TC571 | Laundry - Item Custom | Add custom item type | Item types | Custom type added | Pass |
| TC572 | Laundry - Item Quantity | Set item quantity | Item added | Quantity saved | Pass |
| TC573 | Laundry - Item Rate | Set item rate | Item added | Rate saved | Pass |
| TC574 | Laundry - Item Total | Calculate item total | Quantity and rate | Total calculated | Pass |
| TC575 | Laundry - Multiple Items | Add multiple items | Batch form | Items listed | Pass |
| TC576 | Laundry - Remove Item | Remove item from batch | Items added | Item removed | Pass |
| TC577 | Laundry - Edit Item | Edit item details | Item in batch | Item updated | Pass |
| TC578 | Laundry - Batch Total | Calculate batch total | Multiple items | Total sum shown | Pass |
| TC579 | Laundry - Batch Notes | Add batch notes | Batch form | Notes saved | Pass |
| TC580 | Laundry - Special Instructions | Add special instructions | Batch form | Instructions saved | Pass |
| TC581 | Laundry - Priority | Set priority level | Batch form | Priority saved | Pass |
| TC582 | Laundry - Express | Mark as express | Batch form | Express flag set | Pass |
| TC583 | Laundry - Due Date | Set expected due date | Batch form | Due date saved | Pass |
| TC584 | Laundry - Save Batch | Save laundry batch | Valid data | Batch created | Pass |
| TC585 | Laundry - Save Loading | Loading on save | Saving batch | Loading indicator | Pass |
| TC586 | Laundry - Validation | Form validation | Invalid data | Errors shown | Pass |
| TC587 | Laundry - Empty Items | Save without items | No items added | Error: "Add at least one item" | Pass |
| TC588 | Laundry - Cancel | Cancel batch creation | Form has data | Changes discarded | Pass |
| TC589 | Laundry - Duplicate Detect | Warn on similar batch | Recent similar batch | Warning shown | Pass |
| TC590 | Laundry - Auto-Number | Auto-generate batch number | Batch saved | Unique number assigned | Pass |
| TC591 | Laundry - Template Save | Save as template | Batch created | Template saved | Pass |
| TC592 | Laundry - From Template | Create from template | Template exists | Pre-filled form | Pass |
| TC593 | Laundry - Barcode | Generate batch barcode | Batch created | Barcode generated | Pass |
| TC594 | Laundry - QR Code | Generate batch QR | Batch created | QR generated | Pass |
| TC595 | Laundry - Real-time Sync | Batch synced to staff | Staff connected | Staff sees batch | Pass |
| TC596 | Laundry - Notification | Staff notified | Staff connected | Push notification | Pass |
| TC597 | Laundry - Haptic | Haptic on save | Batch saved | Brief vibration | Pass |
| TC598 | Laundry - Currency | Amounts in currency | Currency set | Formatted correctly | Pass |
| TC599 | Laundry - Copy Batch | Copy existing batch | Batch exists | Copy created | Pass |
| TC600 | Laundry - Quick Add | Quick add common items | Batch form | Items pre-filled | Pass |

### 7.2 Laundry Batch Management (TC601-TC640)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC601 | Batch List - View | View all batches | Batches exist | List displayed | Pass |
| TC602 | Batch List - Empty | No batches exist | New account | Empty state | Pass |
| TC603 | Batch List - Card | Batch card info | Batches exist | Details shown | Pass |
| TC604 | Batch List - Status | Status indicators | Various statuses | Status badges | Pass |
| TC605 | Batch - Pending | Pending status | New batch | Pending shown | Pass |
| TC606 | Batch - Picked Up | Mark picked up | Pending batch | Picked up status | Pass |
| TC607 | Batch - In Progress | Mark in progress | Picked up | In progress status | Pass |
| TC608 | Batch - Completed | Mark completed | In progress | Completed status | Pass |
| TC609 | Batch - Delivered | Mark delivered | Completed | Delivered status | Pass |
| TC610 | Batch - Status Flow | Status progression | Batch exists | Correct flow enforced | Pass |
| TC611 | Batch - Revert Status | Revert to previous | Wrong status | Status reverted | Pass |
| TC612 | Batch Detail - View | View batch details | Batch exists | Full details shown | Pass |
| TC613 | Batch Detail - Items | View all items | Items in batch | Items listed | Pass |
| TC614 | Batch Detail - Timeline | View status timeline | Status changes | Timeline shown | Pass |
| TC615 | Batch Detail - Edit | Edit batch details | Pending batch | Edit form | Pass |
| TC616 | Batch Detail - Add Items | Add items to batch | Batch open | Items added | Pass |
| TC617 | Batch Detail - Remove Items | Remove items | Items in batch | Items removed | Pass |
| TC618 | Batch Detail - Delete | Delete batch | Batch exists | Confirmation | Pass |
| TC619 | Batch - Filter Status | Filter by status | Various statuses | Matching only | Pass |
| TC620 | Batch - Filter Date | Filter by date | Date range | Matching only | Pass |
| TC621 | Batch - Filter Staff | Filter by staff | Multiple staff | Matching only | Pass |
| TC622 | Batch - Search | Search batches | Batches exist | Matching found | Pass |
| TC623 | Batch - Sort Date | Sort by date | Multiple batches | Date sorted | Pass |
| TC624 | Batch - Sort Amount | Sort by amount | Multiple batches | Amount sorted | Pass |
| TC625 | Batch - Sort Status | Sort by status | Various statuses | Status sorted | Pass |
| TC626 | Batch - Payment | Record batch payment | Completed batch | Payment recorded | Pass |
| TC627 | Batch - Partial Payment | Partial payment | Batch total > paid | Partial allowed | Pass |
| TC628 | Batch - Full Payment | Full payment | Batch with balance | Full paid | Pass |
| TC629 | Batch - Payment History | View batch payments | Payments made | History shown | Pass |
| TC630 | Batch - Balance | View remaining balance | Partial paid | Balance calculated | Pass |
| TC631 | Batch - Print | Print batch details | Batch exists | Print dialog | Pass |
| TC632 | Batch - Share | Share batch | Batch exists | Share sheet | Pass |
| TC633 | Batch - Export | Export batch data | Batch exists | Export options | Pass |
| TC634 | Batch - Real-time | Live status updates | Staff connected | Status syncs | Pass |
| TC635 | Batch - Notify Status | Notify on status change | Status changed | Notification sent | Pass |
| TC636 | Batch - Pull Refresh | Pull to refresh | Batch list | Data reloaded | Pass |
| TC637 | Batch - Pagination | Load more | Many batches | More loaded | Pass |
| TC638 | Batch - Loading | Loading state | Fetching data | Skeleton shown | Pass |
| TC639 | Batch - Error | Error state | Server error | Error message | Pass |
| TC640 | Batch - Offline | View offline | No network | Cached data | Pass |

### 7.3 Laundry Approvals (TC641-TC660)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC641 | Approval - Receive | Receive batch for approval | Staff submitted | Notification received | Pass |
| TC642 | Approval - View | View pending approvals | Pending exists | List shown | Pass |
| TC643 | Approval - Detail | View batch details | Pending approval | Details shown | Pass |
| TC644 | Approval - Approve | Approve batch | Pending batch | Batch approved | Pass |
| TC645 | Approval - Reject | Reject batch | Pending batch | Batch rejected | Pass |
| TC646 | Approval - Reason | Add rejection reason | Rejecting | Reason saved | Pass |
| TC647 | Approval - Modify | Modify before approve | Pending batch | Changes saved | Pass |
| TC648 | Approval - Bulk Approve | Approve multiple | Multiple pending | All approved | Pass |
| TC649 | Approval - Bulk Reject | Reject multiple | Multiple pending | All rejected | Pass |
| TC650 | Approval - Notify | Staff notified | Approval done | Notification sent | Pass |
| TC651 | Approval - Badge | Pending count badge | Pending exists | Count shown | Pass |
| TC652 | Approval - Filter | Filter approvals | Various statuses | Filtered | Pass |
| TC653 | Approval - Sort | Sort approvals | Multiple pending | Sorted | Pass |
| TC654 | Approval - History | Approval history | Past approvals | History shown | Pass |
| TC655 | Approval - Undo | Undo approval | Just approved | Reversed | Pass |
| TC656 | Approval - Timeout | Approval timeout | Long pending | Warning shown | Pass |
| TC657 | Approval - Auto | Configure auto-approve | Settings | Auto-approve on | Pass |
| TC658 | Approval - Delegate | Delegate approvals | Settings | Delegated | Pass |
| TC659 | Approval - Offline | Approve offline | No network | Queued | Pass |
| TC660 | Approval - Sync | Sync approvals | Network back | Synced | Pass |

### 7.4 Laundry Reports (TC661-TC680)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC661 | Report - Navigate | Open laundry reports | Data exists | Report screen | Pass |
| TC662 | Report - Date Range | Select date range | Report screen | Range picker | Pass |
| TC663 | Report - Summary | View summary stats | Data exists | Stats shown | Pass |
| TC664 | Report - Total Items | Total items count | Data exists | Count shown | Pass |
| TC665 | Report - Total Amount | Total spending | Data exists | Sum shown | Pass |
| TC666 | Report - By Staff | Breakdown by staff | Multiple staff | Staff breakdown | Pass |
| TC667 | Report - By Item Type | Breakdown by type | Various items | Type breakdown | Pass |
| TC668 | Report - Chart | View chart | Data exists | Chart displayed | Pass |
| TC669 | Report - Trend | View trends | Historical data | Trend shown | Pass |
| TC670 | Report - Compare | Compare periods | Multiple periods | Comparison | Pass |
| TC671 | Report - Export PDF | Export as PDF | Report ready | PDF downloaded | Pass |
| TC672 | Report - Export Excel | Export as Excel | Report ready | Excel downloaded | Pass |
| TC673 | Report - Share | Share report | Report ready | Share sheet | Pass |
| TC674 | Report - Print | Print report | Report ready | Print dialog | Pass |
| TC675 | Report - Email | Email report | Report ready | Email composed | Pass |
| TC676 | Report - Schedule | Schedule reports | Report screen | Scheduled | Pass |
| TC677 | Report - Loading | Loading report | Generating | Loading shown | Pass |
| TC678 | Report - Error | Report error | Server issue | Error message | Pass |
| TC679 | Report - Empty | No data | New account | Empty state | Pass |
| TC680 | Report - Large Data | Many records | Lots of data | Handles well | Pass |

---

**End of Part 3 - Test Cases: TC441-TC680 (240 Test Cases)**
