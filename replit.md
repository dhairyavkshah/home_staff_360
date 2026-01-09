# Home Staff 360 v2.0

## Overview
Home Staff 360 is a professional staff management platform designed as a hybrid mobile application (React + Capacitor) with a backend server. It provides real-time workforce management with live data synchronization across all connected users. Initially built for household staff, its architecture allows for broad applicability across various industries like hospitality, restaurants, and service businesses. The platform supports both "Home User Mode" for employers to manage staff, and "Staff User Mode" for professionals to manage clients and earnings. Future enhancements include industry-specific templates, advanced scheduling, and integration with business tools.

## User Preferences
- Simple language and clear explanations
- Iterative development with small, testable changes
- Ask before major architectural decisions
- Privacy and security remain priorities with live data

## System Architecture

### Project Structure
The project is structured into `android/`, `assets/`, `attached_assets/`, `client/` (React frontend), `docs/`, `migrations/`, `server/` (Express.js backend), `shared/` (shared types and schema), and `tests/`. The frontend includes components, hooks, utilities (with 21-language i18n and Socket.IO context), screens (auth, collaboration, staff), and admin pages. The backend consists of database connection, REST API endpoints, Socket.IO events, and the main server entry point.

### Frontend Screens
The application features 55 screens across core functionalities, Home Mode features (e.g., Households, Attendance, Payables, Expenses, Laundry, Reports, Documents, Notes), Staff Mode features (e.g., Businesses, Attendance, Expenses, Laundry, Earnings, Invoices), and Collaboration features (e.g., Auth, Chat, Connections, Notifications).

### Backend Architecture
The backend uses Express.js with TypeScript, PostgreSQL with Drizzle ORM, and Socket.IO for real-time capabilities. Authentication is handled via JWT tokens, and SMS/OTP services are integrated with Twilio.

### Storage System
A hybrid storage approach is used: server-side PostgreSQL for core data like users, attendance, and collaboration, and client-side localStorage for settings, accounts, notes, documents, and cached profile data.

### Authentication Flow
Users authenticate via phone number and password, followed by OTP verification via Twilio. JWT tokens are issued for session management and stored client-side.

### Session Persistence
The application supports auto-login via stored JWT tokens, profile synchronization for new devices, and skips onboarding for returning users.

### Feature Specifications
- **Notes Feature**: Full-screen view/edit, 20,000 character limit, 6 color options, pin functionality, and "All contexts" mode.
- **Multi-Language Support**: 21 languages.
- **Multi-Currency Support**: 137 currencies across 173+ countries.
- **Real-Time Collaboration**: Chat, connection invites, shared spaces, and live sync events for core features.
- **Push Notifications**: Android (Capacitor LocalNotifications) and Web (Notifications API) for various events.
- **Subscription Model**: Monthly/Annual plans, Free/Premium tiers, 5-tier pricing across 132 countries with Google Play Billing integration.
- **UI/UX Design**: Inspired by Microsoft Fluent 2 and Samsung One UI, featuring "squircle" corners, Light/Dark mode, Google Blue primary color, bottom navigation, and safe area handling for Android notches.

### Security Measures
Authentication uses bcrypt for password hashing, JWT tokens with configurable expiry, and OTPs with expiry and attempt limits. Rate limiting is implemented for OTP, authentication, and password reset requests. Data protection includes HTTPS/TLS, GDPR/DPDP compliance, database transactions for critical operations, and standardized error codes. Duplicate prevention logic for phone numbers is in place.

## External Dependencies

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL, Drizzle ORM
- **Real-time**: Socket.IO (client + server)
- **UI**: Tailwind CSS, Shadcn/ui, Radix UI
- **Routing**: Wouter
- **State Management**: TanStack Query v5
- **Animations**: Framer Motion
- **Icons**: Lucide React, React Icons, Fluent UI
- **Mobile Platform**: Capacitor (Android)
- **SMS/OTP**: Twilio
- **Forms**: React Hook Form, Zod