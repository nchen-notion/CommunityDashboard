"use client";
import { useEffect, useState } from "react";
import { SnapshotButton } from "./SnapshotButton";
import { RefreshButton } from "./RefreshButton";

const HINT = "what does Nosey know?";

export function AdminPanel() {
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // On mount, ask the server whether the cookie is already valid
  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => { if (d?.authed) setUnlocked(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUnlocked(true);
        setInput("");
      } else {
        setError(data?.message ?? "Incorrect password");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-rule px-3 py-1.5 text-xs font-medium text-muted hover:border-ink hover:text-ink transition-colors"
      >
        Admin
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-rule bg-paper p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">Admin</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted hover:text-ink"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {!unlocked ? (
              <form onSubmit={submit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted">Password</span>
                  <input
                    type="password"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setError(""); }}
                    autoFocus
                    disabled={submitting}
                    className={[
                      "rounded-md border bg-paper px-3 py-2 text-sm text-ink outline-none",
                      error ? "border-notion-red" : "border-rule focus:border-ink",
                    ].join(" ")}
                  />
                </label>
                <span className="text-[11px] text-muted">Hint: {HINT}</span>
                {error && <span className="text-[11px] text-notion-red">{error}</span>}
                <button
                  type="submit"
                  disabled={submitting || !input}
                  className="self-start rounded-md border border-rule px-3 py-1.5 text-xs font-medium text-muted hover:border-ink hover:text-ink transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Checking…" : "Unlock"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-[11px] text-muted">Only Nancy should touch this</span>
                <div className="flex flex-wrap items-start gap-2">
                  <SnapshotButton />
                  <RefreshButton />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
