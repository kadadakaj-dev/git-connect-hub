"use client";

type FeedItem = {
  id: string;
  type: "INSERT" | "UPDATE";
  bookingId: string;
  status: string;
  at: string;
};

export function StatsGrid({
  revenue,
  bookingsToday,
  occupancyRate,
  feed,
  currency
}: {
  revenue: number;
  bookingsToday: number;
  occupancyRate: number;
  feed: FeedItem[];
  currency: string;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <article className="glass-edge rounded-2xl bg-card/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-all duration-300" data-testid="stat-revenue">
          <p className="text-sm text-muted-foreground">Príjmy (30 dní)</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {currency} {revenue.toFixed(2)}
          </p>
        </article>
        <article className="glass-edge rounded-2xl bg-card/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-all duration-300" data-testid="stat-bookings">
          <p className="text-sm text-muted-foreground">Rezervácie dnes</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{bookingsToday}</p>
        </article>
        <article className="glass-edge rounded-2xl bg-card/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-all duration-300 sm:col-span-2 lg:col-span-1 xl:col-span-2" data-testid="stat-occupancy">
          <p className="text-sm text-muted-foreground">Obsadenosť</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{occupancyRate.toFixed(1)}%</p>
        </article>
      </div>

      <aside className="glass-edge rounded-2xl bg-card/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl" data-testid="live-feed">
        <h3 className="text-xl font-semibold text-foreground">Live feed</h3>
        <div className="mt-3 space-y-2">
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground">Zatiaľ žiadna aktivita.</p>
          ) : (
            feed.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-secondary p-3 text-sm transition-all duration-300"
              >
                <p className="font-medium text-foreground">
                  {item.type} · {item.status}
                </p>
                <p className="text-xs text-muted-foreground">Booking {item.bookingId.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground/60">{new Date(item.at).toLocaleTimeString()}</p>
              </div>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}
