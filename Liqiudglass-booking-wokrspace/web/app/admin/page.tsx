"use client";

export const dynamic = "force-static";


import { useCallback, useEffect, useMemo, useState } from "react";
import { LiveCalendar } from "./components/LiveCalendar";
import { RevenueChart } from "../../components/dashboard/RevenueChart";
import { StatsGrid } from "../../components/dashboard/StatsGrid";
import { ServiceManager } from "../../components/dashboard/ServiceManager";
import { calculateOccupancyRate } from "../../components/dashboard/statsUtils";
import { useRealtimeBookings } from "../../hooks/useRealtimeBookings";
import { BookingRow, getSupabaseClient } from "../../utils/supabase/client";

const FALLBACK_OPENING_HOURS_PER_DAY = 10;

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { bookings, feed, bookingsToday, loading, error } = useRealtimeBookings();
  const [currency, setCurrency] = useState("EUR");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/admin");
    }
  }, [user, authLoading, router]);

  const updateBookingStatus = useCallback(async (bookingId: string, status: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-api-key";

    try {
      const res = await fetch(`${API_BASE}/api/tenants/tenant_1/bookings/${bookingId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
      console.error(err);
    }
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
      .filter(
        (b) =>
          (b.status === "confirmed" || b.status === "completed") &&
          new Date(b.start_time).getTime() >= cutoff
      )
      .reduce((sum, b) => sum + Number(b.services?.price ?? 0), 0);
  }, [bookings]);

  const occupancyRate = useMemo(() => {
    const totalOpeningHoursWeekly = FALLBACK_OPENING_HOURS_PER_DAY * 7;
    return calculateOccupancyRate(bookings, totalOpeningHoursWeekly);
  }, [bookings]);

  const chartData = useMemo(() => {
    const perDay = new Map<string, number>();
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;
      const dayLabel = new Date(booking.start_time).toLocaleDateString("sk-SK", {
        month: "short",
        day: "numeric"
      });
      const current = perDay.get(dayLabel) ?? 0;
      perDay.set(dayLabel, current + Number(booking.services?.price ?? 0));
    }

    return Array.from(perDay.entries())
      .map(([label, value]) => ({ label, value }))
      .slice(-14);
  }, [bookings]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 transition-colors duration-500 md:p-6" data-testid="admin-dashboard">
      <div className="mx-auto grid max-w-7xl gap-4">
        <header className="rounded-2xl border border-border-gold bg-secondary/50 p-6 shadow-xl shadow-primary/5 backdrop-blur-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Rezervácie v reálnom čase — prehľad a správa.</p>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500 transition-colors">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border-gold bg-secondary/30 p-8 text-center backdrop-blur-xl transition-colors">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground font-medium">Načítavam...</p>
            </div>
          </div>
        ) : (
          <div className="animate-slide-up space-y-4">
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
          </div>
        )}
      </div>
    </main>
  );
}
