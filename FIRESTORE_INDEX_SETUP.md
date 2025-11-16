# Firestore Index Setup Instructions

## Critical: These indexes MUST be created for the app to work

The app is showing errors because Firestore queries require composite indexes. Follow these steps:

---

## Method 1: Automated (Click Links from App Errors) ✅ RECOMMENDED

1. **For Popular Groups Error:**
   - Look at screenshot 2 - there's a URL that starts with `https://console.firebase.google.com/v1/r/project/proximity-app-a693a/firestore/indexes?create...`
   - Click that link or copy it to your browser
   - Click "Create Index" button
   - Wait for build to complete

2. **For Chat Error:**
   - Look at screenshot 4 - there's a similar URL
   - Click that link
   - Click "Create Index"
   - Wait for build to complete

3. **For Proximity Alerts Error:**
   - Look at screenshot 5 - there's another URL
   - Click that link
   - Click "Create Index"
   - Wait for build to complete

---

## Method 2: Manual Creation via Firebase Console

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com
2. Select project: **proximity-app-a693a**
3. Go to **Firestore Database** → **Indexes** tab

### Step 2: Create Each Index

**Index 1: Popular Groups**
- Click "Create Index"
- Collection ID: `groups`
- Add fields in order:
  1. Field: `isActive`, Type: Ascending
  2. Field: `privacyLevel`, Type: Ascending
  3. Field: `popularityScore`, Type: Descending
  4. Field: `memberCount`, Type: Descending
- Query scope: Collection
- Click "Create"

**Index 2: Public Groups by CreatedAt**
- Click "Create Index"
- Collection ID: `groups`
- Add fields:
  1. Field: `isActive`, Type: Ascending
  2. Field: `privacyLevel`, Type: Ascending
  3. Field: `createdAt`, Type: Descending
- Query scope: Collection
- Click "Create"

**Index 3: Chats by LastMessage**
- Click "Create Index"
- Collection ID: `chats`
- Add fields:
  1. Field: `participants`, Type: Array-contains
  2. Field: `lastMessageTimestamp`, Type: Descending
- Query scope: Collection
- Click "Create"

**Index 4: Chats by CreatedAt**
- Click "Create Index"
- Collection ID: `chats`
- Add fields:
  1. Field: `participants`, Type: Array-contains
  2. Field: `createdAt`, Type: Descending
- Query scope: Collection
- Click "Create"

**Index 5: Proximity Alerts**
- Click "Create Index"
- Collection ID: `proximityAlerts`
- Add fields:
  1. Field: `userId`, Type: Ascending
  2. Field: `isRead`, Type: Ascending
  3. Field: `createdAt`, Type: Descending
- Query scope: Collection
- Click "Create"

**Index 6: Group Memberships**
- Click "Create Index"
- Collection ID: `groupMemberships`
- Add fields:
  1. Field: `userId`, Type: Ascending
  2. Field: `status`, Type: Ascending
  3. Field: `joinedAt`, Type: Descending
- Query scope: Collection
- Click "Create"

---

## Step 3: Wait for Indexes to Build

- After creating each index, you'll see "Building..." status
- This usually takes 2-10 minutes depending on data size
- All indexes must show "Enabled" status before the app will work

---

## Step 4: Reload the App

Once all indexes show "Enabled":
1. Open dev menu on emulator: Double-tap R or shake device
2. Tap "Reload"
3. All errors should be resolved

---

## Quick Verification

After indexes are built, you should see:
- ✅ Groups screen loads with 4 tabs (My Groups, Nearby, Popular, Created)
- ✅ Chat list loads without errors
- ✅ Proximity alerts work
- ✅ No red error screens

---

## Notes

- **Index building time:** Usually 2-10 minutes for small datasets
- **Index cost:** Free tier includes generous index limits
- **One-time setup:** Indexes only need to be created once
- **Deployment:** In production, use `firebase deploy --only firestore:indexes` with the `firestore.indexes.json` file I created

---

## Troubleshooting

**If errors persist after creating indexes:**
1. Verify all 6 indexes show "Enabled" status
2. Check index field names match exactly (case-sensitive)
3. Try force-closing and reopening the app
4. Clear app data and re-login
