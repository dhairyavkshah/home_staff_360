# Home Staff 360 - Functional Test Cases (Admin Panel)

## Admin Panel Test Cases (TC1201-TC1500)

---

## Section 16: Admin Authentication & Access (TC1201-TC1240)

### 16.1 Admin Login (TC1201-TC1220)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1201 | Admin Login - Navigate | Open admin login page | Admin URL | Login page shown | Pass |
| TC1202 | Admin Login - Valid | Login with valid credentials | Admin account | Login successful | Pass |
| TC1203 | Admin Login - Invalid Password | Login with wrong password | Admin account | Error: "Invalid credentials" | Pass |
| TC1204 | Admin Login - Invalid Email | Login with wrong email | Admin panel | Error: "Invalid credentials" | Pass |
| TC1205 | Admin Login - Empty Email | Submit without email | Login page | Error: "Email required" | Pass |
| TC1206 | Admin Login - Empty Password | Submit without password | Login page | Error: "Password required" | Pass |
| TC1207 | Admin Login - Loading | Loading state during login | Submitting | Loading indicator | Pass |
| TC1208 | Admin Login - Token | JWT token created | Successful login | Token stored | Pass |
| TC1209 | Admin Login - Session | 8-hour session expiry | Token created | 8 hour validity | Pass |
| TC1210 | Admin Login - Expired | Session expired | 8+ hours | Redirected to login | Pass |
| TC1211 | Admin Login - Auto | Auto-login if valid token | Recently logged in | Dashboard shown | Pass |
| TC1212 | Admin Login - Logout | Logout from admin | Logged in | Session ended | Pass |
| TC1213 | Admin Login - Multiple | Multiple admin sessions | Different browsers | Both valid | Pass |
| TC1214 | Admin Login - Rate Limit | Too many failed attempts | 5+ failures | Account locked | Pass |
| TC1215 | Admin Login - Unlock | Account unlocked after time | Was locked | Unlocked after 30 min | Pass |
| TC1216 | Admin Login - Secure | HTTPS required | Login attempt | Encrypted connection | Pass |
| TC1217 | Admin Login - Remember | Remember me option | Login page | Extended session | Pass |
| TC1218 | Admin Login - Forgot | Forgot password link | Login page | Reset flow | Pass |
| TC1219 | Admin Login - Reset | Password reset | Forgot password | Password reset | Pass |
| TC1220 | Admin Login - Audit | Login audit log | Successful login | Log entry created | Pass |

### 16.2 Role-Based Access (TC1221-TC1240)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1221 | RBAC - Super Admin | Super admin full access | Super admin login | All features available | Pass |
| TC1222 | RBAC - Admin | Admin user management | Admin login | Limited access | Pass |
| TC1223 | RBAC - Moderator | Moderator content access | Moderator login | Content only | Pass |
| TC1224 | RBAC - Deny Access | Access denied for role | Wrong role | Access denied | Pass |
| TC1225 | RBAC - Menu Filter | Menu filtered by role | Any admin | Role-based menu | Pass |
| TC1226 | RBAC - Create Admin | Super admin creates admin | Super admin | Admin created | Pass |
| TC1227 | RBAC - Create Moderator | Admin creates moderator | Admin role | Moderator created | Pass |
| TC1228 | RBAC - Role Change | Change admin role | Super admin | Role updated | Pass |
| TC1229 | RBAC - Deactivate | Deactivate admin | Super admin | Admin deactivated | Pass |
| TC1230 | RBAC - Reactivate | Reactivate admin | Super admin | Admin reactivated | Pass |
| TC1231 | RBAC - Delete Admin | Delete admin account | Super admin | Admin deleted | Pass |
| TC1232 | RBAC - Self Protect | Cannot delete self | Super admin | Self-delete blocked | Pass |
| TC1233 | RBAC - View Admins | View admin list | Any admin | List shown | Pass |
| TC1234 | RBAC - Search Admins | Search admins | Admin list | Matching found | Pass |
| TC1235 | RBAC - Filter Role | Filter by role | Admin list | Filtered | Pass |
| TC1236 | RBAC - Audit Trail | Admin action audit | Any action | Audit logged | Pass |
| TC1237 | RBAC - Permission Check | API permission check | API call | Role verified | Pass |
| TC1238 | RBAC - 403 Response | Unauthorized API call | Wrong role | 403 returned | Pass |
| TC1239 | RBAC - Role Inherit | Role inheritance | Child role | Parent perms inherit | Pass |
| TC1240 | RBAC - Session Role | Role checked per request | Any request | Role validated | Pass |

