import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// --- IMMUTABLE PRODUCTION GUARD ---
const REQUIRED_PROJECT_REF = 'gtefgucwbskgknsdirvj';
const EXPECTED_SUPABASE_URL = `https://${REQUIRED_PROJECT_REF}.supabase.co`;

if (!import.meta.env.VITE_SUPABASE_URL?.includes(REQUIRED_PROJECT_REF)) {
  const currentUrl = import.meta.env.VITE_SUPABASE_URL || 'missing';
  console.error(`[SECURITY HALT] VITE_SUPABASE_URL mismatch. Required: ${REQUIRED_PROJECT_REF}, Got: ${currentUrl}`);
  
  if (import.meta.env.DEV) {
    console.warn("[DEV MODE] Security halt bypassed to allow local debugging of environment variables.");
  } else {
    document.body.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; text-align: center; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color: #1e293b; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="max-width: 440px; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0;">
          <div style="background: #fee2e2; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17.01"/></svg>
          </div>
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em;">Nepovolený prístup</h1>
          <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">Táto verzia aplikácie je nakonfigurovaná výhradne pre produkčné prostredie.</p>
          
          <div style="text-align: left; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #475569; font-weight: 600;">Detaily prostredia:</p>
            <p style="margin: 4px 0 0; font-size: 12px; font-family: monospace; color: #64748b; word-break: break-all;">Ref: ${REQUIRED_PROJECT_REF}<br>Url: ${currentUrl}</p>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 0 0 20px;">
          
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 600; margin-bottom: 8px;">Restricted Access</h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">This deployment is restricted to the authorized production environment.</p>
        </div>
      </div>
    `;
    throw new Error("SECURITY_HALT_INVALID_ENV");
  }
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

