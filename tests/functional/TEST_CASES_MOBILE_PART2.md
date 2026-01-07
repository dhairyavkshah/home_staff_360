# Home Staff 360 - Functional Test Cases (Mobile App)

## Part 2: Home Mode - People & Attendance (TC191-TC480)

---

## Section 4: People Management (TC191-TC290)

### 4.1 Add Staff Member (TC191-TC220)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC191 | Add Staff - Navigate | Navigate to add staff screen | Home mode active | Add staff form displayed | Pass |
| TC192 | Add Staff - Name Required | Submit without name | Add form open | Error: "Name is required" | Pass |
| TC193 | Add Staff - Valid Name | Enter valid staff name | Add form open | Name accepted | Pass |
| TC194 | Add Staff - Phone Optional | Add without phone number | Name entered | Staff created without phone | Pass |
| TC195 | Add Staff - Phone Valid | Add with valid 10-digit phone | Add form open | Phone validated and saved | Pass |
| TC196 | Add Staff - Phone Invalid | Add with invalid phone | Add form open | Error: "Invalid phone number" | Pass |
| TC197 | Add Staff - Role Selection | Select staff role/type | Add form open | Role dropdown populated | Pass |
| TC198 | Add Staff - Role Maid | Select "Maid" role | Role dropdown open | Maid role selected | Pass |
| TC199 | Add Staff - Role Cook | Select "Cook" role | Role dropdown open | Cook role selected | Pass |
| TC200 | Add Staff - Role Driver | Select "Driver" role | Role dropdown open | Driver role selected | Pass |
| TC201 | Add Staff - Role Gardener | Select "Gardener" role | Role dropdown open | Gardener role selected | Pass |
| TC202 | Add Staff - Role Custom | Enter custom role name | Role dropdown open | Custom role saved | Pass |
| TC203 | Add Staff - Salary Monthly | Set monthly salary amount | Add form open | Salary saved in preferred currency | Pass |
| TC204 | Add Staff - Salary Zero | Set salary as 0 | Add form open | Zero salary allowed | Pass |
| TC205 | Add Staff - Salary Large | Set large salary amount | Add form open | Large amount formatted correctly | Pass |
| TC206 | Add Staff - Weekly Off | Set weekly off day | Add form open | Off day saved | Pass |
| TC207 | Add Staff - Multiple Off Days | Set multiple weekly off days | Add form open | Multiple off days saved | Pass |
| TC208 | Add Staff - Start Date | Set joining date | Add form open | Date picker shown | Pass |
| TC209 | Add Staff - Notes | Add notes about staff | Add form open | Notes saved | Pass |
| TC210 | Add Staff - Photo | Add staff photo | Add form open | Photo uploaded | Pass |
| TC211 | Add Staff - Save Success | Save new staff member | Valid data entered | Staff created, list updated | Pass |
| TC212 | Add Staff - Save Loading | Check loading on save | Save clicked | Loading indicator shown | Pass |
| TC213 | Add Staff - Duplicate Name | Add staff with same name | Staff exists with name | Warning shown, allowed | Pass |
| TC214 | Add Staff - Auto-Connect | Add with registered phone | Phone is registered user | Auto-connection invite sent | Pass |
| TC215 | Add Staff - Pending Link | Add with unregistered phone | Phone not registered | Pending phone link created | Pass |
| TC216 | Add Staff - Cancel | Cancel add operation | Add form open | Returns to list, no save | Pass |
| TC217 | Add Staff - Form Reset | Check form cleared on cancel | Form has data | Form cleared on cancel | Pass |
| TC218 | Add Staff - Validation All | Submit with all errors | All fields invalid | All errors displayed | Pass |
| TC219 | Add Staff - Keyboard Next | Tab between form fields | Filling form | Focus moves correctly | Pass |
| TC220 | Add Staff - Haptic Success | Haptic on successful add | Staff saved | Brief vibration | Pass |

