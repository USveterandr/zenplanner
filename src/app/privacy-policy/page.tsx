import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Zen Planner",
  description: "Privacy Policy for the Zen Planner app",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: March 18, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Zen Planner (&quot;we,&quot; &quot;our,&quot; or &quot;the
              App&quot;) is an AI-powered productivity application that helps
              you manage tasks, track goals, build habits, and gain productivity
              insights. This Privacy Policy explains how we collect, use, and
              protect your information when you use Zen Planner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Information We Collect
            </h2>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              2.1 Account Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you create an account or sign in (including via Google OAuth),
              we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Name and email address</li>
              <li>Profile information (avatar, profession, hobbies) you choose to provide</li>
              <li>Authentication tokens for session management</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              2.2 Application Data
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              To provide core functionality, we store the following data on our
              secure servers:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Tasks (titles, descriptions, priorities, due dates, categories, completion status)</li>
              <li>Goals (titles, descriptions, milestones, progress)</li>
              <li>Habits (titles, descriptions, frequency, completion history, streaks)</li>
              <li>Categories (names, colors, icons)</li>
              <li>Reminders and notification preferences</li>
              <li>AI Advisor chat history</li>
              <li>Subscription plan and billing status</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              2.3 Data Shared with Third-Party AI Services
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you use the AI Advisor feature, the following data is sent to
              an external AI service to generate personalized productivity
              recommendations:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Your chat messages to the AI Advisor</li>
              <li>Summaries of your tasks (titles, completion status, priorities)</li>
              <li>Summaries of your goals (titles, progress percentages)</li>
              <li>Summaries of your habits (titles, streak counts)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              The AI Advisor feature is optional and you can use the App without it.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              2.4 Payment Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you subscribe to a paid plan, payment processing is handled
              entirely by PayPal. We do not store your credit card numbers,
              bank account details, or PayPal login credentials. We only receive:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>PayPal subscription ID (to track your billing status)</li>
              <li>Subscription status and renewal dates</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              2.5 Automatically Collected Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              We do not use any analytics, tracking scripts, or advertising
              SDKs. Standard web hosting may collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>IP address, browser type, and device information (standard HTTP request metadata)</li>
              <li>Font loading requests to Google Fonts CDN</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Information We Do Not Collect
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>We do not use tracking cookies or advertising identifiers</li>
              <li>We do not use analytics or crash reporting services</li>
              <li>We do not sell or share your data with advertisers</li>
              <li>We do not store your payment card or bank details</li>
              <li>We do not access your device contacts, photos, or location</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Your information is used exclusively to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Provide core App functionality (task management, goal tracking, habit building, analytics)</li>
              <li>Authenticate your identity and maintain your session</li>
              <li>Process subscription payments through PayPal</li>
              <li>Generate AI-powered productivity advice (when you use the AI Advisor)</li>
              <li>Sync your data across devices when signed in</li>
              <li>Enable offline access through service worker caching</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Data Storage and Security
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Your application data is stored securely using:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>Cloudflare D1:</strong> A globally distributed database for your tasks, goals, habits, and account data</li>
              <li><strong>Supabase:</strong> Authentication service for secure sign-in and session management</li>
              <li><strong>Supabase Storage:</strong> Secure storage for user-uploaded files (e.g., profile avatars)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              All data is transmitted over HTTPS encryption. Your password is
              managed by Supabase&apos;s authentication system and is never
              stored in plaintext.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Third-Party Services
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              The App uses the following third-party services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                <strong>Cloudflare Workers:</strong> Hosts the App and database.
                Subject to{" "}
                <a href="https://www.cloudflare.com/privacypolicy/" className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">
                  Cloudflare&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Supabase:</strong> Provides authentication and file storage.
                Subject to{" "}
                <a href="https://supabase.com/privacy" className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">
                  Supabase&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong>PayPal:</strong> Processes subscription payments.
                Subject to{" "}
                <a href="https://www.paypal.com/us/legalhub/privacy-full" className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">
                  PayPal&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Cloudflare AI:</strong> Powers the AI Advisor feature.
                Data sent is limited to chat messages and productivity summaries.
              </li>
              <li>
                <strong>Google Fonts:</strong> Provides typefaces.
                Subject to{" "}
                <a href="https://policies.google.com/privacy" className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">
                  Google&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Google OAuth:</strong> Optional sign-in method.
                Subject to{" "}
                <a href="https://policies.google.com/privacy" className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">
                  Google&apos;s Privacy Policy
                </a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Zen Planner is not directed at children under the age of 13. We do
              not knowingly collect personal information from children under 13.
              If you believe a child has provided us with personal information,
              please contact us so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Your Rights and Choices
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                <strong>Delete your account and data:</strong> You can request
                account deletion from the App settings or by visiting{" "}
                <a href="/delete-account" className="text-purple-600 hover:text-purple-800 underline">
                  the account deletion page
                </a>.
                All your data will be permanently removed from our servers.
              </li>
              <li>
                <strong>Opt out of AI features:</strong> You can use the App
                without the AI Advisor. No data is sent to AI services unless
                you actively use this feature.
              </li>
              <li>
                <strong>Manage your subscription:</strong> You can change or
                cancel your subscription plan at any time from within the App
                or through your PayPal account.
              </li>
              <li>
                <strong>Export your data:</strong> You can access all your data
                through the App interface at any time.
              </li>
              <li>
                <strong>Disable notifications:</strong> You can manage
                notification permissions through your device settings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Data Retention
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your data for as long as your account is active. If you
              delete your account, all associated data is permanently removed
              within 30 days. Subscription billing records may be retained as
              required by law or by PayPal&apos;s policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              10. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page with an updated &quot;Last
              updated&quot; date. Your continued use of the App after changes
              are posted constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              11. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions or concerns about this Privacy Policy,
              please contact us through our GitHub repository at{" "}
              <a
                href="https://github.com/USveterandr/zenplanner"
                className="text-purple-600 hover:text-purple-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/USveterandr/zenplanner
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <a
            href="/"
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            &larr; Back to Zen Planner
          </a>
        </div>
      </div>
    </div>
  );
}
