# Home Staff 360

## Overview
Home Staff 360 is an offline-first mobile/web application designed for managing household staff and service businesses. It enables efficient tracking of attendance, payments, and expenses for domestic staff (Home User Mode) and allows service professionals to manage their clients and earnings (Staff User Mode). The application prioritizes privacy, storing all user data locally on the device with no server dependencies. It supports multi-currency and multi-language, offering a robust solution for personal and professional management. The project aims to provide a comprehensive "operating system" for home and work, crafted by The Team 360, with a one-time purchase model for lifetime access.

## User Preferences
I prefer simple language and clear explanations. I want iterative development, with small, testable changes. Please ask before making any major architectural decisions or large-scale code changes. I value privacy and offline-first capabilities.

## System Architecture

### UI/UX Decisions
The application features a modern UI inspired by Samsung One UI and Material 3, incorporating "Squircle" corners (24px radius) for a soft, premium feel. It supports both Light and Dark modes and uses Google Blue (#0B57D0) as the primary color.

### Technical Implementations
- **Offline-First Design**: All data is stored 100% locally using browser `localStorage` with no server dependencies, ensuring privacy.
- **Security**: PIN-based app lock with optional biometric authentication (WebAuthn) for secure access.
- **Default App Mode**: The application remembers the user's preferred mode (HOME or STAFF) and defaults to it on launch, configurable in settings.
- **Guided Tour**: Interactive onboarding tours are available for both HOME and STAFF modes, automatically starting once and replayable from settings.
- **Data Scoping**: All data is properly filtered by active account ID, with helper methods for both HOME and STAFF modes. A "Show All Contexts" toggle allows viewing data across all accounts.
- **Cascade Deletes**: Deleting records automatically cleans up all related data (e.g., deleting a person also removes their attendance, transactions, etc.).
- **Document Management**: Documents can be linked to various records (expenses, transactions, people, laundry, client homes). Images are automatically resized (max 1920x1920) and compressed (80% JPEG) to optimize storage, with a 5MB per file limit. Documents are stored as Base64-encoded strings in `localStorage`.
- **Plan Management**: Includes a 30-day free trial with full premium access, transitioning to a limited FREE plan if not purchased. A one-time purchase unlocks lifetime premium access. Reactive plan status is managed via a `useSyncExternalStore` hook.
- **Invoicing System (STAFF Mode)**: Allows creation of itemized invoices with sequential numbering, tax rate support, and five statuses (draft, sent, paid, overdue, cancelled).

### Feature Specifications
- **Home User Features**: Manage staff, track attendance (Full/Half/Absent), record payments, advances, deductions, track household expenses, log laundry batches, generate CSV reports, and backup/restore data.
- **Staff User Features**: Manage client homes, log attendance, track laundry jobs and earnings, record personal expenses, generate earnings reports, and create/manage invoices.
- **Dashboard**: Both modes feature overview sections with clickable cards for quick stats and navigation.
- **Multi-language Support**: English, Hindi, Gujarati, Kannada, Malayalam, Spanish, French, German, Arabic, Chinese, Japanese, Portuguese.
- **Multi-currency Support**: INR, USD, EUR, GBP, AED, and custom currencies.

### System Design Choices
The application is built as a Progressive Web App (PWA) using React with TypeScript and Vite for the frontend. A simple Express.js server is used only for serving static files during development/production. Data models are defined using Zod schemas.

## External Dependencies

- **Frontend Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Icons**: `lucide-react`, `react-icons`
- **State Management**: React Context
- **Persistence**: Browser `localStorage`
- **Biometric Authentication**: WebAuthn API
- **Backend (Development/Static Serving)**: Express.js
- **Schema Validation**: Zod
- **Mobile Packaging**: Capacitor (for Android APK builds)
- **CI/CD**: GitHub Actions (for Android APK builds)