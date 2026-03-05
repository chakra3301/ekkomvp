import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion",
};

export default function DataDeletionPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold font-heading mb-8">
        Data Deletion Instructions
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: March 4, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold mb-3">
            How to Delete Your Data
          </h2>
          <p className="text-muted-foreground mb-4">
            You can request deletion of your EKKO Connect account and all
            associated data using any of the methods below. Once processed, all
            your personal data will be permanently removed within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">
            Option 1: Delete from the App
          </h2>
          <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
            <li>Open EKKO Connect and go to <strong className="text-foreground">Settings</strong>.</li>
            <li>Scroll to the bottom and tap <strong className="text-foreground">Delete Account</strong>.</li>
            <li>Confirm the deletion when prompted.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">
            Option 2: Email Request
          </h2>
          <p className="text-muted-foreground">
            Send an email to{" "}
            <a
              href="mailto:privacy@ekkoconnect.app"
              className="text-primary hover:underline"
            >
              privacy@ekkoconnect.app
            </a>{" "}
            with the subject line &ldquo;Delete My Account&rdquo; from the email
            address associated with your account. We will process your request
            within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">What Gets Deleted</h2>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Your account and login credentials</li>
            <li>Profile information (photos, bio, headline, prompts)</li>
            <li>Match and swipe history</li>
            <li>Messages and chat history</li>
            <li>Location data</li>
            <li>Push notification tokens</li>
            <li>Connected third-party accounts (e.g. Instagram)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Data Retention</h2>
          <p className="text-muted-foreground">
            After deletion, we may retain anonymized, aggregated data that
            cannot be used to identify you. We may also retain data as required
            by law or to protect against fraud or legal claims for a limited
            period.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Contact</h2>
          <p className="text-muted-foreground">
            For questions about data deletion, contact us at:{" "}
            <a
              href="mailto:privacy@ekkoconnect.app"
              className="text-primary hover:underline"
            >
              privacy@ekkoconnect.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
