import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold font-heading mb-8">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: April 12, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-3">1. Information We Collect</h2>
          <p className="mb-2">EKKO Connect collects the following information:</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li><strong className="text-foreground">Account information</strong>: Name, email address, date of birth, phone number (optional).</li>
            <li><strong className="text-foreground">Profile information</strong>: Photos, videos, audio, bio, headline, creative disciplines, prompts/answers.</li>
            <li><strong className="text-foreground">Location data</strong>: When you grant permission, we collect your approximate location to show nearby creatives.</li>
            <li><strong className="text-foreground">Usage data</strong>: Swipe activity, matches, messages, and app interactions to improve our service.</li>
            <li><strong className="text-foreground">Device information</strong>: Device type, operating system, and push notification tokens.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>To create and manage your account.</li>
            <li>To match you with other creatives based on your preferences.</li>
            <li>To enable messaging between matched users.</li>
            <li>To send push notifications about matches, messages, and account updates.</li>
            <li>To improve and personalize your experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. Data Sharing</h2>
          <p className="mb-2">We do not sell your personal information. We share data only with:</p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Other users (your public profile information, as you choose to share).</li>
            <li>Service providers (Supabase for authentication and storage, hosting providers).</li>
            <li>Law enforcement when required by law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. Camera and Photo Library</h2>
          <p className="text-muted-foreground">
            We request camera and photo library access solely to allow you to upload profile photos and media content. Photos are uploaded to our secure storage and are never accessed without your explicit action.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. Location Data</h2>
          <p className="text-muted-foreground">
            Location access is optional. When granted, we use your location only to show you nearby creatives. Your exact coordinates are stored securely and are never shared with other users — only your city/area name is displayed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">6. Push Notifications</h2>
          <p className="text-muted-foreground">
            With your permission, we send push notifications for new matches, messages, and important account updates. You can disable notifications at any time in your device settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">7. Data Retention and Deletion</h2>
          <p className="text-muted-foreground">
            Your data is retained while your account is active. You may request account deletion from the Settings page or by contacting us at privacy@ekkoconnect.app. Upon deletion, all personal data will be removed within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">8. Security</h2>
          <p className="text-muted-foreground">
            We use industry-standard security measures including HTTPS encryption, secure authentication via Supabase, and row-level security on our database.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">9. Children&apos;s Privacy</h2>
          <p className="text-muted-foreground">
            EKKO Connect is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">10. Contact</h2>
          <p className="text-muted-foreground">
            For questions about this privacy policy, contact us at:{" "}
            <a href="mailto:privacy@ekkoconnect.app" className="text-primary hover:underline">
              privacy@ekkoconnect.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
