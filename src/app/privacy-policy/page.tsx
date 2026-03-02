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
          Last updated: March 1, 2026
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
              2.1 Data Stored Locally on Your Device
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              The majority of your data is stored locally on your device using
              your browser&apos;s local storage. This data never leaves your
              device except as described in Section 2.2. Locally stored data
              includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                Tasks (titles, descriptions, priorities, due dates, categories,
                completion status)
              </li>
              <li>Goals (titles, descriptions, milestones, progress)</li>
              <li>
                Habits (titles, descriptions, frequency, completion history,
                streaks)
              </li>
              <li>Categories (names, colors, icons)</li>
              <li>Reminders and notification preferences</li>
              <li>AI Advisor chat history</li>
              <li>Subscription tier preference</li>
              <li>UI preferences (e.g., sidebar state)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              2.2 Data Shared with Third-Party AI Services
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you use the AI Advisor feature, the following data is sent to
              an external AI service to generate personalized productivity
              recommendations:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Your chat messages to the AI Advisor</li>
              <li>
                Summaries of your tasks (titles, completion status, priorities)
              </li>
              <li>Summaries of your goals (titles, progress percentages)</li>
              <li>Summaries of your habits (titles, streak counts)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              This data is used solely to provide AI-powered advice and is not
              stored by us on any server. The AI Advisor feature is optional and
              you can use the App without it.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              2.3 Automatically Collected Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              We do not use any analytics, tracking scripts, or advertising
              SDKs. However, standard web hosting infrastructure may collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                IP address, browser type, and device information (standard HTTP
                request metadata collected by our hosting provider, Vercel)
              </li>
              <li>
                Font loading requests to Google Fonts CDN (standard HTTP
                metadata)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Information We Do Not Collect
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We want to be clear about what we do not collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                We do not collect personal identification information (name,
                email, phone number)
              </li>
              <li>We do not require account creation or login</li>
              <li>We do not use tracking cookies or advertising identifiers</li>
              <li>We do not use analytics or crash reporting services</li>
              <li>We do not sell or share your data with advertisers</li>
              <li>
                We do not process payments (subscription features are for
                display purposes)
              </li>
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
              <li>
                Provide core App functionality (task management, goal tracking,
                habit building, analytics dashboard)
              </li>
              <li>
                Generate AI-powered productivity advice when you use the AI
                Advisor feature
              </li>
              <li>
                Enable offline access through service worker caching
              </li>
              <li>
                Remember your UI preferences (e.g., sidebar state)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Data Storage and Security
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Your productivity data (tasks, goals, habits, chat history) is
              stored entirely in your browser&apos;s local storage on your
              device. We do not maintain a server-side database for user
              application data.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              Please be aware that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                Clearing your browser data or uninstalling the App will
                permanently delete your locally stored data
              </li>
              <li>
                Your data is not synced across devices
              </li>
              <li>
                We recommend periodically backing up important information
                stored in the App
              </li>
            </ul>
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
                <strong>AI Service Provider:</strong> Processes AI Advisor chat
                requests. Data sent is limited to chat messages and productivity
                summaries as described in Section 2.2.
              </li>
              <li>
                <strong>Vercel:</strong> Hosts the App. Subject to{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  className="text-purple-600 hover:text-purple-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vercel&apos;s Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Google Fonts:</strong> Provides typefaces used in the
                App. Subject to{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className="text-purple-600 hover:text-purple-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google&apos;s Privacy Policy
                </a>
                .
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
              Since the App does not require account creation and stores data
              locally, no personal identification information is collected from
              any user.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Your Rights and Choices
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                <strong>Delete your data:</strong> You can delete all your data
                at any time by clearing your browser&apos;s local storage or
                uninstalling the App.
              </li>
              <li>
                <strong>Opt out of AI features:</strong> You can use the App
                without the AI Advisor. No data is sent to external AI services
                unless you actively use this feature.
              </li>
              <li>
                <strong>Disable notifications:</strong> You can manage
                notification permissions through your device settings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Cookies
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The App uses one functional cookie (<code>sidebar_state</code>) to
              remember your sidebar UI preference. This is not a tracking cookie
              and contains only a boolean value. We do not use any analytics,
              advertising, or third-party tracking cookies.
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
