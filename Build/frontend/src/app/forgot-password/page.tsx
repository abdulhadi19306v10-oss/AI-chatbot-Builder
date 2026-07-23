"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);
      setMessage(data.message || "If that email is registered, a reset link has been sent.");
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
              Reset Password
            </h1>
            <p className="text-secondary text-[15px]">We will send you a link to reset your password</p>
          </div>

          {message && (
            <div className="mb-6 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-signal-teal text-sm rounded-lg font-medium">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-error text-sm rounded-lg">
              {error}
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-5 mb-6">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-ink placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-signal-teal focus:border-signal-teal transition text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-signal-teal hover:bg-teal-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? "Sending link…" : "Send Reset Link"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-secondary mt-6">
            Remembered your password?{" "}
            <Link href="/login" className="font-semibold text-signal-teal hover:text-teal-dark transition">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
