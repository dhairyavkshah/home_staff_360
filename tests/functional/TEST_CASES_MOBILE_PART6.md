# Home Staff 360 - Functional Test Cases (Mobile App)

## Part 6: Staff Mode (TC1051-TC1200)

---

## Section 13: Staff Mode Core Features (TC1051-TC1120)

### 13.1 Staff Mode Activation (TC1051-TC1070)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1051 | Staff Mode - Switch | Switch to Staff Mode | In Home Mode | Staff Mode active | Pass |
| TC1052 | Staff Mode - Welcome | Welcome screen on first use | First time | Onboarding shown | Pass |
| TC1053 | Staff Mode - Dashboard | View staff dashboard | Staff Mode | Dashboard shown | Pass |
| TC1054 | Staff Mode - Navigation | Bottom navigation | Staff Mode | Staff tabs shown | Pass |
| TC1055 | Staff Mode - Homes Tab | Homes/Clients tab | Staff Mode | Homes list | Pass |
| TC1056 | Staff Mode - Attendance Tab | My Attendance tab | Staff Mode | Attendance | Pass |
| TC1057 | Staff Mode - Earnings Tab | Earnings tab | Staff Mode | Earnings view | Pass |
| TC1058 | Staff Mode - Expenses Tab | My Expenses tab | Staff Mode | Expenses | Pass |
| TC1059 | Staff Mode - Profile | Staff profile view | Staff Mode | Profile shown | Pass |
| TC1060 | Staff Mode - Data Separate | Data separate from Home | Staff Mode | Different data | Pass |
| TC1061 | Staff Mode - Switch Back | Switch to Home Mode | Staff Mode | Home Mode active | Pass |
| TC1062 | Staff Mode - Persist | Mode persists on restart | Mode selected | Same mode | Pass |
| TC1063 | Staff Mode - Summary | Dashboard summary stats | Staff Mode | Stats shown | Pass |
| TC1064 | Staff Mode - Today | Today's schedule | Staff Mode | Today shown | Pass |
| TC1065 | Staff Mode - Pending | Pending items | Staff Mode | Pending count | Pass |
| TC1066 | Staff Mode - Quick Actions | Quick action buttons | Dashboard | Actions available | Pass |
| TC1067 | Staff Mode - Recent Activity | Recent activity feed | Activity exists | Feed shown | Pass |
| TC1068 | Staff Mode - Notifications | Notification badge | Notifications | Badge count | Pass |
| TC1069 | Staff Mode - Real-time | Live updates | Connected | Updates live | Pass |
| TC1070 | Staff Mode - Offline | Offline access | No network | Cached data | Pass |