### 4.2 Edit Staff Member (TC221-TC245)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC221 | Edit Staff - Navigate | Open edit screen for staff | Staff exists | Edit form with current data | Pass |
| TC222 | Edit Staff - Name Change | Modify staff name | Edit form open | Name updated | Pass |
| TC223 | Edit Staff - Phone Change | Modify staff phone | Edit form open | Phone updated | Pass |
| TC224 | Edit Staff - Role Change | Change staff role | Edit form open | Role updated | Pass |
| TC225 | Edit Staff - Salary Change | Modify monthly salary | Edit form open | Salary updated | Pass |
| TC226 | Edit Staff - Off Day Change | Modify weekly off days | Edit form open | Off days updated | Pass |
| TC227 | Edit Staff - Photo Change | Update staff photo | Edit form open | New photo saved | Pass |
| TC228 | Edit Staff - Photo Remove | Remove staff photo | Photo exists | Photo removed | Pass |
| TC229 | Edit Staff - Notes Update | Modify staff notes | Edit form open | Notes updated | Pass |
| TC230 | Edit Staff - Save Success | Save edited staff | Changes made | Updates saved | Pass |
| TC231 | Edit Staff - No Changes | Save without changes | Edit form open | No error, screen closes | Pass |
| TC232 | Edit Staff - Cancel | Cancel edit operation | Changes made | Changes discarded | Pass |
| TC233 | Edit Staff - Unsaved Warning | Back with unsaved changes | Changes made | Warning dialog shown | Pass |
| TC234 | Edit Staff - Concurrent Edit | Edit while another user edits | Connected staff | Conflict handled | Pass |
| TC235 | Edit Staff - Connected Staff | Edit linked staff | Staff is connected user | Some fields read-only | Pass |
| TC236 | Edit Staff - Archive Staff | Archive staff member | Edit screen open | Staff marked inactive | Pass |
| TC237 | Edit Staff - Unarchive Staff | Restore archived staff | Staff archived | Staff marked active | Pass |
| TC238 | Edit Staff - Delete Staff | Delete staff member | Edit screen open | Confirmation dialog | Pass |
| TC239 | Edit Staff - Delete Confirm | Confirm staff deletion | Delete dialog open | Staff and data removed | Pass |
| TC240 | Edit Staff - Delete Cancel | Cancel staff deletion | Delete dialog open | Staff remains | Pass |
| TC241 | Edit Staff - History Kept | Check history after edit | Staff edited | Previous records intact | Pass |
| TC242 | Edit Staff - Real-time Sync | Changes sync to connected | Staff is connected | Other user sees changes | Pass |
| TC243 | Edit Staff - Offline Edit | Edit while offline | No network | Changes queued | Pass |
| TC244 | Edit Staff - Sync on Connect | Offline edits sync | Network restored | Changes uploaded | Pass |
| TC245 | Edit Staff - Merge Conflicts | Handle edit conflicts | Both users edited | Conflict resolution UI | Pass |

