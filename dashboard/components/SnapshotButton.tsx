"use client";
import { useState } from "react";

type Status = "idle" | "running" | "done" | "error";

function easternMonthKey(offset: number): string {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  et.setMonth(et.getMonth() + offset);
  const y = et.getFullYear();
  const m = String(et.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

export function SnapshotButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [month, setMonth] = useState<string>(() => easternMonthKey(0));

  const monthOptions = [easternMonthKey(-1), easternMonthKey(0), easternMonthKey(1)];

  async function handleClick() {
    if (status === "running") return;
    setStatus("running");
    setErrorMsg("");
    try {
      const res = await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("done");
      } else {
        setStatus("error");
        setErrorMsg(data.message ?? "Unknown error");
        console.error("[snapshot]", data.message);
      }
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Network error");
    }
    setTimeout(() => setStatus("idle"), 5000);
  }

  const label =
    status === "running" ? "Saving…" :
    status === "done"    ? "Saved!" :
    status === "error"   ? "Failed" :
    "Take Snapshot";

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        disabled={status === "running"}
        className="rounded-md border border-rule bg-paper px-2 py-1.5 text-xs text-muted hover:border-ink hover:text-ink disabled:cursor-not-allowed"
      >
        {monthOptions.map((m) => (
          <option key={m} value={m}>{formatMonth(m)}</option>
        ))}
      </select>
      <button
        onClick={handleClick}
        disabled={status === "running"}
        title={status === "error" ? errorMsg : `Save snapshot as ${formatMonth(month)}`}
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
    </div>
  );
}
