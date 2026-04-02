export default function Loading() {
    return (
        <main className="min-h-screen bg-background p-4 transition-colors duration-500">
            <div className="mx-auto max-w-md space-y-4 animate-pulse">
                {/* Auth card skeleton */}
                <div className="rounded-2xl bg-card p-4 shadow-sm">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="mt-2 h-5 w-48 rounded bg-muted" />
                    <div className="mt-3 flex gap-2">
                        <div className="h-12 w-40 rounded-xl bg-muted" />
                        <div className="h-12 w-20 rounded-xl bg-muted" />
                    </div>
                </div>

                {/* Services skeleton */}
                <div className="rounded-2xl bg-card p-4 shadow-sm">
                    <div className="h-6 w-32 rounded bg-muted" />
                    <div className="mt-3 space-y-2">
                        <div className="h-12 w-full rounded-xl bg-muted" />
                        <div className="h-12 w-full rounded-xl bg-muted" />
                        <div className="h-12 w-full rounded-xl bg-muted" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-10 w-16 rounded-full bg-muted" />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
