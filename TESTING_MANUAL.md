# Comprehensive Manual Testing Checklist - Proximity-Based Group Networking App

## Overview
This React Native proximity-based app enables users to find nearby group members using GPS location tracking, Firebase authentication, and real-time notifications.

---

## SETUP REQUIREMENTS

### Pre-Testing Setup
- [ ] Device/emulator with location services enabled
- [ ] Internet/data connection active
- [ ] Firebase project configured with valid credentials
- [ ] Google Maps API keys configured
- [ ] Notification permissions ready to grant
- [ ] Multiple test accounts created for proximity testing
- [ ] Multiple devices/emulators for proximity feature testing

### Environment Variables (.env)
- [ ] FIREBASE_API_KEY configured
- [ ] GOOGLE_MAPS_API_KEY configured (Android/iOS)
- [ ] All Firebase config values present

---

## 1. AUTHENTICATION FEATURES

### 1.1 Sign Up Screen

#### Happy Path
- [ ] Navigate to Sign Up from Sign In screen
- [ ] Enter valid full name (2-50 characters)
- [ ] Enter valid email address
- [ ] Enter valid password (8+ chars, uppercase, lowercase, number)
- [ ] Enter matching confirm password
- [ ] Click "Sign Up" button
- [ ] Verify loading state shows ("Creating Account...")
- [ ] Verify successful account creation
- [ ] Verify automatic navigation to Main app
- [ ] Verify user profile created in Firestore with default settings

#### Edge Cases & Validations
- [ ] Test with name less than 2 characters - expect error "Name must be between 2 and 50 characters"
- [ ] Test with name over 50 characters - expect validation error
- [ ] Test with invalid email format - expect error "Please enter a valid email address"
- [ ] Test with email already in use - expect error "This email is already in use"
- [ ] Test with password less than 8 characters - expect error
- [ ] Test with password missing uppercase - expect error "Password must contain at least one uppercase letter"
- [ ] Test with password missing lowercase - expect error
- [ ] Test with password missing number - expect error "Password must contain at least one number"
- [ ] Test with non-matching passwords - expect error "Passwords do not match"
- [ ] Test with empty fields - expect appropriate validation errors
- [ ] Test "Sign In" link navigation to Sign In screen
- [ ] Test keyboard dismissal on scroll
- [ ] Test form fields disabled during loading
- [ ] Test network error handling (airplane mode)

### 1.2 Sign In Screen

#### Happy Path
- [ ] Enter valid registered email
- [ ] Enter correct password
- [ ] Click "Sign In" button
- [ ] Verify loading state shows ("Signing In...")
- [ ] Verify successful sign in
- [ ] Verify navigation to Main app (Map tab)
- [ ] Verify user profile loaded in AuthContext

#### Edge Cases & Validations
- [ ] Test with invalid email format - expect error "Please enter a valid email address"
- [ ] Test with password less than 6 characters - expect error "Password must be at least 6 characters"
- [ ] Test with unregistered email - expect error "User not found"
- [ ] Test with wrong password - expect error "Incorrect password"
- [ ] Test with empty email field
- [ ] Test with empty password field
- [ ] Test "Forgot Password?" link navigation
- [ ] Test "Sign Up" link navigation
- [ ] Test form fields disabled during loading
- [ ] Test network error handling
- [ ] Test too many failed attempts - expect "Too many attempts. Please try again later"

### 1.3 Forgot Password Screen

#### Happy Path
- [ ] Navigate from Sign In screen
- [ ] Enter registered email address
- [ ] Click "Send Reset Link" button
- [ ] Verify loading state shows ("Sending...")
- [ ] Verify success alert "Email Sent"
- [ ] Verify alert message "Password reset instructions have been sent to your email"
- [ ] Verify navigation back to Sign In after clicking OK
- [ ] Check email inbox for reset email (Firebase)

#### Edge Cases & Validations
- [ ] Test with invalid email format - expect error
- [ ] Test with unregistered email - verify still shows success (security)
- [ ] Test "Back to Sign In" button navigation
- [ ] Test network error handling
- [ ] Test form disabled during loading

### 1.4 Authentication State Persistence
- [ ] Sign in and close app completely
- [ ] Reopen app - verify user remains signed in
- [ ] Verify automatic navigation to Main app
- [ ] Sign out and close app
- [ ] Reopen app - verify user sees Sign In screen

---

## 2. LOCATION SERVICES

### 2.1 Location Permissions

#### First Launch - Permission Request
- [ ] Launch app for first time (after sign in)
- [ ] Navigate to Map tab
- [ ] Verify location permission dialog appears
- [ ] Grant permission
- [ ] Verify permission granted and location tracking starts
- [ ] Verify current location displayed on map

#### Permission Denial
- [ ] Deny location permission
- [ ] Verify alert "Location Permission Required"
- [ ] Verify alert message about app functionality
- [ ] Navigate to device settings
- [ ] Grant permission manually
- [ ] Return to app
- [ ] Verify location now works

#### Background Location (if implemented)
- [ ] Test background location permission request (Android 10+)
- [ ] Test "Allow all the time" vs "Allow only while using app"
- [ ] Verify appropriate handling

### 2.2 Location Tracking

#### Active Tracking
- [ ] Start location tracking on Map screen
- [ ] Verify "Getting your location..." loading screen
- [ ] Verify user marker appears on map
- [ ] Verify map centers on user location
- [ ] Move device/change emulator location
- [ ] Verify marker updates (within 10 seconds - foreground interval)
- [ ] Verify map follows movement

#### Location Accuracy
- [ ] Verify location accuracy displayed
- [ ] Test in different GPS conditions (good/poor signal)
- [ ] Verify high accuracy mode enabled

#### App State Changes
- [ ] With tracking active, minimize app (background)
- [ ] Wait 1 minute
- [ ] Bring app to foreground
- [ ] Verify location refreshes automatically
- [ ] Verify no crashes or errors

#### Location Errors
- [ ] Disable location services on device
- [ ] Verify error message displayed
- [ ] Re-enable location services
- [ ] Verify automatic recovery
- [ ] Test in airplane mode
- [ ] Verify appropriate error handling

### 2.3 Location Context
- [ ] Verify currentLocation state updates
- [ ] Verify locationPermission state accurate
- [ ] Verify isTracking state accurate
- [ ] Test startTracking() method
- [ ] Test stopTracking() method
- [ ] Test refreshLocation() method
- [ ] Verify locationError displayed when appropriate