### 13.2 Client Homes Management (TC1071-TC1100)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1071 | Homes - View List | View client homes list | Staff Mode | Homes listed | Pass |
| TC1072 | Homes - Empty State | No homes added | New staff | Empty state | Pass |
| TC1073 | Homes - Add Home | Add new client home | Homes screen | Add form | Pass |
| TC1074 | Homes - Client Name | Enter client name | Add form | Name saved | Pass |
| TC1075 | Homes - Address | Enter address | Add form | Address saved | Pass |
| TC1076 | Homes - Phone | Enter client phone | Add form | Phone saved | Pass |
| TC1077 | Homes - Service Type | Select service type | Add form | Type selected | Pass |
| TC1078 | Homes - Rate | Enter service rate | Add form | Rate saved | Pass |
| TC1079 | Homes - Rate Period | Rate per day/week/month | Add form | Period selected | Pass |
| TC1080 | Homes - Schedule | Set work schedule | Add form | Schedule saved | Pass |
| TC1081 | Homes - Days | Select working days | Schedule | Days selected | Pass |
| TC1082 | Homes - Time | Set work timing | Schedule | Time saved | Pass |
| TC1083 | Homes - Notes | Add notes | Add form | Notes saved | Pass |
| TC1084 | Homes - Save | Save home | Valid data | Home created | Pass |
| TC1085 | Homes - Card Display | Home card info | Homes exist | Info shown | Pass |
| TC1086 | Homes - Connection Status | Show if connected | Has connection | Status badge | Pass |
| TC1087 | Homes - Edit | Edit home details | Home exists | Edit form | Pass |
| TC1088 | Homes - Delete | Delete home | Home exists | Confirmation | Pass |
| TC1089 | Homes - Search | Search homes | Multiple homes | Matching found | Pass |
| TC1090 | Homes - Filter | Filter by status | Various status | Filtered | Pass |
| TC1091 | Homes - Sort | Sort homes | Multiple homes | Sorted | Pass |
| TC1092 | Homes - Detail View | View home details | Home exists | Details shown | Pass |
| TC1093 | Homes - Quick Call | Quick call client | Phone saved | Dialer opens | Pass |
| TC1094 | Homes - Quick Message | Message client | Connected | Chat opens | Pass |
| TC1095 | Homes - Quick Attendance | Mark attendance | Home selected | Attendance form | Pass |
| TC1096 | Homes - Earnings | View home earnings | Payments exist | Earnings shown | Pass |
| TC1097 | Homes - History | View work history | History exists | History shown | Pass |
| TC1098 | Homes - Auto-Connect | Auto-connect client | Client registered | Connection created | Pass |
| TC1099 | Homes - Pending Link | Pending phone link | Client not registered | Link created | Pass |
| TC1100 | Homes - Sync Data | Sync with connected | Connection active | Data syncs | Pass |

### 13.3 Staff Attendance Logging (TC1101-TC1120)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1101 | Attendance - View | View my attendance | Staff Mode | Attendance screen | Pass |
| TC1102 | Attendance - Log Today | Log today's attendance | Staff Mode | Form shown | Pass |
| TC1103 | Attendance - Select Home | Select home for log | Multiple homes | Home selected | Pass |
| TC1104 | Attendance - Check In | Record check-in time | Logging | Time saved | Pass |
| TC1105 | Attendance - Check Out | Record check-out time | Checked in | Time saved | Pass |
| TC1106 | Attendance - Full Day | Mark full day | Logging | Full day status | Pass |
| TC1107 | Attendance - Half Day | Mark half day | Logging | Half day status | Pass |
| TC1108 | Attendance - Leave | Mark leave | Logging | Leave status | Pass |
| TC1109 | Attendance - Notes | Add attendance notes | Logging | Notes saved | Pass |
| TC1110 | Attendance - Location | Add location tag | Permission granted | Location saved | Pass |
| TC1111 | Attendance - Save | Save attendance log | Valid data | Log saved | Pass |
| TC1112 | Attendance - Submit | Submit for approval | Log saved | Submitted | Pass |
| TC1113 | Attendance - Pending | View pending | Submitted | Pending shown | Pass |
| TC1114 | Attendance - Approved | View approved | Approved | Status shown | Pass |
| TC1115 | Attendance - Rejected | View rejected | Rejected | Status shown | Pass |
| TC1116 | Attendance - Edit | Edit pending log | Pending status | Edit form | Pass |
| TC1117 | Attendance - Calendar | View attendance calendar | Logs exist | Calendar shown | Pass |
| TC1118 | Attendance - Monthly | Monthly summary | Month data | Summary shown | Pass |
| TC1119 | Attendance - Real-time | Sync to employer | Connected | Employer sees | Pass |
| TC1120 | Attendance - Notification | Notification on approval | Approved/rejected | Notification | Pass |

---

## Section 14: Staff Earnings & Invoices (TC1121-TC1170)

