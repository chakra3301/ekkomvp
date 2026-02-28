"use client";

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { SplashScreen } from "@capacitor/splash-screen";

export async function initNativeBridge() {
  if (!Capacitor.isNativePlatform()) return;

  await SplashScreen.hide();
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setOverlaysWebView({ overlay: true });

  Keyboard.setAccessoryBarVisible({ isVisible: true });
  Keyboard.setScroll({ isDisabled: false });

  App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) {
      console.log("[Native] App resumed");
    }
  });

  App.addListener("appUrlOpen", async ({ url }) => {
    // Handle OAuth callback — close the SFSafariViewController and
    // navigate to the callback URL in the WebView
    if (url.includes("/api/auth/callback")) {
      await Browser.close();
      const parsed = new URL(url);
      window.location.href = parsed.pathname + parsed.search;
      return;
    }

    const slug = url.split("ekkoconnect.app").pop();
    if (slug) {
      window.location.href = slug;
    }
  });

  await setupPushNotifications();
}

async function setupPushNotifications() {
  const permission = await PushNotifications.checkPermissions();

  if (permission.receive === "prompt") {
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== "granted") return;
  }

  if (permission.receive === "denied") return;

  await PushNotifications.register();

  PushNotifications.addListener("registration", (token) => {
    console.log("[Native] Push token:", token.value);
    // TODO: Send token to server via tRPC mutation
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("[Native] Push received:", notification);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const data = action.notification.data;
    if (data?.url) {
      window.location.href = data.url;
    }
  });
}