### 2.4 Background Location Tracking ✨ NEW

#### Service Initialization
- [ ] Sign in to app
- [ ] Verify background location service starts automatically
- [ ] Check device location settings (Allow all the time)
- [ ] Verify foreground service notification (Android)
- [ ] Verify background permission granted

#### Background Updates
- [ ] Send app to background
- [ ] Wait 15 minutes
- [ ] Open Firestore console
- [ ] Verify location document updated with timestamp
- [ ] Verify accuracy and coordinates recorded
- [ ] Verify isActive flag is true

#### Proximity Detection in Background
- [ ] Have two users in same group
- [ ] Both grant background location permission
- [ ] Send both apps to background
- [ ] Move User A within User B's proximity radius
- [ ] Wait up to 15 minutes
- [ ] Verify proximity alert triggered
- [ ] Verify notification received on both devices

#### Background Service Lifecycle
- [ ] Sign in - verify service starts
- [ ] Sign out - verify service stops
- [ ] Force kill app - verify service restarts (Android)
- [ ] Airplane mode - verify service handles gracefully
- [ ] Battery saver mode - verify service continues (may be throttled)

#### Battery Optimization
- [ ] Monitor battery usage over 1 hour
- [ ] Verify reasonable battery consumption (<5% per hour)
- [ ] Test with screen off
- [ ] Test with device locked

---

## 3. MAP SCREEN

### 3.1 Map Display

#### Initial Load
- [ ] Navigate to Map tab
- [ ] Verify Google Maps loads correctly
- [ ] Verify map centered on user location
- [ ] Verify appropriate zoom level (MAP_DEFAULTS)
- [ ] Verify user marker visible
- [ ] Verify marker labeled "You"
- [ ] Verify marker color matches theme primary color

#### Map Interactions
- [ ] Pan map by dragging
- [ ] Zoom in using pinch gesture
- [ ] Zoom out using pinch gesture
- [ ] Double tap to zoom in
- [ ] Rotate map (if enabled)
- [ ] Verify smooth animations
- [ ] Tap "My Location" button (Google Maps built-in)
- [ ] Verify map re-centers on user

#### Map Controls
- [ ] Test GPS crosshairs FAB (floating action button)
- [ ] Verify FAB positioned correctly (right side, above bottom sheet)
- [ ] Click FAB - verify map centers on user location
- [ ] Verify FAB visible and accessible

### 3.2 Bottom Sheet

#### Display
- [ ] Verify bottom sheet visible at bottom of screen
- [ ] Verify title "Nearby Members"
- [ ] Verify subtitle "No group members nearby at the moment" (when empty)
- [ ] Verify bottom sheet rounded corners
- [ ] Verify proper shadow/elevation

#### Interactions (if swipeable - not in current code)
- [ ] Test if bottom sheet is draggable
- [ ] Test expanded/collapsed states

### 3.3 Nearby Members Display
Note: This feature appears to be placeholder - test when implemented
- [ ] Join a group with other members
- [ ] Have another user broadcast location in same group
- [ ] Verify their marker appears on map
- [ ] Verify marker shows correct position
- [ ] Verify marker labeled with user name
- [ ] Verify distance calculated correctly
- [ ] Verify bottom sheet shows user list

---

## 4. GROUPS MANAGEMENT

### 4.1 Groups List Screen

#### Empty State
- [ ] Navigate to Groups tab (new user)
- [ ] Verify empty state icon (account-group-outline)
- [ ] Verify title "No Groups Yet"
- [ ] Verify subtitle message about creating/joining groups
- [ ] Verify "Create Your First Group" button visible
- [ ] Click button - verify navigation to Create Group screen

#### With Groups (when implemented)
- [ ] Verify groups displayed in list
- [ ] Verify group names visible
- [ ] Verify group member counts
- [ ] Test pull-to-refresh gesture
- [ ] Verify refresh indicator shows
- [ ] Verify list updates after refresh

#### FAB (Floating Action Button)
- [ ] Verify + FAB visible in bottom right
- [ ] Click FAB - verify navigation to Create Group screen
- [ ] Verify FAB elevation/shadow
- [ ] Verify FAB doesn't overlap content

### 4.2 Create Group Screen

#### Navigation
- [ ] Navigate from Groups List (FAB or empty state button)
- [ ] Verify screen title "Create Group"
- [ ] Verify back button navigates to Groups List

#### Happy Path
- [ ] Enter group name (3-50 characters)
- [ ] Enter optional description (up to 500 characters)
- [ ] Click "Create Group" button
- [ ] Verify alert "Coming Soon" (current implementation)
- [ ] Verify alert message "Group creation will be implemented soon"

#### Validations
- [ ] Test with group name less than 3 characters
- [ ] Verify error "Group name must be at least 3 characters"
- [ ] Test with empty group name
- [ ] Test with group name exactly 3 characters
- [ ] Test with group name exactly 50 characters
- [ ] Test with group name over 50 characters (verify maxLength)
- [ ] Test description over 500 characters (verify maxLength)
- [ ] Test with special characters in name
- [ ] Test form during loading state

#### UI Elements
- [ ] Verify "Group Name" label
- [ ] Verify "Description (Optional)" label
- [ ] Verify input field styling
- [ ] Verify placeholder text
- [ ] Verify text input truncation
- [ ] Test keyboard behavior (dismiss on scroll)
- [ ] Test multiline description input

### 4.3 Group Detail Screen

#### Navigation
- [ ] Click on a group from Groups List (when implemented)
- [ ] Verify navigation with groupId parameter
- [ ] Verify screen title "Group Details"

#### Display
- [ ] Verify groupId displayed (placeholder implementation)
- [ ] Verify back button returns to Groups List

Note: Full implementation pending

---

## 5. NOTIFICATIONS SCREEN

### 5.1 Screen Display

#### Empty State
- [ ] Navigate to Notifications/Alerts tab
- [ ] Verify header "Proximity Alerts"
- [ ] Verify empty state icon (bell-outline)
- [ ] Verify title "No Alerts Yet"
- [ ] Verify subtitle "You'll be notified when group members are nearby"
- [ ] Verify proper styling and centering

#### With Notifications (when implemented)
- [ ] Verify notification list displays
- [ ] Verify notification items show user info
- [ ] Verify notification items show distance
- [ ] Verify notification items show timestamp
- [ ] Verify notification items show group name
- [ ] Test notification item tap interaction

