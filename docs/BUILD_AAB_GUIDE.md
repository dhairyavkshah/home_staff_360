# Home Staff 360 - Building Signed AAB for Google Play Store

## Overview

This guide explains how to generate a signed Android App Bundle (.aab) file for uploading to Google Play Store.

---

## Prerequisites

1. A GitHub account with this repository
2. Java JDK installed on your computer (for keystore generation)
3. A Google Play Developer account ($25 one-time fee)

---

## Step 1: Generate Your Signing Keystore

The keystore is your app's identity. **NEVER lose this file** - you won't be able to update your app on Play Store without it.

### Option A: Using Command Line (Recommended)

Run this command on your computer (Mac/Linux/Windows with Java installed):

```bash
keytool -genkey -v -keystore homestaff360-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias homestaff360
```

You'll be prompted to enter:
1. **Keystore password**: Choose a strong password (save this!)
2. **Key password**: Can be same as keystore password
3. **Your name**: Dhairya Shah
4. **Organizational unit**: The Team 360
5. **Organization**: The Team 360
6. **City/Locality**: [Your City]
7. **State/Province**: [Your State]
8. **Country code**: IN (or your country's 2-letter code)

### Option B: Using Android Studio

1. Open Android Studio
2. Go to **Build → Generate Signed Bundle / APK**
3. Select **Android App Bundle**
4. Click **Create new...** under Key store path
5. Fill in the details and save

---

## Step 2: Convert Keystore to Base64

The keystore needs to be Base64 encoded to store as a GitHub Secret.

### On Mac/Linux:
```bash
base64 -i homestaff360-release.jks -o keystore-base64.txt
```

### On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("homestaff360-release.jks")) | Out-File keystore-base64.txt
```

Open `keystore-base64.txt` - you'll need this content for GitHub Secrets.

---

## Step 3: Configure GitHub Secrets

Go to your GitHub repository and add these secrets:

1. Navigate to: **Repository → Settings → Secrets and variables → Actions**
2. Click **New repository secret** for each:

| Secret Name | Value |
|-------------|-------|
| `KEYSTORE_BASE64` | Contents of keystore-base64.txt (the entire Base64 string) |
| `KEYSTORE_PASSWORD` | Your keystore password |
| `KEY_ALIAS` | `homestaff360` (or whatever you set during generation) |
| `KEY_PASSWORD` | Your key password |

---

## Step 4: Trigger the Release Build

### Method 1: Manual Trigger (Recommended for releases)

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Build Android APK & AAB** workflow
4. Click **Run workflow**
5. Select `release` from the dropdown
6. Click **Run workflow**

### Method 2: Push to Main Branch

Every push to `main` branch triggers a debug build automatically.

---

## Step 5: Download Your AAB

1. After the workflow completes (5-10 minutes)
2. Go to **Actions** → Click on the completed workflow run
3. Scroll to **Artifacts** section
4. Download **HomeStaff360-release-aab**
5. Extract the ZIP to get `app-release.aab`

---

## Step 6: Upload to Google Play Console

### First-Time Setup

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in app details:
   - **App name**: Home Staff 360
   - **Default language**: English (US)
   - **App or game**: App
   - **Free or paid**: Free
4. Complete all required sections in the Dashboard

### Upload AAB

1. Go to **Release → Production** (or Testing track first)
2. Click **Create new release**
3. Upload your `app-release.aab` file
4. Add release notes (from our RELEASE_NOTES.md)
5. Review and rollout

---

## Important Files Reference

| File | Purpose |
|------|---------|
| `homestaff360-release.jks` | Your signing keystore (KEEP SAFE!) |
| `keystore-base64.txt` | Base64 encoded keystore for GitHub |
| `.github/workflows/android.yml` | Build workflow configuration |
| `android/app/build.gradle` | Android build configuration |

---

## Version Management

Before each release, update version in `android/app/build.gradle`:

```groovy
defaultConfig {
    versionCode 1       // Increment for each upload (1, 2, 3...)
    versionName "1.0.0" // User-visible version
}
```

**Version Code Rules:**
- Must be higher than previous upload
- Integers only (1, 2, 3, 4...)

**Version Name Suggestions:**
- 1.0.0 - Initial release
- 1.0.1 - Bug fixes
- 1.1.0 - New features
- 2.0.0 - Major changes

---

## Troubleshooting

### Build Fails - Keystore Not Found
- Ensure `KEYSTORE_BASE64` secret contains the full Base64 string
- Check that all 4 secrets are configured

### Build Fails - Wrong Password
- Verify `KEYSTORE_PASSWORD` and `KEY_PASSWORD` are correct
- Passwords are case-sensitive

### Upload Fails - Wrong Signature
- You must use the SAME keystore for all updates
- If you lose your keystore, you'll need to create a new app listing

### AAB Too Large
- Check that web assets are properly built
- Ensure no large test files are included

---

## Security Best Practices

1. **Never commit** your keystore file to the repository
2. **Keep backups** of your keystore in secure locations
3. **Store passwords** in a password manager
4. **Use GitHub Secrets** - never hardcode passwords
5. **Rotate secrets** if you suspect compromise

---

## Quick Commands Reference

```bash
# Generate new keystore
keytool -genkey -v -keystore homestaff360-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias homestaff360

# Verify keystore
keytool -list -v -keystore homestaff360-release.jks

# Convert to Base64 (Mac/Linux)
base64 -i homestaff360-release.jks -o keystore-base64.txt

# View keystore details
keytool -list -keystore homestaff360-release.jks
```

---

## Google Play Store Requirements Checklist

Before uploading your AAB, ensure you have:

- [ ] Privacy Policy URL
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] At least 2 phone screenshots
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] Content rating questionnaire completed
- [ ] Target audience and content declarations
- [ ] Data safety section completed
- [ ] App category selected

---

## Support

For questions about this build process, contact:
**Dhairya Shah (The Team 360)**

---

*Document Version: 1.0*
*Last Updated: January 2, 2026*
