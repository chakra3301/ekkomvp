import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold font-heading mb-8">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: April 12, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using EKKO Connect, you agree to be bound by these Terms of Service. If you do not agree, do not use the app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. Eligibility</h2>
          <p className="text-muted-foreground">
            You must be at least 13 years old to use EKKO Connect. By creating an account, you represent that you meet this requirement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. Your Account</h2>
          <p className="text-muted-foreground">
            You are responsible for maintaining the security of your account and for all activities that occur under your account. You agree to provide accurate and complete information when creating your profile.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. User Content</h2>
          <p className="text-muted-foreground mb-2">
            You retain ownership of content you post on EKKO Connect. By posting content, you grant us a non-exclusive, worldwide license to use, display, and distribute your content within the platform. You agree not to post content that:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Is illegal, harmful, threatening, abusive, or harassing.</li>
            <li>Infringes on intellectual property rights of others.</li>
            <li>Contains sexually explicit material or nudity.</li>
            <li>Promotes violence or discrimination.</li>
            <li>Is spam or unauthorized advertising.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. Prohibited Conduct</h2>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Impersonating another person or entity.</li>
            <li>Using the platform to stalk, harass, or harm others.</li>
            <li>Attempting to gain unauthorized access to other accounts.</li>
            <li>Using automated tools to interact with the platform.</li>
            <li>Circumventing any security features.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">6. Objectionable Content &amp; Moderation</h2>
          <p className="text-muted-foreground mb-2">
            EKKO Connect has zero tolerance for objectionable content or abusive behavior. We take the following steps to maintain a safe environment:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Users may report profiles, photos, messages, or posts directly from the app.</li>
            <li>Users may block other users at any time from profile or chat screens; blocked users cannot view your profile, match with you, or contact you.</li>
            <li>Our moderation team reviews reports and acts on objectionable content or abusive users within 24 hours.</li>
            <li>We may remove content, restrict accounts, or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">7. Subscriptions &amp; In-App Purchases</h2>
          <p className="text-muted-foreground mb-2">
            EKKO Connect offers a free tier and an optional paid tier called EKKO Infinite ($7.99/month). Paid subscriptions are processed through your Apple ID.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Payment is charged to your Apple ID account at confirmation of purchase.</li>
            <li>Your subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.</li>
            <li>Your account will be charged for renewal within 24 hours prior to the end of the current period, at the subscription cost.</li>
            <li>You can manage or cancel your subscription in your Apple ID Account Settings. Deleting the app does not cancel the subscription.</li>
            <li>No refunds or credits for partial months or unused periods, except where required by law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">8. Termination</h2>
          <p className="text-muted-foreground">
            We reserve the right to suspend or terminate your account at any time for violations of these terms. You may delete your account at any time through the Settings page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">9. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground">
            EKKO Connect is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">10. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the maximum extent permitted by law, EKKO Connect shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">11. Contact</h2>
          <p className="text-muted-foreground">
            For questions about these terms, contact us at:{" "}
            <a href="mailto:legal@ekkoconnect.app" className="text-primary hover:underline">
              legal@ekkoconnect.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
