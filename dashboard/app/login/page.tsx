"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function NotionMark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 126" width={size} height={size} aria-hidden className="text-ink">
      <path
        fill="currentColor"
        d="M22.5 7.6L77.4 3.5c6.7-.6 8.4-.2 12.6 2.9l17.5 12.3c2.9 2.1 3.9 2.7 3.9 5v83.4c0 4.3-1.6 6.8-7 7.2L40 118.6c-4.1.2-6.1-.4-8.3-3.2L18.6 98.6c-2.4-3.3-3.4-5.7-3.4-8.6V14.7c0-3.5 1.6-6.4 7.3-7.1z"
      />
      <path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M77.4 11.3L24.5 15.3c-2.7.2-3.3 1.6-2.3 2.6L34.6 27c2.6 1.9 6 1.7 9.1 1.5l49.2-2.9c2.1-.2 4.4-1 4.4-2.7 0-1.7-1-2.5-3.7-4.4L80.1 11.4c-.7-.5-1.5-.5-2.7 0M30 32.6v55.5c0 3 1.5 4.1 4.9 3.9l54.2-3.1c3.4-.2 3.9-2.2 3.9-4.6V29.1c0-2.4-.9-3.7-3-3.5l-56.6 3.3c-2.3.2-3.4 1.4-3.4 3.7m54 3c.4 1.7 0 3.4-1.7 3.6l-2.6.5v38.3c-2.3 1.2-4.4 2-6.2 2-2.9 0-3.6-.9-5.7-3.6L51.2 51.9v25.1l5.4 1.2s0 3.2-4.4 3.2L40 82.1c-.4-.7 0-2.5 1.2-2.9l3.1-.9V44.4l-4.3-.4c-.4-1.7.5-4.1 3.2-4.3l13.7-.9 18.7 28.7v-25.4l-4.5-.5c-.4-2.1 1.2-3.6 3-3.7L84 35.7z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-rule bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <NotionMark size={20} />
          <span className="font-serif text-lg font-semibold text-ink">Community Dashboard</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-lg border border-rule px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>

        <p className="text-xs text-muted">
          Hint: find the password in the{" "}
          <a
            href="https://app.dev.notion.com/p/notion/Community-Reach-Dashboard-352b35e6e67f809aa1e2c1acee781fca?source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink"
          >
            Community Reach Dashboard
          </a>{" "}
          page.
        </p>
      </div>
    </div>
  );
}