### 5.2 Push Notifications ✨ ENHANCED

#### FCM Setup & Initialization
- [ ] Install app fresh
- [ ] Grant notification permission
- [ ] Verify FCM token generated (check logs)
- [ ] Verify token stored in Firestore user profile
- [ ] Verify Notifee channels created (Android)

#### Foreground Notifications
- [ ] With app open and active
- [ ] Trigger proximity alert from another user
- [ ] Verify notification appears at top of screen
- [ ] Verify correct icon displayed
- [ ] Verify notification title and message accurate
- [ ] Verify notification sound plays (if enabled in settings)
- [ ] Verify haptic feedback occurs
- [ ] Tap notification - verify navigation to map

#### Background Notifications
- [ ] Send app to background (home button)
- [ ] Trigger proximity alert
- [ ] Verify notification appears in system tray
- [ ] Verify notification badge on app icon
- [ ] Verify sound plays based on alert style setting
- [ ] Verify vibration based on alert style setting
- [ ] Tap notification - verify app opens to map

#### Notifications When App Closed
- [ ] Force close app completely
- [ ] Trigger proximity alert from another device
- [ ] Verify notification appears
- [ ] Verify notification persists in notification drawer
- [ ] Tap notification - verify app launches to map screen
- [ ] Verify notification data payload received

#### Notification Channels (Android)
- [ ] Long-press notification
- [ ] Tap settings/configure
- [ ] Verify "Proximity Alerts" channel exists
- [ ] Verify "Background Service" channel exists
- [ ] Verify "Meet Requests" channel exists
- [ ] Test changing channel settings
- [ ] Verify app respects channel settings

#### Notification Types
- [ ] Test proximity alert notification
- [ ] Test meet request received notification
- [ ] Test meet request accepted notification
- [ ] Test meet request declined notification
- [ ] Verify each has appropriate icon
- [ ] Verify each has appropriate action buttons (if applicable)

#### Quiet Hours Feature
- [ ] Go to Settings screen
- [ ] Enable quiet hours (e.g., 10 PM - 7 AM)
- [ ] Save settings
- [ ] Trigger alert during quiet hours
- [ ] Verify notification suppressed or silent
- [ ] Trigger alert outside quiet hours
- [ ] Verify normal notification behavior

#### Alert Style Settings
- [ ] Set alert style to "Silent"
- [ ] Trigger notification - verify no sound/vibration
- [ ] Set alert style to "Vibration"
- [ ] Trigger notification - verify vibration only
- [ ] Set alert style to "Sound"
- [ ] Trigger notification - verify sound only
- [ ] Set alert style to "Both"
- [ ] Trigger notification - verify sound + vibration

---

## 6. PROFILE SCREEN

### 6.1 Profile Display

#### User Information
- [ ] Navigate to Profile tab
- [ ] Verify avatar placeholder displayed
- [ ] Verify user display name shown
- [ ] Verify user email shown
- [ ] Verify avatar icon centered
- [ ] Verify proper styling and spacing

### 6.2 Settings Section

#### Theme Toggle
- [ ] Verify "Theme" setting visible
- [ ] Verify current theme mode displayed (Light/Dark/Auto)
- [ ] Click theme setting
- [ ] Verify cycles through: Light → Dark → Auto → Light
- [ ] Verify app theme changes immediately
- [ ] Close and reopen app - verify theme persisted
- [ ] Test "Auto" mode with device theme changes
- [ ] Verify all screens update with theme change

#### Proximity Radius Setting
- [ ] Verify "Proximity Radius" setting visible
- [ ] Verify current value "100m" displayed
- [ ] Click setting (placeholder)
- [ ] Verify future implementation for radius adjustment

#### Notifications Setting
- [ ] Verify "Notifications" setting visible
- [ ] Verify chevron icon indicating navigation
- [ ] Click setting (placeholder)
- [ ] Verify future navigation to notification preferences

#### Privacy Setting
- [ ] Verify "Privacy" setting visible
- [ ] Verify chevron icon indicating navigation
- [ ] Click setting (placeholder)
- [ ] Verify future navigation to privacy settings

### 6.3 Settings Screen ✨ NEW

#### Navigation
- [ ] Navigate to Profile tab
- [ ] Verify "Settings" option visible
- [ ] Tap Settings
- [ ] Verify navigation to Settings screen
- [ ] Verify back button returns to Profile

#### Alert Style Setting
- [ ] Verify "Alert Style" section visible
- [ ] Verify current selection highlighted
- [ ] Tap "Silent" option
- [ ] Verify selection updates with animation
- [ ] Verify haptic feedback on selection
- [ ] Tap "Vibration" option
- [ ] Verify selection updates
- [ ] Tap "Sound" option
- [ ] Verify selection updates
- [ ] Tap "Both" option
- [ ] Verify selection updates

#### Proximity Radius Slider
- [ ] Verify "Proximity Radius" section visible
- [ ] Verify current value displayed (e.g., "100 m")
- [ ] Drag slider to minimum (50m)
- [ ] Verify value updates in real-time
- [ ] Drag slider to maximum (500m)
- [ ] Verify value updates
- [ ] Set to intermediate value (250m)
- [ ] Verify smooth slider animation
- [ ] Verify haptic feedback on drag

#### Quiet Hours Configuration
- [ ] Verify "Quiet Hours" section visible
- [ ] Toggle "Enable Quiet Hours" switch
- [ ] Verify switch animates smoothly
- [ ] Verify haptic feedback on toggle
- [ ] Tap "Start Time" (e.g., 10:00 PM)
- [ ] Verify time picker modal appears
- [ ] Select different time
- [ ] Verify time updates in UI
- [ ] Tap "End Time" (e.g., 7:00 AM)
- [ ] Verify time picker modal appears
- [ ] Select different time
- [ ] Verify time updates in UI
- [ ] Disable quiet hours
- [ ] Verify time pickers become disabled

#### Notification Preferences
- [ ] Verify "Notification Preferences" section
- [ ] Toggle "Proximity Alerts" switch
- [ ] Verify toggle works with animation
- [ ] Verify haptic feedback
- [ ] Toggle "Meet Requests" switch
- [ ] Verify toggle works
- [ ] Toggle "Group Updates" switch
- [ ] Verify toggle works
- [ ] Toggle "System Notifications" switch
- [ ] Verify toggle works

