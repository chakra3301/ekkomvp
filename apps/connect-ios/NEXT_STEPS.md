# EKKO Connect iOS — Next Steps Guide

You have the Xcode project open and building. Here's everything to do from here, in order.

---

## Step 1: Set Up Code Signing

1. In Xcode, click the **EKKOConnect** project in the left sidebar (blue icon, top of file list)
2. Select the **EKKOConnect** target
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** from the dropdown (your Apple Developer account)
6. If the bundle ID `app.ekkoconnect.connect` conflicts with the existing Capacitor app:
   - Temporarily change it to `app.ekkoconnect.connect.native` for development
   - Change it back to `app.ekkoconnect.connect` when you're ready to replace the Capacitor version

---

## Step 2: First Run on Simulator

1. Select **iPhone 17 Pro** from the device picker at the top of Xcode
2. Press **Cmd+R** (or click the play button)
3. The app will build, install on the simulator, and launch
4. You should see the **Login screen** with:
   - "EKKO Connect" header
   - Sign in with Apple button (won't work on simulator)
   - Continue with Google button
   - Email + password fields
   - Sign in button
   - "Don't have an account? Sign up" link

### What to test on simulator:
- **Email login**: Use an existing account from the web app
- **Register**: Create a new account with email/password
- **Complete Profile flow**: Name + DOB → Creative/Client role selection
- **Profile Setup**: 4-step wizard (media upload, prompts, details, preview)
- **Discover**: Card stack should load profiles from your backend
- **Likes/Matches/Profile/Settings**: Navigate through all tabs

### What WON'T work on simulator:
- Apple Sign In (requires real device)
- Push notifications (requires real device + APNs)
- Camera capture (can use photo library instead)

---

## Step 3: Connect to Your Development Server

If your Connect web app runs locally at `localhost:3001`, the iOS simulator can't reach `localhost`. You need your Mac's local IP.

1. Find your Mac's IP:
   - System Settings → Wi-Fi → click your network → Details → IP Address
   - Or run in Terminal: `ipconfig getifaddr en0`
   - It'll be something like `192.168.1.100`

2. Open `EKKOConnect/App/Config.swift` in Xcode

3. Change the tRPC URL for local development:
   ```swift
   static let trpcBaseURL = "http://192.168.1.100:3001/api/trpc"
   ```

4. Make sure your Connect web app is running:
   ```bash
   cd /Users/lucaorion/ekkomvp/apps/connect
   pnpm dev
   ```

5. Rebuild and run the iOS app (Cmd+R)

6. When you're done testing locally, change it back to production:
   ```swift
   static let trpcBaseURL = "https://ekkoconnect.app/api/trpc"
   ```

---

## Step 4: Test on Your Physical iPhone

1. Plug your iPhone into your Mac via USB/USB-C
2. When prompted on the iPhone, tap **Trust** this computer
3. In Xcode's device picker, select **Luca's iPhone**
4. Press **Cmd+R**
5. First time: Go to iPhone Settings → General → VPN & Device Management → tap your developer certificate → Trust
6. The app will install and launch on your iPhone

### Test these features on device:
- **Apple Sign In**: Tap the Apple button, authenticate with Face ID
- **Push notifications**: Sign in, then use the web app (or another device) to trigger a notification:
  - Like the account's profile → should receive "Someone liked your profile"
  - Send a message to a match → should receive the message preview
- **Location**: Go to Settings → tap the location button → allow location access
- **Haptics**: Swipe cards left/right on Discover → feel the haptic feedback
- **Camera**: In Profile Setup → Media step → tap a slot to pick from camera/library

---

## Step 5: Add Your App Icon

1. Export your EKKO Connect logo as a 1024x1024 PNG (no transparency, no rounded corners — iOS adds the rounding)
2. In Xcode, expand: EKKOConnect → Resources → Assets.xcassets → AppIcon
3. Drag your 1024x1024 PNG into the empty slot
4. Xcode 15+ automatically generates all required sizes from the single image
5. Rebuild and run — the icon should appear on the home screen

If you don't have a 1024x1024 icon ready, you can use the existing logo temporarily:
```bash
# Copy and resize the web app logo (you may need to resize it to 1024x1024)
cp /Users/lucaorion/ekkomvp/apps/connect/public/logo.png /Users/lucaorion/ekkomvp/apps/connect-ios/EKKOConnect/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png
```
Then update the `Contents.json` in that folder to reference the filename.

---

## Step 6: Wire Up Remaining Features

The app is fully functional but a few features need the final wiring. Here's what to connect:

### 6a. Realtime Chat (live message updates)

Currently ChatView loads messages on mount but doesn't auto-update. To enable live updates:

Open `EKKOConnect/Features/Chat/ChatView.swift` and add the RealtimeService:

1. Add a state property at the top of ChatView:
   ```swift
   @State private var realtimeService: RealtimeService?
   ```

2. In the `.task` modifier, after `loadChat()`, subscribe:
   ```swift
   .task {
       await loadChat()
       if let userId = currentUserId {
           let rt = RealtimeService(supabase: appState.supabase)
           realtimeService = rt
           await rt.subscribeToChat(matchId: matchId, currentUserId: userId)
       }
   }
   ```

3. Add `.onChange` modifiers to react to signals:
   ```swift
   .onChange(of: realtimeService?.newMessageSignal) { _, _ in
       Task { await reloadMessages() }
   }
   .onChange(of: realtimeService?.readSignal) { _, _ in
       Task { await reloadMessages() }
   }
   ```

4. Use `realtimeService?.isOtherTyping` instead of the local `isOtherTyping` state

5. Call `realtimeService?.sendTyping(userId:)` when the user types in the text field

6. Call `realtimeService?.sendRead(userId:)` after marking messages as read

### 6b. Location in Settings

Open `EKKOConnect/Features/Settings/SettingsView.swift`, update the `useMyLocation()` function:

```swift
private func useMyLocation() async {
    locating = true
    do {
        let locationManager = LocationManager()
        let result = try await locationManager.getCurrentLocation()
        filterCity = result.city ?? ""

        // Save to ConnectProfile
        struct LocationInput: Codable {
            let location: String
            let latitude: Double
            let longitude: Double
        }
        let _: ConnectProfile = try await appState.trpc.mutate(
            "connectProfile.update",
            input: LocationInput(
                location: result.city ?? "",
                latitude: result.latitude,
                longitude: result.longitude
            )
        )
    } catch {
        // Show error
    }
    locating = false
}
```

### 6c. Deep Link Navigation

Open `EKKOConnect/App/EKKOConnectApp.swift`. The `handleDeepLink` function needs to select the right tab and push to the right screen. To do this:

1. Move `selectedTab` from `MainTabView` to `AppState` so it's accessible globally:
   ```swift
   // In AppState.swift, add:
   var selectedTab = 0
   var pendingChatMatchId: String?
   ```

2. In `MainTabView`, bind to `appState.selectedTab` instead of local state

3. In `handleDeepLink`:
   ```swift
   private func handleDeepLink(_ route: String) {
       if route.starts(with: "/matches/") {
           let matchId = String(route.dropFirst("/matches/".count))
           appState.selectedTab = 2 // Matches tab
           appState.pendingChatMatchId = matchId
       } else if route == "/likes" {
           appState.selectedTab = 1
       } else if route.starts(with: "/discover") {
           appState.selectedTab = 0
       }
   }
   ```

4. In `MatchesView`, observe `appState.pendingChatMatchId` and navigate:
   ```swift
   .navigationDestination(item: $appState.pendingChatMatchId) { matchId in
       ChatView(matchId: matchId)
   }
   ```

### 6d. Unread Badge on Matches Tab

In `MainTabView`, query the unread count and show a badge:

```swift
// Add to MainTabView:
@State private var unreadCount = 0

// In the TabView, on the Matches tab:
.badge(unreadCount > 0 ? unreadCount : 0)

// Load unread count:
.task {
    do {
        let result: UnreadCountResult = try await appState.trpc.query("connectChat.getUnreadCount")
        unreadCount = result.count
    } catch {}
}
```

---

## Step 7: Test the Full Flow End-to-End

Run through this checklist on your physical iPhone:

### Auth:
- [ ] Register with email/password
- [ ] Log out
- [ ] Log in with email/password
- [ ] Log in with Apple Sign In
- [ ] Complete Profile wizard appears for new accounts
- [ ] Role selection (Creative/Client) works

### Profile Setup:
- [ ] Upload at least 1 photo (featured slot)
- [ ] Upload a second photo
- [ ] Remove a photo
- [ ] Select and answer a prompt
- [ ] Add a custom prompt
- [ ] Fill in bio, headline, looking for
- [ ] Preview shows all entered data
- [ ] "Activate Profile" saves and redirects

### Discover:
- [ ] Cards load from the backend
- [ ] Swipe right → LIKE indicator appears, card flies off
- [ ] Swipe left → PASS indicator appears, card flies off
- [ ] Haptic feedback on swipe
- [ ] Tap card → expanded profile view opens
- [ ] Like/Pass buttons work in expanded view
- [ ] Like note prompt appears after liking
- [ ] Undo button appears for 30 seconds after swipe
- [ ] Grid mode shows profiles
- [ ] Empty state shows when all profiles are viewed

### Likes:
- [ ] Incoming likes appear in grid
- [ ] Like Back creates a match
- [ ] Pass removes the like

### Matches:
- [ ] New matches appear in horizontal scroll
- [ ] Conversations show last message preview
- [ ] Tapping a match opens the chat

### Chat:
- [ ] Send a text message
- [ ] Message appears in the conversation
- [ ] Send an image
- [ ] Read receipts update (checkmarks)
- [ ] Unmatch removes the conversation
- [ ] Profile sheet opens when tapping the header

### Settings:
- [ ] Theme toggle works (Light/Dark/System)
- [ ] Display name edit saves
- [ ] Discovery filters persist after closing
- [ ] Sign out works
- [ ] Delete account confirmation requires "DELETE"

### Profile:
- [ ] Profile card displays correctly
- [ ] Stats show likes received and matches count
- [ ] Active/Paused toggle works
- [ ] Edit button navigates to Profile Setup (edit mode)

---

## Step 8: Performance and Polish

### Things to check:
- **Scroll performance**: Lists and grids should scroll at 60fps with no stuttering
- **Image loading**: Photos should load smoothly with Kingfisher caching (no flickering)
- **Memory**: Use Xcode Instruments → Leaks to check for memory leaks
- **Network errors**: Turn on airplane mode → app should show errors gracefully, not crash
- **Dark mode**: Every screen should look good in both light and dark mode

### Quick wins to add:
- Add `.refreshable` to any screen that loads data (pull-to-refresh)
- Add `ProgressView()` loading states where screens show blank during API calls
- Add `.animation()` to state changes for smoother transitions

---

## Step 9: App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: EKKO Connect
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: app.ekkoconnect.connect
   - **SKU**: ekkoconnect-ios
4. Under **App Information**:
   - **Category**: Social Networking
   - **Content Rights**: Does not contain third-party content
   - **Age Rating**: 12+ (Infrequent Mature/Suggestive Themes, Unrestricted Web Access)
5. Under **Pricing and Availability**:
   - Set price to Free (the app is free, IAP is optional)
   - Select countries/regions
6. Under **App Privacy**:
   - Data types collected: Name, Email, Phone Number, Photos, Location, User Content
   - Purpose: App Functionality
   - Linked to identity: Yes
   - Tracking: No

---

## Step 10: Screenshots

You need screenshots for App Store listing. Required sizes:
- **6.7"** (iPhone 15 Pro Max / 16 Pro Max): 1290 x 2796
- **6.1"** (iPhone 15 / 16): 1179 x 2556

### Recommended screenshots (in order):
1. **Discover** — Show the swipe card stack with a profile card
2. **Profile Setup** — Show the media grid with photos uploaded
3. **Matches** — Show a list of matches with message previews
4. **Chat** — Show a conversation with messages
5. **Profile** — Show the user's own profile card with stats

### How to capture:
1. Run the app on the simulator
2. Navigate to the screen
3. Press **Cmd+S** in the Simulator app to save a screenshot
4. Screenshots save to your Desktop
5. Crop/annotate as needed

---

## Step 11: App Review Preparation

### Create a demo account:
1. Register a test account on the web app: `review@ekkoconnect.app` / `AppReview2024!`
2. Set up a Connect profile with photos, prompts, bio
3. Create a second test account and match with the first (so the reviewer can see matches/chat)
4. Write these credentials in App Store Connect → App Review Information

### Review notes (paste into App Store Connect):
```
Demo Account:
Email: review@ekkoconnect.app
Password: AppReview2024!

This account has a pre-configured profile with photos and an existing match 
for testing the messaging feature. The app connects to our backend at 
ekkoconnect.app which handles authentication via Supabase.

Sign in with Apple is available as the primary login method.
```

### Common rejection reasons to avoid:
- **Missing Sign in with Apple**: Already implemented ✓
- **Incomplete functionality**: Make sure all tabs work and show content
- **Placeholder content**: Remove any "Coming soon" text before submitting
- **Privacy policy**: Must be accessible at `https://ekkoconnect.app/privacy`
- **In-App Purchase**: If including IAP, make sure restore purchases works

---

## Step 12: Build, Archive, and Submit

1. Set the build configuration:
   - In Xcode: Product → Scheme → Edit Scheme → Run → Build Configuration → **Release**
   - Or just use Archive which always builds in Release

2. Change bundle ID to production (if you used `.native` suffix):
   - Target → General → Bundle Identifier: `app.ekkoconnect.connect`

3. Set version numbers:
   - **Version** (MARKETING_VERSION): `1.0.0`
   - **Build** (CURRENT_PROJECT_VERSION): `1`

4. Change entitlements to production:
   - In `EKKOConnect.entitlements`, change `aps-environment` from `development` to `production`

5. Archive:
   - Select **Any iOS Device** from the device picker (not a simulator)
   - Product → Archive
   - Wait for the build to complete

6. Upload:
   - The Organizer window opens automatically
   - Select the archive → **Distribute App**
   - Choose **App Store Connect** → **Upload**
   - Xcode validates the build and uploads it

7. In App Store Connect:
   - Go to your app → **App Store** tab
   - Under the version, select the build you just uploaded
   - Fill in "What's New" text
   - Click **Submit for Review**

---

## Quick Reference: Key Files to Edit

| Task | File to edit |
|------|-------------|
| Change Supabase/tRPC URLs | `EKKOConnect/App/Config.swift` |
| Change bundle ID | `project.yml` → re-run `xcodegen generate` |
| Change app name | `EKKOConnect/Resources/Info.plist` → CFBundleDisplayName |
| Add app icon | `Resources/Assets.xcassets/AppIcon.appiconset/` |
| Edit any screen | `EKKOConnect/Features/<ScreenName>/` |
| Edit shared components | `EKKOConnect/Components/` |
| Edit colors/theme | `EKKOConnect/Core/Theme/EKKOTheme.swift` |
| Edit push notification handling | `EKKOConnect/Core/Push/PushManager.swift` |
| Change entitlements | `EKKOConnect/Resources/EKKOConnect.entitlements` |
| Regenerate Xcode project | Run `cd apps/connect-ios && xcodegen generate` |
