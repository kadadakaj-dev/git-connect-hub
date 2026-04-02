"use client";

export const dynamic = "force-static";


import { useEffect, useState } from "react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      if (navigator.onLine) {
        setIsOnline(true);
        setTimeout(() => window.location.replace("/"), 1000);
      } else {
        setIsOnline(false);
      }
    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center transition-colors duration-500">
      <div className="mx-auto max-w-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <svg
            className="h-10 w-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-foreground">Ste offline</h1>

        <p className="mt-2 text-muted-foreground">
          Aplikácia je momentálne nedostupná. Skontrolujte pripojenie k internetu
          a skúste to znova.
        </p>

        {isOnline ? (
          <p className="mt-6 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Pripojenie obnovené — presmerovávam...
          </p>
        ) : (
          <button
            onClick={() => window.location.reload()}
            className="mt-6 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-glow active:scale-95 transition-all hover:shadow-glow-lg"
          >
            Skúsiť znova
          </button>
        )}
      </div>
    </main>
  );
}
