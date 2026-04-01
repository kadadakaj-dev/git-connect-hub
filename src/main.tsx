import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register Service Worker for PWA & Push Notifications
// Safe registration to avoid InvalidStateError in IDE webviews or non-standard environments
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Only register if we're in a standard secure context or localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:' || isLocalhost;
    
    // Skip if we detect IDE context or we're in Vite's development server
    const isDev = import.meta.env.DEV;
    const isIDE = navigator.userAgent.includes('Code') || navigator.userAgent.includes('Vantage');
    
    if (isSecure && !isIDE && !isDev) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((err) => {
          console.warn("SW registration skipped or failed:", err.message);
        });
    } else {
      console.log("SW registration skipped: unstable environment.");
    }
  });
}