### 4.3 Staff List & Search (TC246-TC265)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC246 | Staff List - View All | View list of all staff | Staff members exist | All staff displayed | Pass |
| TC247 | Staff List - Empty State | View list with no staff | No staff added | Empty state with add CTA | Pass |
| TC248 | Staff List - Card Display | Staff card shows info | Staff exists | Name, role, salary shown | Pass |
| TC249 | Staff List - Avatar | Staff photo in card | Photo uploaded | Photo displayed | Pass |
| TC250 | Staff List - Default Avatar | Staff without photo | No photo | Default avatar shown | Pass |
| TC251 | Staff List - Search Name | Search staff by name | Multiple staff | Matching names filtered | Pass |
| TC252 | Staff List - Search Partial | Search with partial name | Staff "Priya" exists | "Pri" finds "Priya" | Pass |
| TC253 | Staff List - Search No Results | Search non-existing name | Staff list | "No results" message | Pass |
| TC254 | Staff List - Filter Role | Filter by staff role | Multiple roles | Only matching role shown | Pass |
| TC255 | Staff List - Filter Active | Filter active only | Active and archived | Only active shown | Pass |
| TC256 | Staff List - Filter Archived | Filter archived only | Active and archived | Only archived shown | Pass |
| TC257 | Staff List - Sort Name | Sort alphabetically by name | Multiple staff | A-Z order | Pass |
| TC258 | Staff List - Sort Date | Sort by date added | Multiple staff | Newest first | Pass |
| TC259 | Staff List - Sort Salary | Sort by salary | Multiple staff | Highest first | Pass |
| TC260 | Staff List - Tap to View | Tap staff card | Staff in list | Staff detail page | Pass |
| TC261 | Staff List - Quick Actions | Long press staff card | Staff in list | Action menu shown | Pass |
| TC262 | Staff List - Swipe Actions | Swipe staff card | Staff in list | Edit/delete options | Pass |
| TC263 | Staff List - Pull Refresh | Pull to refresh list | Staff list view | List reloaded | Pass |
| TC264 | Staff List - Loading State | Check loading indicator | Fetching staff | Loading skeleton shown | Pass |
| TC265 | Staff List - Pagination | Load more on scroll | Many staff (50+) | Next page loaded | Pass |

### 4.4 Staff Detail View (TC266-TC290)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC266 | Staff Detail - View | Open staff detail page | Staff exists | Full info displayed | Pass |
| TC267 | Staff Detail - Photo Large | View large staff photo | Photo exists | Photo expanded | Pass |
| TC268 | Staff Detail - Contact Phone | Tap phone to call | Phone saved | Dialer opened | Pass |
| TC269 | Staff Detail - Quick Message | Tap to message | Staff connected | Chat opened | Pass |
| TC270 | Staff Detail - Balance | View pending balance | Transactions exist | Balance calculated | Pass |
| TC271 | Staff Detail - Attendance Summary | View attendance stats | Attendance logged | Present/absent counts | Pass |
| TC272 | Staff Detail - Payment History | View transaction list | Payments made | All transactions shown | Pass |
| TC273 | Staff Detail - Recent Activity | View recent actions | Activity exists | Timeline displayed | Pass |
| TC274 | Staff Detail - Mark Attendance | Quick attendance button | On detail page | Attendance marked | Pass |
| TC275 | Staff Detail - Record Payment | Quick payment button | On detail page | Payment form opened | Pass |
| TC276 | Staff Detail - Add Expense | Quick expense button | On detail page | Expense form opened | Pass |
| TC277 | Staff Detail - Connection Status | Show if connected | Staff has account | "Connected" badge shown | Pass |
| TC278 | Staff Detail - Pending Invite | Show pending status | Invite sent | "Pending" badge shown | Pass |
| TC279 | Staff Detail - Send Invite | Send connection invite | Not connected | Invite sent | Pass |
| TC280 | Staff Detail - Resend Invite | Resend pending invite | Invite pending | New invite sent | Pass |
| TC281 | Staff Detail - Edit Button | Edit from detail page | On detail page | Edit form opened | Pass |
| TC282 | Staff Detail - Delete Button | Delete from detail | On detail page | Delete confirmation | Pass |
| TC283 | Staff Detail - Share Staff | Share staff info | On detail page | Share sheet opened | Pass |
| TC284 | Staff Detail - Statistics | View work statistics | History exists | Charts/stats shown | Pass |
| TC285 | Staff Detail - Monthly Report | Generate monthly report | Data exists | Report generated | Pass |
| TC286 | Staff Detail - Back Navigation | Navigate back to list | On detail page | Returns to list | Pass |
| TC287 | Staff Detail - Scroll Content | Scroll long content | Much data | Content scrollable | Pass |
| TC288 | Staff Detail - Tab Navigation | Switch detail tabs | Multiple tabs | Tab content changes | Pass |
| TC289 | Staff Detail - Real-time Update | Live updates received | Connected staff | Data refreshes live | Pass |
| TC290 | Staff Detail - Error State | Handle load error | Server error | Error message shown | Pass |

---

