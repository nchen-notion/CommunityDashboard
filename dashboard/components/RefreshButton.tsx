"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Status = "idle" | "running" | "done" | "error";

export function RefreshButton() {
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    // Resume polling if a scrape was already running when the page loaded
    fetch("/api/scrape-status")
      .then((r) => r.json())
      .then((data) => {
        if (mountedRef.current && data.running) {
          setStatus("running");
          startPolling();
        }
      })
      .catch(() => {});
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/scrape-status");
        const data = await res.json();
        if (!data.running && mountedRef.current) {
          stopPolling();
          setStatus(data.conclusion === "success" ? "done" : "error");
          router.refresh(); // re-fetches all server component data (live Notion + archives)
          setTimeout(() => {
            if (mountedRef.current) setStatus("idle");
          }, 3000);
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 5_000);
  }

  async function handleClick() {
    if (status === "running") return;
    setStatus("running");
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (res.status === 409) {
        // Another scrape is already running — just attach to it
        startPolling();
        return;
      }
      const data = await res.json();
      if (data.ok) {
        startPolling();
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const label =
    status === "running" ? "Scraping… (~2 hrs)" :
    status === "done"    ? "Done!" :
    status === "error"   ? "Failed" :
    "Run scrape";

  return (
    <div className="flex flex-col items-end gap-0.5">
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
      {status === "done" && (
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {label}
    </button>
    <span className="text-[10px] text-muted">~2 hrs · ~$40</span>
    </div>
  );
}
