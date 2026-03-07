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

  // Track keyboard height for CSS-based layout adjustments
  Keyboard.addListener("keyboardWillShow", (info) => {
    document.documentElement.style.setProperty(
      "--keyboard-height",
      `${info.keyboardHeight}px`
    );
    document.documentElement.classList.add("keyboard-open");

    // Scroll the focused input into view after layout settles.
    // Skip if the input is inside a container that manages its own keyboard
    // offset (e.g. chat pages with paddingBottom: var(--keyboard-height)).
    setTimeout(() => {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        if (!el.closest("[data-keyboard-managed]")) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 100);
  });

  Keyboard.addListener("keyboardWillHide", () => {
    document.documentElement.style.setProperty("--keyboard-height", "0px");
    document.documentElement.classList.remove("keyboard-open");
  });

  // Also scroll into view when switching between inputs while keyboard is open
  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    ) {
      setTimeout(() => {
        if (
          document.documentElement.classList.contains("keyboard-open") &&
          !el.closest("[data-keyboard-managed]")
        ) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
    }
  });

  App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) {
      console.log("[Native] App resumed");
    }
  });

  App.addListener("appUrlOpen", async ({ url }) => {
    // Handle native OAuth callback — the auth code arrives via custom URL
    // scheme after being forwarded by /api/auth/native-redirect.
    // Navigate the WebView to /api/auth/callback so the PKCE verifier
    // cookie is available for the code exchange.
    if (url.startsWith("ekkoconnect://auth-callback")) {
      await Browser.close();
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get("code");
        const next = parsed.searchParams.get("next") || "/discover";
        if (code) {
          window.location.href = `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
        } else {
          window.location.href = "/login?error=missing_code";
        }
      } catch (e) {
        console.error("[Native] Error handling auth callback:", e);
        window.location.href = "/login?error=native_auth_error";
      }
      return;
    }

    // Handle web-style OAuth callback (Universal Link fallback)
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
    localStorage.setItem("ekko-push-token", token.value);
    window.dispatchEvent(new Event("ekko-push-token"));
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
