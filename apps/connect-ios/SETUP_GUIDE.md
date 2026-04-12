# EKKO Connect Native iOS — Step-by-Step Setup Guide

## Prerequisites

- Xcode 15.0+ (for iOS 17 target)
- Apple Developer account (for push notifications, Apple Sign In, and App Store)
- Physical iPhone for testing push notifications and Apple Sign In
- Your Connect web app running (locally or deployed at ekkoconnect.app)

---

## Step 1: Create the Xcode Project

The Swift files are built as an SPM package, but you need an actual Xcode project to run on a device.

### Option A: Generate from SPM (fastest)

1. Open Terminal in `apps/connect-ios/`
2. Run:
   ```bash
   cd /Users/lucaorion/ekkomvp/apps/connect-ios
   swift package generate-xcodeproj
   ```
3. Open `EKKOConnect.xcodeproj` in Xcode
4. Select the `EKKOConnect` target → General tab
5. Change:
   - **Bundle Identifier**: `app.ekkoconnect.connect.dev` (use `.dev` suffix during development so it doesn't conflict with the Capacitor app)
   - **Deployment Target**: iOS 17.0
   - **Device Orientation**: Portrait only (uncheck Landscape Left and Landscape Right)

### Option B: Create fresh Xcode project (recommended for full control)

1. Open Xcode → File → New → Project
2. Select **App** under iOS
3. Configure:
   - **Product Name**: `EKKOConnect`
   - **Team**: Your Apple Developer team
   - **Organization Identifier**: `app.ekkoconnect`
   - **Bundle Identifier**: `app.ekkoconnect.connect.dev`
   - **Interface**: SwiftUI
   - **Language**: Swift
   - **Storage**: None
4. Save to a temporary location
5. Delete the auto-generated `ContentView.swift` and `EKKOConnectApp.swift`
6. Drag all files from `apps/connect-ios/EKKOConnect/` into the Xcode project navigator (choose "Create folder references", check "Copy items if needed")
7. Add SPM dependencies:
   - File → Add Package Dependencies
   - Add: `https://github.com/supabase/supabase-swift.git` (version 2.0.0+)
   - Add: `https://github.com/onevcat/Kingfisher.git` (version 7.0.0+)
   - Add: `https://github.com/RevenueCat/purchases-ios-spm.git` (version 5.0.0+)

---

## Step 2: Configure Supabase Credentials

You need to set your actual Supabase URL and anon key. **Do NOT hardcode the service role key in the app.**

### Create a Config file

1. Create a new file `EKKOConnect/App/Config.swift`:

```swift
import Foundation

enum Config {
    static let supabaseURL = "https://tfpxqdiqapnhivvvylml.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcHhxZGlxYXBuaGl2dnZ5bG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjkwODMsImV4cCI6MjA4NTg0NTA4M30.Mn6EkP96mGb_lS1Xpc7ngeNR-SnT_quV_mGuKOtdcGA"
    
    // tRPC base URL — your Connect web app
    // For local development: "http://localhost:3001/api/trpc"
    // For production: "https://ekkoconnect.app/api/trpc"
    static let trpcBaseURL = "https://ekkoconnect.app/api/trpc"
    
    // RevenueCat (get from RevenueCat dashboard → API Keys → iOS)
    static let revenueCatAPIKey = "YOUR_REVENUECAT_IOS_KEY"
}
```

2. Update `AppState.swift` to use `Config` instead of `ProcessInfo.processInfo.environment`:

```swift
// Replace these lines in AppState.init():
let supabaseURL = URL(string: Config.supabaseURL)!
let supabaseKey = Config.supabaseAnonKey
let trpcBaseURL = URL(string: Config.trpcBaseURL)!
```

3. Add `Config.swift` to your `.gitignore` so credentials aren't committed:
```
apps/connect-ios/EKKOConnect/App/Config.swift
```

---

## Step 3: Set Up Capabilities & Entitlements

In Xcode, select your target → **Signing & Capabilities** tab.

### 3a. Sign In with Apple
1. Click **+ Capability** → **Sign in with Apple**
2. This adds the `com.apple.developer.applesignin` entitlement

### 3b. Push Notifications
1. Click **+ Capability** → **Push Notifications**
2. This adds the `aps-environment` entitlement
3. You also need to create an APNs key in your Apple Developer account:
   - Go to https://developer.apple.com/account/resources/authkeys/list
   - Click **+** → Check **Apple Push Notifications service (APNs)**
   - Download the `.p8` key file
   - Note the **Key ID** and your **Team ID**
4. In Supabase Dashboard → Settings → Auth → Apple:
   - Upload the APNs key OR configure via FCM (if using Firebase for push delivery)

### 3c. Associated Domains (Universal Links)
1. Click **+ Capability** → **Associated Domains**
2. Add: `applinks:ekkoconnect.app`
3. On your server, ensure `https://ekkoconnect.app/.well-known/apple-app-site-association` exists:
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.app.ekkoconnect.connect",
      "paths": ["/matches/*", "/likes", "/discover", "/profile/*"]
    }]
  }
}
```
Replace `TEAMID` with your actual Apple Team ID.

### 3d. URL Scheme
1. Select target → **Info** tab → **URL Types**
2. Click **+**
3. Set:
   - **Identifier**: `app.ekkoconnect.connect`
   - **URL Schemes**: `ekkoconnect`
   - **Role**: Editor

---

## Step 4: Configure Google Sign In

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** for iOS
3. Set the **Bundle ID** to `app.ekkoconnect.connect` (or your dev bundle ID)
4. Download the `GoogleService-Info.plist`
5. In Supabase Dashboard → Authentication → Providers → Google:
   - Add the iOS client ID
6. The app uses `ASWebAuthenticationSession` for Google OAuth — no additional SDK needed. The Supabase Swift SDK handles the OAuth flow.

---

## Step 5: Add App Icon & Launch Screen

### App Icon
1. Open `Assets.xcassets` in Xcode
2. Select **AppIcon**
3. Drag your 1024x1024 app icon into the slot (Xcode auto-generates all sizes in Xcode 15+)
4. If you have the EKKO logo at `apps/connect/public/logo.png`, scale it up or create a proper app icon

### Launch Screen
1. In your target → General → **App Icons and Launch Screen**
2. Set **Launch Screen** to use a storyboard OR set a background color:
   - Background color: `#0f0f0f` (dark) to match the app