---

## Section 17: Admin Dashboard & Analytics (TC1241-TC1290)

### 17.1 Dashboard Overview (TC1241-TC1260)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1241 | Dashboard - View | View admin dashboard | Logged in | Dashboard shown | Pass |
| TC1242 | Dashboard - Total Users | Total user count | Users exist | Count displayed | Pass |
| TC1243 | Dashboard - Active Users | Active user count | Users active | Count displayed | Pass |
| TC1244 | Dashboard - New Today | New users today | Registrations | Count displayed | Pass |
| TC1245 | Dashboard - New Week | New users this week | Registrations | Count displayed | Pass |
| TC1246 | Dashboard - New Month | New users this month | Registrations | Count displayed | Pass |
| TC1247 | Dashboard - Growth Chart | User growth chart | Historical data | Chart shown | Pass |
| TC1248 | Dashboard - Active Chart | Active users chart | Usage data | Chart shown | Pass |
| TC1249 | Dashboard - Sessions | Active sessions | Live sessions | Count shown | Pass |
| TC1250 | Dashboard - Connections | Total connections | Connections made | Count shown | Pass |
| TC1251 | Dashboard - Messages | Message volume | Messages sent | Count shown | Pass |
| TC1252 | Dashboard - Revenue | Revenue metrics | If applicable | Metrics shown | Pass |
| TC1253 | Dashboard - System Health | System health status | Server running | Status indicators | Pass |
| TC1254 | Dashboard - API Status | API health | APIs active | Status shown | Pass |
| TC1255 | Dashboard - Database | Database status | DB connected | Status shown | Pass |
| TC1256 | Dashboard - Quick Links | Admin quick links | Dashboard | Links available | Pass |
| TC1257 | Dashboard - Refresh | Refresh data | Dashboard | Data reloaded | Pass |
| TC1258 | Dashboard - Auto-Refresh | Auto-refresh interval | Dashboard | Auto-updates | Pass |
| TC1259 | Dashboard - Date Range | Filter by date range | Dashboard | Range applied | Pass |
| TC1260 | Dashboard - Export | Export dashboard data | Dashboard | Data exported | Pass |

