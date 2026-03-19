"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export default function DeleteAccountPage() {
  const { user, signOut } = useAppStore();
  const [confirmed, setConfirmed] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = () => {
    // Clear all persisted data from localStorage
    localStorage.removeItem("zen-planner-storage");
    signOut();
    setDeleted(true);
  };

  if (deleted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Deleted</h1>
          <p className="text-gray-600 mb-6">
            Your account and all associated data have been permanently deleted from this device.
            This includes your profile, tasks, goals, habits, chat history, and subscription information.
          </p>
          <Link
            href="/"
            className="inline-block bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Delete Your Account</h1>
        <p className="text-sm text-gray-500 mb-8">Zen Planner Account Deletion</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What happens when you delete your account</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Deleting your account will permanently remove all data stored by Zen Planner on this device.
              Since all data is stored locally in your browser, deletion is immediate and irreversible.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">The following data will be permanently deleted:</h3>
              <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                <li>Your account profile (name, email, password)</li>
                <li>All tasks and subtasks</li>
                <li>All goals and milestones</li>
                <li>All habits and completion history</li>
                <li>AI Advisor chat history</li>
                <li>Subscription and trial information</li>
                <li>All app preferences and settings</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data retention</h2>
            <p className="text-gray-700 leading-relaxed">
              Zen Planner stores all user data locally on your device using browser storage (localStorage).
              No user data is stored on our servers. Once deleted, your data cannot be recovered as there are
              no server-side backups. Deletion is immediate with no retention period.
            </p>
          </section>

          {user ? (
            <section className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Delete your account</h2>
              <p className="text-gray-700 mb-4">
                You are currently signed in as <strong>{user.email}</strong>. To proceed with account deletion,
                confirm below.
              </p>
              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  I understand that deleting my account will permanently remove all my data and this action cannot be undone.
                </span>
              </label>
              <button
                onClick={handleDelete}
                disabled={!confirmed}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  confirmed
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Permanently Delete My Account
              </button>
            </section>
          ) : (
            <section className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Delete your account</h2>
              <p className="text-gray-700 mb-4">
                To delete your account, please sign in to the app first, then return to this page.
                Alternatively, you can clear your browser data for this site to remove all Zen Planner data.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">How to clear your data manually:</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-1 text-sm">
                  <li>Open your browser settings</li>
                  <li>Go to Privacy &amp; Security &gt; Clear browsing data</li>
                  <li>Select &quot;Cookies and site data&quot;</li>
                  <li>Clear data for zenplanner.vercel.app</li>
                </ol>
              </div>
            </section>
          )}

          <section className="border-t pt-6">
            <p className="text-sm text-gray-500">
              If you have questions about account deletion, please review our{" "}
              <Link href="/privacy-policy" className="text-violet-600 hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
