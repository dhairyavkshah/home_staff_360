# Home Staff 360 - Functional Test Suite Index

## Version 1.0 | January 7, 2026

---

## Overview

This document serves as the master index for the Home Staff 360 functional test suite, containing **1,500 test cases** covering both the mobile application (1,200 cases) and admin panel (300 cases).

---

## Test Suite Structure

### Mobile App Test Cases (1,200)

| File | Sections | Test Range | Count |
|------|----------|------------|-------|
| TEST_CASES_MOBILE_PART1.md | Auth, Onboarding, Profile, Settings, Localization | TC001-TC190 | 190 |
| TEST_CASES_MOBILE_PART2.md | People Management, Attendance | TC191-TC440 | 250 |
| TEST_CASES_MOBILE_PART3.md | Transactions, Payments, Laundry | TC441-TC680 | 240 |
| TEST_CASES_MOBILE_PART4.md | Expenses, Reports, Documents, Backup | TC681-TC900 | 220 |
| TEST_CASES_MOBILE_PART5.md | Connections, Collaboration, Messaging | TC901-TC1050 | 150 |
| TEST_CASES_MOBILE_PART6.md | Staff Mode Features | TC1051-TC1200 | 150 |

### Admin Panel Test Cases (300)

| File | Sections | Test Range | Count |
|------|----------|------------|-------|
| TEST_CASES_ADMIN.md | Admin Auth, Dashboard, Users, Ads, System | TC1201-TC1500 | 300 |

---

## Section Breakdown

### Mobile App Sections

| # | Section | Description | Test Cases |
|---|---------|-------------|------------|
| 1 | Authentication & Onboarding | Phone entry, OTP, Password, Login | TC001-TC090 |
| 2 | Profile & Settings | Profile management, app settings, security | TC091-TC150 |
| 3 | Localization & Currency | 21 languages, 27 currencies | TC151-TC190 |
| 4 | People Management | Add/edit/view staff members | TC191-TC290 |
| 5 | Attendance Management | Mark, calendar, reports, approvals | TC291-TC440 |
| 6 | Transactions & Payments | Record payments, history, balances | TC441-TC560 |
| 7 | Laundry Management | Batches, items, approvals, reports | TC561-TC680 |
| 8 | Expense Management | Record, list, approvals, reports | TC681-TC800 |
| 9 | Reports & Analytics | Dashboard, comprehensive reports | TC801-TC860 |
| 10 | Documents & Backup | Document management, backup/restore | TC861-TC900 |
| 11 | Connection Management | Search, invites, connections | TC901-TC960 |
| 12 | Real-Time Messaging | Chat, messages, edit/delete | TC961-TC1050 |
| 13 | Staff Mode Core | Mode switch, homes, attendance | TC1051-TC1120 |
| 14 | Staff Earnings & Invoices | Earnings tracking, invoice generation | TC1121-TC1170 |
| 15 | Staff Expenses & Documents | Staff expense, document management | TC1171-TC1200 |

### Admin Panel Sections

| # | Section | Description | Test Cases |
|---|---------|-------------|------------|
| 16 | Admin Auth & Access | Login, RBAC, session management | TC1201-TC1240 |
| 17 | Dashboard & Analytics | Overview, analytics, reports | TC1241-TC1290 |
| 18 | User Management | User list, search, detail, actions | TC1291-TC1360 |
| 19 | Advertising Management | Ad campaigns, analytics | TC1361-TC1430 |
| 20 | System Administration | Maintenance, backups, logs, config | TC1431-TC1500 |

---

## Test Case Format

Each test case follows this format:

| Column | Description |
|--------|-------------|
| TC ID | Unique identifier (TC001-TC1500) |
| Test Case Name | Short descriptive name |
| Test Case Scenario Description | Detailed description of what to test |
| Prerequisites | Required conditions before testing |
| Expected Outcome | What should happen when test passes |
| Result | Pass/Fail status |

---

## Execution Guidelines

### Test Priority

1. **Critical Path (Execute First)**
   - Authentication (TC001-TC090)
   - Core attendance (TC291-TC330)
   - Payments (TC441-TC480)
   - Messaging (TC981-TC1010)

2. **High Priority**
   - Profile & Settings (TC091-TC150)
   - Connection Management (TC901-TC960)
   - Admin Auth (TC1201-TC1240)

3. **Medium Priority**
   - All other functional tests

4. **Low Priority**
   - Edge cases and negative tests

### Test Environment

- **Platform**: Android/iOS/Web
- **Backend**: Express.js + PostgreSQL
- **Real-time**: Socket.IO
- **Auth**: JWT tokens

### Prerequisites

1. Test user accounts (home and staff modes)
2. Admin accounts (super admin, admin, moderator)
3. Database seeded with test data
4. SMS gateway configured (Twilio)

---

## Execution Summary Template

| Date | Executed By | Total | Passed | Failed | Blocked | Pass Rate |
|------|-------------|-------|--------|--------|---------|-----------|
| | | 1500 | | | | % |

---

## Defect Tracking

| TC ID | Defect Description | Severity | Status | Fixed Version |
|-------|-------------------|----------|--------|---------------|
| | | | | |

---

## Test Cycle History

| Cycle | Date | Environment | Total | Passed | Failed | Notes |
|-------|------|-------------|-------|--------|--------|-------|
| 1 | | | | | | Initial execution |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |

---

*Document generated: January 7, 2026*
*Home Staff 360 v2.0*
