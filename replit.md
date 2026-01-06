# Home Staff 360

## Current Version
**Version 1.0.2** (versionCode 3) - January 2026

## Overview
Home Staff 360 is a **100% free, offline-first mobile/web application** for managing household staff and service businesses. It enables efficient tracking of attendance, payments, and expenses for domestic staff (Home User Mode) and allows service professionals to manage their clients and earnings (Staff User Mode). The application prioritizes privacy, storing all user data locally on the device with no server dependencies. It supports multi-currency and multi-language, offering a robust solution for personal and professional management.

## App Philosophy
- **Completely Free**: No premium tiers, no subscriptions, no paywalls
- **Ad-Free**: No advertisements of any kind
- **Privacy-First**: 100% offline, all data stays on the user's device
- **Donation-Supported**: Optional donations help keep the app free for everyone

## User Preferences
I prefer simple language and clear explanations. I want iterative development, with small, testable changes. Please ask before making any major architectural decisions or large-scale code changes. I value privacy and offline-first capabilities.

## Current Specifications & Scope

### Dual Mode Operation
1. **Home User Mode**: For households managing domestic staff
   - Manage unlimited staff members with roles (maid, cook, driver, gardener, etc.)
   - Track attendance (Full Day, Half Day, Absent)
   - Record payments, advances, and deductions
   - Track household bills and expenses with categories
   - Log laundry batches with item-wise pricing
   - Generate and export CSV reports
   - Backup and restore data

2. **Staff/Professional Mode**: For service professionals managing their work
   - Manage client homes where they work
   - Log attendance at multiple client locations
   - Track laundry jobs with earnings
   - Record personal business expenses
   - Generate earnings reports
   - Create and manage invoices with tax support

### Plan & Limits (100% Free)
- **Home User Mode**: Maximum 10 households
- **Staff User Mode**: Maximum 10 businesses
- **No hard limits** on staff members, clients, or documents
- **Soft limit of 1000 total records**: Warning at 900 records, prompt at 1000 to delete old records
- **Document storage**: 5MB per file, images auto-compressed to 80% JPEG quality

### Support the Developer (Donation Feature)
Located in Settings > Support the Developer, this optional feature allows users to make voluntary donations:

**Payment Methods**:
- **Indian Users**: UPI (opens native UPI app) with UPI ID: dhairyavkshah@icici
- **International Users**: PayPal (opens PayPal.me link)

**Donation Tiers** (currency-specific):
- **INR**: ₹20, ₹50, ₹100, ₹200, ₹500, ₹1000 + custom amount
- **USD**: $1, $2, $5, $10, $20, $50 + custom amount
- **EUR**: €1, €2, €5, €10, €20, €50 + custom amount
- **GBP**: £1, £2, £5, £10, £20, £50 + custom amount
- **AED**: 5, 10, 20, 50, 100, 200 AED + custom amount

**Flow**:
1. User selects amount (preset or custom)
2. User chooses payment method (auto-detected by country)
3. Opens UPI app or PayPal externally
4. User confirms payment completion
5. Thank you message with confetti animation
6. User marked as "supporter" in localStorage

## System Architecture

