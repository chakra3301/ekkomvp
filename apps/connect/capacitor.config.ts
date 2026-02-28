import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.CAPACITOR_DEV === "true";

const config: CapacitorConfig = {
  appId: "app.ekkoconnect.connect",
  appName: "EKKO Connect",
  webDir: "public",
  server: {
    // In dev mode, point to local Next.js dev server
    // In production, load the deployed URL
    url: isDev ? "http://localhost:3001" : "https://connect.ekkoconnect.app",
    cleartext: isDev, // Allow HTTP in dev mode
    allowNavigation: [
      "connect.ekkoconnect.app",
      "*.supabase.co",
      "accounts.google.com",
      "appleid.apple.com",
    ],
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: true,
    backgroundColor: "#f5f5f5",
    preferredContentMode: "mobile",
    scheme: "ekkoconnect",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#f5f5f5",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
