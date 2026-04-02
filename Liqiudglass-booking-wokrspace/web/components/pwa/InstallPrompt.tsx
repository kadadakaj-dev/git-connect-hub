"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed";
const SHOW_DELAY_MS = 30_000; // Show after 30 seconds

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if user previously dismissed
    if (localStorage.getItem(DISMISS_KEY)) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Show with delay after the prompt event fires
  useEffect(() => {
    if (!deferred) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [deferred]);

  if (!deferred || !visible) return null;

  const handleInstall = async () => {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setDeferred(null);
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl border border-border-gold bg-card p-4 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">Nainštalovať aplikáciu</p>
          <p className="text-xs text-muted-foreground mt-0.5">Rýchly prístup z domovskej obrazovky</p>
        </div>
        <button
          onClick={() => void handleInstall()}
          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-sm active:scale-95"
        >
          Inštalovať
        </button>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss install prompt"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