#### Saving Settings
- [ ] Make multiple changes to settings
- [ ] Tap "Save Settings" button
- [ ] Verify loading state shows on button
- [ ] Verify success toast appears: "Settings saved successfully"
- [ ] Navigate back to Profile
- [ ] Return to Settings
- [ ] Verify all settings persisted correctly
- [ ] Close app completely
- [ ] Reopen app and check Settings
- [ ] Verify settings still persisted

#### Settings Validation
- [ ] Try to enable quiet hours with end time before start time
- [ ] Verify validation message or auto-correction
- [ ] Set proximity radius to minimum and maximum
- [ ] Verify values stay within bounds
- [ ] Test rapid toggling of switches
- [ ] Verify UI remains stable

#### Firestore Persistence
- [ ] Change settings and save
- [ ] Open Firestore console
- [ ] Navigate to users/{userId}
- [ ] Verify settings object updated
- [ ] Verify alertStyle, proximityRadius, quietHours saved
- [ ] Verify notificationPreferences object updated

### 6.4 Sign Out

#### Happy Path
- [ ] Click "Sign Out" button
- [ ] Verify confirmation alert appears
- [ ] Verify alert title "Sign Out"
- [ ] Verify alert message "Are you sure you want to sign out?"
- [ ] Verify "Cancel" button
- [ ] Verify "Sign Out" button (destructive style)
- [ ] Click "Cancel" - verify alert dismisses, no sign out
- [ ] Click "Sign Out" again
- [ ] Click "Sign Out" in alert
- [ ] Verify successful sign out
- [ ] Verify navigation to Sign In screen
- [ ] Verify cannot navigate back to authenticated screens
- [ ] Verify user data cleared from context

#### Error Handling
- [ ] Simulate sign out error
- [ ] Verify error alert displayed
- [ ] Verify error message shown

---

## 7. MEET-UP REQUEST FUNCTIONALITY ✨ NEW

### 7.1 Send Meet Request

#### UI Elements
- [ ] Navigate to Map screen
- [ ] See nearby member marker
- [ ] Tap member marker
- [ ] Verify marker callout appears
- [ ] Verify "Meet Up" button visible in callout
- [ ] Verify distance displayed accurately
- [ ] Tap "Meet Up" button
- [ ] Verify MeetRequestModal opens

#### Modal Display (Send Mode)
- [ ] Verify modal title "Send Meet Request"
- [ ] Verify recipient name displayed
- [ ] Verify distance displayed (e.g., "150m away")
- [ ] Verify distance icon visible
- [ ] Verify optional message input field
- [ ] Verify placeholder text "Add a message (optional)"
- [ ] Verify "Cancel" button
- [ ] Verify "Send Request" button
- [ ] Verify close (X) button

#### Sending Request
- [ ] Enter optional message (up to 200 chars)
- [ ] Tap "Send Request" button
- [ ] Verify loading indicator shows
- [ ] Verify button disabled during loading
- [ ] Verify success - modal closes
- [ ] Verify success toast notification
- [ ] Verify request appears in sent requests list
- [ ] Verify can't send duplicate request to same user

#### Message Input
- [ ] Test with no message - verify sends successfully
- [ ] Test with short message (10 chars)
- [ ] Test with maximum length (200 chars)
- [ ] Verify character counter (if implemented)
- [ ] Test with special characters
- [ ] Test with emoji
- [ ] Test multiline message
- [ ] Tap outside modal - verify closes

### 7.2 Receive Meet Request

#### Notification
- [ ] Have another user send you a meet request
- [ ] Verify notification received immediately
- [ ] Verify notification shows sender name
- [ ] Verify notification shows distance
- [ ] Tap notification - verify modal opens

#### Modal Display (View Mode)
- [ ] Verify modal title "Meet Request"
- [ ] Verify sender name displayed prominently
- [ ] Verify message displayed (if included)
- [ ] Verify message icon and styling
- [ ] Verify distance displayed
- [ ] Verify "Decline" button (outlined, red)
- [ ] Verify "Accept" button (filled, green)
- [ ] Verify close (X) button

#### Accepting Request
- [ ] Tap "Accept" button
- [ ] Verify loading indicator shows
- [ ] Verify button disabled during loading
- [ ] Verify success - modal closes
- [ ] Verify success toast: "Meet request accepted"
- [ ] Verify request status updated to "accepted"
- [ ] Verify sender receives notification
- [ ] Verify request removed from pending list

#### Declining Request
- [ ] Receive new meet request
- [ ] Open request modal
- [ ] Tap "Decline" button
- [ ] Verify loading indicator shows
- [ ] Verify modal closes
- [ ] Verify toast: "Meet request declined"
- [ ] Verify request status updated to "declined"
- [ ] Verify sender receives notification
- [ ] Verify request removed from pending list

### 7.3 Meet Request Management

#### Sent Requests List
- [ ] Navigate to sent requests (if accessible)
- [ ] Verify list of sent requests
- [ ] Verify each shows:
  - Recipient name
  - Status (pending/accepted/declined)
  - Timestamp
  - Distance (if available)
- [ ] Test canceling pending request
- [ ] Verify request removed from list

#### Received Requests List
- [ ] Navigate to received requests
- [ ] Verify list of received requests
- [ ] Verify pending requests highlighted
- [ ] Verify badge count on tab (if applicable)
- [ ] Test viewing request details
- [ ] Test accepting from list
- [ ] Test declining from list
- [ ] Verify list updates in real-time

#### Real-time Updates
- [ ] Have two devices logged in (User A, User B)
- [ ] User A sends request to User B
- [ ] Verify User A sees "pending" status immediately
- [ ] Verify User B receives notification immediately
- [ ] User B accepts request
- [ ] Verify User A sees "accepted" status update in real-time
- [ ] Verify no page refresh needed

#### Request Expiration
- [ ] Send meet request
- [ ] Wait 2 hours
- [ ] Verify request status changes to "expired"
- [ ] Verify expired requests auto-removed
- [ ] Test cleanup function manually (if available)

#### Edge Cases
- [ ] Try sending request to offline user
- [ ] Try sending request to user not in group
- [ ] Test with poor network connection
- [ ] Test rapid send/cancel actions
- [ ] Test receiving multiple requests simultaneously
- [ ] Verify proper error handling

### 7.4 Meet Request Notifications

