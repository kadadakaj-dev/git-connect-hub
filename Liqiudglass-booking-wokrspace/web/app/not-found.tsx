"use client";

export const dynamic = "force-static";

import Link from "next/link";


export default function NotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center transition-colors duration-500">
            <div className="mx-auto max-w-sm">
                <p className="text-7xl font-bold text-muted/80">404</p>

                <h1 className="mt-4 text-2xl font-semibold text-foreground">Stránka nenájdená</h1>

                <p className="mt-2 text-muted-foreground">
                    Stránka, ktorú hľadáte, neexistuje alebo bola presunutá.
                </p>

                <Link
                    href="/"
                    className="mt-6 inline-block h-12 rounded-xl bg-primary px-8 leading-[48px] font-semibold text-primary-foreground shadow-glow active:scale-95 transition-all hover:shadow-glow-lg"
                >
                    Domov
                </Link>
            </div>
        </main>
    );
}