### 17.2 Analytics & Reports (TC1261-TC1290)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1261 | Analytics - Navigate | Open analytics section | Admin access | Analytics screen | Pass |
| TC1262 | Analytics - User Growth | User growth analytics | Historical data | Growth charts | Pass |
| TC1263 | Analytics - Daily Active | DAU metrics | Usage data | DAU shown | Pass |
| TC1264 | Analytics - Weekly Active | WAU metrics | Usage data | WAU shown | Pass |
| TC1265 | Analytics - Monthly Active | MAU metrics | Usage data | MAU shown | Pass |
| TC1266 | Analytics - Retention | User retention | Historical | Retention curves | Pass |
| TC1267 | Analytics - Churn | Churn rate | Historical | Churn metrics | Pass |
| TC1268 | Analytics - Engagement | Engagement metrics | Usage data | Metrics shown | Pass |
| TC1269 | Analytics - Feature Usage | Feature usage stats | Usage data | Per-feature stats | Pass |
| TC1270 | Analytics - Top Features | Most used features | Usage data | Ranked list | Pass |
| TC1271 | Analytics - Geography | Geographic distribution | User data | Map/chart shown | Pass |
| TC1272 | Analytics - Language | Language distribution | User data | Language chart | Pass |
| TC1273 | Analytics - Currency | Currency distribution | User data | Currency chart | Pass |
| TC1274 | Analytics - Device | Device types | User agents | Device breakdown | Pass |
| TC1275 | Analytics - Platform | Platform split | User agents | iOS/Android/Web | Pass |
| TC1276 | Analytics - Session Duration | Average session length | Sessions | Duration shown | Pass |
| TC1277 | Analytics - Peak Hours | Peak usage hours | Usage data | Heatmap shown | Pass |
| TC1278 | Analytics - Comparison | Compare periods | Multiple periods | Comparison view | Pass |
| TC1279 | Analytics - Export | Export analytics | Report ready | Data exported | Pass |
| TC1280 | Analytics - Schedule | Schedule reports | Analytics | Schedule set | Pass |
| TC1281 | Reports - Users | Generate user report | Analytics | Report generated | Pass |
| TC1282 | Reports - Activity | Activity report | Analytics | Report generated | Pass |
| TC1283 | Reports - Financial | Financial report | If applicable | Report generated | Pass |
| TC1284 | Reports - Custom | Custom report builder | Analytics | Builder shown | Pass |
| TC1285 | Reports - Templates | Report templates | Admin | Templates available | Pass |
| TC1286 | Reports - PDF | Export as PDF | Report ready | PDF downloaded | Pass |
| TC1287 | Reports - Excel | Export as Excel | Report ready | Excel downloaded | Pass |
| TC1288 | Reports - Email | Email report | Report ready | Email sent | Pass |
| TC1289 | Reports - History | Report history | Past reports | History listed | Pass |
| TC1290 | Reports - Loading | Loading state | Generating | Loading shown | Pass |

---

## Section 18: User Management (TC1291-TC1360)

### 18.1 User List & Search (TC1291-TC1320)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1291 | Users - Navigate | Open user management | Admin access | User list shown | Pass |
| TC1292 | Users - List All | View all users | Users exist | List displayed | Pass |
| TC1293 | Users - Pagination | Paginate user list | Many users | Pages available | Pass |
| TC1294 | Users - Page Size | Change page size | User list | Size changed | Pass |
| TC1295 | Users - Search Phone | Search by phone | Users exist | Matching found | Pass |
| TC1296 | Users - Search Name | Search by name | Users exist | Matching found | Pass |
| TC1297 | Users - Search Partial | Partial search | Users exist | Fuzzy match | Pass |
| TC1298 | Users - Filter Active | Filter active users | Mixed status | Only active | Pass |
| TC1299 | Users - Filter Inactive | Filter inactive | Mixed status | Only inactive | Pass |
| TC1300 | Users - Filter Mode | Filter by mode | Home/Staff users | Mode filtered | Pass |
| TC1301 | Users - Filter Date | Filter by join date | Various dates | Date filtered | Pass |
| TC1302 | Users - Sort Name | Sort by name | Users exist | Name sorted | Pass |
| TC1303 | Users - Sort Date | Sort by date | Users exist | Date sorted | Pass |
| TC1304 | Users - Sort Activity | Sort by last active | Users exist | Activity sorted | Pass |
| TC1305 | Users - Column Toggle | Toggle columns | User list | Columns changed | Pass |
| TC1306 | Users - Export | Export user list | Users exist | List exported | Pass |
| TC1307 | Users - Bulk Select | Select multiple users | User list | Multi-selected | Pass |
| TC1308 | Users - Bulk Action | Bulk action on selected | Selected users | Action applied | Pass |
| TC1309 | Users - Refresh | Refresh user list | User list | Data reloaded | Pass |
| TC1310 | Users - Loading | Loading state | Fetching | Loading shown | Pass |
| TC1311 | Users - Empty | No users found | Search/filter | Empty state | Pass |
| TC1312 | Users - Error | Error loading | Server issue | Error message | Pass |
| TC1313 | Users - Card View | User card info | List view | Card details | Pass |
| TC1314 | Users - Avatar | User avatar shown | Photo exists | Avatar displayed | Pass |
| TC1315 | Users - Status Badge | Status indicator | User row | Badge shown | Pass |
| TC1316 | Users - Quick View | Quick view popup | User row | Preview shown | Pass |
| TC1317 | Users - Tap Detail | Tap for full detail | User row | Detail page | Pass |
| TC1318 | Users - Copy Phone | Copy phone number | User detail | Phone copied | Pass |
| TC1319 | Users - Quick Actions | Row quick actions | User row | Actions shown | Pass |
| TC1320 | Users - Real-time | Real-time updates | User changes | List updates | Pass |

