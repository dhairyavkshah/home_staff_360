# Home Staff 360 v2.0

## Overview
Home Staff 360 is a live, real-time household staff management platform designed for managing household staff and service businesses. Version 2.0 features full online collaboration with phone+password authentication, real-time messaging, and live data synchronization across all connected users.

It operates in two core modes:
- **Home User Mode**: For household managers to track domestic staff attendance, payments, expenses, and laundry batches with real-time collaboration.
- **Staff User Mode**: For service professionals to manage client homes, log attendance, track earnings, handle expenses, and create invoices.

The business vision is to provide a comprehensive, real-time solution for household and service staff management, enhancing efficiency and communication.

## User Preferences
- Simple language and clear explanations
- Iterative development with small, testable changes
- Ask before major architectural decisions
- Privacy and security remain priorities with live data

## System Architecture

### Live Real-Time Architecture
Home Staff 360 v2.0 is a fully live, cloud-connected application using a client-server architecture with real-time capabilities:
- **Client**: React with TanStack for UI and Socket.IO Client for live updates.
- **Server**: Express.js for REST APIs and Socket.IO Server for real-time events.
- **Database**: PostgreSQL as the primary data store.
- **Authentication**: JWT-based authentication with 30-day tokens.

### Authentication Flow
The system uses a phone+password authentication flow with OTP verification for phone ownership. Users can register or log in with their phone number and password. OTP is used for verification and password resets. Passwords require a minimum of 6 characters and are mandatory for all users.

### UI/UX Design
The UI is modern, inspired by Microsoft Fluent 2 and Samsung One UI, featuring "squircle" corners (24px radius) for a soft aesthetic. It supports both Light and Dark modes. The primary color is Google Blue (#0B57D0), and navigation is handled via a bottom navigation bar with 5 tabs.

### Feature Specifications
- **Multi-Language Support**: Supports 21 languages, including English, Hindi, Spanish, French, and more.
- **Multi-Currency Support**: Supports 27 currencies, including INR, USD, EUR, GBP, AUD, and CAD.
- **Real-Time Collaboration**: Includes a chat system with message edit/delete within a 5-minute window, real-time message delivery, and live events for attendance, laundry, and expense updates.
- **Auto-Connection System**: Automatically creates connection invites based on phone numbers, resolving pending links upon user registration.
- **Advertising System**: Displays full-screen video ads approximately every 5 minutes of app usage, with a skip option after 5 seconds and click-through functionality. Includes analytics for impressions, completion rates, and CTR, managed via an admin interface.

### Security Measures
- **Authentication**: Passwords are hashed with bcrypt (10 rounds), JWT tokens are used (30-day user, 8-hour admin), and OTPs expire in 10 minutes with a max of 5 attempts.
- **Rate Limiting**: Implemented for sensitive actions like phone change requests and OTP requests.
- **Data Security**: All data is transmitted over HTTPS/TLS, server-side data is encrypted at rest, and the system is designed to be GDPR and DPDP Act compliant.

## External Dependencies

- **Database**: PostgreSQL
- **SMS/OTP Service**: Twilio
- **Frontend Framework**: React 18 with TypeScript
- **Backend Framework**: Express.js with TypeScript
- **ORM**: Drizzle ORM
- **Real-time Communication**: Socket.IO (client and server)
- **UI Components**: Tailwind CSS, Shadcn/ui
- **Routing**: Wouter
- **Data Fetching**: TanStack Query v5
- **Animations**: Framer Motion
- **Icons**: Lucide React, React Icons
- **Mobile Packaging**: Capacitor (for Android)
- **CI/CD**: GitHub Actions