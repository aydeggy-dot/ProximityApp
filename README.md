# Proximity-Based Group Networking Mobile App

A React Native mobile application that detects and notifies users when members of their configured groups are in close proximity. The app provides real-time location tracking, proximity alerts, and an interactive map interface.

## Features

### Core Features
- User Authentication (Firebase Auth)
- Group Management (Create/Join Groups)
- Real-time Proximity Detection
- Interactive Map with Nearby Members
- Push Notifications for Proximity Alerts
- Privacy Controls per Group
- Dark Mode Support

### Technology Stack
- React Native 0.82.1 with TypeScript
- Firebase (Auth & Firestore)
- React Navigation v7
- React Native Maps
- React Native Geolocation Service

## Prerequisites

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Installation

### Step 1: Install Dependencies

```sh
npm install
```

For iOS, also install CocoaPods:

```sh
cd ios && pod install && cd ..
```

### Step 2: Environment Configuration

Copy `.env.example` to `.env`:

```sh
cp .env.example .env
```

Edit `.env` with your Firebase and Google Maps credentials:

```env
# Firebase Configuration (get from Firebase Console)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Maps API Keys
GOOGLE_MAPS_API_KEY_ANDROID=your_android_maps_key
GOOGLE_MAPS_API_KEY_IOS=your_ios_maps_key

APP_ENV=development
```

### Step 3: Firebase Setup

1. **Create Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. **Enable Authentication**: Enable Email/Password authentication in Firebase Console
3. **Create Firestore Database**: Set up Firestore in test mode
4. **Add Android App**: Download `google-services.json` and place in `android/app/`
5. **Add iOS App**: Download `GoogleService-Info.plist` and place in `ios/ProximityApp/`

See FIREBASE_SETUP.md for detailed instructions.

### Step 4: Start Metro

Run the Metro bundler:

```sh
npm start
```

### Step 5: Run the App

With Metro running, build and run your app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

## Project Structure

```
src/
├── features/              # Feature-based modules
│   ├── auth/             # Authentication screens
│   ├── groups/           # Group management
│   ├── map/              # Map and location features
│   ├── notifications/    # Proximity alerts
│   └── profile/          # User profile
├── services/             # Business logic
│   ├── firebase/         # Firebase Auth & Firestore
│   ├── location/         # Location tracking service
│   └── proximity/        # Proximity detection logic
├── contexts/             # React Context providers
├── navigation/           # App navigation structure
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── constants/            # App constants
└── theme/                # Theme configuration
```

## Key Features Implemented

- **Authentication**: Firebase email/password with user profiles
- **Location Tracking**: Real-time location with background support
- **Proximity Detection**: Configurable radius (50m-1km)
- **Group Management**: Create/join groups with privacy controls
- **Dark Mode**: Full dark mode with auto-detection
- **Maps Integration**: React Native Maps with marker support

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## Common Issues

- **Metro bundler won't start**: Run `npm start -- --reset-cache`
- **Build fails**: Clean build with `cd android && ./gradlew clean` (Android) or `cd ios && pod install` (iOS)
- **Location not working**: Check permissions in device settings
- **Firebase errors**: Verify google-services.json (Android) or GoogleService-Info.plist (iOS) placement

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