#### Push Notifications
- [ ] Close app completely
- [ ] Have another user send meet request
- [ ] Verify FCM notification received
- [ ] Verify notification title accurate
- [ ] Verify notification body includes sender name
- [ ] Tap notification - verify app opens to request

#### In-App Notifications
- [ ] With app open
- [ ] Receive meet request
- [ ] Verify toast/banner notification appears
- [ ] Verify notification auto-dismisses
- [ ] Verify can dismiss manually

#### Notification Sounds
- [ ] Ensure alert style set to "Sound" or "Both"
- [ ] Receive meet request
- [ ] Verify custom sound plays
- [ ] Verify sound different from proximity alerts
- [ ] Test with alert style "Silent"
- [ ] Verify no sound plays

---

## 8. MAP ENHANCEMENTS ✨ NEW

### 8.1 ETA Calculation

#### Display
- [ ] Navigate to Map screen
- [ ] See nearby member marker
- [ ] Tap marker to open callout
- [ ] Verify ETA displayed (e.g., "5 min")
- [ ] Verify ETA format appropriate:
  - "< 1 min" for very close
  - "15 min" for medium distance
  - "1h 30m" for long distance

#### Accuracy
- [ ] Compare ETA with actual distance
- [ ] Verify walking speed assumption reasonable (5 km/h)
- [ ] Move marker position
- [ ] Verify ETA updates accordingly
- [ ] Test with various distances:
  - Very close (<100m)
  - Medium (100m-1km)
  - Far (>1km)

#### Speed Descriptions (if implemented)
- [ ] Verify speed description shown
- [ ] Test: "Normal walk" for 5 km/h
- [ ] Test: "Brisk walk" for 7 km/h
- [ ] Test: "Jogging" for 10 km/h

### 8.2 Polyline Paths

#### Display
- [ ] Navigate to Map screen
- [ ] Have nearby member visible
- [ ] Verify polyline drawn from your location to member
- [ ] Verify polyline color appropriate
- [ ] Verify polyline stroke width readable
- [ ] Verify polyline doesn't obscure markers

#### Multiple Members
- [ ] Have multiple nearby members
- [ ] Verify polyline to each member
- [ ] Verify different colors or styling (if implemented)
- [ ] Verify performance with 5+ polylines
- [ ] Verify polylines don't overlap confusingly

#### Real-time Updates
- [ ] Have member move
- [ ] Verify polyline updates smoothly
- [ ] Verify smooth animation
- [ ] Move your own location
- [ ] Verify all polylines update

#### Toggle Polylines (if implemented)
- [ ] Find polyline toggle button
- [ ] Tap to hide polylines
- [ ] Verify all polylines hidden
- [ ] Tap to show polylines
- [ ] Verify all polylines appear

### 8.3 Direction Indicators

#### Bearing Calculation
- [ ] View nearby member on map
- [ ] Verify direction arrow or indicator
- [ ] Verify arrow points toward member
- [ ] Verify bearing accurate (compass direction)
- [ ] Move member position
- [ ] Verify arrow rotates accordingly

#### Direction Labels
- [ ] Verify direction description shown (e.g., "North", "Southeast")
- [ ] Test with member in each cardinal direction
- [ ] Verify labels accurate
- [ ] Test with member moving
- [ ] Verify label updates

#### Visual Design
- [ ] Verify arrow icon visible and clear
- [ ] Verify arrow color contrasts with map
- [ ] Verify arrow size appropriate
- [ ] Test in light and dark mode
- [ ] Verify arrow visible in both themes

### 8.4 Last Seen Timestamps

#### Display
- [ ] View map with offline members
- [ ] Verify "Last seen" timestamp shown
- [ ] Verify format: "Just now", "5m ago", "2h ago", "3d ago"
- [ ] Verify timestamp updates periodically
- [ ] Verify online members don't show timestamp

#### Stale Location Indicator
- [ ] Have member go offline
- [ ] Wait 15+ minutes
- [ ] Verify member marker styled differently (greyed out)
- [ ] Verify tooltip shows "Last seen 20m ago"
- [ ] Verify polyline to stale member removed (optional)

#### Real-time Updates
- [ ] Member goes offline
- [ ] Verify timestamp starts counting
- [ ] Wait 1 minute
- [ ] Verify timestamp updates to "1m ago"
- [ ] Member comes back online
- [ ] Verify "Last seen" removed, marker active

### 8.5 Distance-Based Marker Styling

#### Marker Colors
- [ ] Verify very close members (<50m) have distinct color/icon
- [ ] Verify medium distance (50-200m) different style
- [ ] Verify far members (>200m) different style
- [ ] Verify color scheme intuitive (e.g., green=close, yellow=medium, red=far)

#### Marker Sizes
- [ ] Verify closer members have larger markers
- [ ] Verify far members have smaller markers
- [ ] Verify your own marker always largest/distinct
- [ ] Verify marker sizes don't obscure each other

#### Marker Animations
- [ ] Member enters proximity
- [ ] Verify marker pulse/bounce animation
- [ ] Verify animation smooth, not distracting
- [ ] Member exits proximity
- [ ] Verify marker animates back to normal

### 8.6 Movement Detection

#### Speed Calculation
- [ ] Start moving (or simulate location changes)
- [ ] Verify speed calculated accurately
- [ ] Verify speed displayed (if shown)
- [ ] Verify speed in appropriate units (km/h or mph)
- [ ] Stop moving
- [ ] Verify speed drops to 0

#### Movement Indicators
- [ ] While moving, verify movement icon/indicator shown
- [ ] Verify indicator shows you're in motion
- [ ] Verify direction of movement indicated
- [ ] Stop moving
- [ ] Verify indicator disappears or changes

#### Map Following
- [ ] Enable "follow mode" (if available)
- [ ] Start moving
- [ ] Verify map centers on your location automatically
- [ ] Verify map rotates based on heading (if implemented)
- [ ] Stop moving
- [ ] Verify map stops auto-centering

---

## 9. SOUND & HAPTIC ALERTS ✨ NEW

### 9.1 Distance-Based Sound Selection

#### Sound Files
- [ ] Verify sound files loaded correctly
- [ ] Check logs for sound loading errors
- [ ] Verify sounds exist in assets folder:
  - warning.mp3 (for <20m)
  - alert.mp3 (for 20-50m)
  - notification.mp3 (for >50m)