## Section 5: Attendance Management (TC291-TC440)

### 5.1 Mark Attendance (TC291-TC330)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC291 | Attendance - Navigate | Open attendance page | Home mode active | Attendance screen shown | Pass |
| TC292 | Attendance - Today View | View today's attendance | Staff exists | Today's status for all staff | Pass |
| TC293 | Attendance - Mark Present | Mark staff as present | Staff in list | Present status saved | Pass |
| TC294 | Attendance - Mark Absent | Mark staff as absent | Staff in list | Absent status saved | Pass |
| TC295 | Attendance - Mark Half Day | Mark staff as half day | Staff in list | Half day status saved | Pass |
| TC296 | Attendance - Mark Leave | Mark staff on leave | Staff in list | Leave status saved | Pass |
| TC297 | Attendance - Mark Holiday | Mark as holiday | Staff in list | Holiday status saved | Pass |
| TC298 | Attendance - Weekly Off Auto | Auto-mark weekly off | Off day configured | Auto-marked as off | Pass |
| TC299 | Attendance - Toggle Status | Tap to cycle status | Unmarked | Cycles through statuses | Pass |
| TC300 | Attendance - Long Press Menu | Long press for options | Staff in list | Status options menu | Pass |
| TC301 | Attendance - Add Note | Add note to attendance | Marking attendance | Note saved with record | Pass |
| TC302 | Attendance - Time In | Record check-in time | Marking present | Time recorded | Pass |
| TC303 | Attendance - Time Out | Record check-out time | Marked present | Out time recorded | Pass |
| TC304 | Attendance - Late Arrival | Mark late arrival | Marking present | Late flag added | Pass |
| TC305 | Attendance - Early Leave | Mark early departure | Marked present | Early leave recorded | Pass |
| TC306 | Attendance - Overtime | Record overtime hours | Full day worked | Overtime saved | Pass |
| TC307 | Attendance - Location Tag | Add location to attendance | Location permission | Coordinates saved | Pass |
| TC308 | Attendance - Bulk Mark | Mark multiple staff at once | Multiple staff | All marked in bulk | Pass |
| TC309 | Attendance - Bulk Present | Mark all present | Multiple staff | All set to present | Pass |
| TC310 | Attendance - Bulk Absent | Mark all absent | Multiple staff | All set to absent | Pass |
| TC311 | Attendance - Undo Mark | Undo attendance mark | Just marked | Previous state restored | Pass |
| TC312 | Attendance - Save Loading | Check loading on save | Saving attendance | Loading indicator | Pass |
| TC313 | Attendance - Save Success | Attendance saved | Valid data | Success message | Pass |
| TC314 | Attendance - Save Error | Handle save error | Server issue | Error message shown | Pass |
| TC315 | Attendance - Real-time Sync | Sync to connected staff | Staff connected | Staff sees their record | Pass |
| TC316 | Attendance - Notification Sent | Notification on mark | Staff connected | Push notification sent | Pass |
| TC317 | Attendance - Haptic Feedback | Haptic on mark | Status changed | Brief vibration | Pass |
| TC318 | Attendance - Sound Feedback | Sound on mark | Sounds enabled | Confirmation sound | Pass |
| TC319 | Attendance - Past Date | Mark for past date | Calendar open | Past attendance allowed | Pass |
| TC320 | Attendance - Future Date | Mark for future date | Calendar open | Future dates blocked | Pass |
| TC321 | Attendance - Edit Past | Edit past attendance | Past record exists | Edit allowed (limits apply) | Pass |
| TC322 | Attendance - Delete Record | Delete attendance record | Record exists | Confirmation required | Pass |
| TC323 | Attendance - Quick Actions | Swipe attendance row | Row in list | Quick action buttons | Pass |
| TC324 | Attendance - Filter Staff | Filter by specific staff | Multiple staff | Only selected shown | Pass |
| TC325 | Attendance - Filter Status | Filter by status | Mixed statuses | Only matching shown | Pass |
| TC326 | Attendance - Date Picker | Open date picker | Attendance screen | Calendar displayed | Pass |
| TC327 | Attendance - Navigate Days | Previous/next day | Viewing today | Day changes | Pass |
| TC328 | Attendance - Jump to Date | Select specific date | Date picker open | Jumps to date | Pass |
| TC329 | Attendance - Weekend Highlight | Weekends marked different | Calendar view | Weekends highlighted | Pass |
| TC330 | Attendance - Today Button | Jump to today | Viewing past date | Returns to today | Pass |