### 18.2 User Detail & Actions (TC1321-TC1360)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1321 | User Detail - View | View user detail | User exists | Full detail shown | Pass |
| TC1322 | User Detail - Profile | Profile information | User detail | Profile section | Pass |
| TC1323 | User Detail - Activity | Activity log | User detail | Activity shown | Pass |
| TC1324 | User Detail - Connections | User connections | Connections exist | Connections listed | Pass |
| TC1325 | User Detail - Messages | Message count | Messages sent | Count shown | Pass |
| TC1326 | User Detail - Attendance | Attendance summary | Staff data | Summary shown | Pass |
| TC1327 | User Detail - Payments | Payment history | Transactions | History shown | Pass |
| TC1328 | User Detail - Edit | Edit user info | Admin access | Edit form | Pass |
| TC1329 | User Detail - Name | Edit display name | Editing | Name updated | Pass |
| TC1330 | User Detail - Phone | Edit phone (restricted) | Super admin | Phone updated | Pass |
| TC1331 | User Detail - Status | Change user status | Admin access | Status updated | Pass |
| TC1332 | User - Activate | Activate user | Inactive user | Activated | Pass |
| TC1333 | User - Deactivate | Deactivate user | Active user | Deactivated | Pass |
| TC1334 | User - Suspend | Suspend user | Active user | Suspended | Pass |
| TC1335 | User - Unsuspend | Unsuspend user | Suspended | Unsuspended | Pass |
| TC1336 | User - Delete | Delete user | User exists | Confirmation | Pass |
| TC1337 | User - Delete Confirm | Confirm deletion | Dialog shown | User deleted | Pass |
| TC1338 | User - Reset Password | Reset user password | User exists | Password reset | Pass |
| TC1339 | User - Force Logout | Force logout user | User logged in | Sessions ended | Pass |
| TC1340 | User - Sessions | View user sessions | Sessions exist | Sessions listed | Pass |
| TC1341 | User - End Session | End specific session | Session exists | Session ended | Pass |
| TC1342 | User - Notes | Add admin notes | User detail | Notes saved | Pass |
| TC1343 | User - Flag | Flag user | User detail | Flag added | Pass |
| TC1344 | User - Unflag | Remove flag | Flagged user | Flag removed | Pass |
| TC1345 | User - Impersonate | Impersonate user | Super admin | Session started | Pass |
| TC1346 | User - Export Data | Export user data | User detail | Data exported | Pass |
| TC1347 | User - Send Message | Send system message | User detail | Message sent | Pass |
| TC1348 | User - Verify Phone | Verify phone manually | User detail | Phone verified | Pass |
| TC1349 | User - Merge | Merge duplicate users | Duplicates exist | Users merged | Pass |
| TC1350 | User - Split | Split merged data | Wrong merge | Data split | Pass |
| TC1351 | User - Audit | User audit trail | User detail | Audit shown | Pass |
| TC1352 | User - Created By | Show who created | Admin created | Creator shown | Pass |
| TC1353 | User - Modified By | Show who modified | Admin edited | Modifier shown | Pass |
| TC1354 | User - Timestamps | Created/updated times | User exists | Times shown | Pass |
| TC1355 | User - GDPR Export | GDPR data export | Request | Full export | Pass |
| TC1356 | User - GDPR Delete | GDPR deletion | Request | Full deletion | Pass |
| TC1357 | User - Anonymize | Anonymize user | Request | Data anonymized | Pass |
| TC1358 | User - History | View change history | User modified | History shown | Pass |
| TC1359 | User - Rollback | Rollback changes | History exists | Changes reverted | Pass |
| TC1360 | User - Permissions | View user permissions | User detail | Permissions shown | Pass |

