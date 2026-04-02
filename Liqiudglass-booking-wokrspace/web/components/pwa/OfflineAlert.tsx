"use client";

import { useEffect, useState } from "react";

export function OfflineAlert() {
  const [status, setStatus] = useState<"online" | "offline" | "reconnecting">("online");

  useEffect(() => {
    const goOffline = () => setStatus("offline");
    const goOnline = () => {
      setStatus("reconnecting");
      setTimeout(() => setStatus("online"), 2000);
    };

    if (!navigator.onLine) setStatus("offline");

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (status === "online") return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 px-4 py-2 text-center text-sm font-medium transition-colors duration-300 ${status === "reconnecting"
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300"
        }`}
      role="status"
      aria-live="polite"
    >
      {status === "reconnecting"
        ? "Connection restored — syncing…"
        : "You are offline. Some actions may be unavailable."}
    </div>
  );
}
