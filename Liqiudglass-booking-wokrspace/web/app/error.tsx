"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
    error,
    reset
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center transition-colors duration-500">
            <div className="mx-auto max-w-sm">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg
                        className="h-10 w-10 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-semibold text-foreground">Niečo sa pokazilo</h1>

                <p className="mt-2 text-muted-foreground">
                    Nastala neočakávaná chyba. Náš tím bol upozornený.
                </p>

                {error.digest && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground/60">
                        Error ID: {error.digest}
                    </p>
                )}

                <button
                    onClick={reset}
                    className="mt-6 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-glow active:scale-95 transition-all hover:shadow-glow-lg"
                >
                    Skúsiť znova
                </button>
            </div>
        </main>
    );
}
