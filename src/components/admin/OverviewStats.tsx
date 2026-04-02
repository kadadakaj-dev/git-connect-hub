import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import BookingDetailsDialog, { type AdminBookingDetails } from '@/components/admin/BookingDetailsDialog';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isWithinInterval, subDays, startOfDay } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Calendar, BarChart3, Package, TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

type Booking = AdminBookingDetails;

const OverviewStats = () => {
  const { language } = useLanguage();
  const today = useMemo(() => new Date(), []);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name_sk, name_en, category, price, duration)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Booking[];
    }
  });

  const { data: services } = useQuery({
    queryKey: ['admin-services-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    }
  });

  // --- Process Statistics ---
  const stats = useMemo(() => {
    if (!bookings) return null;

    const activeBookings = bookings.filter(b => b.status !== 'cancelled');
    
    // 1. Basic Counts
    const todayCount = activeBookings.filter(b => isToday(new Date(b.date))).length;
    
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const weekCount = activeBookings.filter(b => 
      isWithinInterval(new Date(b.date), { start: weekStart, end: weekEnd })
    ).length;

    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const monthCount = activeBookings.filter(b => 
      isWithinInterval(new Date(b.date), { start: monthStart, end: monthEnd })
    ).length;

    const pendingCount = bookings.filter(b => b.status === 'pending').length;

    // 2. Revenue Calculation (Current Month)
    const monthlyConfirmedRevenue = activeBookings
      .filter(b => b.status === 'confirmed' && isWithinInterval(new Date(b.date), { start: monthStart, end: monthEnd }))
      .reduce((sum, b) => sum + (Number(b.services?.price) || 0), 0);
    
    const monthlyPotentialRevenue = activeBookings
      .filter(b => b.status === 'pending' && isWithinInterval(new Date(b.date), { start: monthStart, end: monthEnd }))
      .reduce((sum, b) => sum + (Number(b.services?.price) || 0), 0);

    // 3. Chart Data: Last 7 Days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(startOfDay(today), 6 - i);
      const dayBookings = activeBookings.filter(b => 
        startOfDay(new Date(b.date)).getTime() === d.getTime()
      ).length;
      return {
        name: format(d, 'eee', { locale: language === 'sk' ? sk : undefined }),
        count: dayBookings,
        fullDate: format(d, 'd. MMMM', { locale: language === 'sk' ? sk : undefined })
      };
    });

    // 4. Service Distribution (Top 5)
    const serviceMap = new Map<string, number>();
    activeBookings.forEach(b => {
      if (b.services) {
        const name = language === 'sk' ? b.services.name_sk : b.services.name_en;
        serviceMap.set(name, (serviceMap.get(name) || 0) + 1);
      }
    });
    const serviceData = Array.from(serviceMap.entries())
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      todayCount,
      weekCount,
      monthCount,
      pendingCount,
      monthlyConfirmedRevenue,
      monthlyPotentialRevenue,
      last7Days,
      serviceData
    };
  }, [bookings, language, today]);

  // Recent bookings (last 5)
  const recentBookings = bookings?.slice(0, 5) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            {language === 'sk' ? 'Potvrdené' : 'Confirmed'}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20 shadow-sm">
            <XCircle className="w-3 h-3 mr-1" />
            {language === 'sk' ? 'Zrušené' : 'Cancelled'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 shadow-sm">
            <Clock className="w-3 h-3 mr-1" />
            {language === 'sk' ? 'Čakajúce' : 'Pending'}
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'd. MMM', { locale: language === 'sk' ? sk : undefined });
  };

  const COLORS = ['#1a365d', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

  if (bookingsLoading || !stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="lg-glass-card overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-bold text-lg-color-brand-blue uppercase tracking-[0.2em]">
              {language === 'sk' ? 'Dnes' : "Today"}
            </CardTitle>
            <div className="p-2.5 rounded-2xl bg-lg-color-brand-blue/10 text-lg-color-brand-blue shadow-inner">
              <Calendar className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 relative">
            <p className="text-3xl sm:text-4xl font-extrabold text-lg-color-text-ink tracking-tight">{stats.todayCount}</p>
            <p className="text-[10px] sm:text-xs text-lg-color-text-slate mt-2 font-semibold bg-lg-color-brand-glow px-2 py-1 rounded-full w-fit">
              {format(today, 'd. MMMM', { locale: language === 'sk' ? sk : undefined })}
            </p>
          </CardContent>
        </Card>

        <Card className="lg-glass-card overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-bold text-lg-color-brand-blue uppercase tracking-[0.2em]">
              {language === 'sk' ? 'Týždeň' : 'Week'}
            </CardTitle>
            <div className="p-2.5 rounded-2xl bg-lg-color-success/10 text-lg-color-success shadow-inner">
              <BarChart3 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 relative">
            <p className="text-3xl sm:text-4xl font-extrabold text-lg-color-text-ink tracking-tight">{stats.weekCount}</p>
            <div className="flex items-center text-[10px] sm:text-xs text-lg-color-success mt-2 font-bold bg-lg-color-success/5 px-2 py-1 rounded-full w-fit">
              <TrendingUp className="w-3 h-3 mr-1" />
              {language === 'sk' ? 'Aktívne' : 'Active'}
            </div>
          </CardContent>
        </Card>

        <Card className="lg-glass-card overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-bold text-lg-color-brand-blue uppercase tracking-[0.2em]">
              {language === 'sk' ? 'Čakajúce' : 'Pending'}
            </CardTitle>
            <div className="p-2.5 rounded-2xl bg-lg-color-brand-blue-dark/10 text-lg-color-brand-blue-dark shadow-inner">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 relative">
            <p className="text-3xl sm:text-4xl font-extrabold text-lg-color-text-ink tracking-tight">{stats.pendingCount}</p>
            <p className="text-[10px] sm:text-xs text-lg-color-text-slate mt-2 font-semibold italic">
              {language === 'sk' ? 'Vyžadujú akciu' : 'Requires action'}
            </p>
          </CardContent>
        </Card>

        <Card className="lg-glass-card overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
            <CardTitle className="text-[10px] sm:text-xs font-bold text-lg-color-brand-blue uppercase tracking-[0.2em]">
              {language === 'sk' ? 'Tržby' : 'Revenue'}
            </CardTitle>
            <div className="p-2.5 rounded-2xl bg-lg-color-brand-blue-light/10 text-lg-color-brand-blue-dark shadow-inner">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 relative">
            <p className="text-3xl sm:text-4xl font-extrabold text-lg-color-text-ink tracking-tight">{stats.monthlyConfirmedRevenue} €</p>
            <div className="flex flex-col gap-0.5 mt-2">
              <span className="text-[10px] text-lg-color-brand-blue font-bold uppercase tracking-wider">
                {language === 'sk' ? 'Potvrdené' : 'Confirmed'}
              </span>
              <span className="text-[9px] text-lg-color-text-slate font-medium">
                + {stats.monthlyPotentialRevenue} € {language === 'sk' ? 'čakajúce' : 'potential'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <Card className="lg:col-span-2 lg-glass-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-lg-color-brand-blue-dark">
              <BarChart3 className="w-5 h-5 text-lg-color-brand-blue" />
              {language === 'sk' ? 'Trend rezervácií (7 dní)' : 'Booking Trend (7 days)'}
            </CardTitle>
            <CardDescription className="text-lg-color-text-slate opacity-80">{language === 'sk' ? 'Počet rezervácií za posledný týždeň' : 'Daily bookings volume for the last week'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full pt-4 min-h-[250px]">
              {isMounted && containerWidth > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.last7Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3B82F6" 
                    radius={[6, 6, 0, 0]} 
                    barSize={32}
                  >
                    {stats.last7Days.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 6 ? '#24476B' : '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg-glass-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-lg-color-brand-blue-dark">
              <Package className="w-5 h-5 text-lg-color-brand-blue-dark" />
              {language === 'sk' ? 'Top služby' : 'Top Services'}
            </CardTitle>
            <CardDescription className="text-lg-color-text-slate opacity-80">{language === 'sk' ? 'Najžiadanejšie procedúry' : 'Most requested treatments'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full min-h-[250px]">
              {isMounted && containerWidth > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              )}
              <div className="space-y-2 mt-2">
                {stats.serviceData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate max-w-[120px]">{s.name}</span>
                    </div>
                    <span className="font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="lg-glass-card shadow-sm">
        <CardHeader className="p-5 sm:p-8 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-2xl font-bold text-lg-color-text-ink">
                {language === 'sk' ? 'Posledné rezervácie' : 'Recent Activity'}
              </CardTitle>
              <CardDescription className="text-lg-color-text-slate opacity-80">
                {language === 'sk' ? 'Prehľad posledných pohybov v systéme' : 'Overview of the latest booking updates'}
              </CardDescription>
            </div>
            <div className="p-3 rounded-2xl bg-primary/5 text-primary">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-8 pt-4">
          {recentBookings.length > 0 ? (
            <>
              {/* Mobile Card List */}
              <div className="space-y-4 md:hidden">
                {recentBookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => setSelectedBooking(booking)}
                    className="w-full lg-glass-card--interactive p-4 text-left"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#1a2b42]">{booking.client_name}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {booking.services
                            ? (language === 'sk' ? booking.services.name_sk : booking.services.name_en)
                            : '-'}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground font-medium bg-blue-50/50 p-2 rounded-lg">
                      <Calendar className="w-3 h-3 mr-1.5 text-blue-500" />
                      {formatDate(booking.date)} • <Clock className="w-3 h-3 mx-1.5 text-blue-500" /> {booking.time_slot}
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden rounded-2xl border border-[var(--glass-border-subtle)] overflow-hidden md:block">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold py-4">{language === 'sk' ? 'Klient' : 'Client'}</TableHead>
                      <TableHead className="font-bold py-4">{language === 'sk' ? 'Služba' : 'Service'}</TableHead>
                      <TableHead className="font-bold py-4">{language === 'sk' ? 'Dátum a čas' : 'Date & Time'}</TableHead>
                      <TableHead className="font-bold py-4">{language === 'sk' ? 'Stav' : 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer transition-colors hover:bg-blue-50/30 group"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <TableCell className="font-bold text-[#1a2b42] py-4">{booking.client_name}</TableCell>
                        <TableCell className="font-medium text-slate-600">
                          {booking.services
                            ? (language === 'sk' ? booking.services.name_sk : booking.services.name_en)
                            : '-'}
                        </TableCell>
                        <TableCell className="font-medium text-slate-500 italic">
                          {formatDate(booking.date)} <span className="mx-2 text-slate-300">|</span> {booking.time_slot}
                        </TableCell>
                        <TableCell className="py-4">{getStatusBadge(booking.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium italic">
                {language === 'sk'
                  ? 'Zatiaľ nie sú žiadne rezervácie'
                  : 'No bookings yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <BookingDetailsDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBooking(null);
          }
        }}
      />
    </div>
  );
};

export default OverviewStats;