3. Alternatively, create `LaunchScreen.storyboard`:
   - Add an `ImageView` centered with the EKKO logo
   - Set background to `#0f0f0f`

---

## Step 6: Set Up Info.plist Permissions

Add these keys to your `Info.plist` (or in Target → Info → Custom iOS Target Properties):

| Key | Value |
|-----|-------|
| `NSCameraUsageDescription` | EKKO Connect needs camera access for profile photos and media |
| `NSPhotoLibraryUsageDescription` | EKKO Connect needs photo library access to upload images and videos |
| `NSPhotoLibraryAddUsageDescription` | EKKO Connect needs permission to save photos |
| `NSLocationWhenInUseUsageDescription` | EKKO Connect uses your location to discover nearby creatives |

---

## Step 7: Test on Simulator

1. Select an iPhone 15 Pro simulator in Xcode
2. Press **Cmd+R** to build and run
3. The app should launch showing the login screen
4. **Note**: Push notifications and Apple Sign In don't work on simulator. Everything else does.

### Test the auth flow:
1. Register a new account with email/password on the Connect web app first
2. Sign in with that email on the native app
3. You should see the Complete Profile screen (name + DOB → role selection)
4. After completing, you'll see the Profile Setup wizard

### Test with local development server:
If your Connect web app is running locally:
1. Change `Config.trpcBaseURL` to `"http://YOUR_MAC_IP:3001/api/trpc"` (not `localhost` — the simulator can't reach `localhost` on the host)
2. Find your Mac's IP: System Settings → Wi-Fi → Details → IP Address
3. Make sure your Mac's firewall allows incoming connections on port 3001

---

## Step 8: Test on Physical Device

1. Connect your iPhone via USB
2. Select your device in Xcode's destination picker
3. First time: Xcode will prompt to trust the device
4. Press **Cmd+R**
5. On the iPhone: Settings → General → VPN & Device Management → Trust your developer certificate

### Test push notifications:
1. The app will request notification permission on first launch after sign-in
2. Create a second account on another device or the web app
3. Like the first account's profile → the first device should receive a push notification
4. Send a message → push notification should appear

### Test Apple Sign In:
1. Tap "Sign in with Apple" on the login screen
2. Authenticate with Face ID / Touch ID
3. The app should create an account and navigate to Complete Profile

---

## Step 9: Set Up RevenueCat (In-App Purchases)

### 9a. RevenueCat Dashboard
1. Create an account at https://www.revenuecat.com
2. Create a new project: "EKKO Connect"
3. Add an **Apple App Store** app:
   - Bundle ID: `app.ekkoconnect.connect`
   - App Store Connect Shared Secret (from App Store Connect → App → App Information → Shared Secret)

### 9b. App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Create your app listing (My Apps → +)
3. Go to **Subscriptions** → create a subscription group "EKKO Connect"
4. Add a product:
   - Reference Name: "EKKO Infinite"
   - Product ID: `app.ekkoconnect.infinite.monthly`
   - Duration: 1 Month
   - Price: $7.99

### 9c. RevenueCat Products
1. In RevenueCat → Products → add `app.ekkoconnect.infinite.monthly`
2. Create an **Entitlement** named `infinite`
3. Attach the product to the entitlement
4. Create an **Offering** → add a package with your product

### 9d. API Key
1. In RevenueCat → API Keys → copy the **iOS public key**
2. Paste it into `Config.revenueCatAPIKey`

### 9e. Webhook (backend sync)
1. In RevenueCat → Webhooks → Add
2. URL: `https://ekkoconnect.app/api/webhooks/revenuecat`
3. Authorization: `Bearer YOUR_REVENUECAT_WEBHOOK_SECRET`
4. Set `REVENUECAT_WEBHOOK_SECRET` in your web app's environment variables

---

## Step 10: Pre-Submission Checklist

Before submitting to the App Store:

### Code changes:
- [ ] Change bundle ID from `app.ekkoconnect.connect.dev` to `app.ekkoconnect.connect`
- [ ] Set `Config.trpcBaseURL` to production: `https://ekkoconnect.app/api/trpc`
- [ ] Set `Config.revenueCatAPIKey` to the production key
- [ ] Remove any `print()` debug statements
- [ ] Set Xcode build configuration to **Release**

### App Store Connect:
- [ ] App icon (1024x1024)
- [ ] Screenshots (6.7" and 6.1" required minimum)
- [ ] App description, keywords, subtitle
- [ ] Privacy policy URL: `https://ekkoconnect.app/privacy`
- [ ] Support URL: `https://ekkoconnect.app`
- [ ] Age rating: 12+ (social networking, user-generated content)
- [ ] App category: Social Networking

### Apple review notes:
- [ ] Provide a demo account for the reviewer (email + password)
- [ ] Explain that the app connects to an existing backend at ekkoconnect.app
- [ ] Note that Apple Sign In is available as a login option (required for App Store approval)

---

## Step 11: Archive & Submit

1. In Xcode: Product → Archive
2. Wait for the archive to build
3. In the Organizer window: click **Distribute App**
4. Select **App Store Connect** → **Upload**
5. Follow the prompts (signing, entitlements check)
6. Go to App Store Connect → your app → Submit for Review

---

## Step 12: Post-Launch

### apple-app-site-association
Make sure this file is served at `https://ekkoconnect.app/.well-known/apple-app-site-association` for Universal Links to work. Create it in your web app's `public/` directory.

### Monitor
- RevenueCat dashboard for subscription analytics
- Supabase dashboard for auth and database metrics
- App Store Connect for crash reports and user feedback

### Future improvements (not yet implemented):
- **Supabase Realtime integration in ChatView**: The `RealtimeService` is built but needs to be wired into ChatView for live message updates (currently messages load on mount but don't auto-update)
- **Deep link navigation**: The `DeepLinkHandler` posts notifications but `EKKOConnectApp` needs to route them to the correct tab/screen
- **CoreLocation in Settings**: The "Use my location" button calls `LocationManager` but needs to save coordinates to the ConnectProfile via the API
- **Offline caching**: Add local persistence with SwiftData for offline viewing of profiles and messages
- **Video/Audio playback**: Add `AVPlayer` views in `ConnectProfileCard` for video and audio media slots
- **3D model viewer**: Add `SceneView` from SceneKit for `.usdz` model slots

---

## Quick Reference: File Locations

| What | Where |
|------|-------|
| Supabase config | `Config.swift` (you create this) |
| App entry point | `EKKOConnect/App/EKKOConnectApp.swift` |
| Auth state | `EKKOConnect/App/AppState.swift` |
| tRPC client | `EKKOConnect/Core/Networking/TRPCClient.swift` |
| Theme/colors | `EKKOConnect/Core/Theme/EKKOTheme.swift` |
| All screens | `EKKOConnect/Features/` |
| Reusable components | `EKKOConnect/Components/` |
| Data models | `EKKOConnect/Models/` |
