# Home Staff 360

## Overview
Home Staff 360 is a professional staff management platform designed as a hybrid mobile application (React + Capacitor) with a backend server. It provides real-time workforce management with live data synchronization, suitable for household staff, hospitality businesses, restaurants, and other service-oriented operations. The platform supports two main operating modes: Home User Mode for employers and managers to track staff activities, and Staff User Mode for service professionals to manage clients, earnings, and expenses.

**Tagline:** Your Data, Your Device, Your Control

**Industry Applications:**
- Households: Domestic staff management
- Hospitality: Hotel staff management
- Restaurants: Kitchen and service staff management
- Service Businesses: Cleaning, maintenance, field staff
- Property Management: Building staff and security

## User Preferences
- Simple language and clear explanations
- Iterative development with small, testable changes
- Ask before major architectural decisions
- Privacy and security remain priorities with live data

## Important Documents
- **MIGRATION_CHECKLIST.md**: Formal procedures for safely managing database schema changes when the app has live users and production data. Must be followed for all database migrations.

## System Architecture

**UI/UX Design:**
- Inspired by Microsoft Fluent 2 and Samsung One UI with "Squircle" corners (24px radius).
- Supports Light and Dark modes.
- Primary color: Google Blue (#0B57D0).
- Features a bottom navigation with 5 tabs and handles safe areas for Android notches.

**Technical Implementations:**
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui, Radix UI for UI components. Uses Wouter for routing, TanStack Query v5 for state management, and Framer Motion for animations.
- **Backend**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM for schema definition and migrations.
- **Real-time Communication**: Socket.IO for live data updates and collaboration features.
- **Authentication**: JWT tokens for session management, supported by Twilio for SMS/OTP verification. Passwords are hashed with bcrypt.

## Hybrid Privacy-First Storage Architecture

Home Staff 360 uses a **hybrid storage model** with two distinct storage locations:

### Storage Location Summary

| Storage Location | What Is Stored | Purpose |
|-----------------|----------------|---------|
| **Your Device (Primary)** | Staff records, attendance, payments, expenses, laundry, invoices, documents, clients, households, notes, settings | All business/operational data |
| **Our Server (Minimal)** | Phone number, password hash, user connections, chat messages, approval requests, notifications | Authentication & collaboration only |

### Local Device Storage (Primary - Your Data)
All business and operational data stays **exclusively on user devices**:
- Staff records and profiles
- Attendance logs and check-in/check-out data
- Payment transactions and salary records
- Expense entries and receipts
- Laundry batches and tracking
- Invoices and billing information
- Documents and attachments
- Client and household information
- Personal notes and memos
- App settings and preferences

**We do NOT have access to this data. It exists only on your device.**

### Server Storage (Minimal - Collaboration Only)
Our PostgreSQL server stores **only the minimum data required** for:
- **User Authentication**: Phone number and encrypted password hash for login
- **User Connections**: Links between users who choose to connect (employer to staff)
- **Chat Messages**: Messages sent between connected users
- **Approval Workflows**: Items shared between users requiring approval
- **Notifications**: System notifications for collaboration features

### Why This Hybrid Approach?
- **Maximum Privacy**: Your sensitive business data never touches our servers
- **You Own Your Data**: Complete control over your information on your device
- **Collaboration Enabled**: Server enables real-time messaging and connections between users
- **No Data Mining**: We cannot analyze, monetize, or share your business data because we don't have it

### Admin Panel Privacy
- **No Personal Data Display**: User names and phone numbers are not displayed on admin panels
- **No Business Data Access**: Admin cannot view user business data (stored locally on devices)
- **System Management Only**: Admin access is limited to platform infrastructure

## Feature Specifications
- **Notes Feature**: Full-screen view/edit, 20,000 character limit, 6 color options, pin functionality, and "All contexts" mode.
- **Multi-Language Support**: 21 languages available.
- **Multi-Currency Support**: 120+ national/regional currencies supporting all 173 countries, with automatic currency detection based on setup location.
- **Real-Time Collaboration**: Chat messaging, connection invites, shared spaces, and live sync for operational data.
- **Push Notifications**: Implemented for Android using Firebase Cloud Messaging (FCM) with Capacitor Push Notifications plugin. Supports background notifications when app is closed. Token registration on app start, unregistration on logout. Web fallback uses Notifications API. Events include chat messages, connection requests, and collaboration updates.
- **User Profile Avatars**: Profile images uploaded and compressed to 512x512 pixels max, stored as base64 on server. Displayed across chat, connections, messages, and notifications via reusable UserAvatar component and use-user-avatar hook with caching.
- **Subscription Model**: Two plans (Monthly/Annual), two tiers (Free/Premium), and 5-tier pricing across 173 countries via Google Play Billing.
- **Auto-Backup**: WhatsApp-style background backup system with user consent, configurable frequency (daily/weekly/monthly), Android WorkManager integration, foreground service notifications during backup execution, and **local device storage only** (not uploaded to servers).

## Security Measures
- **Authentication**: JWT tokens with configurable expiry, OTP expiry (10 mins, max 5 attempts), bcrypt hashing for passwords, SHA-256 for PINs.
- **Rate Limiting**: Implemented for OTP requests, authentication attempts, password resets, and Socket.IO connections.
- **Data Protection**: HTTPS/TLS, GDPR and DPDP Act compliance, database transactions for critical operations.
- **Duplicate Prevention**: Phone number validation to prevent duplicate staff/clients, with normalization.

## External Dependencies

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Real-time | Socket.IO (client + server) |
| UI | Tailwind CSS, Shadcn/ui, Radix UI |
| Routing | Wouter |
| State | TanStack Query v5 |
| Animations | Framer Motion |
| Icons | Lucide React, React Icons, Fluent UI |
| Mobile | Capacitor (Android) |
| SMS | Twilio |
| Forms | React Hook Form, Zod |
