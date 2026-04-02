"use client";

import { motion } from "framer-motion";
import { TrendingUp, CalendarDays, Gauge, Radio } from "lucide-react";

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
  currency,
}: {
  revenue: number;
  bookingsToday: number;
  occupancyRate: number;
  feed: FeedItem[];
  currency: string;
}) {
  const cards = [
    {
      label: "Prijmy (30 dni)",
      value: `${currency} ${revenue.toFixed(2)}`,
      icon: <TrendingUp size={20} />,
      glowColor: "rgba(212, 175, 55, 0.15)",
    },
    {
      label: "Rezervacie dnes",
      value: bookingsToday.toString(),
      icon: <CalendarDays size={20} />,
      glowColor: "rgba(59, 130, 246, 0.12)",
    },
    {
      label: "Obsadenost",
      value: `${occupancyRate.toFixed(1)}%`,
      icon: <Gauge size={20} />,
      glowColor: "rgba(34, 197, 94, 0.12)",
    },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {cards.map((card, i) => (
          <motion.article
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative overflow-hidden rounded-2xl liquid-glass glass-edge p-5 ${
              i === 2 ? "sm:col-span-2 lg:col-span-1 xl:col-span-2" : ""
            }`}
            data-testid={`stat-${card.label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div
              className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl pointer-events-none animate-glow-pulse"
              style={{ background: card.glowColor }}
            />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {card.value}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {card.icon}
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <aside
        className="rounded-2xl liquid-glass glass-edge p-5"
        data-testid="live-feed"
      >
        <div className="flex items-center gap-2 mb-3">
          <Radio size={16} className="text-primary animate-pulse" />
          <h3 className="text-lg font-semibold text-foreground">Live feed</h3>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Zatial ziadna aktivita.
            </p>
          ) : (
            feed.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl liquid-glass-subtle p-3 text-sm"
              >
                <p className="font-medium text-foreground">
                  {item.type === "INSERT" ? "Nova" : "Aktualizovana"} - {item.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  Booking {item.bookingId.slice(0, 8)}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {new Date(item.at).toLocaleTimeString()}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}
