# Firebase Setup Guide

This guide will walk you through setting up Firebase for the Proximity App.

## Prerequisites

- A Google account
- Basic understanding of Firebase Console

## Step-by-Step Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "Proximity App")
4. (Optional) Enable Google Analytics
5. Click **"Create project"**

### 2. Enable Authentication

1. In the Firebase Console, select your project
2. Click **"Authentication"** in the left sidebar
3. Click **"Get started"**
4. Select **"Email/Password"** from the Sign-in providers
5. Enable **"Email/Password"** (first toggle)
6. Click **"Save"**

### 3. Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
   - For production, you'll need proper security rules
4. Choose a Cloud Firestore location (preferably close to your users)
5. Click **"Enable"**

### 4. Set Up Firestore Security Rules

For development, these rules allow authenticated users to read/write:

1. Go to **Firestore Database** > **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own user document
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Groups - anyone authenticated can read, creator can write
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        resource.data.createdBy == request.auth.uid;
    }

    // Group memberships
    match /groupMemberships/{membershipId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // User locations - can be read by anyone authenticated,
    // written only by the user themselves
    match /userLocations/{locationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        locationId.split('_')[0] == request.auth.uid;
    }

    // Proximity alerts
    match /proximityAlerts/{alertId} {
      allow read, write: if request.auth != null;
    }

    // Chat messages
    match /chatMessages/{messageId} {
      allow read, write: if request.auth != null;
    }

    // Meet requests
    match /meetRequests/{requestId} {
      allow read, write: if request.auth != null;
    }

    // Group events
    match /groupEvents/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

⚠️ **Important**: Before going to production, review and tighten these security rules!

### 5. Add Android App

1. In Firebase Console project overview, click the Android icon
2. Register app with these details:
   - **Android package name**: `com.proximityapp`
   - **App nickname**: Proximity App (optional)
   - **Debug signing certificate SHA-1**: (optional for now)
3. Click **"Register app"**
4. Download `google-services.json`
5. Place the file in your project: `android/app/google-services.json`
6. Click **"Next"** through the remaining steps

### 6. Add iOS App

1. In Firebase Console project overview, click the iOS icon
2. Register app with these details:
   - **iOS bundle ID**: `org.reactjs.native.example.ProximityApp`
   - **App nickname**: Proximity App (optional)
3. Click **"Register app"**
4. Download `GoogleService-Info.plist`
5. Place the file in your project: `ios/ProximityApp/GoogleService-Info.plist`
6. Click **"Next"** through the remaining steps

### 7. Get Firebase Configuration for .env File

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. Select your Web app (or create one if needed)
4. Copy the configuration values to your `.env` file:

```env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Verify Setup

### Test Authentication

1. Run your app
2. Try to sign up with an email and password
3. Check Firebase Console > Authentication > Users to see if the user was created

### Test Firestore

1. After signing up, check Firebase Console > Firestore Database
2. You should see a `users` collection with your user document

## Enable Additional Firebase Features (Optional)

### Firebase Cloud Messaging (Push Notifications)

1. Go to **Project Settings** > **Cloud Messaging**
2. Note your **Server key** (for backend notifications)
3. iOS requires additional APNs configuration

### Firebase Storage (for User Avatars)

1. Go to **Storage** in the left sidebar
2. Click **"Get started"**
3. Accept the default security rules
4. Click **"Done"**

## Automated Index Deployment (Recommended)

The project includes a pre-configured `firestore.indexes.json` file with all required indexes.

### Option 1: Deploy via Firebase CLI
```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (one-time setup)
firebase init firestore

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Option 2: Manual Upload
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Indexes**
4. Click the menu (⋮) and select **Import/Export**
5. Upload the `firestore.indexes.json` file from the project root

For detailed index setup instructions, see **FIRESTORE_INDEX_SETUP.md** in the project root.

---

## Firestore Data Structure

The app uses these collections:

```
users/
  {userId}/
    - displayName
    - email
    - groups[]
    - privacySettings{}
    - notificationPreferences{}

groups/
  {groupId}/
    - name
    - description
    - createdBy
    - memberCount
    - isActive

groupMemberships/
  {userId}_{groupId}/
    - userId
    - groupId
    - role
    - isBroadcasting
    - isVisible

userLocations/
  {userId}_{groupId}/
    - userId
    - groupId
    - location{}
    - lastUpdated
    - isActive

proximityAlerts/
  {alertId}/
    - userId
    - groupId
    - distance
    - timestamp
```

## Troubleshooting

### "Default Firebase app has not been initialized"
- Verify `google-services.json` (Android) is in `android/app/`
- Verify `GoogleService-Info.plist` (iOS) is in `ios/ProximityApp/`
- Rebuild the app

### Authentication Errors
- Check that Email/Password is enabled in Firebase Console
- Verify your .env file has correct Firebase config values

### Firestore Permission Denied
- Check security rules in Firestore Database > Rules
- Make sure you're authenticated before accessing Firestore
- Verify the rules match the ones in this guide

### Build Errors After Adding Firebase
- Android: Run `cd android && ./gradlew clean && cd ..`
- iOS: Run `cd ios && pod install && cd ..`
- Clear Metro cache: `npm start -- --reset-cache`

## Production Checklist

Before deploying to production:

- [ ] Review and update Firestore security rules
- [ ] Set up proper error handling
- [ ] Configure Firebase Analytics
- [ ] Set up Firebase Crashlytics
- [ ] Enable Firebase App Check
- [ ] Configure rate limiting
- [ ] Set up backup and recovery
- [ ] Review Firebase usage limits and billing

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com/)

## Support

If you encounter issues with Firebase setup:
1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review [React Native Firebase docs](https://rnfirebase.io/)
3. Check Firebase Console for error logs
4. Verify all configuration files are in the correct locations
