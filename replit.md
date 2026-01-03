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
- **Plan Management**: The app is fully free with the following limits:
  - **Home User Mode**: Maximum 10 households
  - **Staff User Mode**: Maximum 10 businesses
  - **No hard limits** on staff, clients, or documents
  - **Soft limit of 1000 total records**: When reached, users are prompted to delete dormant records to add more. Warning shows at 900 records.
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

## CRITICAL: GitHub Push & Workflow Instructions

**IMPORTANT**: The Replit OAuth token does NOT have `workflow` scope, so you CANNOT push workflow files from Replit.

### Correct Workflow for GitHub Push:
1. **Remove .github folder from Replit** (run in Shell):
   ```bash
   rm -rf .github
   ```
2. **Push to GitHub**:
   ```bash
   git push origin main --force
   ```
3. **Add workflow file manually in GitHub**:
   - Go to https://github.com/dhairyavkshah/home-staff-360
   - Click "Add file" > "Create new file"
   - Path: `.github/workflows/android.yml`
   - Paste the workflow content (see below)
   - Commit directly to main

### Android Build Workflow Content:
```yaml
name: Android Build

on:
  workflow_dispatch:
    inputs:
      build_type:
        description: 'Build Type'
        required: true
        default: 'debug'
        type: choice
        options:
          - debug
          - release

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web app
        run: npm run build
      
      - name: Sync Capacitor
        run: npx cap sync android
      
      - name: Set up Android SDK
        uses: android-actions/setup-android@v3
      
      - name: Decode Keystore
        if: inputs.build_type == 'release'
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/homestaff360-release.jks
      
      - name: Build Release AAB
        if: inputs.build_type == 'release'
        working-directory: android
        run: ./gradlew bundleRelease
        env:
          KEYSTORE_FILE: ${{ github.workspace }}/android/app/homestaff360-release.jks
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      
      - name: Build Release APK
        if: inputs.build_type == 'release'
        working-directory: android
        run: ./gradlew assembleRelease
        env:
          KEYSTORE_FILE: ${{ github.workspace }}/android/app/homestaff360-release.jks
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      
      - name: Build Debug APK
        if: inputs.build_type == 'debug'
        working-directory: android
        run: ./gradlew assembleDebug
      
      - name: Upload Release AAB
        if: inputs.build_type == 'release'
        uses: actions/upload-artifact@v4
        with:
          name: android-release-aab
          path: android/app/build/outputs/bundle/release/app-release.aab
      
      - name: Upload Release APK
        if: inputs.build_type == 'release'
        uses: actions/upload-artifact@v4
        with:
          name: android-release-apk
          path: android/app/build/outputs/apk/release/app-release.apk
      
      - name: Upload Debug APK
        if: inputs.build_type == 'debug'
        uses: actions/upload-artifact@v4
        with:
          name: android-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

### GitHub Secrets Required for Release Builds:
- `KEYSTORE_BASE64` - Base64-encoded keystore file
- `KEYSTORE_PASSWORD` - Keystore password
- `KEY_ALIAS` - Key alias
- `KEY_PASSWORD` - Key password