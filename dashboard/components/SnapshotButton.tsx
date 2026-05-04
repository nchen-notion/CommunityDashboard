"use client";
import { useState } from "react";

type Status = "idle" | "running" | "done" | "error";

export function SnapshotButton() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    if (status === "running") return;
    setStatus("running");
    try {
      const res = await fetch("/api/snapshot", { method: "POST" });
      const data = await res.json();
      setStatus(data.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 3000);
  }

  const label =
    status === "running" ? "Saving…" :
    status === "done"    ? "Saved!" :
    status === "error"   ? "Failed" :
    "Take Snapshot";

  return (
    <button
      onClick={handleClick}
      disabled={status === "running"}
      className={[
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        status === "idle"    && "border border-rule text-muted hover:border-ink hover:text-ink",
        status === "running" && "border border-rule text-muted cursor-wait",
        status === "done"    && "border border-notion-green text-notion-green",
        status === "error"   && "border border-notion-red text-notion-red",
      ].filter(Boolean).join(" ")}
    >
      {status === "running" && (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {label}
    </button>
  );
}
