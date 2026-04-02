"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LiveCalendar } from "./components/LiveCalendar";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ServiceManager } from "@/components/dashboard/ServiceManager";
import { calculateOccupancyRate } from "@/components/dashboard/statsUtils";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { BookingRow, getSupabaseClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const FALLBACK_OPENING_HOURS_PER_DAY = 10;

export default function AdminPage() {
  const { bookings, feed, bookingsToday, loading, error } = useRealtimeBookings();
  const [currency, setCurrency] = useState("EUR");

  const updateBookingStatus = useCallback(async (bookingId: string, status: BookingRow["status"]) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const loadSettings = async () => {
      const { data: settings } = await supabase
        .from("business_settings")
        .select("currency")
        .limit(1)
        .maybeSingle();
      if (settings?.currency) setCurrency(settings.currency);
    };
    void loadSettings();
  }, []);

  const totalRevenue = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return bookings
      .filter((b) => (b.status === "confirmed" || b.status === "completed") && new Date(b.start_time).getTime() >= cutoff)
      .reduce((sum, b) => sum + Number(b.services?.price ?? 0), 0);
  }, [bookings]);

  const occupancyRate = useMemo(() => {
    return calculateOccupancyRate(bookings, FALLBACK_OPENING_HOURS_PER_DAY * 7);
  }, [bookings]);

  const chartData = useMemo(() => {
    const perDay = new Map<string, number>();
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;
      const dayLabel = new Date(booking.start_time).toLocaleDateString("sk-SK", { month: "short", day: "numeric" });
      perDay.set(dayLabel, (perDay.get(dayLabel) ?? 0) + Number(booking.services?.price ?? 0));
    }
    return Array.from(perDay.entries()).map(([label, value]) => ({ label, value })).slice(-14);
  }, [bookings]);

  return (
    <main className="min-h-screen p-4 md:p-6" data-testid="admin-dashboard">
      <div className="mx-auto grid max-w-7xl gap-4">
        {/* Dashboard header */}
        <header className="rounded-2xl liquid-glass-strong glass-edge p-6 shadow-glass-glow">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Rezervacie v realnom case -- prehlad a sprava.
          </p>
        </header>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl liquid-glass border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        {loading ? (
          <div className="rounded-2xl liquid-glass p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Nacitavam...</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <StatsGrid
              revenue={totalRevenue}
              bookingsToday={bookingsToday}
              occupancyRate={occupancyRate}
              feed={feed}
              currency={currency}
            />
            <RevenueChart data={chartData} />
            <LiveCalendar
              bookings={bookings}
              onApprove={(id) => void updateBookingStatus(id, "confirmed")}
              onCancel={(id) => void updateBookingStatus(id, "cancelled")}
            />
            <ServiceManager />
          </motion.div>
        )}
      </div>
    </main>
  );
}
