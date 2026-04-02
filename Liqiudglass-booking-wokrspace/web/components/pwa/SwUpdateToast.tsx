"use client";

import { useEffect, useState } from "react";

export function SwUpdateToast() {
    const [showReload, setShowReload] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const handleControllerChange = () => {
            window.location.reload();
        };

        const checkWaiting = (reg: ServiceWorkerRegistration) => {
            if (reg.waiting) {
                setWaitingWorker(reg.waiting);
                setShowReload(true);
            }
        };

        const handleStateChange = (event: Event) => {
            const sw = event.target as ServiceWorker;
            if (sw.state === "installed") {
                setWaitingWorker(sw);
                setShowReload(true);
            }
        };

        const handleRegistration = async () => {
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) return;

            checkWaiting(reg);

            reg.addEventListener("updatefound", () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener("statechange", handleStateChange);
                }
            });
        };

        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
        void handleRegistration();

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
        };
    }, []);

    const handleUpdate = () => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: "SKIP_WAITING" });
        }
        setShowReload(false);
    };

    if (!showReload) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-gold bg-card px-4 py-3 text-sm shadow-2xl shadow-primary/10 backdrop-blur-xl">
                <span className="text-foreground">Nová verzia je dostupná</span>
                <button
                    onClick={handleUpdate}
                    className="shrink-0 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-glow-sm active:scale-95"
                >
                    Obnoviť
                </button>
            </div>
        </div>
    );
}
