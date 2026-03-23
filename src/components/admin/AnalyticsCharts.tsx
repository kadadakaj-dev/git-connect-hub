import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { sk } from 'date-fns/locale';

const COLORS = [
  'hsl(210, 60%, 55%)',
  'hsl(150, 50%, 45%)',
  'hsl(280, 50%, 55%)',
  'hsl(35, 80%, 55%)',
  'hsl(0, 60%, 55%)',
  'hsl(180, 50%, 45%)',
];

const AnalyticsCharts = () => {
  const { language } = useLanguage();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-analytics-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, date, time_slot, status, booking_duration, service_id, services(name_sk, name_en, price, category)')
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Revenue per day (last 30 days)
  const revenueData = useMemo(() => {
    if (!bookings) return [];
    const end = new Date();
    const start = subDays(end, 29);
    const days = eachDayOfInterval({ start: startOfDay(start), end: startOfDay(end) });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayBookings = bookings.filter(
        (b) => b.date === dateStr && b.status !== 'cancelled'
      );
      const revenue = dayBookings.reduce((sum, b) => sum + (Number((b as any).services?.price) || 0), 0);
      return {
        date: format(day, 'd.M', { locale: language === 'sk' ? sk : undefined }),
        revenue,
      };
    });
  }, [bookings, language]);

  // Occupancy per day of week (last 30 days)
  const occupancyData = useMemo(() => {
    if (!bookings) return [];
    const end = new Date();
    const start = subDays(end, 29);
    const dayNames = language === 'sk'
      ? ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const counts = Array(7).fill(0);
    const totals = Array(7).fill(0);

    const days = eachDayOfInterval({ start: startOfDay(start), end: startOfDay(end) });
    days.forEach((day) => {
      const dow = day.getDay();
      totals[dow]++;
      const dateStr = format(day, 'yyyy-MM-dd');
      const hasBooking = bookings.some((b) => b.date === dateStr && b.status !== 'cancelled');
      if (hasBooking) counts[dow]++;
    });

    // Reorder to start on Monday
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((i) => ({
      day: dayNames[i],
      occupancy: totals[i] > 0 ? Math.round((counts[i] / totals[i]) * 100) : 0,
    }));
  }, [bookings, language]);

  // Popular services (pie chart)
  const servicesData = useMemo(() => {
    if (!bookings) return [];
    const map = new Map<string, { name: string; count: number }>();
    bookings
      .filter((b) => b.status !== 'cancelled' && (b as any).services)
      .forEach((b) => {
        const svc = (b as any).services;
        const name = language === 'sk' ? svc.name_sk : svc.name_en;
        const existing = map.get(name);
        if (existing) existing.count++;
        else map.set(name, { name, count: 1 });
      });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [bookings, language]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Revenue chart */}
      <Card className="rounded-[24px] border-[var(--glass-border-subtle)] bg-white/60">
        <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
          <CardTitle className="text-base sm:text-lg">
            {language === 'sk' ? 'Tržby za posledných 30 dní' : 'Revenue (last 30 days)'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {language === 'sk' ? 'Celkom' : 'Total'}: <span className="font-semibold text-foreground">{totalRevenue.toFixed(0)} €</span>
          </p>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="h-[220px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 60%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210, 60%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 10%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(0)} €`, language === 'sk' ? 'Tržba' : 'Revenue']}
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(210,10%,90%)', fontSize: 13 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(210, 60%, 55%)"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Occupancy chart */}
        <Card className="rounded-[24px] border-[var(--glass-border-subtle)] bg-white/60">
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-base sm:text-lg">
              {language === 'sk' ? 'Obsadenosť podľa dňa' : 'Occupancy by day'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 10%, 90%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, language === 'sk' ? 'Obsadenosť' : 'Occupancy']}
                    contentStyle={{ borderRadius: 12, border: '1px solid hsl(210,10%,90%)', fontSize: 13 }}
                  />
                  <Bar dataKey="occupancy" fill="hsl(150, 50%, 45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Popular services pie */}
        <Card className="rounded-[24px] border-[var(--glass-border-subtle)] bg-white/60">
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-base sm:text-lg">
              {language === 'sk' ? 'Najpopulárnejšie služby' : 'Most popular services'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="h-[220px] sm:h-[260px]">
              {servicesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={servicesData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      innerRadius="40%"
                      paddingAngle={3}
                      label={({ name, percent }) => `${name.length > 12 ? name.slice(0, 12) + '…' : name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      style={{ fontSize: 11 }}
                    >
                      {servicesData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(value) => (value.length > 18 ? value.slice(0, 18) + '…' : value)}
                    />
                    <Tooltip
                      formatter={(value: number) => [value, language === 'sk' ? 'Rezervácií' : 'Bookings']}
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(210,10%,90%)', fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">
                  {language === 'sk' ? 'Žiadne dáta' : 'No data'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