### 5.2 Attendance Calendar (TC331-TC370)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC331 | Calendar - Month View | View monthly calendar | Attendance page | Month calendar displayed | Pass |
| TC332 | Calendar - Navigate Month | Go to next/previous month | Calendar view | Month changes | Pass |
| TC333 | Calendar - Jump Month | Select specific month | Calendar view | Jumps to month | Pass |
| TC334 | Calendar - Year Navigation | Navigate between years | Calendar view | Year changes | Pass |
| TC335 | Calendar - Status Colors | Different colors per status | Records exist | Color-coded dates | Pass |
| TC336 | Calendar - Present Color | Green for present | Present records | Green indicators | Pass |
| TC337 | Calendar - Absent Color | Red for absent | Absent records | Red indicators | Pass |
| TC338 | Calendar - Half Day Color | Yellow for half day | Half day records | Yellow indicators | Pass |
| TC339 | Calendar - Leave Color | Blue for leave | Leave records | Blue indicators | Pass |
| TC340 | Calendar - Holiday Color | Purple for holiday | Holiday records | Purple indicators | Pass |
| TC341 | Calendar - Tap Date | Tap date to view details | Calendar view | Day details shown | Pass |
| TC342 | Calendar - Multiple Staff | View all staff on date | Multiple staff | All shown for date | Pass |
| TC343 | Calendar - Single Staff | Filter single staff calendar | Staff selected | Only their records | Pass |
| TC344 | Calendar - Legend Display | Show color legend | Calendar view | Legend visible | Pass |
| TC345 | Calendar - Count Display | Show counts on date | Multiple staff | Count indicator | Pass |
| TC346 | Calendar - Week View | Switch to week view | Calendar view | Week displayed | Pass |
| TC347 | Calendar - Day View | Switch to day view | Calendar view | Day displayed | Pass |
| TC348 | Calendar - Swipe Navigate | Swipe to change month | Calendar view | Month navigates | Pass |
| TC349 | Calendar - Today Highlight | Today highlighted | Calendar view | Today distinctly marked | Pass |
| TC350 | Calendar - Selected Highlight | Selected date highlighted | Date tapped | Selection visible | Pass |
| TC351 | Calendar - Empty Days | Days without records | New staff | No color indicator | Pass |
| TC352 | Calendar - Future Dates | Future dates styling | Calendar view | Disabled/grayed out | Pass |
| TC353 | Calendar - Loading State | Loading calendar data | Opening calendar | Loading indicator | Pass |
| TC354 | Calendar - Error State | Calendar data error | Server error | Error message | Pass |
| TC355 | Calendar - Refresh | Pull to refresh | Calendar view | Data reloaded | Pass |
| TC356 | Calendar - Week Start | Configure week start day | Settings | Week starts correctly | Pass |
| TC357 | Calendar - Quick Add | Add from calendar date | Empty date | Add attendance form | Pass |
| TC358 | Calendar - Scroll Months | Scroll through months | Calendar view | Smooth navigation | Pass |
| TC359 | Calendar - Performance | Large data performance | Many records | Smooth rendering | Pass |
| TC360 | Calendar - Export Month | Export month data | Calendar view | Export initiated | Pass |
| TC361 | Calendar - Print Month | Print month calendar | Calendar view | Print preview | Pass |
| TC362 | Calendar - Share Month | Share month summary | Calendar view | Share sheet | Pass |
| TC363 | Calendar - Staff Picker | Switch staff in calendar | Multiple staff | Staff selector | Pass |
| TC364 | Calendar - Comparison View | Compare staff attendance | Multiple selected | Side-by-side view | Pass |
| TC365 | Calendar - Streak Display | Show attendance streaks | Consistent attendance | Streak count shown | Pass |
| TC366 | Calendar - Notes Preview | Show notes on hover | Notes exist | Note preview | Pass |
| TC367 | Calendar - Overtime Indicator | Show overtime on day | Overtime recorded | OT indicator | Pass |
| TC368 | Calendar - Late Indicator | Show late arrivals | Late records | Late indicator | Pass |
| TC369 | Calendar - Anniversary | Mark work anniversary | Staff has history | Anniversary badge | Pass |
| TC370 | Calendar - Monthly Summary | Summary at month end | Month has data | Stats summary | Pass |

