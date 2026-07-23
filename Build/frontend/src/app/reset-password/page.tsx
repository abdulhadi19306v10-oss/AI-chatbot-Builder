"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing. Please request a new link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "This reset link is invalid or has expired.");
      } else {
        setSuccess(true);
        router.push("/login?reset=success");
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to connect to authentication server. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative teal blob — bottom left */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--color-signal-teal) 0%, transparent 70%)",
          transform: "translate(-30%, 30%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo above card */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-signal-teal flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span
            className="text-2xl font-bold text-ink"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            Chatbot Builder
          </span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-10">
          <div className="mb-8">
            <h1
              className="text-3xl font-bold text-ink mb-1.5"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              Choose New Password
            </h1>
            <p className="text-secondary text-[15px]">Set a secure password for your account</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-error text-sm rounded-lg flex flex-col gap-2">
              <span>{error}</span>
              {(error.includes("invalid") || error.includes("expired") || error.includes("missing")) && (
                <Link href="/forgot-password" className="text-xs font-semibold text-red-700 dark:text-red-300 underline hover:no-underline transition">
                  Request a new reset link
                </Link>
              )}
            </div>
          )}

          {!token ? (
            <div className="py-6 text-center">
              <p className="text-sm text-secondary mb-4">No reset token was found in the URL query string.</p>
              <Link href="/forgot-password" className="font-semibold text-signal-teal hover:text-teal-dark transition text-sm">
                Go to Forgot Password
              </Link>
            </div>
          ) : success ? (
            <div className="py-6 text-center">
              <p className="text-sm text-secondary mb-4">Password has been updated. Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 mb-6">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-ink placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-signal-teal focus:border-signal-teal transition text-sm"
                  placeholder="At least 8 characters"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-ink placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-signal-teal focus:border-signal-teal transition text-sm"
                  placeholder="Repeat your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-signal-teal hover:bg-teal-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? "Resetting password…" : "Reset Password"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-secondary mt-6">
            <Link href="/login" className="font-semibold text-signal-teal hover:text-teal-dark transition">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent flex items-center justify-center text-secondary">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