### 14.1 Earnings Tracking (TC1121-TC1145)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1121 | Earnings - View | View earnings dashboard | Staff Mode | Earnings shown | Pass |
| TC1122 | Earnings - Total | Total earnings displayed | Payments exist | Total calculated | Pass |
| TC1123 | Earnings - Period | Earnings by period | Multiple payments | Period totals | Pass |
| TC1124 | Earnings - This Month | This month earnings | Month data | Month total | Pass |
| TC1125 | Earnings - Last Month | Last month earnings | Previous month | Last month total | Pass |
| TC1126 | Earnings - By Home | Earnings per home | Multiple homes | Home breakdown | Pass |
| TC1127 | Earnings - Pending | Pending payments | Due amounts | Pending shown | Pass |
| TC1128 | Earnings - Received | Received payments | Payments received | Received total | Pass |
| TC1129 | Earnings - History | Payment history | Payments exist | History list | Pass |
| TC1130 | Earnings - Detail | Payment detail | Payment exists | Details shown | Pass |
| TC1131 | Earnings - Chart | Earnings chart | Data exists | Chart displayed | Pass |
| TC1132 | Earnings - Trend | Earnings trend | Historical data | Trend shown | Pass |
| TC1133 | Earnings - Compare | Compare months | Multiple months | Comparison | Pass |
| TC1134 | Earnings - Filter | Filter payments | Various | Filtered | Pass |
| TC1135 | Earnings - Search | Search payments | Multiple | Found | Pass |
| TC1136 | Earnings - Export | Export earnings | Data exists | Export options | Pass |
| TC1137 | Earnings - PDF | Export PDF | Report ready | PDF downloaded | Pass |
| TC1138 | Earnings - Real-time | Live payment updates | Connected | Updates live | Pass |
| TC1139 | Earnings - Notification | Payment notification | Payment received | Notification | Pass |
| TC1140 | Earnings - Goal | Set earnings goal | Earnings screen | Goal set | Pass |
| TC1141 | Earnings - Goal Progress | View goal progress | Goal set | Progress shown | Pass |
| TC1142 | Earnings - Tax Estimate | Estimate tax | Sufficient earnings | Estimate shown | Pass |
| TC1143 | Earnings - Annual | Annual summary | Year data | Summary shown | Pass |
| TC1144 | Earnings - Share | Share earnings | Report ready | Share sheet | Pass |
| TC1145 | Earnings - Currency | Earnings in currency | Currency set | Formatted | Pass |

### 14.2 Invoice Generation (TC1146-TC1170)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1146 | Invoice - Navigate | Open invoices | Staff Mode | Invoices screen | Pass |
| TC1147 | Invoice - New | Create new invoice | Invoices screen | Create form | Pass |
| TC1148 | Invoice - Select Client | Select client/home | Creating | Client selected | Pass |
| TC1149 | Invoice - Period | Set invoice period | Creating | Period set | Pass |
| TC1150 | Invoice - Auto-Fill | Auto-fill from attendance | Period set | Data populated | Pass |
| TC1151 | Invoice - Add Line | Add line item | Creating | Line added | Pass |
| TC1152 | Invoice - Description | Item description | Adding line | Description saved | Pass |
| TC1153 | Invoice - Quantity | Item quantity | Adding line | Quantity saved | Pass |
| TC1154 | Invoice - Rate | Item rate | Adding line | Rate saved | Pass |
| TC1155 | Invoice - Line Total | Calculate line total | Quantity & rate | Total calculated | Pass |
| TC1156 | Invoice - Multiple Lines | Multiple line items | Creating | All lines shown | Pass |
| TC1157 | Invoice - Remove Line | Remove line item | Lines exist | Line removed | Pass |
| TC1158 | Invoice - Subtotal | Calculate subtotal | Lines exist | Subtotal shown | Pass |
| TC1159 | Invoice - Tax | Add tax | Invoice form | Tax calculated | Pass |
| TC1160 | Invoice - Discount | Add discount | Invoice form | Discount applied | Pass |
| TC1161 | Invoice - Total | Calculate total | All items | Total shown | Pass |
| TC1162 | Invoice - Notes | Add notes | Invoice form | Notes saved | Pass |
| TC1163 | Invoice - Terms | Add payment terms | Invoice form | Terms saved | Pass |
| TC1164 | Invoice - Due Date | Set due date | Invoice form | Due date set | Pass |
| TC1165 | Invoice - Save | Save invoice | Valid data | Invoice saved | Pass |
| TC1166 | Invoice - Preview | Preview invoice | Invoice ready | Preview shown | Pass |
| TC1167 | Invoice - Share | Share invoice | Invoice ready | Share sheet | Pass |
| TC1168 | Invoice - PDF | Download PDF | Invoice ready | PDF downloaded | Pass |
| TC1169 | Invoice - Send | Send to client | Client connected | Invoice sent | Pass |
| TC1170 | Invoice - Status | Track payment status | Invoice sent | Status tracked | Pass |