---

## Section 19: Advertising Management (TC1361-TC1430)

### 19.1 Ad Campaign Management (TC1361-TC1395)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1361 | Ads - Navigate | Open ads management | Admin access | Ads screen shown | Pass |
| TC1362 | Ads - List All | View all ad campaigns | Ads exist | List displayed | Pass |
| TC1363 | Ads - Create | Create new ad campaign | Ads screen | Create form | Pass |
| TC1364 | Ads - Title | Enter campaign title | Creating | Title saved | Pass |
| TC1365 | Ads - Description | Enter description | Creating | Description saved | Pass |
| TC1366 | Ads - Type Video | Select video ad type | Creating | Video selected | Pass |
| TC1367 | Ads - Upload Video | Upload video file | Video type | Video uploaded | Pass |
| TC1368 | Ads - Video Preview | Preview uploaded video | Video uploaded | Preview plays | Pass |
| TC1369 | Ads - Duration | Set max duration | Creating | Duration set | Pass |
| TC1370 | Ads - Skip Time | Set skip after time | Creating | Skip time set (5s) | Pass |
| TC1371 | Ads - Click URL | Set click-through URL | Creating | URL saved | Pass |
| TC1372 | Ads - Start Date | Set campaign start | Creating | Start date set | Pass |
| TC1373 | Ads - End Date | Set campaign end | Creating | End date set | Pass |
| TC1374 | Ads - Weight | Set display weight | Creating | Weight saved | Pass |
| TC1375 | Ads - Priority | Set priority level | Creating | Priority set | Pass |
| TC1376 | Ads - Targeting | Set targeting options | Creating | Targeting saved | Pass |
| TC1377 | Ads - Budget | Set campaign budget | Creating | Budget saved | Pass |
| TC1378 | Ads - Save | Save ad campaign | Valid data | Campaign saved | Pass |
| TC1379 | Ads - Activate | Activate campaign | Inactive ad | Activated | Pass |
| TC1380 | Ads - Pause | Pause campaign | Active ad | Paused | Pass |
| TC1381 | Ads - Edit | Edit campaign | Campaign exists | Edit form | Pass |
| TC1382 | Ads - Update | Save edited campaign | Changes made | Updated | Pass |
| TC1383 | Ads - Delete | Delete campaign | Campaign exists | Confirmation | Pass |
| TC1384 | Ads - Delete Confirm | Confirm deletion | Dialog shown | Deleted | Pass |
| TC1385 | Ads - Duplicate | Duplicate campaign | Campaign exists | Copy created | Pass |
| TC1386 | Ads - Preview | Preview ad display | Campaign exists | Preview shown | Pass |
| TC1387 | Ads - Test | Test ad delivery | Campaign active | Test shown | Pass |
| TC1388 | Ads - Filter Status | Filter by status | Various status | Filtered | Pass |
| TC1389 | Ads - Filter Date | Filter by date | Date range | Filtered | Pass |
| TC1390 | Ads - Search | Search campaigns | Campaigns exist | Matching found | Pass |
| TC1391 | Ads - Sort | Sort campaigns | Multiple | Sorted | Pass |
| TC1392 | Ads - Bulk Actions | Bulk status change | Selected | Status changed | Pass |
| TC1393 | Ads - Export | Export campaign list | Campaigns exist | List exported | Pass |
| TC1394 | Ads - Schedule | Schedule status change | Campaign exists | Schedule set | Pass |
| TC1395 | Ads - Rotation | Configure rotation | Multiple active | Rotation set | Pass |