### 5.3 Attendance Reports (TC371-TC410)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC371 | Report - Navigate | Open attendance reports | Attendance data exists | Report screen shown | Pass |
| TC372 | Report - Date Range | Select date range | Report screen | Date picker shown | Pass |
| TC373 | Report - This Month | Select current month | Report screen | Month data loaded | Pass |
| TC374 | Report - Last Month | Select previous month | Report screen | Previous month data | Pass |
| TC375 | Report - Custom Range | Select custom dates | Date picker | Custom range applied | Pass |
| TC376 | Report - Staff Filter | Filter by staff | Multiple staff | Selected staff only | Pass |
| TC377 | Report - All Staff | Report for all staff | Multiple staff | All staff included | Pass |
| TC378 | Report - Summary Stats | View summary statistics | Data exists | Present/absent counts | Pass |
| TC379 | Report - Percentage | Calculate attendance % | Data exists | Percentage calculated | Pass |
| TC380 | Report - Present Count | Count present days | Data exists | Accurate count | Pass |
| TC381 | Report - Absent Count | Count absent days | Data exists | Accurate count | Pass |
| TC382 | Report - Half Day Count | Count half days | Data exists | Accurate count | Pass |
| TC383 | Report - Leave Count | Count leave days | Data exists | Accurate count | Pass |
| TC384 | Report - Working Days | Calculate working days | Data exists | Excludes offs/holidays | Pass |
| TC385 | Report - Chart View | View attendance chart | Data exists | Chart displayed | Pass |
| TC386 | Report - Bar Chart | Switch to bar chart | Chart view | Bar chart shown | Pass |
| TC387 | Report - Pie Chart | Switch to pie chart | Chart view | Pie chart shown | Pass |
| TC388 | Report - Line Graph | View trend line | Chart view | Trend displayed | Pass |
| TC389 | Report - Compare Months | Compare month to month | Multiple months | Comparison shown | Pass |
| TC390 | Report - Compare Staff | Compare staff to staff | Multiple staff | Comparison shown | Pass |
| TC391 | Report - Export PDF | Export report as PDF | Report generated | PDF downloaded | Pass |
| TC392 | Report - Export Excel | Export report as Excel | Report generated | Excel downloaded | Pass |
| TC393 | Report - Export CSV | Export report as CSV | Report generated | CSV downloaded | Pass |
| TC394 | Report - Share Report | Share report | Report generated | Share sheet | Pass |
| TC395 | Report - Print Report | Print report | Report generated | Print dialog | Pass |
| TC396 | Report - Email Report | Email report | Report generated | Email composed | Pass |
| TC397 | Report - Schedule Report | Schedule auto reports | Report screen | Schedule set | Pass |
| TC398 | Report - Loading State | Loading report data | Generating report | Loading indicator | Pass |
| TC399 | Report - Error State | Report generation error | Server issue | Error message | Pass |
| TC400 | Report - Empty State | No data for range | New account | Empty state message | Pass |
| TC401 | Report - Large Data | Report with many records | Lots of data | Handles efficiently | Pass |
| TC402 | Report - Filter Applied | Show active filters | Filters set | Filter indicators | Pass |
| TC403 | Report - Clear Filters | Clear all filters | Filters applied | All filters removed | Pass |
| TC404 | Report - Save Template | Save report template | Custom report | Template saved | Pass |
| TC405 | Report - Load Template | Load saved template | Template exists | Template applied | Pass |
| TC406 | Report - Salary Impact | Show salary deductions | Absences exist | Deduction calculated | Pass |
| TC407 | Report - Overtime Summary | Summarize overtime | Overtime logged | Hours totaled | Pass |
| TC408 | Report - Late Summary | Summarize late arrivals | Late records | Count and pattern | Pass |
| TC409 | Report - Trend Analysis | Analyze attendance trends | Historical data | Trends identified | Pass |
| TC410 | Report - Insights | AI-generated insights | Sufficient data | Insights displayed | Pass |

