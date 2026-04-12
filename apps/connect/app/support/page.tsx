import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with EKKO Connect",
};

export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold font-heading mb-2">Support</h1>
      <p className="text-sm text-muted-foreground mb-10">
        We&apos;re here to help. Find answers below or reach out directly.
      </p>

      <div className="space-y-10 text-sm leading-relaxed">
        {/* Contact */}
        <section className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-3">Contact us</h2>
          <p className="text-muted-foreground mb-4">
            The fastest way to get help is email. We aim to respond within 24
            hours on business days.
          </p>
          <div className="space-y-2">
            <div>
              <span className="text-muted-foreground">General support:</span>{" "}
              <a
                href="mailto:support@ekkoconnect.app"
                className="text-primary hover:underline font-medium"
              >
                support@ekkoconnect.app
              </a>
            </div>
            <div>
              <span className="text-muted-foreground">Trust &amp; safety:</span>{" "}
              <a
                href="mailto:safety@ekkoconnect.app"
                className="text-primary hover:underline font-medium"
              >
                safety@ekkoconnect.app
              </a>
            </div>
            <div>
              <span className="text-muted-foreground">Privacy requests:</span>{" "}
              <a
                href="mailto:privacy@ekkoconnect.app"
                className="text-primary hover:underline font-medium"
              >
                privacy@ekkoconnect.app
              </a>
            </div>
            <div>
              <span className="text-muted-foreground">Legal:</span>{" "}
              <a
                href="mailto:legal@ekkoconnect.app"
                className="text-primary hover:underline font-medium"
              >
                legal@ekkoconnect.app
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Frequently asked questions</h2>

          <div className="space-y-5">
            <FAQ
              q="How do I report a user or inappropriate content?"
              a="On any profile, tap the three-dot menu (⋯) in the top-right and choose Report. From a chat, tap the menu in the chat header and choose Report. Our team reviews reports within 24 hours and takes action on objectionable content or abusive behavior."
            />
            <FAQ
              q="How do I block someone?"
              a="Open their profile or a chat with them, tap the three-dot menu, and choose Block. Blocked users cannot see your profile, match with you, or contact you. You can unblock users from Settings → Blocked Users."
            />
            <FAQ
              q="How do I cancel my EKKO Infinite subscription?"
              a="Subscriptions are managed through your Apple ID. Open Settings on your iPhone → tap your name at the top → Subscriptions → EKKO Infinite → Cancel. Your subscription remains active until the end of the current billing period."
            />
            <FAQ
              q="How do I delete my account?"
              a="In the app: Profile tab → Settings (gear icon) → Delete Account. Type DELETE to confirm. This permanently removes your profile, matches, messages, and all data. This cannot be undone."
            />
            <FAQ
              q="I forgot my password. How do I reset it?"
              a="On the sign-in screen, tap 'Forgot password?' and enter your email address. You'll receive a password reset link."
            />
            <FAQ
              q="Why can't I sign in?"
              a="Make sure you're using the same login method (Apple, Google, or email) that you used to create your account. If you're still having trouble, email support@ekkoconnect.app with your registered email address."
            />
            <FAQ
              q="How does discovery work?"
              a="Discovery shows you other creatives based on your filters in Settings → Discovery Filters (distance, role, location). You can swipe right to like or left to pass. If you both like each other, you match and can start chatting."
            />
            <FAQ
              q="Why am I not getting matches?"
              a="A strong profile makes a big difference. Make sure you have at least 2 high-quality photos, a short bio, and a few answered prompts. Broadening your distance filter in Settings can also help."
            />
            <FAQ
              q="How do I connect my Instagram?"
              a="Go to Profile → Edit Profile → Details and add your Instagram handle. If you want your recent posts to appear on your profile, tap Connect Instagram in Settings and authorize the app."
            />
            <FAQ
              q="Is EKKO Connect safe?"
              a="We have zero tolerance for abusive behavior or objectionable content. You can report or block any user at any time. Our moderation team reviews reports within 24 hours. Never share sensitive personal or financial information with anyone you've met on the app."
            />
          </div>
        </section>

        {/* Community guidelines */}
        <section className="glass-card p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-3">Community guidelines</h2>
          <p className="text-muted-foreground mb-3">
            EKKO Connect is a community of creatives and the people who work
            with them. To keep it a great place for everyone:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>Be respectful. No harassment, hate speech, or threats.</li>
            <li>No nudity, sexually explicit content, or violent imagery.</li>
            <li>Represent yourself accurately &mdash; no impersonation or fake profiles.</li>
            <li>Don&apos;t solicit or scam. Keep discussions about creative work.</li>
            <li>Don&apos;t post content you don&apos;t have the rights to share.</li>
            <li>If you see something, report it. We review every report.</li>
          </ul>
        </section>

        {/* Legal links */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Legal</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group glass-card rounded-xl p-4">
      <summary className="cursor-pointer list-none flex items-start justify-between gap-3">
        <span className="font-medium text-foreground">{q}</span>
        <span className="text-muted-foreground text-lg leading-none shrink-0 transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="text-muted-foreground mt-3">{a}</p>
    </details>
  );
}
