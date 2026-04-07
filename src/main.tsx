import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// --- IMMUTABLE PRODUCTION GUARD ---
const REQUIRED_PROJECT_REF = 'gtefgucwbskgknsdirvj';
const EXPECTED_SUPABASE_URL = `https://${REQUIRED_PROJECT_REF}.supabase.co`;

if (!import.meta.env.VITE_SUPABASE_URL?.includes(REQUIRED_PROJECT_REF)) {
  console.error(`[SECURITY HALT] VITE_SUPABASE_URL does not match strictly required project ref: ${REQUIRED_PROJECT_REF}`);
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
    <h2>🚨 SECURITY HALT: Invalid Backend Environment</h2>
    <p>This deployment is restricted to the production environment: <b>${REQUIRED_PROJECT_REF}</b>.</p>
    <p>Current config: ${import.meta.env.VITE_SUPABASE_URL || 'missing'}</p>
  </div>`;
  throw new Error("SECURITY_HALT_INVALID_ENV");
}
// --- END PRODUCTION GUARD ---

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
        .catch((err) => {
          console.warn("SW registration skipped or failed:", err.message);
        });
    } else {
      console.log("SW registration skipped: unstable environment.");
    }
  });
}

