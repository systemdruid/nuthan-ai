# Recallio AI - Mobile App

React Native (Expo) mobile app for Recallio AI.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- [EAS CLI](https://docs.expo.dev/eas/) (for builds): `npm install -g eas-cli`
- An [Expo account](https://expo.dev/signup)
- Android Studio (for Android emulator) or a physical Android device

## Development Setup

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Configure environment variables

Credentials are managed via environment variables — never hardcoded. Copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
API_URL=https://your-api-url.ngrok-free.dev
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

These are injected at build time via `app.config.js` and read in the app via `expo-constants`. The `.env` file is gitignored and never committed.

#### Getting Google OAuth Client IDs

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** of type **Web application** → copy as `GOOGLE_WEB_CLIENT_ID`
3. Create an **OAuth 2.0 Client ID** of type **Android**:
   - Package name: `com.recallio.ai`
   - SHA-1: run `eas credentials` → **Keystore → Display keystore credentials**
   - Copy as `GOOGLE_ANDROID_CLIENT_ID`
4. On the Android OAuth client, enable **Custom URI scheme**

### 3. Build and run a development client

Since the app uses native modules (`expo-notifications`, `expo-auth-session`), it cannot run in Expo Go. Use a dev build:

```bash
eas login
eas build --profile development --platform android
```

Install the resulting APK on your device, then start the dev server:

```bash
npx expo start --dev-client
```

---

## Production Setup

### 1. Generate a production keystore

EAS manages the production keystore automatically. Run:

```bash
eas credentials --platform android
```

Select **Keystore → Set up a new keystore → Yes** to let EAS generate and store it.

Copy the resulting **SHA-1 fingerprint** and add it to your Android OAuth client in Google Cloud Console.

### 2. Set EAS Secrets

Instead of a `.env` file, production builds use EAS Secrets stored server-side on Expo. Run once per secret:

```bash
eas secret:create --scope project --name API_URL --value "https://your-production-api.com"
eas secret:create --scope project --name GOOGLE_WEB_CLIENT_ID --value "your-web-client-id.apps.googleusercontent.com"
eas secret:create --scope project --name GOOGLE_ANDROID_CLIENT_ID --value "your-android-client-id.apps.googleusercontent.com"
```

EAS automatically injects these as environment variables during remote builds. `app.config.js` picks them up via `process.env`, so no code changes are needed between dev and production.

To list or delete existing secrets:

```bash
eas secret:list
eas secret:delete --name SECRET_NAME
```

### 3. Configure `eas.json`

The `production` profile is already present in `eas.json`. For a Play Store release (AAB format) no changes are needed. For a standalone APK add:

```json
"production": {
  "android": {
    "buildType": "apk"
  }
}
```

### 4. Build the production APK / AAB

```bash
eas build --profile production --platform android
```

EAS will build remotely and provide a download link when complete.

### 5. Submit to Google Play (optional)

```bash
eas submit --platform android
```

This requires a Google Play service account key. See [EAS Submit docs](https://docs.expo.dev/submit/android/) for setup instructions.

### 6. Over-the-air (OTA) updates

For JS-only changes (no new native modules), push updates without a full rebuild:

```bash
eas update --branch production --message "describe the update"
```

Requires `expo-updates` to be configured. Users receive the update automatically on next app launch.

---

## Project Structure

```
mobile/
├── App.js                  # Root component, notification setup
├── app.config.js           # Dynamic Expo config — reads env vars at build time
├── eas.json                # EAS build profiles
├── .env                    # Local env vars (gitignored, never committed)
├── src/
│   ├── config.js           # Reads credentials from expo-constants
│   ├── notifications.js    # Local alarm/reminder scheduling
│   ├── api/
│   │   ├── authApi.js      # Authentication API calls
│   │   └── notesApi.js     # Notes API calls
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   └── HomeScreen.js
│   └── components/
│       ├── NoteCard.js
│       ├── NoteFormModal.js
│       └── TagFilterBar.js
```