### UI/UX Design
- Modern UI inspired by Samsung One UI and Material 3
- "Squircle" corners (24px radius) for a soft, premium feel
- Light and Dark mode support
- Primary color: Google Blue (#0B57D0)
- Bottom navigation with 5 tabs (Home, Staff/Clients, Expenses, Reports, Settings)

### Technical Implementations
- **Offline-First Design**: All data stored in browser `localStorage`, no server dependencies
- **Security**: PIN-based app lock with optional biometric authentication (WebAuthn)
  - **Brute-force protection**: 5 failed PIN attempts = 30-minute lockout with countdown timer (persistent in localStorage)
- **Backup Validation**: Zod schema validation for backup imports to prevent data corruption
- **Default App Mode**: Remembers user's preferred mode (HOME or STAFF), configurable in settings
- **Guided Tour**: Interactive onboarding tours for both modes, auto-starts once, replayable from settings
- **Data Scoping**: All data filtered by active account ID, "Show All Contexts" toggle available
- **Cascade Deletes**: Deleting records automatically cleans up related data
- **Document Management**: Images resized (max 1920x1920), compressed (80% JPEG), stored as Base64
- **Invoicing System (STAFF Mode)**: Itemized invoices with sequential numbering, tax rates, 5 statuses

### Known Limitations (Planned for v1.1)
- **Hardcoded English labels**: Some financial terms like "Payment", "Advance", "Deduction" in getCategoryLabel() are in English (globally understood financial terms)
- **List virtualization**: Not implemented for v1.0 (soft limit of 1000 records mitigates performance concerns)
- **Comprehensive ARIA labels**: Baseline accessibility provided by Shadcn components; comprehensive ARIA audit planned

### Multi-Language Support (21 Languages)
**All 21 languages have complete translations (100% coverage ~620 keys)**:
- English (en), Hindi (hi), Gujarati (gu), Kannada (kn), Malayalam (ml)
- Spanish (es), Marathi (mr), Punjabi (pa), Tamil (ta)
- Telugu (te), Urdu (ur), Bengali (bn), Odia (or), Assamese (as)
- Russian (ru), French (fr), German (de), Arabic (ar), Chinese (zh), Japanese (ja), Portuguese (pt)

**Language Selector Features**:
- Typeahead search functionality
- Safe area collision padding for Android compatibility
- Grouped by region (Indian languages first, then international)

### Multi-Currency Support (27 Currencies)
**General App Currencies**: INR, USD, EUR, GBP, AUD, CAD, CHF, CZK, DKK, HKD, HUF, ILS, JPY, MXN, NOK, NZD, PHP, PLN, RUB, SEK, SGD, THB, TWD, AED, CNY, BRL, ZAR, and custom currencies with user-defined symbol.

**PayPal Donation Currencies (22)**: AUD, USD, CAD, CHF, CZK, DKK, EUR, GBP, HKD, HUF, ILS, JPY, MXN, NOK, NZD, PHP, PLN, RUB, SEK, SGD, THB, TWD. Users with unsupported currencies are shown USD amounts.

## External Dependencies

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Icons**: `lucide-react`, `react-icons`
- **Animation**: `framer-motion`
- **State Management**: React Context
- **Persistence**: Browser `localStorage`
- **Biometric Authentication**: WebAuthn API
- **Backend (Static Serving Only)**: Express.js
- **Schema Validation**: Zod
- **Mobile Packaging**: Capacitor (Android)
- **CI/CD**: GitHub Actions

## Project Structure

```
client/src/
├── components/         # Reusable UI components
│   ├── ui/            # Shadcn components
│   └── ...            # App-specific components
├── screens/           # Main app screens
│   ├── HomeScreen.tsx
│   ├── StaffScreen.tsx
│   ├── ExpensesScreen.tsx
│   ├── ReportsScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── SupportDeveloperScreen.tsx
│   └── ...
├── lib/
│   ├── i18n/          # Internationalization
│   │   └── translations.ts
│   ├── storage.ts     # localStorage wrapper
│   ├── payment-handler.ts  # Donation payment handling
│   └── ...
└── hooks/             # Custom React hooks
```

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

## Development Notes

### Translation Status
- 14 languages have complete translations (~250 keys each)
- 6 Indian languages have partial translations (onboarding only, ~30 keys each)
- Remaining work: ~720 translations for Telugu, Tamil, Urdu, Bengali, Odia, Assamese

### Key Design Decisions
- Language selector uses typeahead search for better UX with 20 languages
- Dropdowns have safe area collision padding for Android status bar
- All data operations use helper methods that respect active account context
- Documents stored as compressed Base64 to stay within localStorage limits
