"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-white p-6 text-center">
      <div className="mb-6 text-6xl">📡</div>
      <h1 className="mb-3 text-3xl font-bold text-gray-900">You&apos;re Offline</h1>
      <p className="mb-6 max-w-md text-gray-600">
        It looks like you&apos;ve lost your internet connection. Don&apos;t worry — your tasks
        are saved locally and will sync when you&apos;re back online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
      >
        Try Again
      </button>
    </div>
  );
}
