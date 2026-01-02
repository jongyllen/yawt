# Development & Release Guide

This document provides detailed instructions on how to build, test, and release YAWT (Yet Another Workout Tracker).

## Development Environments

### Prerequisites
- **Node.js**: LTS version (v20+ recommended).
- **Expo CLI**: `npm install -g eas-cli` (for builds) and `npx expo`.
- **Xcode**: Required for iOS development and simulators.
- **Android Studio**: Required for Android development and emulators.

---

## 🛠️ Building the App

### Running on Simulators

#### iOS Simulator
```bash
npx expo run:ios
```
- **What works**: Navigation, SQLite, UI updates, Live Activity testing (iOS 16.1+).
- **What doesn't**: Apple Health sync (real data), Haptic feedback (physical vibration), Camera.

#### Android Emulator
```bash
npx expo run:android
```
- **What works**: Most features, SQLite, Navigation.
- **What doesn't**: Haptic feedback.

### Running on Physical Devices (Direct USB/WIFI)
To test native features like **Haptics** and **Apple Health**, running on a real device is essential.

#### iOS Physical Device
Ensure your iPhone is connected via USB or on the same Wi-Fi.
```bash
npx expo run:ios --device
```
- **Debug (Standard)**: Allows for "Fast Refresh" - code changes appear instantly.
- **Release (Production Simulation)**: Runs the app at full speed, exactly like TestFlight. Use this to verify performance or final HealthKit permissions.
  ```bash
  npx expo run:ios --device --configuration Release
  ```

#### Android Physical Device
```bash
npx expo run:android --device
```

---

## 🛠️ Command Glossary: Expo vs. EAS

YAWT uses two different command-line tools. Here is when to use which:

### 1. Expo CLI (`npx expo`)
Used for **Local Development**. It compiles the code on your machine and pushes it to a simulator or your phone.
- `npx expo start`: Starts the development server for Expo Go or Dev Clients.
- `npx expo run:ios`: Builds and launches the native iOS project locally.
- `npx expo run:android`: Builds and launches the native Android project locally.

### 2. EAS CLI (`eas`)
Used for **Cloud & Infrastructure**. It sends your code to Expo's servers to build professional binaries.
- `eas build`: Creates a downloadable `.ipa` or `.apk` file.
- `eas submit`: Uploads a build to the App Store or Google Play.
- `eas build --auto-submit`: Does both in one go.

---

## 🚀 Releasing to TestFlight (iOS)

YAWT uses **EAS (Expo Application Services)** for automated builds and submissions.

### 1. Versioning
Ensure the `version` in `package.json` and `app.json` is updated. EAS will handle the `buildNumber` auto-incrementing in the cloud.

### 2. Triggering a Build & Submission
To build and automatically submit to TestFlight:

```bash
eas build --platform ios --profile production --auto-submit
```

- **Production Profile**: Uses the credentials configured in `eas.json`.
- **Auto-Submit**: Automatically uploads the finished `.ipa` to App Store Connect once the build succeeds.

### 3. After Submission
1.  Wait for Apple to finish **Processing** (usually 15–30 mins).
2.  Open the **TestFlight** app on your iPhone.
3.  Install version 1.0.x and start testing!

---

## 🤖 Releasing for Android (Internal Testing)

### 1. Triggering a Build
```bash
eas build --platform android --profile production
```

### 2. Submission to Play Store
If you have the Google Play Console configured:
```bash
eas submit --platform android
```
Otherwise, download the `.aab` from the Expo dashboard and upload it manually to the **Internal Testing** track in the Play Console.

---

## 💡 Troubleshooting

### CocoaPods Errors
If `pod install` fails with "Unable to find compatibility version string", ensure the `objectVersion` in `project.pbxproj` is set to **56** (Xcode 14.0 compatibility).

### Version Mismatch
Always ensure the main app `MARKETING_VERSION` matches the extension's version in the Xcode project.

### Credentials
If prompted for credentials during `eas build`, you may need to run in interactive mode:
```bash
eas build --platform ios --profile production --auto-submit
```
*(Avoid `--non-interactive` if you need to set up new provisioning profiles or distribution certificates).*
