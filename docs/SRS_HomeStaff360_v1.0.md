# Software Requirements Specification (SRS)
# Home Staff 360 v1.0

**Document Version:** 1.0  
**Date:** January 2026  
**Author:** Dhairya Shah (The Team 360)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Functional Requirements - Home User Mode](#3-functional-requirements---home-user-mode)
4. [Functional Requirements - Staff User Mode](#4-functional-requirements---staff-user-mode)
5. [Functional Requirements - Collaboration Features](#5-functional-requirements---collaboration-features)
6. [Functional Requirements - Super Admin Panel](#6-functional-requirements---super-admin-panel)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Data Requirements](#8-data-requirements)
9. [External Interfaces](#9-external-interfaces)
10. [System Constraints and Assumptions](#10-system-constraints-and-assumptions)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a comprehensive description of the Home Staff 360 application. It details the functional and non-functional requirements for a hybrid mobile application designed for professional staff management across households, hospitality, restaurants, and service-oriented businesses.

### 1.2 Scope

Home Staff 360 is a cross-platform staff management solution that operates in two primary modes:

- **Home User Mode**: For employers and managers to track staff attendance, payments, expenses, service batches, and maintain notes with real-time collaboration capabilities.
- **Staff User Mode**: For service professionals to manage multiple clients, log attendance, track earnings, handle expenses, create invoices, and maintain documentation.

The application includes:
- React-based frontend with Capacitor for Android deployment
- Express.js backend with PostgreSQL database
- Real-time collaboration via Socket.IO
- Multi-language support (21 languages)
- Multi-currency support (27 currencies)
- 5-tier subscription pricing across 132 countries

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| Home User | Employer or household manager who hires staff |
| Staff User | Service professional who works for multiple clients |
| Household | A home/client entity managed by a Home User |
| Account | A workspace context (household for Home Users, business for Staff Users) |
| Person | A staff member or client tracked within an account |
| OTP | One-Time Password for phone verification |
| JWT | JSON Web Token for authentication |
| Payable | Outstanding amount owed to staff |
| Service Batch | A laundry or service batch with piece-wise tracking |

### 1.4 References

- Microsoft Fluent Design System 2
- Samsung One UI Design Guidelines
- GDPR (General Data Protection Regulation)
- DPDP Act (Digital Personal Data Protection Act, India)
- Capacitor Documentation
- Socket.IO Documentation

### 1.5 Document Overview

This document is organized into ten sections covering introduction, system overview, functional requirements for each user mode, non-functional requirements, data specifications, external interfaces, and system constraints.

---

## 2. Overall Description

### 2.1 Product Perspective

Home Staff 360 is a standalone hybrid mobile application that can operate both online and offline. It integrates with:

- **PostgreSQL Database**: For persistent server-side storage
- **Twilio SMS Service**: For OTP-based authentication
- **Google Play Billing**: For subscription management on Android
- **AdMob**: For ad-supported free tier
- **Socket.IO**: For real-time collaboration features

### 2.2 Product Functions

#### Core Functions

| Function Category | Description |
|-------------------|-------------|
| User Management | Registration, authentication, profile management |
| Attendance Tracking | Daily check-in/out with overtime and leave tracking |
| Financial Management | Payments, advances, deductions, expense tracking |
| Service Tracking | Laundry batches, piece-wise counts, delivery tracking |
| Document Management | File storage, categorization, sharing |
| Reporting | Financial summaries, attendance reports, export to Excel |
| Collaboration | Real-time messaging, connection invites, shared spaces |
| Notifications | Push notifications for messages, invites, approvals |

### 2.3 User Characteristics

#### Home Users (Employers/Managers)
- Non-technical users managing household or business staff
- Need simple interfaces for attendance and payment tracking
- Require multi-language support for diverse regions
- May manage 1-50+ staff members

#### Staff Users (Service Professionals)
- Service providers working for multiple clients
- Need to track earnings across different households
- Require invoice generation capabilities
- May serve 1-20+ clients simultaneously

#### Super Administrators
- Technical administrators managing the platform
- Access to user analytics and system configuration
- Responsible for user management and support

### 2.4 Operating Environment

| Component | Technology |
|-----------|------------|
| Mobile Platform | Android 8.0+ via Capacitor |
| Web Platform | Modern browsers (Chrome, Firefox, Safari, Edge) |
| Backend Server | Node.js with Express.js |
| Database | PostgreSQL (Neon-backed) |
| Real-time | Socket.IO WebSocket connections |

### 2.5 Design and Implementation Constraints

1. **Hybrid Architecture**: Must support both web and Android platforms
2. **Offline-First Design**: Core features must work without internet connectivity
3. **Safe Area Compliance**: UI must respect Android notches and navigation bars
4. **Memory Constraints**: Local storage limited by device capabilities
5. **Rate Limiting**: API calls are rate-limited for security

### 2.6 Assumptions and Dependencies

1. Users have smartphones with Android 8.0+ or modern web browsers
2. Twilio service is available for SMS OTP delivery
3. Internet connectivity required for collaboration features
4. Google Play Services available for subscription management on Android

---

## 3. Functional Requirements - Home User Mode

### 3.1 Onboarding and Authentication

#### FR-H-001: Splash Screen
- **Description**: Display branded splash screen on app launch
- **Input**: App launch event
- **Output**: Animated logo with attribution text
- **Duration**: 2-3 seconds before navigation

#### FR-H-002: Onboarding Flow
- **Description**: First-time user introduction screens
- **Screens**: 4 swipeable introduction cards
- **Actions**: Skip button, Continue button, Progress indicators
- **Completion**: Set `onboardingCompleted = true` in settings

#### FR-H-003: Role Selection
- **Description**: User selects operating mode (Home or Staff)
- **Options**: 
  - "I manage staff" (Home Mode)
  - "I provide services" (Staff Mode)
- **Persistence**: Stored in user profile, changeable in settings

#### FR-H-004: PIN Setup
- **Description**: Optional 4-digit PIN for app security
- **Validation**: PIN must be 4 digits
- **Storage**: Stored locally with biometric option
- **Recovery**: Can be reset through settings

### 3.2 Household Management

#### FR-H-010: Create Household
- **Description**: Create a new household/account
- **Input Fields**:
  - Name (required, min 1 character)
  - Description (optional)
- **Output**: New account created with unique ID
- **Limit**: Based on subscription tier (1-unlimited)

#### FR-H-011: View Households
- **Description**: List all households owned by user
- **Display**: Name, staff count, creation date
- **Actions**: Select, Edit, Delete
- **Sorting**: Alphabetical or by creation date

#### FR-H-012: Switch Household
- **Description**: Change active household context
- **Behavior**: All data views update to selected household
- **Persistence**: Last selected household remembered

#### FR-H-013: Delete Household
- **Description**: Remove household and associated data
- **Confirmation**: Required confirmation dialog
- **Cascade**: Deletes all people, attendance, transactions, expenses

### 3.3 Staff/People Management

#### FR-H-020: Add Person
- **Description**: Add a staff member to household
- **Input Fields**:
  - Name (required)
  - Phone Number (optional, validated format)
  - Profession (dropdown selection)
  - Salary Amount (optional, numeric)
  - Salary Cycle (daily/weekly/monthly)
  - Photo (optional, max 20MB)
- **Validation**: Duplicate phone number check with error message
- **Output**: New person record created

#### FR-H-021: View People List
- **Description**: Display all staff in current household
- **Display**: Photo, Name, Profession, Status indicator
- **Filtering**: By profession, by status
- **Sorting**: Alphabetical, by join date

#### FR-H-022: Person Detail View
- **Description**: Comprehensive view of staff member
- **Tabs**:
  - Overview (photo, contact, salary info)
  - Attendance (monthly calendar view)
  - Payments (transaction history)
  - Expenses (expense records)
  - Documents (associated files)
- **Actions**: Edit, Delete, Call, Message

#### FR-H-023: Edit Person
- **Description**: Modify staff member details
- **Editable Fields**: All fields from Add Person
- **Validation**: Same as Add Person
- **History**: Changes not version-tracked

#### FR-H-024: Delete Person
- **Description**: Remove staff member
- **Confirmation**: Required with name verification
- **Cascade**: Attendance, transactions, expenses retained for records

#### FR-H-025: Person Calendar View
- **Description**: Monthly attendance calendar for specific person
- **Display**: Color-coded days (present, absent, half-day, leave, holiday)
- **Actions**: Tap day to add/edit attendance
- **Navigation**: Previous/Next month arrows

### 3.4 Attendance Tracking

#### FR-H-030: Attendance Dashboard
- **Description**: Overview of today's attendance status
- **Display**: Total staff, Present, Absent, On Leave counts
- **Quick Actions**: Mark all present, View details

#### FR-H-031: Add Attendance Entry
- **Description**: Record attendance for a staff member
- **Input Fields**:
  - Person (dropdown selection)
  - Date (date picker, defaults to today)
  - Status (Present/Absent/Half-Day/Leave/Holiday)
  - Check-in Time (optional, time picker)
  - Check-out Time (optional, time picker)
  - Overtime Hours (optional, numeric)
  - Notes (optional, text)
- **Validation**: No duplicate entries for same person/date
- **Output**: Attendance record created

#### FR-H-032: Bulk Attendance
- **Description**: Mark attendance for multiple staff at once
- **Display**: Checklist of all staff
- **Actions**: Toggle present/absent for each
- **Submission**: Creates individual records for each

#### FR-H-033: Edit Attendance
- **Description**: Modify existing attendance record
- **Access**: From attendance list or person calendar
- **Editable**: All fields from Add Attendance

#### FR-H-034: Delete Attendance
- **Description**: Remove attendance record
- **Confirmation**: Simple confirm dialog
- **Effect**: Record permanently deleted

### 3.5 Payments and Transactions

#### FR-H-040: Payables Dashboard
- **Description**: Overview of outstanding amounts owed
- **Calculation**: (Attendance days x Daily rate) - Payments made
- **Display**: Per-person payable amounts
- **Actions**: View history, Make payment

#### FR-H-041: Transactions List
- **Description**: View all financial transactions
- **Display**: Date, Person, Type, Amount, Notes
- **Filtering**: By person, by type, by date range
- **Types**: Payment, Advance, Deduction, Bonus

#### FR-H-042: Add Transaction
- **Description**: Record a financial transaction
- **Input Fields**:
  - Person (dropdown selection)
  - Date (date picker)
  - Type (Payment/Advance/Deduction/Bonus)
  - Amount (numeric, required)
  - Payment Method (Cash/Bank/UPI/Other)
  - Notes (optional)
- **Validation**: Amount must be positive
- **Effect**: Updates payable calculations

#### FR-H-043: Edit Transaction
- **Description**: Modify existing transaction
- **Editable**: All fields except Person
- **Audit**: No version history maintained

#### FR-H-044: Delete Transaction
- **Description**: Remove transaction record
- **Confirmation**: Required
- **Effect**: Recalculates payables

### 3.6 Expenses Management

#### FR-H-050: Expenses Dashboard
- **Description**: Overview of household expenses
- **Display**: Monthly total, Category breakdown chart
- **Filtering**: By month, by category

#### FR-H-051: Add Expense
- **Description**: Record a household expense
- **Input Fields**:
  - Title (required)
  - Amount (numeric, required)
  - Date (date picker)
  - Category (dropdown: Groceries, Utilities, Supplies, Maintenance, Other)
  - Person (optional, who incurred)
  - Paid By (optional)
  - Receipt (optional, image upload, max 20MB)
  - Notes (optional)
- **Output**: Expense record created

#### FR-H-052: View Expense
- **Description**: Detailed expense view
- **Display**: All fields, receipt image preview
- **Actions**: Edit, Delete, Share

#### FR-H-053: Expense Calendar
- **Description**: Calendar view of expenses
- **Display**: Days with expenses highlighted
- **Interaction**: Tap day to view expenses for that date

#### FR-H-054: Edit Expense
- **Description**: Modify expense record
- **Editable**: All fields

#### FR-H-055: Delete Expense
- **Description**: Remove expense record
- **Confirmation**: Required

### 3.7 Laundry Batch Tracking

#### FR-H-060: Laundry Dashboard
- **Description**: Overview of laundry batches
- **Display**: Active batches, Completed batches
- **Stats**: Total items, Pending items

#### FR-H-061: Add Laundry Batch
- **Description**: Create new laundry batch
- **Input Fields**:
  - Person (who is handling)
  - Date Given (date picker)
  - Items (piece-wise entry):
    - Item type (Shirt, Pants, Saree, Bedsheet, etc.)
    - Quantity (numeric)
  - Notes (optional)
- **Output**: Batch created with unique ID

#### FR-H-062: View Laundry Batch
- **Description**: Detailed batch view
- **Display**: All items with quantities, status
- **Actions**: Mark items returned, Edit, Delete

#### FR-H-063: Update Batch Status
- **Description**: Mark items as returned
- **Input**: Item-wise return counts
- **Calculation**: Pending items = Given - Returned

#### FR-H-064: Complete Batch
- **Description**: Mark entire batch as complete
- **Validation**: All items must be returned
- **Effect**: Batch moves to completed list

### 3.8 Notes Feature

#### FR-H-070: Notes List
- **Description**: View all notes for current household
- **Display**: Note preview, color indicator, pin status
- **Sorting**: Pinned first, then by modification date
- **All Contexts Mode**: View notes from all households

#### FR-H-071: Add Note
- **Description**: Create a new note
- **Input Fields**:
  - Title (optional)
  - Content (max 20,000 characters)
  - Color (6 options: yellow, blue, green, pink, purple, orange)
  - Pinned (toggle)
- **Output**: Note created with timestamp

#### FR-H-072: View Note (Full Screen)
- **Description**: Full-screen note viewer
- **Display**: Title, content, color background
- **Actions**: Edit, Delete, Toggle Pin, Share

#### FR-H-073: Edit Note (Full Screen)
- **Description**: Full-screen note editor
- **Features**: Auto-save, character count
- **Validation**: Max 20,000 characters

#### FR-H-074: Delete Note
- **Description**: Remove note
- **Confirmation**: Required

#### FR-H-075: Pin/Unpin Note
- **Description**: Toggle pin status
- **Effect**: Pinned notes appear at top of list

### 3.9 Documents Management

#### FR-H-080: Documents List
- **Description**: View all documents in household
- **Display**: Thumbnail/icon, filename, date, size
- **Filtering**: By category (ID, Contract, Medical, Other)

#### FR-H-081: Add Document
- **Description**: Upload a document
- **Input**:
  - File (image/PDF, max 20MB)
  - Category (dropdown)
  - Person (optional association)
  - Notes (optional)
- **Storage**: Base64 encoded in localStorage

#### FR-H-082: View Document
- **Description**: Full-screen document viewer
- **Features**: Zoom, Pan for images
- **Actions**: Share, Delete

#### FR-H-083: Delete Document
- **Description**: Remove document
- **Confirmation**: Required
- **Effect**: Permanently deleted from storage

### 3.10 Reports Generation

#### FR-H-090: Reports Dashboard
- **Description**: Overview of available reports
- **Report Types**:
  - Attendance Summary
  - Payment Summary
  - Expense Summary
  - Person-wise Report
  - Monthly Summary

#### FR-H-091: Generate Report
- **Description**: Create a specific report
- **Input**:
  - Report Type
  - Date Range (from/to)
  - Person Filter (optional)
- **Output**: Report data displayed

#### FR-H-092: Report Preview
- **Description**: View generated report
- **Display**: Formatted tables, totals, summaries
- **Actions**: Export, Share

#### FR-H-093: Export Report
- **Description**: Export report to Excel
- **Format**: XLSX file
- **Content**: All report data with formatting
- **Delivery**: Download or share via system share

### 3.11 Settings and Preferences

#### FR-H-100: Settings Screen
- **Description**: App configuration options
- **Sections**:
  - Profile Settings
  - App Settings (language, currency, theme)
  - Security (PIN, biometrics)
  - Backup & Restore
  - Subscription
  - About & Legal

#### FR-H-101: Profile Settings
- **Description**: User profile management
- **Editable**:
  - Display Name
  - Profile Photo
  - Phone Number (verified)
- **Actions**: Save, Cancel

#### FR-H-102: Language Selection
- **Description**: Change app language
- **Options**: 21 languages
  - English, Hindi, Spanish, French, Portuguese, Arabic, Bengali, Chinese (Simplified), German, Indonesian, Italian, Japanese, Korean, Malay, Russian, Tamil, Telugu, Thai, Turkish, Urdu, Vietnamese
- **Effect**: Immediate UI language change

#### FR-H-103: Currency Selection
- **Description**: Change default currency
- **Options**: 27 currencies
  - INR, USD, EUR, GBP, AUD, CAD, AED, BDT, BRL, CHF, CNY, EGP, IDR, JPY, KES, KRW, MXN, MYR, NGN, PHP, PKR, RUB, SAR, SGD, THB, TRY, ZAR
- **Effect**: All monetary displays updated

#### FR-H-104: Theme Selection
- **Description**: Light/Dark mode toggle
- **Options**: Light, Dark, System Default
- **Effect**: Immediate theme change

#### FR-H-105: Backup Data
- **Description**: Export all local data
- **Format**: JSON file
- **Content**: All households, people, attendance, transactions, expenses, notes, documents
- **Delivery**: Download or share

#### FR-H-106: Restore Data
- **Description**: Import backup file
- **Input**: JSON backup file
- **Validation**: Schema validation before import
- **Behavior**: Merge or replace options

#### FR-H-107: Switch Mode
- **Description**: Change between Home and Staff modes
- **Confirmation**: Required (data context changes)
- **Effect**: Dashboard and navigation updated

---

## 4. Functional Requirements - Staff User Mode

### 4.1 Business Profile Setup

#### FR-S-001: Business Profile
- **Description**: Staff user's professional profile
- **Input Fields**:
  - Business Name
  - Profession (from predefined list)
  - Description
  - Photo
- **Display**: Shown to connected clients

### 4.2 Client Homes Management

#### FR-S-010: Client Homes List
- **Description**: View all client households
- **Display**: Name, profession, status
- **Actions**: View details, Add new

#### FR-S-011: Add Client Home
- **Description**: Add a new client
- **Input Fields**:
  - Client Name (required)
  - Phone Number (optional, validated)
  - Address (optional)
  - Profession/Service Type
  - Rate (amount per service)
  - Rate Type (per day/week/month/visit)
  - Notes (optional)
- **Validation**: Duplicate phone number check

#### FR-S-012: View Client Home
- **Description**: Client detail view
- **Tabs**:
  - Overview
  - Attendance Log
  - Earnings
  - Expenses
  - Laundry
- **Actions**: Edit, Delete, Call

#### FR-S-013: Edit Client Home
- **Description**: Modify client details
- **Editable**: All fields from Add

#### FR-S-014: Delete Client Home
- **Description**: Remove client
- **Confirmation**: Required
- **Cascade**: Associated data retained

### 4.3 Attendance Logging

#### FR-S-020: Log Attendance
- **Description**: Record work at a client
- **Input Fields**:
  - Client (dropdown)
  - Date (date picker)
  - Check-in Time
  - Check-out Time
  - Status (Worked/Leave/Holiday)
  - Notes
- **Output**: Attendance record created

#### FR-S-021: Attendance History
- **Description**: View attendance across all clients
- **Display**: Date, Client, Hours, Status
- **Filtering**: By client, by date range

#### FR-S-022: Quick Check-In/Out
- **Description**: One-tap attendance logging
- **Behavior**: Records current time for selected client
- **Display**: Active work sessions shown

### 4.4 Earnings Tracking

#### FR-S-030: Earnings Dashboard
- **Description**: Financial overview
- **Display**:
  - Total Earned (all time)
  - This Month
  - Pending/Receivable
  - Per-client breakdown
- **Charts**: Monthly trend, client distribution

#### FR-S-031: Earnings History
- **Description**: Detailed earnings list
- **Display**: Date, Client, Amount, Status (Paid/Pending)
- **Filtering**: By client, by status, by date

#### FR-S-032: Record Payment Received
- **Description**: Mark earnings as paid
- **Input**:
  - Client
  - Amount
  - Date Received
  - Payment Method
- **Effect**: Updates pending calculations

### 4.5 Expense Management

#### FR-S-040: Staff Expenses
- **Description**: Track work-related expenses
- **Input Fields**:
  - Title
  - Amount
  - Date
  - Category (Travel, Supplies, Equipment, Other)
  - Client (optional, if client-specific)
  - Receipt (optional)
- **Output**: Expense record created

#### FR-S-041: Expense Summary
- **Description**: Overview of expenses
- **Display**: Total, by category, by client
- **Filtering**: By date range, by category

### 4.6 Laundry Logging

#### FR-S-050: Log Laundry
- **Description**: Record laundry pickup from client
- **Input**:
  - Client
  - Date Given
  - Items (piece-wise)
  - Expected Return Date
- **Output**: Batch created

#### FR-S-051: Laundry Batches
- **Description**: View all batches
- **Display**: Client, Items count, Status
- **Actions**: Update, Complete, Delete

### 4.7 Invoice Management

#### FR-S-060: Invoices List
- **Description**: View all invoices
- **Display**: Invoice #, Client, Amount, Status, Date
- **Filtering**: By client, by status (Draft/Sent/Paid)

#### FR-S-061: Create Invoice
- **Description**: Generate new invoice
- **Input Fields**:
  - Client (dropdown)
  - Invoice Date
  - Due Date
  - Line Items:
    - Description
    - Quantity
    - Rate
    - Amount (auto-calculated)
  - Tax (optional percentage)
  - Notes
- **Calculation**: Subtotal, Tax, Total
- **Output**: Invoice created with unique number

#### FR-S-062: View Invoice
- **Description**: Invoice detail view
- **Display**: Formatted invoice with all details
- **Actions**: Edit, Share, Mark as Sent, Mark as Paid, Delete

#### FR-S-063: Share Invoice
- **Description**: Send invoice to client
- **Methods**: PDF export, System share, WhatsApp
- **Tracking**: Updates status to "Sent"

#### FR-S-064: Invoice Templates
- **Description**: Predefined invoice formats
- **Options**: Basic, Detailed, Professional
- **Customization**: Logo, terms, notes

### 4.8 Staff Documents

#### FR-S-070: Staff Documents
- **Description**: Personal/professional documents
- **Categories**: ID, Certificates, Contracts, Other
- **Features**: Same as Home mode documents

### 4.9 Staff Reports

#### FR-S-080: Staff Reports
- **Description**: Generate staff-specific reports
- **Types**:
  - Earnings Report (by period)
  - Client-wise Summary
  - Expense Report
  - Tax Summary
- **Export**: Excel format

---

## 5. Functional Requirements - Collaboration Features

### 5.1 Authentication

#### FR-C-001: Phone Registration
- **Description**: New user registration
- **Input**:
  - Phone Number (with country code)
  - Password (min 6 characters)
  - Display Name
- **Process**:
  1. Validate phone format
  2. Check for existing account
  3. Send OTP via Twilio
  4. Create user record on verification
- **Output**: Account created, JWT issued

#### FR-C-002: Phone Login
- **Description**: Existing user login
- **Input**:
  - Phone Number
  - Password
- **Process**:
  1. Validate credentials
  2. Send OTP via Twilio
  3. Verify OTP
  4. Issue JWT token
- **Token**: 30-day expiry for users

#### FR-C-003: OTP Verification
- **Description**: Verify one-time password
- **Input**: 6-digit OTP
- **Constraints**:
  - 10-minute expiry
  - Max 5 attempts per session
  - Rate limited to 10 requests per 15 minutes
- **Output**: JWT token on success

#### FR-C-004: Password Reset
- **Description**: Recover account access
- **Process**:
  1. Enter phone number
  2. Receive OTP
  3. Verify OTP
  4. Set new password
- **Rate Limit**: 5 requests per 15 minutes

#### FR-C-005: Auto Login
- **Description**: Seamless session continuation
- **Behavior**: Check JWT validity on app launch
- **Persistence**: Token in localStorage
- **Sync**: Fetch profile from server on new device

#### FR-C-006: Logout
- **Description**: End user session
- **Behavior**: Clear JWT, retain phone for quick re-login
- **Server**: Invalidate token (optional)

### 5.2 Connections

#### FR-C-010: Connections List
- **Description**: View all connections
- **Display**: Name, Type (Home/Staff), Status
- **Categories**: Connected, Pending Sent, Pending Received

#### FR-C-011: Send Connection Invite
- **Description**: Invite another user
- **Input**:
  - Phone Number
  - Message (optional)
- **Behavior**:
  - If user exists: Create pending invite
  - If not: Option to send SMS invite
- **Notification**: Real-time push to recipient

#### FR-C-012: Auto-Connect
- **Description**: Automatic connection by phone match
- **Trigger**: When adding person with verified phone
- **Behavior**: Auto-create connection if phone matches registered user
- **Notification**: Both parties notified

#### FR-C-013: Accept/Reject Invite
- **Description**: Respond to connection request
- **Actions**: Accept, Reject, Block
- **Effect (Accept)**: Connection established, shared space created
- **Effect (Reject)**: Invite removed, sender notified

#### FR-C-014: Remove Connection
- **Description**: End a connection
- **Confirmation**: Required
- **Effect**: Shared space access revoked

### 5.3 Messaging

#### FR-C-020: Chat List
- **Description**: View all conversations
- **Display**: Contact name, last message preview, timestamp, unread count
- **Sorting**: By most recent activity

#### FR-C-021: Chat Screen
- **Description**: Real-time messaging interface
- **Features**:
  - Text messages
  - Delivery/Read receipts
  - Timestamps
  - Scroll to load history
- **Real-time**: Socket.IO for instant delivery

#### FR-C-022: Send Message
- **Description**: Send a chat message
- **Input**: Text content
- **Validation**: Non-empty, max length
- **Delivery**: Real-time via Socket.IO

#### FR-C-023: Edit Message
- **Description**: Modify sent message
- **Constraint**: Within 5 minutes of sending
- **Display**: "Edited" indicator shown

#### FR-C-024: Delete Message
- **Description**: Remove message
- **Constraint**: Within 5 minutes of sending
- **Behavior**: Removed for both parties

### 5.4 Shared Spaces

#### FR-C-030: Shared Space View
- **Description**: Collaborative workspace between connected users
- **Content**:
  - Shared attendance records
  - Shared expense records
  - Shared laundry batches
- **Sync**: Real-time updates via Socket.IO

#### FR-C-031: Sync Attendance
- **Description**: Share attendance data
- **Trigger**: Auto-sync when both parties connected
- **Conflict**: Server-side merge, newer wins

#### FR-C-032: Sync Expenses
- **Description**: Share expense records
- **Visibility**: Both parties can view shared expenses

#### FR-C-033: Approval Workflow
- **Description**: Request approval for changes
- **Types**: Attendance correction, Expense claim
- **Process**:
  1. Requester submits change
  2. Approver receives notification
  3. Approver accepts/rejects
  4. Both parties notified of outcome

### 5.5 Notifications

#### FR-C-040: Push Notifications (Android)
- **Description**: Native push notifications
- **Technology**: Capacitor LocalNotifications
- **Events**:
  - New message received
  - Connection invite received
  - Connection accepted/rejected
  - Approval request
- **Behavior**: Sound, vibration, badge count

#### FR-C-041: Web Notifications
- **Description**: Browser notifications
- **Technology**: Web Notifications API
- **Permission**: Request on first collaboration action

#### FR-C-042: Notification Center
- **Description**: In-app notification list
- **Display**: All notifications with read/unread status
- **Actions**: Mark as read, Clear all

#### FR-C-043: Notification Settings
- **Description**: Control notification preferences
- **Options**:
  - Enable/disable push
  - Message notifications
  - Invite notifications
  - Sound/Vibration toggles

---

## 6. Functional Requirements - Super Admin Panel

### 6.1 Admin Authentication

#### FR-A-001: Admin Login
- **Description**: Super admin authentication
- **Input**: Email, Password
- **Credentials**: Environment variables (ADMIN_DEFAULT_EMAIL, ADMIN_DEFAULT_PASSWORD)
- **Token**: 8-hour JWT expiry
- **Protection**: Separate admin JWT from user JWT

#### FR-A-002: Admin Logout
- **Description**: End admin session
- **Behavior**: Clear admin token, redirect to login

### 6.2 User Management

#### FR-A-010: Users List
- **Description**: View all registered users
- **Display**: Phone, Display Name, Type, Registration Date, Status
- **Pagination**: 50 users per page
- **Search**: By phone number, by name

#### FR-A-011: User Details
- **Description**: View individual user details
- **Display**:
  - Profile information
  - Registration date
  - Last active
  - Connection count
  - Account count

#### FR-A-012: Suspend User
- **Description**: Temporarily disable user account
- **Effect**: User cannot login, existing sessions invalidated
- **Reversible**: Yes, can unsuspend

#### FR-A-013: Delete User
- **Description**: Permanently remove user
- **Confirmation**: Required with reason
- **Cascade**: All user data deleted
- **Audit**: Action logged

### 6.3 Analytics Dashboard

#### FR-A-020: Overview Statistics
- **Description**: Platform-wide metrics
- **Metrics**:
  - Total Users
  - Active Users (30 days)
  - New Registrations (7 days)
  - Connection count
  - Message volume

#### FR-A-021: User Growth Chart
- **Description**: Registration trends
- **Display**: Line chart of daily/weekly/monthly registrations
- **Filtering**: Date range selection

#### FR-A-022: Activity Metrics
- **Description**: Usage statistics
- **Metrics**:
  - Daily Active Users
  - Average session duration
  - Feature usage breakdown
  - Geographic distribution

### 6.4 System Configuration

#### FR-A-030: Rate Limit Settings
- **Description**: Configure API rate limits
- **Configurable**:
  - OTP requests per period
  - Authentication attempts
  - Socket.IO connections

#### FR-A-031: Maintenance Mode
- **Description**: Enable/disable maintenance mode
- **Effect**: Users see maintenance message
- **Admin Access**: Preserved during maintenance

#### FR-A-032: Broadcast Message
- **Description**: Send message to all users
- **Input**: Message content, target audience (all/Home/Staff)
- **Delivery**: In-app notification

---

## 7. Non-Functional Requirements

### 7.1 Performance Requirements

#### NFR-001: Response Time
| Operation | Target | Maximum |
|-----------|--------|---------|
| Page Load | < 2 seconds | 5 seconds |
| API Response | < 500ms | 2 seconds |
| Real-time Message Delivery | < 100ms | 500ms |
| Database Query | < 100ms | 500ms |

#### NFR-002: Throughput
- Concurrent WebSocket connections: 1000+ per server
- API requests: 1000 requests/second
- Database transactions: 500/second

#### NFR-003: Resource Efficiency
- Mobile memory usage: < 150MB
- Local storage usage: < 50MB (typical)
- Battery impact: Minimal background drain

### 7.2 Security Requirements

#### NFR-010: Authentication Security
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with configurable expiry
- OTP expiry: 10 minutes
- Maximum OTP attempts: 5 per session

#### NFR-011: Rate Limiting
| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| OTP Requests | 10 | 15 minutes |
| Authentication | 20 | 15 minutes |
| Password Reset | 5 | 15 minutes |
| Socket.IO | 30 connections | 1 minute |

#### NFR-012: Data Protection
- HTTPS/TLS for all transmissions
- Phone number normalization
- No sensitive data in logs
- Secrets stored in environment variables

#### NFR-013: Compliance
- GDPR compliant data handling
- DPDP Act (India) compliant
- Privacy policy available
- Data export capability

### 7.3 Scalability Requirements

#### NFR-020: Horizontal Scaling
- Stateless server design
- Database connection pooling
- Socket.IO with Redis adapter (future)

#### NFR-021: Data Growth
- User data partitioned by account
- Pagination on all list endpoints
- Archive capability for old records

### 7.4 Reliability Requirements

#### NFR-030: Availability
- Target uptime: 99.5%
- Graceful degradation for third-party services
- Offline mode for core features

#### NFR-031: Data Integrity
- 7 critical operations wrapped in database transactions
- Optimistic locking for concurrent updates
- Backup and restore capability

#### NFR-032: Error Handling
- Standardized error codes
- User-friendly error messages
- Automatic error reporting

### 7.5 Usability Requirements

#### NFR-040: Accessibility
- Touch targets minimum 44x44 pixels
- Sufficient color contrast
- Screen reader compatibility
- Keyboard navigation (web)

#### NFR-041: Multi-Language
- 21 languages supported
- RTL support for Arabic, Urdu
- Dynamic language switching

#### NFR-042: Multi-Currency
- 27 currencies supported
- Locale-appropriate formatting
- Currency symbol display

#### NFR-043: Design System
- Microsoft Fluent Design 2 inspired
- Samsung One UI elements
- 24px squircle corners
- Consistent spacing and typography

### 7.6 Compatibility Requirements

#### NFR-050: Android
- Minimum: Android 8.0 (API 26)
- Target: Android 13+ (API 33)
- Safe area handling for notches
- System navigation compatibility

#### NFR-051: Web Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## 8. Data Requirements

### 8.1 Database Schema Overview

#### Server-Side (PostgreSQL)

| Table | Description | Key Fields |
|-------|-------------|------------|
| users | Registered users | id, phoneNumber, passwordHash, displayName, userType |
| connections | User connections | id, fromUserId, toUserId, status |
| messages | Chat messages | id, fromUserId, toUserId, content, timestamp |
| notifications | Push notifications | id, userId, type, data, read |
| attendance | Synced attendance | id, userId, personId, date, status |
| expenses | Synced expenses | id, userId, amount, category, date |
| laundry | Synced laundry | id, userId, items, status |
| persons | Synced staff/clients | id, userId, name, phone, profession |
| approvals | Pending approvals | id, requesterId, approverId, type, status |

#### Client-Side (localStorage)

| Key | Description | Type |
|-----|-------------|------|
| hm_profile | User profile | Object |
| hm_settings | App settings | Object |
| hm_accounts | Households/Businesses | Array |
| hm_people | Staff/Clients | Array |
| hm_attendance | Attendance records | Array |
| hm_transactions | Payment records | Array |
| hm_laundry | Laundry batches | Array |
| hm_expenses | Expense records | Array |
| hm_notes | Notes | Array |

### 8.2 Data Storage Strategy

| Data Type | Primary Storage | Sync Behavior |
|-----------|-----------------|---------------|
| User Profile | Server + Local | Server authoritative |
| Connections | Server only | Real-time via Socket.IO |
| Messages | Server only | Real-time via Socket.IO |
| Attendance | Local + Server | Two-way sync when connected |
| Transactions | Local only | No sync (privacy) |
| Expenses | Local + Server | Optional sync |
| Notes | Local only | No sync |
| Documents | Local only | Base64 encoded |

### 8.3 Backup and Restore

#### Backup Format
```json
{
  "version": "1.0",
  "exportDate": "2026-01-09T12:00:00Z",
  "profile": {...},
  "settings": {...},
  "accounts": [...],
  "people": [...],
  "attendance": [...],
  "transactions": [...],
  "expenses": [...],
  "laundry": [...],
  "notes": [...],
  "documents": [...]
}
```

#### Restore Behavior
- Schema validation before import
- Option: Merge or Replace existing data
- Document size limit: 20MB per file
- Total backup size: Limited by device storage

---

## 9. External Interfaces

### 9.1 Twilio SMS Integration

#### Purpose
OTP delivery for authentication

#### API Endpoints Used
- `POST /2010-04-01/Accounts/{AccountSid}/Messages.json`

#### Configuration
| Parameter | Environment Variable |
|-----------|---------------------|
| Account SID | TWILIO_ACCOUNT_SID |
| Auth Token | TWILIO_AUTH_TOKEN |
| From Number | TWILIO_PHONE_NUMBER |

#### Request Format
```
To: +{phoneNumber}
Body: "Your Home Staff 360 verification code is: {OTP}. Valid for 10 minutes."
```

#### Error Handling
- Rate limit exceeded: Retry after delay
- Invalid number: User-friendly error message
- Service unavailable: Graceful degradation

### 9.2 Socket.IO Real-Time

#### Purpose
Real-time collaboration features

#### Events (Client to Server)
| Event | Payload | Description |
|-------|---------|-------------|
| join-user-room | userId | Join personal room |
| send-message | {toUserId, content} | Send chat message |
| mark-read | {messageIds} | Mark messages read |
| sync-attendance | {records} | Sync attendance data |

#### Events (Server to Client)
| Event | Payload | Description |
|-------|---------|-------------|
| new-message | {message} | New message received |
| message-read | {messageIds} | Read receipt |
| connection-invite | {invite} | New connection invite |
| sync-update | {type, data} | Data sync update |

#### Connection Management
- Auto-reconnect with exponential backoff
- Heartbeat every 25 seconds
- Room-based message routing

### 9.3 Google Play Billing

#### Purpose
Subscription management on Android

#### Products
| Product ID | Type | Description |
|------------|------|-------------|
| premium_monthly | Subscription | Monthly premium |
| premium_annual | Subscription | Annual premium |

#### Implementation
- Capacitor plugin integration
- Receipt validation server-side
- Subscription status cached locally

### 9.4 AdMob Integration

#### Purpose
Monetization for free tier

#### Ad Types
| Type | Placement |
|------|-----------|
| Banner | Bottom of screen |
| Interstitial | Between major actions |
| Rewarded | Optional for features |

#### Configuration
- Test ads in development
- Production ad unit IDs in environment
- Frequency capping: Max 1 interstitial per 5 minutes

---

## 10. System Constraints and Assumptions

### 10.1 Technical Constraints

1. **Offline-First Architecture**
   - Core features must work without internet
   - Data synced when connection restored
   - Conflict resolution: Server-side merge, newer wins

2. **Local Storage Limits**
   - Browser localStorage: ~5-10MB
   - Document storage: Max 20MB per file
   - Total practical limit: ~50MB per user

3. **Rate Limiting**
   - All API endpoints rate-limited
   - WebSocket connections limited
   - Third-party API quotas (Twilio)

4. **Mobile Platform Constraints**
   - Android minimum version: 8.0
   - Safe area handling required
   - Background execution limited

### 10.2 Business Constraints

1. **Subscription Tiers**
   | Tier | Price | Features |
   |------|-------|----------|
   | Free | $0 | Ad-supported, 1 household, 5 staff |
   | Monthly | Varies by region | Ad-free, unlimited |
   | Annual | Varies by region | Ad-free, unlimited, discount |

2. **Regional Pricing**
   - 5-tier pricing across 132 countries
   - Local currency display
   - Purchasing power parity considered

3. **Data Retention**
   - User data retained until deletion request
   - Chat messages: Indefinite
   - Notifications: 90 days

### 10.3 Assumptions

1. **User Assumptions**
   - Users have smartphones with Android 8.0+ or modern browsers
   - Users have reliable SMS delivery to their phone number
   - Users can read one of the 21 supported languages

2. **Infrastructure Assumptions**
   - PostgreSQL database available and reliable
   - Twilio service operational
   - Internet connectivity for collaboration features

3. **Security Assumptions**
   - Users keep their devices secure
   - Users do not share their PIN/password
   - Server environment properly secured

### 10.4 Future Considerations

1. **Planned Features**
   - iOS support via Capacitor
   - Shift scheduling and management
   - Department/team structures
   - Integration with payroll systems
   - Advanced analytics

2. **Scalability Considerations**
   - Redis for Socket.IO adapter
   - CDN for static assets
   - Database sharding if needed
   - Microservices architecture for growth

---

## Appendix A: Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | OTP expired |
| AUTH_003 | Max OTP attempts exceeded |
| AUTH_004 | Phone number not registered |
| AUTH_005 | Account suspended |
| RATE_001 | Rate limit exceeded |
| DATA_001 | Validation error |
| DATA_002 | Duplicate entry |
| DATA_003 | Not found |
| PERM_001 | Unauthorized access |
| SYS_001 | Internal server error |

## Appendix B: Supported Languages

| Code | Language | Direction |
|------|----------|-----------|
| en | English | LTR |
| hi | Hindi | LTR |
| es | Spanish | LTR |
| fr | French | LTR |
| pt | Portuguese | LTR |
| ar | Arabic | RTL |
| bn | Bengali | LTR |
| zh | Chinese (Simplified) | LTR |
| de | German | LTR |
| id | Indonesian | LTR |
| it | Italian | LTR |
| ja | Japanese | LTR |
| ko | Korean | LTR |
| ms | Malay | LTR |
| ru | Russian | LTR |
| ta | Tamil | LTR |
| te | Telugu | LTR |
| th | Thai | LTR |
| tr | Turkish | LTR |
| ur | Urdu | RTL |
| vi | Vietnamese | LTR |

## Appendix C: Supported Currencies

| Code | Currency | Symbol |
|------|----------|--------|
| INR | Indian Rupee | ₹ |
| USD | US Dollar | $ |
| EUR | Euro | € |
| GBP | British Pound | £ |
| AUD | Australian Dollar | A$ |
| CAD | Canadian Dollar | C$ |
| AED | UAE Dirham | د.إ |
| BDT | Bangladeshi Taka | ৳ |
| BRL | Brazilian Real | R$ |
| CHF | Swiss Franc | CHF |
| CNY | Chinese Yuan | ¥ |
| EGP | Egyptian Pound | E£ |
| IDR | Indonesian Rupiah | Rp |
| JPY | Japanese Yen | ¥ |
| KES | Kenyan Shilling | KSh |
| KRW | South Korean Won | ₩ |
| MXN | Mexican Peso | MX$ |
| MYR | Malaysian Ringgit | RM |
| NGN | Nigerian Naira | ₦ |
| PHP | Philippine Peso | ₱ |
| PKR | Pakistani Rupee | ₨ |
| RUB | Russian Ruble | ₽ |
| SAR | Saudi Riyal | ﷼ |
| SGD | Singapore Dollar | S$ |
| THB | Thai Baht | ฿ |
| TRY | Turkish Lira | ₺ |
| ZAR | South African Rand | R |

---

**Document End**

*Home Staff 360 v1.0 - Software Requirements Specification*  
*By: Dhairya Shah (The Team 360)*