### 19.2 Ad Analytics (TC1396-TC1430)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1396 | Ad Stats - Dashboard | View ad analytics | Ads running | Dashboard shown | Pass |
| TC1397 | Ad Stats - Impressions | Total impressions | Ad views | Count shown | Pass |
| TC1398 | Ad Stats - Per Campaign | Impressions per campaign | Multiple ads | Breakdown shown | Pass |
| TC1399 | Ad Stats - Completions | Video completion count | Videos watched | Count shown | Pass |
| TC1400 | Ad Stats - Completion Rate | Calculate completion % | Views & completes | Rate calculated | Pass |
| TC1401 | Ad Stats - Skips | Skip count | Skips tracked | Count shown | Pass |
| TC1402 | Ad Stats - Skip Rate | Calculate skip % | Views & skips | Rate calculated | Pass |
| TC1403 | Ad Stats - Clicks | Click-through count | Clicks tracked | Count shown | Pass |
| TC1404 | Ad Stats - CTR | Click-through rate | Impressions & clicks | CTR calculated | Pass |
| TC1405 | Ad Stats - Chart | Impressions chart | Historical data | Chart shown | Pass |
| TC1406 | Ad Stats - Trend | Impression trends | Historical | Trend line | Pass |
| TC1407 | Ad Stats - Compare | Compare campaigns | Multiple | Comparison | Pass |
| TC1408 | Ad Stats - Period | Filter by period | Date range | Range applied | Pass |
| TC1409 | Ad Stats - Daily | Daily breakdown | Period selected | Daily stats | Pass |
| TC1410 | Ad Stats - Weekly | Weekly breakdown | Period selected | Weekly stats | Pass |
| TC1411 | Ad Stats - Monthly | Monthly breakdown | Period selected | Monthly stats | Pass |
| TC1412 | Ad Stats - Device | Stats by device | Device data | Breakdown | Pass |
| TC1413 | Ad Stats - Geography | Stats by location | Location data | Geo breakdown | Pass |
| TC1414 | Ad Stats - Time | Stats by time of day | Time data | Time breakdown | Pass |
| TC1415 | Ad Stats - Performance | Top performing ads | Multiple ads | Ranked list | Pass |
| TC1416 | Ad Stats - Underperform | Underperforming ads | Multiple ads | Alerts shown | Pass |
| TC1417 | Ad Stats - Revenue | Revenue if applicable | Revenue tracked | Revenue shown | Pass |
| TC1418 | Ad Stats - Export | Export analytics | Data exists | Data exported | Pass |
| TC1419 | Ad Stats - PDF | Export as PDF | Report ready | PDF downloaded | Pass |
| TC1420 | Ad Stats - Schedule | Schedule reports | Analytics | Schedule set | Pass |
| TC1421 | Ad Stats - Real-time | Real-time stats | Ads running | Live updates | Pass |
| TC1422 | Ad Stats - Refresh | Refresh stats | Analytics | Data reloaded | Pass |
| TC1423 | Ad Stats - Loading | Loading state | Fetching | Loading shown | Pass |
| TC1424 | Ad Stats - Error | Error state | Server issue | Error message | Pass |
| TC1425 | Ad Stats - Empty | No data | New ads | Empty state | Pass |
| TC1426 | Ad Stats - ROI | ROI calculation | Cost & revenue | ROI shown | Pass |
| TC1427 | Ad Stats - Goals | Campaign goals | Goals set | Progress shown | Pass |
| TC1428 | Ad Stats - Alerts | Performance alerts | Thresholds | Alerts triggered | Pass |
| TC1429 | Ad Stats - Forecast | Performance forecast | Historical | Forecast shown | Pass |
| TC1430 | Ad Stats - Optimize | Optimization suggestions | Sufficient data | Suggestions shown | Pass |

---

## Section 20: System Administration (TC1431-TC1500)