#### Close Proximity (<20m)
- [ ] Move within 20m of another member
- [ ] Verify "warning" sound plays
- [ ] Verify sound appropriate (urgent/attention-grabbing)
- [ ] Verify sound plays only once (not repeating)
- [ ] Move away
- [ ] Verify sound stops

#### Medium Proximity (20-50m)
- [ ] Be 20-50m from member
- [ ] Trigger proximity alert
- [ ] Verify "alert" sound plays
- [ ] Verify sound less urgent than warning
- [ ] Verify sound volume appropriate

#### Far Proximity (>50m)
- [ ] Be >50m from member
- [ ] Trigger proximity alert
- [ ] Verify "notification" sound plays
- [ ] Verify sound gentle/subtle
- [ ] Verify sound distinguishable from other notifications

#### Sound Settings Integration
- [ ] Go to Settings
- [ ] Set alert style to "Silent"
- [ ] Trigger proximity alert
- [ ] Verify no sound plays
- [ ] Set alert style to "Sound"
- [ ] Trigger alert
- [ ] Verify sound plays
- [ ] Set alert style to "Both"
- [ ] Verify sound + vibration

#### Platform Differences
- [ ] Test sounds on Android
- [ ] Verify sounds play correctly
- [ ] Test sounds on iOS
- [ ] Verify sounds play correctly
- [ ] Verify volume respects device settings

### 9.2 Haptic Feedback

#### General Interactions
- [ ] Tap any button
- [ ] Verify light haptic feedback
- [ ] Tap toggle switch
- [ ] Verify medium haptic feedback
- [ ] Complete important action (save settings)
- [ ] Verify heavy haptic feedback

#### Success Feedback
- [ ] Complete successful action (e.g., save settings)
- [ ] Verify success haptic pattern
- [ ] Verify pattern distinct from error

#### Error Feedback
- [ ] Trigger validation error
- [ ] Verify error haptic pattern
- [ ] Verify pattern feels negative/alerting
- [ ] Verify different from success pattern

#### Selection Feedback
- [ ] Use slider (proximity radius)
- [ ] Verify haptic feedback on drag
- [ ] Use picker/selector
- [ ] Verify haptic on selection change

#### Haptic Settings
- [ ] Test on device with haptics disabled
- [ ] Verify app handles gracefully
- [ ] Enable haptics on device
- [ ] Verify all haptics work

#### Platform Differences
- [ ] Test on Android device
- [ ] Verify vibration patterns work
- [ ] Test on iPhone
- [ ] Verify taptic engine patterns work
- [ ] Verify feedback feels natural on both platforms

---

## 10. NAVIGATION & ROUTING

### 7.1 Bottom Tab Navigation

#### Tab Bar
- [ ] Verify tab bar visible at bottom
- [ ] Verify 4 tabs: Map, Groups, Alerts, Profile
- [ ] Verify tab icons correct
- [ ] Verify tab labels correct
- [ ] Verify active tab highlighted (primary color)
- [ ] Verify inactive tabs grayed (textSecondary color)

#### Tab Switching
- [ ] Click Map tab - verify MapScreen displays
- [ ] Click Groups tab - verify GroupsListScreen displays
- [ ] Click Alerts tab - verify NotificationsScreen displays
- [ ] Click Profile tab - verify ProfileScreen displays
- [ ] Switch between tabs rapidly - verify smooth transitions
- [ ] Verify tab state preserved when switching
- [ ] Verify proper screen headers per tab

### 7.2 Stack Navigation

#### Auth Stack
- [ ] Verify SignIn → SignUp navigation
- [ ] Verify SignUp → SignIn navigation
- [ ] Verify SignIn → ForgotPassword navigation
- [ ] Verify ForgotPassword → SignIn navigation
- [ ] Test back button behavior on each screen
- [ ] Test Android hardware back button

#### Groups Stack
- [ ] Verify GroupsList → CreateGroup navigation
- [ ] Verify CreateGroup back button → GroupsList
- [ ] Verify GroupsList → GroupDetail navigation (when implemented)
- [ ] Test nested navigation flows

#### Map Stack
- [ ] Verify MapView displays (main screen)
- [ ] Test future navigation to member profiles

### 7.3 Deep Linking (if implemented)
- [ ] Test opening app from notification
- [ ] Verify navigation to correct screen
- [ ] Test with app closed
- [ ] Test with app in background

---

## 8. THEME & UI

### 8.1 Light Mode

#### Visual Verification
- [ ] Set theme to Light mode
- [ ] Verify background color light
- [ ] Verify text readable (dark on light)
- [ ] Verify proper contrast ratios
- [ ] Verify button colors appropriate
- [ ] Verify input field styling
- [ ] Verify card/surface colors
- [ ] Verify icons visible
- [ ] Verify status bar style

#### Consistency
- [ ] Check all screens use theme colors
- [ ] Verify no hardcoded colors visible
- [ ] Verify shadows/elevations appropriate

### 8.2 Dark Mode

#### Visual Verification
- [ ] Set theme to Dark mode
- [ ] Verify background color dark
- [ ] Verify text readable (light on dark)
- [ ] Verify proper contrast ratios
- [ ] Verify button colors appropriate
- [ ] Verify input field styling (darker)
- [ ] Verify card/surface colors darker
- [ ] Verify icons visible in dark mode
- [ ] Verify status bar style (light content)

#### Consistency
- [ ] Check all screens use dark theme
- [ ] Verify map tiles appropriate for dark mode
- [ ] Verify no glaring white backgrounds

### 8.3 Auto Mode
- [ ] Set theme to Auto
- [ ] Change device theme to Light
- [ ] Verify app switches to Light mode
- [ ] Change device theme to Dark
- [ ] Verify app switches to Dark mode
- [ ] Verify smooth transition

### 8.4 Typography & Spacing
- [ ] Verify font sizes consistent across app
- [ ] Verify line heights appropriate
- [ ] Verify spacing consistent (margins, padding)
- [ ] Verify button sizes touchable (min 44px)
- [ ] Test on different screen sizes
- [ ] Test on tablets (if supported)

---

## 9. DATA PERSISTENCE & STATE MANAGEMENT

### 9.1 AsyncStorage

#### Theme Persistence
- [ ] Change theme to Dark
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify Dark theme restored

#### User Profile Persistence
- [ ] Sign in
- [ ] Update profile (when feature available)
- [ ] Close app
- [ ] Reopen app
- [ ] Verify profile data persisted

### 9.2 Context Providers