---

## Section 15: Staff Expenses & Documents (TC1171-TC1200)

### 15.1 Staff Expense Tracking (TC1171-TC1190)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1171 | Expense - Navigate | Open my expenses | Staff Mode | Expenses screen | Pass |
| TC1172 | Expense - New | Create expense | Expenses screen | Expense form | Pass |
| TC1173 | Expense - Amount | Enter amount | Creating | Amount saved | Pass |
| TC1174 | Expense - Category | Select category | Creating | Category selected | Pass |
| TC1175 | Expense - Travel | Travel expense | Categories | Travel selected | Pass |
| TC1176 | Expense - Supplies | Supplies expense | Categories | Supplies selected | Pass |
| TC1177 | Expense - Equipment | Equipment expense | Categories | Equipment selected | Pass |
| TC1178 | Expense - Link Home | Link to client home | Creating | Home linked | Pass |
| TC1179 | Expense - Receipt | Attach receipt | Creating | Receipt attached | Pass |
| TC1180 | Expense - Save | Save expense | Valid data | Expense saved | Pass |
| TC1181 | Expense - Submit | Submit for reimbursement | Expense saved | Submitted | Pass |
| TC1182 | Expense - Pending | View pending | Submitted | Pending shown | Pass |
| TC1183 | Expense - Approved | View approved | Approved | Status shown | Pass |
| TC1184 | Expense - Rejected | View rejected | Rejected | Status shown | Pass |
| TC1185 | Expense - List | View all expenses | Expenses exist | List shown | Pass |
| TC1186 | Expense - Filter | Filter expenses | Various | Filtered | Pass |
| TC1187 | Expense - Total | Monthly total | Month data | Total shown | Pass |
| TC1188 | Expense - Real-time | Sync to employer | Connected | Employer sees | Pass |
| TC1189 | Expense - Notification | Notification on status | Status changed | Notification | Pass |
| TC1190 | Expense - Report | Expense report | Data exists | Report generated | Pass |

### 15.2 Staff Documents (TC1191-TC1200)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1191 | Docs - Navigate | Open my documents | Staff Mode | Documents screen | Pass |
| TC1192 | Docs - Upload | Upload document | Documents screen | Upload started | Pass |
| TC1193 | Docs - ID Proof | Upload ID proof | Uploading | Categorized | Pass |
| TC1194 | Docs - Certificates | Upload certificates | Uploading | Categorized | Pass |
| TC1195 | Docs - View | View document | Document exists | Opened | Pass |
| TC1196 | Docs - Share | Share with employer | Document exists | Shared | Pass |
| TC1197 | Docs - Delete | Delete document | Document exists | Deleted | Pass |
| TC1198 | Docs - Verify | Document verified | Employer verifies | Verified badge | Pass |
| TC1199 | Docs - Expiry | Track expiry dates | Expiry set | Alerts shown | Pass |
| TC1200 | Docs - Renew Alert | Renewal reminder | Near expiry | Notification | Pass |

---

**End of Part 6 - Test Cases: TC1051-TC1200 (150 Test Cases)**