### 20.1 Maintenance & Broadcasts (TC1431-TC1460)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1431 | Maintenance - Navigate | Open maintenance | Admin access | Maintenance screen | Pass |
| TC1432 | Maintenance - Enable | Enable maintenance mode | Admin access | Mode enabled | Pass |
| TC1433 | Maintenance - Disable | Disable maintenance | Mode enabled | Mode disabled | Pass |
| TC1434 | Maintenance - Message | Set maintenance message | Enabling | Message saved | Pass |
| TC1435 | Maintenance - Schedule | Schedule maintenance | Maintenance | Schedule set | Pass |
| TC1436 | Maintenance - Duration | Set expected duration | Scheduling | Duration saved | Pass |
| TC1437 | Maintenance - Notify | Notify users | Before maintenance | Users notified | Pass |
| TC1438 | Maintenance - Admin Access | Admin access during | Mode enabled | Admins can access | Pass |
| TC1439 | Maintenance - User Block | Users blocked | Mode enabled | Users see message | Pass |
| TC1440 | Broadcast - Navigate | Open broadcasts | Admin access | Broadcasts screen | Pass |
| TC1441 | Broadcast - Create | Create broadcast | Broadcasts screen | Create form | Pass |
| TC1442 | Broadcast - Title | Enter title | Creating | Title saved | Pass |
| TC1443 | Broadcast - Message | Enter message | Creating | Message saved | Pass |
| TC1444 | Broadcast - Type | Select type | Creating | Type selected | Pass |
| TC1445 | Broadcast - Info | Information type | Types | Info selected | Pass |
| TC1446 | Broadcast - Warning | Warning type | Types | Warning selected | Pass |
| TC1447 | Broadcast - Critical | Critical type | Types | Critical selected | Pass |
| TC1448 | Broadcast - Target | Target audience | Creating | Audience set | Pass |
| TC1449 | Broadcast - All Users | Target all users | Targeting | All selected | Pass |
| TC1450 | Broadcast - Filtered | Target filtered users | Targeting | Filter applied | Pass |
| TC1451 | Broadcast - Schedule | Schedule broadcast | Creating | Schedule set | Pass |
| TC1452 | Broadcast - Send Now | Send immediately | Creating | Sent immediately | Pass |
| TC1453 | Broadcast - Save Draft | Save as draft | Creating | Draft saved | Pass |
| TC1454 | Broadcast - Edit | Edit broadcast | Broadcast exists | Edit form | Pass |
| TC1455 | Broadcast - Delete | Delete broadcast | Broadcast exists | Deleted | Pass |
| TC1456 | Broadcast - History | Broadcast history | Past broadcasts | History shown | Pass |
| TC1457 | Broadcast - Stats | Broadcast stats | Broadcast sent | Stats shown | Pass |
| TC1458 | Broadcast - Delivery | Delivery stats | Broadcast sent | Delivery % | Pass |
| TC1459 | Broadcast - Read | Read stats | Broadcast sent | Read % | Pass |
| TC1460 | Broadcast - Resend | Resend broadcast | Past broadcast | Resent | Pass |