#### AuthContext
- [ ] Sign in - verify user state populated
- [ ] Verify userProfile state populated
- [ ] Verify loading states work correctly
- [ ] Sign out - verify user state cleared
- [ ] Test updateProfile method (when available)

#### LocationContext
- [ ] Grant permission - verify locationPermission true
- [ ] Start tracking - verify currentLocation populated
- [ ] Verify isTracking state accurate
- [ ] Stop tracking - verify isTracking false
- [ ] Verify locationError shows when appropriate
- [ ] Test refreshLocation method

#### ThemeContext
- [ ] Change theme - verify theme object updates
- [ ] Verify themeMode state accurate
- [ ] Verify isDark boolean correct
- [ ] Verify all consumers re-render

---

## 10. FORM VALIDATIONS & INPUT HANDLING

### 10.1 Email Validation
- [ ] Test valid emails: user@example.com, test.user@domain.co.uk
- [ ] Test invalid: no@domain, @domain.com, user@, user
- [ ] Test with spaces: expect failure
- [ ] Test extremely long emails

### 10.2 Password Validation
- [ ] Test valid: "Password123"
- [ ] Test missing uppercase: "password123" - expect error
- [ ] Test missing lowercase: "PASSWORD123" - expect error
- [ ] Test missing number: "Password" - expect error
- [ ] Test too short: "Pass1" - expect error
- [ ] Test with special characters: "Pass@123" - expect success
- [ ] Test very long password (100+ chars)

### 10.3 Display Name Validation
- [ ] Test 2 characters (minimum): "AB"
- [ ] Test 50 characters (maximum)
- [ ] Test 1 character - expect error
- [ ] Test 51 characters - expect error
- [ ] Test with special characters
- [ ] Test with numbers
- [ ] Test with whitespace only - expect error
- [ ] Test with leading/trailing spaces - verify trimmed

### 10.4 Input Field Behavior
- [ ] Test keyboard auto-capitalization (off for email)
- [ ] Test keyboard types (email, default, numeric)
- [ ] Test secure text entry for passwords
- [ ] Test multiline text areas
- [ ] Test maxLength enforcement
- [ ] Test placeholder text display
- [ ] Test paste functionality
- [ ] Test auto-correct behavior
- [ ] Test field focus/blur states

---

## 11. ERROR HANDLING

### 11.1 Network Errors

#### Offline Mode
- [ ] Enable airplane mode
- [ ] Attempt sign in - verify network error
- [ ] Attempt sign up - verify network error
- [ ] Attempt password reset - verify network error
- [ ] Attempt to load groups - verify error
- [ ] Verify error message: "Network error. Please check your connection"
- [ ] Re-enable network
- [ ] Retry - verify success

#### Poor Connection
- [ ] Test with slow/unstable connection
- [ ] Verify appropriate timeouts
- [ ] Verify retry mechanisms
- [ ] Verify loading indicators don't hang

### 11.2 Firebase Errors

#### Authentication Errors
- [ ] Test various Firebase auth error codes
- [ ] Verify user-friendly error messages
- [ ] Test: email-already-in-use
- [ ] Test: invalid-email
- [ ] Test: weak-password
- [ ] Test: user-not-found
- [ ] Test: wrong-password
- [ ] Test: too-many-requests
- [ ] Verify errors don't expose sensitive info

#### Firestore Errors
- [ ] Test permission denied errors
- [ ] Test document not found
- [ ] Test write failures
- [ ] Verify appropriate error messages

### 11.3 Location Errors
- [ ] Disable GPS - verify error handled
- [ ] Test location timeout (15s)
- [ ] Test location unavailable
- [ ] Verify error messages helpful

### 11.4 App Crashes & Recovery
- [ ] Force close app during operations
- [ ] Reopen - verify graceful recovery
- [ ] Test with low memory conditions
- [ ] Test rapid screen transitions
- [ ] Test rapid button taps

---

## 12. PERFORMANCE & OPTIMIZATION

### 12.1 Loading States
- [ ] Verify loading indicators on all async operations
- [ ] Verify loading doesn't block UI unnecessarily
- [ ] Verify smooth animations during loading
- [ ] Test cancellation of pending requests

### 12.2 List Performance
- [ ] Test groups list with many items (when implemented)
- [ ] Test notifications list with many items
- [ ] Verify smooth scrolling
- [ ] Verify list virtualization (FlatList)

### 12.3 Map Performance
- [ ] Test map with many markers (when implemented)
- [ ] Verify smooth panning/zooming
- [ ] Verify marker clustering (if implemented)
- [ ] Test on lower-end devices

### 12.4 Memory Management
- [ ] Monitor memory usage during extended use
- [ ] Verify no memory leaks
- [ ] Test app after many screen transitions
- [ ] Verify location tracking stops when appropriate

---

## 13. SECURITY & PRIVACY

### 13.1 Authentication Security
- [ ] Verify passwords not visible in logs
- [ ] Verify secure password storage (Firebase handles)
- [ ] Verify session management
- [ ] Test unauthorized access attempts
- [ ] Verify token refresh

### 13.2 Location Privacy
- [ ] Verify location only shared when user opts in
- [ ] Verify location stops when app backgrounded (if configured)
- [ ] Test privacy settings (when implemented)
- [ ] Verify group-level visibility settings

### 13.3 Data Privacy
- [ ] Verify users only see authorized data
- [ ] Verify Firestore security rules (backend)
- [ ] Test viewing other users' private data - expect denial

---

## 14. PLATFORM-SPECIFIC TESTING

### 14.1 Android-Specific

#### UI/UX
- [ ] Test back button behavior on all screens
- [ ] Test status bar color/style
- [ ] Test navigation bar color
- [ ] Test different Android versions (API 21+)
- [ ] Test on different screen sizes
- [ ] Test on tablets

#### Permissions
- [ ] Test location permission flow
- [ ] Test background location permission (Android 10+)
- [ ] Test notification permission (Android 13+)
- [ ] Verify permission rationale dialogs

#### Build
- [ ] Test APK build
- [ ] Test app bundle build
- [ ] Verify google-services.json loaded
- [ ] Test signing configurations

### 14.2 iOS-Specific

#### UI/UX
- [ ] Test safe area insets (notch)
- [ ] Test on iPhone with notch
- [ ] Test on iPad
- [ ] Test different iOS versions (13+)
- [ ] Test status bar style
- [ ] Test keyboard behavior (iOS specific)

