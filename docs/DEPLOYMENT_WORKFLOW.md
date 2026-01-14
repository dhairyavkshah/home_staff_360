# Home Staff 360 - Deployment Workflow

## Overview

This document describes the development and production deployment workflow for Home Staff 360. The system maintains two separate environments to ensure safe testing before production releases.

---

## Environment Architecture

### Development Environment
- **Purpose**: Testing, debugging, new feature development
- **Replit URL**: Your workspace development URL (e.g., `https://your-repl.username.repl.co`)
- **Database**: Development PostgreSQL (can be modified freely)
- **Android App**: Debug APK with `.dev` app ID suffix
- **App Name**: "Home Staff 360 DEV"

### Production Environment
- **Purpose**: Live published app for end users
- **Replit URL**: `https://homestaff360.replit.app`
- **Database**: Production PostgreSQL (handle with care)
- **Android App**: Signed AAB/APK for Google Play
- **App Name**: "Home Staff 360"

---

## Configuration Files

### Capacitor Configurations

| File | Environment | App ID | Server URL |
|------|-------------|--------|------------|
| `capacitor.config.dev.ts` | Development | `com.theteam360.homestaff360.dev` | Dev Replit URL |
| `capacitor.config.prod.ts` | Production | `com.theteam360.homestaff360` | `https://homestaff360.replit.app` |
| `capacitor.config.ts` | Active (copied) | Depends on build | Depends on build |

### Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_APP_ENV` | `development` | `production` |
| `VITE_API_BASE_URL` | (empty - uses relative) | `https://homestaff360.replit.app` |

---

## GitHub Workflows

### Available Workflows

| Workflow | File | Trigger | Output |
|----------|------|---------|--------|
| Dev APK | `android-dev-apk.yml` | Push to `develop/*`, manual | Debug APK |
| Prod AAB | `android-prod-aab.yml` | Push to `main`, tags `v*` | Signed AAB |
| Prod APK | `android-prod-apk.yml` | Push to `main`, manual | Signed APK |

### Required GitHub Secrets

Set these in your GitHub repository settings:

```
KEYSTORE_BASE64      - Base64 encoded keystore file
KEYSTORE_PASSWORD    - Keystore password
KEY_ALIAS            - Key alias name
KEY_PASSWORD         - Key password
```

---

## Development Workflow

### Step 1: Develop & Test Locally

```bash
# Start development server in Replit
npm run dev

# Test in browser at your Replit dev URL
```

### Step 2: Build Development APK

**Option A: GitHub Actions (Recommended)**
1. Push changes to `develop` branch
2. Go to GitHub Actions
3. Run "Build Development APK" workflow
4. Enter your Replit development URL when prompted
5. Download the APK artifact

**Option B: Manual Build**
```bash
# Copy dev config
cp capacitor.config.dev.ts capacitor.config.ts

# Update the URL in capacitor.config.ts to your dev URL
# Then build
npm run build
npx cap sync android

# Open in Android Studio and build debug APK
npx cap open android
```

### Step 3: Test on Android Device

1. Install the DEV APK on your test device
2. The app will connect to your development server
3. Test all features thoroughly
4. Check logs and fix issues

---

## Production Deployment Workflow

### Step 1: Prepare for Release

1. **Merge to main**: Merge tested `develop` branch to `main`
2. **Update version**: Increment `versionCode` and `versionName` in `android/app/build.gradle`
3. **Test one more time** on development

### Step 2: Publish Backend to Replit

1. In Replit, click **Deploy** button
2. Select deployment settings
3. Deploy to production URL

### Step 3: Build Production AAB/APK

**Automatic (on push to main):**
- GitHub Actions automatically builds production AAB
- Download from Actions artifacts

**Manual:**
1. Go to GitHub Actions
2. Run "Build Production AAB" or "Build Production APK"
3. Download the signed artifact

### Step 4: Upload to Google Play

1. Go to Google Play Console
2. Upload the AAB file
3. Complete release notes
4. Submit for review

---

## Quick Reference Commands

### Development Build (Local)
```bash
# 1. Copy dev config
cp capacitor.config.dev.ts capacitor.config.ts

# 2. Edit the URL in capacitor.config.ts to your dev URL

# 3. Build
npm run build
npx cap sync android
npx cap open android
```

### Production Build (Local)
```bash
# 1. Copy prod config
cp capacitor.config.prod.ts capacitor.config.ts

# 2. Build
npm run build
npx cap sync android
npx cap open android
```

---

## Environment Separation Benefits

| Benefit | How It Works |
|---------|--------------|
| Safe Testing | Test risky changes on dev without affecting live users |
| Database Isolation | Dev database can be reset; prod data is preserved |
| Different App IDs | Both DEV and PROD apps can be installed simultaneously |
| Debug Logging | DEV has debugging enabled; PROD has it disabled |
| Independent Releases | Push to dev frequently; push to prod when ready |

---

## Troubleshooting

### Dev APK connects to wrong server
- Check `capacitor.config.ts` has the correct dev URL
- Rebuild: `npx cap sync android`
- Uninstall old APK before installing new one

### Production build fails signing
- Verify GitHub secrets are set correctly
- Check keystore file is valid
- Ensure passwords match

### Database sync issues
- Dev and prod databases are completely separate
- Data entered in dev won't appear in prod (and vice versa)
- This is intentional for safety

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| Jan 2026 | 3.0 | Added dev/prod environment separation |

---

*Last Updated: January 14, 2026*
