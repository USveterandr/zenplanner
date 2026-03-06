# Google Play Publishing Guide - Zen Planner

## Overview

This guide provides step-by-step instructions to publish Zen Planner on Google Play Store and create a downloadable APK for non-Google Play users.

## Live Website
- **URL:** https://zenplanner-app.isaactrinidadllc.workers.dev
- **Install Page:** https://zenplanner-app.isaactrinidadllc.workers.dev/install

---

## What's New (March 2026)
- **All features are now FREE** - No payment required
- Lemon Squeezy payment integration removed
- Unlimited access to all features

---

## Current Status

### Completed Items
- ✅ Android App Bundle (AAB) built and ready
- ✅ Package name: `com.zenplanner.app`
- ✅ Version: 1.0.0 (versionCode: 1)
- ✅ App icons in all required sizes
- ✅ Privacy policy page exists on website
- ✅ Asset links configured for Android App Links
- ✅ Splash screen configured
- ✅ Shortcuts configured
- ✅ Payment system removed - all features free
- ✅ Deployed on Cloudflare Workers: https://zenplanner-app.isaactrinidadllc.workers.dev

---

## Step 1: Create Google Play Store Assets

You need to create the following images. Use the existing icons in `/public/` folder as a base:

### Required Screenshots (Phone)
- 2-8 screenshots required
- Recommended sizes: 1080x1920 (9:16 ratio)
- Include: Task list, Calendar view, Analytics, AI Advisor features

### Feature Graphic (Required)
- Size: 1024x500 pixels
- Show app name, logo, and key features
- Location: Top of store listing

### App Icon (Already exists in android-twa)
- 512x512 PNG (store listing)
- Multiple sizes for device (already generated)

---

## Step 2: Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with your account
3. Click "Create App"
4. Fill in:
   - App name: Zen Planner
   - Default language: English (en)
   - App type: Android App
5. Select "Release" > "Production" track
6. Upload the AAB file:
   ```
   android-twa/app/build/outputs/bundle/release/app-release.aab
   ```
7. Fill in Store Listing with assets from Step 1
8. Provide privacy policy URL (see Step 3)
9. Complete Content Rating questionnaire
10. Submit for review

---

## Step 3: Privacy Policy

Host the privacy policy online. Options:
1. Use existing: `https://zenplanner-app.isaactrinidadllc.workers.dev/privacy-policy`
2. Or convert `PRIVACY_POLICY.md` to HTML and host it

---

## Step 4: App Signing

The app is already configured with:
- App signing key: `android-twa/android.keystore`
- Key alias: `zenplanner`
- Key password: `zenplanner123`

**IMPORTANT:** Keep this keystore safe!

---

## Building APK for Non-Android Users (Direct Download)

To create a standalone APK that users can download and install directly:

### Prerequisites
1. Install Android Studio: https://developer.android.com/studio
2. Install Command Line Tools
3. Set ANDROID_HOME environment variable

### Build Commands

```bash
cd android-twa

# Build debug APK (for testing)
./gradlew assembleDebug

# Build release APK (for distribution)
./gradlew assembleRelease
```

### Output Files
- Debug APK: `android-twa/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android-twa/app/build/outputs/apk/release/app-release.apk`

---

## Distributing APK Without Google Play

For users who don't use Google Play:

1. Build the release APK (see above)
2. Upload to your website
3. Create a download page with instructions:
   - "Download APK" button
   - Note: User needs to enable "Install from unknown sources"
   
### Example Download Page HTML:
```html
<a href="/app-release.apk" download>Download Zen Planner</a>
<p>To install, go to Settings > Security > Enable "Unknown Sources"</p>
```

---

## App Information for Store Listing

- **App Name:** Zen Planner
- **Short Description:** AI-Powered Todo & Planner - Beat procrastination
- **Long Description:** 
```
Zen Planner - Your AI-Powered Productivity Companion

Beat procrastination and get more done with Zen Planner!

Features:
- Smart task management with priorities and due dates
- AI Advisor for personalized productivity tips
- Calendar view to visualize your schedule
- Goal tracking and habit building with streaks
- Analytics dashboard for productivity insights
- Full offline support
- Team collaboration
- Smart reminders

All features are FREE!
```
- **Category:** Productivity
- **Content Rating:** Everyone

---

## Files Reference

| File | Location |
|------|----------|
| AAB Bundle | `android-twa/app/build/outputs/bundle/release/app-release.aab` |
| APK (after build) | `android-twa/app/build/outputs/apk/release/app-release.apk` |
| App Icons | `android-twa/app/src/main/res/mipmap-*/` |
| Store Icon | `android-twa/store_icon.png` |
| Privacy Policy | `PRIVACY_POLICY.md` |
| Release Notes | `RELEASE_NOTES.md` |

---

## Minimum Requirements
- Android 5.0+ (API 21)
- Target: Android 15 (API 35)

---

## iOS Installation (Without App Store)

There are two ways to install Zen Planner on iPhone/iPad without using the App Store:

### Option 1: PWA - Add to Home Screen (Free, Recommended)

This works without any Apple developer account:

1. Open **https://zenplanner-app.isaactrinidadllc.workers.dev/install** in Safari
2. Tap the **Share button** (square with arrow up)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top right

**Features:**
- Works offline
- Native app experience
- No certificate required
- Instant installation

**Direct Link:** https://zenplanner-app.isaactrinidadllc.workers.dev/install

### Option 2: Apple Enterprise / Custom App (Requires Paid Account)

To distribute without App Store review, you need:
- **Apple Developer Enterprise Account** ($299/year)
- An Apple certificate to sign the app
- Your own distribution method ( MDM, direct link, etc.)

Contact us if you need enterprise distribution.

---

## Creating Install Links

Add these links to your website:

```html
<!-- Main App -->
<a href="https://zenplanner-app.isaactrinidadllc.workers.dev">Open Zen Planner</a>

<!-- Install Page -->
<a href="https://zenplanner-app.isaactrinidadllc.workers.dev/install">Install Zen Planner</a>
```

---

## Files Updated for iOS Support

- ✅ `src/app/install/page.tsx` - Install instructions page
- ✅ `src/app/layout.tsx` - iOS meta tags configured
- ✅ `public/manifest.json` - PWA manifest ready
- ✅ `public/apple-touch-icon.png` - iOS icon (180x180)