### 20.2 System Backups & Logs (TC1461-TC1490)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1461 | Backup - Navigate | Open system backups | Admin access | Backup screen | Pass |
| TC1462 | Backup - Create | Create system backup | Admin access | Backup started | Pass |
| TC1463 | Backup - Progress | View backup progress | Creating | Progress shown | Pass |
| TC1464 | Backup - Complete | Backup complete | Backup finished | Success message | Pass |
| TC1465 | Backup - Download | Download backup | Backup ready | File downloaded | Pass |
| TC1466 | Backup - Schedule | Schedule backups | Backup settings | Schedule set | Pass |
| TC1467 | Backup - Auto | Auto-backup | Schedule met | Backup created | Pass |
| TC1468 | Backup - History | Backup history | Past backups | History listed | Pass |
| TC1469 | Backup - Delete | Delete old backup | Backup exists | Deleted | Pass |
| TC1470 | Backup - Retention | Retention policy | Policy set | Old deleted | Pass |
| TC1471 | Restore - Navigate | Open restore | Backup screen | Restore options | Pass |
| TC1472 | Restore - Select | Select backup | Backups exist | Backup selected | Pass |
| TC1473 | Restore - Execute | Execute restore | Backup selected | Restore started | Pass |
| TC1474 | Restore - Progress | Restore progress | Restoring | Progress shown | Pass |
| TC1475 | Restore - Complete | Restore complete | Finished | Success message | Pass |
| TC1476 | Logs - Navigate | Open system logs | Admin access | Logs screen | Pass |
| TC1477 | Logs - View | View logs | Logs exist | Logs displayed | Pass |
| TC1478 | Logs - Filter Level | Filter by level | Various levels | Filtered | Pass |
| TC1479 | Logs - Filter Date | Filter by date | Date range | Filtered | Pass |
| TC1480 | Logs - Search | Search logs | Logs exist | Matching found | Pass |
| TC1481 | Logs - Tail | Live tail logs | Logs streaming | Real-time | Pass |
| TC1482 | Logs - Download | Download logs | Logs exist | File downloaded | Pass |
| TC1483 | Logs - Audit | Audit logs | Actions taken | Audit entries | Pass |
| TC1484 | Logs - Error | Error logs | Errors occurred | Errors shown | Pass |
| TC1485 | Logs - API | API logs | API calls | API logs shown | Pass |
| TC1486 | Logs - Security | Security logs | Security events | Security shown | Pass |
| TC1487 | Logs - Retention | Log retention | Policy set | Old purged | Pass |
| TC1488 | Logs - Archive | Archive logs | Logs exist | Archived | Pass |
| TC1489 | Logs - Analytics | Log analytics | Sufficient logs | Analytics shown | Pass |
| TC1490 | Logs - Alerts | Log alerts | Thresholds | Alerts triggered | Pass |

### 20.3 System Configuration (TC1491-TC1500)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1491 | Config - Navigate | Open configuration | Super admin | Config screen | Pass |
| TC1492 | Config - App Settings | View app settings | Config screen | Settings shown | Pass |
| TC1493 | Config - Update | Update setting | Config screen | Setting updated | Pass |
| TC1494 | Config - Feature Flags | Feature flags | Config screen | Flags shown | Pass |
| TC1495 | Config - Toggle Feature | Toggle feature flag | Flag exists | Flag toggled | Pass |
| TC1496 | Config - Rate Limits | Rate limit config | Config screen | Limits shown | Pass |
| TC1497 | Config - Update Limits | Update rate limits | Editing | Limits updated | Pass |
| TC1498 | Config - Cache | Cache management | Config screen | Cache options | Pass |
| TC1499 | Config - Clear Cache | Clear system cache | Cache options | Cache cleared | Pass |
| TC1500 | Config - Health Check | System health check | Config screen | Health verified | Pass |

---

**End of Admin Test Cases - TC1201-TC1500 (300 Test Cases)**

---

## Test Case Summary

| Section | Range | Count |
|---------|-------|-------|
| Mobile App Part 1: Auth, Profile, Settings | TC001-TC190 | 190 |
| Mobile App Part 2: People, Attendance | TC191-TC440 | 250 |
| Mobile App Part 3: Transactions, Laundry | TC441-TC680 | 240 |
| Mobile App Part 4: Expenses, Reports, Docs | TC681-TC900 | 220 |
| Mobile App Part 5: Collaboration, Messaging | TC901-TC1050 | 150 |
| Mobile App Part 6: Staff Mode | TC1051-TC1200 | 150 |
| Admin Panel | TC1201-TC1500 | 300 |
| **Total** | **TC001-TC1500** | **1500** |

---

*Generated: January 7, 2026*
*Home Staff 360 v2.0 Functional Test Suite*