### 5.4 Attendance Approvals (TC411-TC440)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC411 | Approval - Receive | Receive attendance for approval | Staff marked attendance | Approval notification | Pass |
| TC412 | Approval - View Pending | View pending approvals | Approvals pending | List displayed | Pass |
| TC413 | Approval - Approve Single | Approve one attendance | Pending approval | Approved, staff notified | Pass |
| TC414 | Approval - Reject Single | Reject one attendance | Pending approval | Rejected, staff notified | Pass |
| TC415 | Approval - Approve All | Approve all pending | Multiple pending | All approved | Pass |
| TC416 | Approval - Reject All | Reject all pending | Multiple pending | All rejected | Pass |
| TC417 | Approval - Add Note | Add note with approval | Approving | Note attached | Pass |
| TC418 | Approval - View Details | View attendance details | Pending approval | Full details shown | Pass |
| TC419 | Approval - Compare | Compare with previous | Pending approval | Comparison view | Pass |
| TC420 | Approval - History | View approval history | Past approvals | History listed | Pass |
| TC421 | Approval - Filter Pending | Filter pending only | Mixed statuses | Only pending shown | Pass |
| TC422 | Approval - Filter Approved | Filter approved only | Mixed statuses | Only approved shown | Pass |
| TC423 | Approval - Filter Rejected | Filter rejected only | Mixed statuses | Only rejected shown | Pass |
| TC424 | Approval - Sort Date | Sort by date | Multiple approvals | Date sorted | Pass |
| TC425 | Approval - Sort Staff | Sort by staff | Multiple approvals | Staff sorted | Pass |
| TC426 | Approval - Real-time Update | Live approval status | Connected users | Status updates live | Pass |
| TC427 | Approval - Notification Sent | Notification on action | Approval processed | Staff notified | Pass |
| TC428 | Approval - Undo Action | Undo approval/rejection | Just processed | Action reversed | Pass |
| TC429 | Approval - Time Limit | Approval time limit | Old pending | Cannot approve after limit | Pass |
| TC430 | Approval - Auto-Approve | Configure auto-approve | Settings | Auto-approval enabled | Pass |
| TC431 | Approval - Delegate | Delegate approval rights | Settings | Another user can approve | Pass |
| TC432 | Approval - Bulk Actions | Bulk approve/reject | Multiple selected | Bulk processed | Pass |
| TC433 | Approval - Search | Search approvals | Approval list | Matching found | Pass |
| TC434 | Approval - Date Range | Filter by date range | Approval list | Range filtered | Pass |
| TC435 | Approval - Badge Count | Pending count badge | Pending approvals | Count shown on tab | Pass |
| TC436 | Approval - Swipe Actions | Swipe to approve/reject | Pending item | Quick action | Pass |
| TC437 | Approval - Loading | Loading approvals | Fetching data | Loading indicator | Pass |
| TC438 | Approval - Empty State | No pending approvals | All processed | Empty state message | Pass |
| TC439 | Approval - Offline Queue | Approve while offline | No network | Queued for sync | Pass |
| TC440 | Approval - Sync on Connect | Offline approvals sync | Network restored | Actions synced | Pass |

---

**End of Part 2 - Test Cases: TC191-TC440 (250 Test Cases)**
