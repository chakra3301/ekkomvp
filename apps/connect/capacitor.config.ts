import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.CAPACITOR_DEV === "true";

const config: CapacitorConfig = {
  appId: "app.ekkoconnect.connect",
  appName: "EKKO Connect",
  webDir: "public",
  server: {
    // In dev mode, point to local Next.js dev server
    // In production, load the deployed URL
    url: isDev ? "http://localhost:3001" : "https://ekkoconnect.app",
    cleartext: isDev, // Allow HTTP in dev mode
    allowNavigation: [
      "ekkoconnect.app",
      "*.ekkoconnect.app",
      "*.supabase.co",
      "*.googleapis.com",
      "accounts.google.com",
      "appleid.apple.com",
    ],
  },
  ios: {
    contentInset: "never",
    allowsLinkPreview: true,
    backgroundColor: "#0f0f0f",
    preferredContentMode: "mobile",
    scheme: "ekkoconnect",
  },
  plugins: {
    Keyboard: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resize: "none" as any,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#0f0f0f",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