#### Permissions
- [ ] Test location permission (When In Use)
- [ ] Test location permission (Always)
- [ ] Test notification permission
- [ ] Verify permission description strings (Info.plist)

#### Build
- [ ] Test iOS build
- [ ] Verify GoogleService-Info.plist loaded
- [ ] Test code signing
- [ ] Test on physical device

---

## 15. ACCESSIBILITY

### 15.1 Screen Reader Support
- [ ] Enable TalkBack (Android) or VoiceOver (iOS)
- [ ] Navigate through app
- [ ] Verify all buttons have labels
- [ ] Verify images have alt text
- [ ] Verify form inputs labeled
- [ ] Verify focus order logical

### 15.2 Visual Accessibility
- [ ] Test with large text sizes
- [ ] Verify UI doesn't break
- [ ] Verify color contrast meets WCAG standards
- [ ] Test with color blindness simulators
- [ ] Verify touch targets min 44x44 points

### 15.3 Interaction
- [ ] Test without using gestures (accessibility tools)
- [ ] Verify all features keyboard accessible (if applicable)

---

## 16. EDGE CASES & STRESS TESTING

### 16.1 Boundary Conditions
- [ ] Test with maximum length inputs
- [ ] Test with minimum length inputs
- [ ] Test with special characters
- [ ] Test with emoji
- [ ] Test with different languages
- [ ] Test with RTL languages (if supported)

### 16.2 Rapid Actions
- [ ] Rapidly tap buttons
- [ ] Rapidly switch tabs
- [ ] Rapidly navigate screens
- [ ] Verify no duplicate requests
- [ ] Verify no crashes

### 16.3 Long Running Sessions
- [ ] Use app continuously for 30+ minutes
- [ ] Monitor battery usage
- [ ] Monitor data usage
- [ ] Verify no degradation
- [ ] Verify location tracking stable

### 16.4 Multiple Users Proximity
- [ ] Have 2+ users in same group
- [ ] Have all users broadcast location
- [ ] Move users into proximity radius
- [ ] Verify all users receive alerts
- [ ] Verify correct distance calculations
- [ ] Test with users moving in/out of range

---

## 17. FIRESTORE INTEGRATION TESTING

### 17.1 User Profile Operations
- [ ] Sign up - verify profile document created
- [ ] Verify profile fields correct in Firestore
- [ ] Update profile - verify Firestore updates
- [ ] Verify timestamps (createdAt, updatedAt)
- [ ] Sign out - verify local state cleared

### 17.2 Group Operations (when implemented)
- [ ] Create group - verify Firestore document
- [ ] Join group - verify membership document
- [ ] Leave group - verify membership deleted
- [ ] Verify member count updates

### 17.3 Location Operations (when implemented)
- [ ] Broadcast location - verify Firestore document
- [ ] Verify location updates every 10 seconds
- [ ] Stop broadcasting - verify isActive false
- [ ] Verify old locations cleaned up

### 17.4 Real-time Listeners (when implemented)
- [ ] Subscribe to nearby users
- [ ] Have another user update location
- [ ] Verify real-time update received
- [ ] Unsubscribe - verify no more updates

---

## 18. REGRESSION TESTING

After any code changes or updates:

### Quick Smoke Test (15 min)
1. [ ] Launch app
2. [ ] Sign in
3. [ ] Navigate to each tab
4. [ ] Check location permission
5. [ ] View map with location
6. [ ] Toggle theme
7. [ ] Sign out

### Full Regression (1-2 hours)
- [ ] Run all authentication tests
- [ ] Run all navigation tests
- [ ] Run all location tests
- [ ] Run all UI/theme tests
- [ ] Test critical user flows

---

## 19. CRITICAL USER FLOWS

### Flow 1: New User Onboarding
1. [ ] Install app
2. [ ] Open app
3. [ ] Click Sign Up
4. [ ] Enter details
5. [ ] Sign up successfully
6. [ ] Grant location permission
7. [ ] View map with current location
8. [ ] Navigate to Groups
9. [ ] See empty state
10. [ ] Attempt to create group

### Flow 2: Returning User
1. [ ] Open app (already signed in)
2. [ ] See map immediately
3. [ ] Location tracking active
4. [ ] Switch to Groups tab
5. [ ] View group list
6. [ ] Switch to Profile
7. [ ] Change theme
8. [ ] Theme persists

### Flow 3: Proximity Detection (when implemented)
1. [ ] User A and B in same group
2. [ ] Both broadcast location
3. [ ] Move into proximity
4. [ ] Both receive notification
5. [ ] View on map
6. [ ] See accurate distance

---

## 20. PRODUCTION READINESS CHECKLIST

### Before Release
- [ ] All critical bugs fixed
- [ ] All authentication flows working
- [ ] Location tracking stable
- [ ] Theme switching works
- [ ] No console errors
- [ ] No memory leaks
- [ ] Performance acceptable
- [ ] Works on target devices
- [ ] Firebase rules configured
- [ ] API keys secured
- [ ] Privacy policy included
- [ ] Terms of service included
- [ ] App icons configured
- [ ] Splash screen configured
- [ ] Build configurations correct
- [ ] Code signing set up
- [ ] Crash reporting configured (if available)
- [ ] Analytics configured (if applicable)

---

## TEST ENVIRONMENT MATRIX

Test on combinations of:

### Devices
- [ ] iOS 13+: iPhone 8, iPhone X, iPhone 14
- [ ] Android 8+: Samsung, Google Pixel, various manufacturers
- [ ] Tablet: iPad, Android tablet

### Conditions
- [ ] WiFi only
- [ ] Cellular data only
- [ ] Poor network signal
- [ ] Offline mode
- [ ] Low battery
- [ ] Low storage

### Settings
- [ ] Light theme
- [ ] Dark theme
- [ ] Auto theme
- [ ] Different font sizes
- [ ] Different locales

---

## BUG REPORTING TEMPLATE

When issues found:

**Severity:** Critical / High / Medium / Low

**Description:**

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**

**Actual Result:**

**Environment:**
- Device:
- OS Version:
- App Version:
- Network:

**Screenshots/Video:**

**Logs:**

---

## Notes

This comprehensive testing checklist covers all implemented features and provides a structured approach to manual testing. Update this checklist as new features are implemented (group creation, proximity detection, chat, etc.).

**Last Updated:** November 2025
