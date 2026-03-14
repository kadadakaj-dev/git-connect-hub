import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import BookingDetailsDialog, { type AdminBookingDetails } from '@/components/admin/BookingDetailsDialog';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isWithinInterval } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Calendar, BarChart3, Package, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

type Booking = AdminBookingDetails;

const OverviewStats = () => {
  const { language } = useLanguage();
  const today = new Date();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name_sk, name_en),
          employees (full_name)
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

  // Calculate statistics
  const todayBookings = bookings?.filter(b => {
    const bookingDate = new Date(b.date);
    return isToday(bookingDate) && b.status !== 'cancelled';
  }).length || 0;

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekBookings = bookings?.filter(b => {
    const bookingDate = new Date(b.date);
    return isWithinInterval(bookingDate, { start: weekStart, end: weekEnd }) && b.status !== 'cancelled';
  }).length || 0;

  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthBookings = bookings?.filter(b => {
    const bookingDate = new Date(b.date);
    return isWithinInterval(bookingDate, { start: monthStart, end: monthEnd }) && b.status !== 'cancelled';
  }).length || 0;

  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;

  // Recent bookings (last 5)
  const recentBookings = bookings?.slice(0, 5) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            {language === 'sk' ? 'Potvrdené' : 'Confirmed'}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            {language === 'sk' ? 'Zrušené' : 'Cancelled'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
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

  if (bookingsLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'sk' ? 'Rezervácie dnes' : "Today's Bookings"}
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Calendar className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayBookings}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(today, 'd. MMMM yyyy', { locale: language === 'sk' ? sk : undefined })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'sk' ? 'Tento týždeň' : 'This Week'}
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <BarChart3 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{weekBookings}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(weekStart, 'd. MMM', { locale: language === 'sk' ? sk : undefined })} - {format(weekEnd, 'd. MMM', { locale: language === 'sk' ? sk : undefined })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'sk' ? 'Tento mesiac' : 'This Month'}
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthBookings}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(today, 'MMMM yyyy', { locale: language === 'sk' ? sk : undefined })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'sk' ? 'Čakajúce' : 'Pending'}
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingBookings}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'sk' ? 'Na potvrdenie' : 'Awaiting confirmation'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Services */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {language === 'sk' ? 'Aktívne služby' : 'Active Services'}
            </CardTitle>
            <CardDescription>
              {language === 'sk' ? `${services?.length || 0} aktívnych služieb` : `${services?.length || 0} active services`}
            </CardDescription>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Package className="w-5 h-5" />
          </div>
        </CardHeader>
      </Card>

      {/* Recent Bookings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>
            {language === 'sk' ? 'Posledné rezervácie' : 'Recent Bookings'}
          </CardTitle>
          <CardDescription>
            {language === 'sk' 
              ? 'Posledných 5 rezervácií' 
              : 'Last 5 bookings'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBookings.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {recentBookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => setSelectedBooking(booking)}
                    className="w-full rounded-[20px] border border-[var(--glass-border-subtle)] bg-white/72 p-4 text-left shadow-[0_12px_24px_rgba(126,195,255,0.08)] transition-colors hover:bg-white/82"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[hsl(var(--soft-navy))]">{booking.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.services
                            ? (language === 'sk' ? booking.services.name_sk : booking.services.name_en)
                            : '-'}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.date)} • {booking.time_slot}
                    </p>
                  </button>
                ))}
              </div>

              <div className="hidden rounded-md border overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'sk' ? 'Klient' : 'Client'}</TableHead>
                      <TableHead>{language === 'sk' ? 'Služba' : 'Service'}</TableHead>
                      <TableHead>{language === 'sk' ? 'Dátum' : 'Date'}</TableHead>
                      <TableHead>{language === 'sk' ? 'Stav' : 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <TableCell className="font-medium">{booking.client_name}</TableCell>
                        <TableCell>
                          {booking.services
                            ? (language === 'sk' ? booking.services.name_sk : booking.services.name_en)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {formatDate(booking.date)} • {booking.time_slot}
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {language === 'sk' 
                ? 'Zatiaľ nie sú žiadne rezervácie' 
                : 'No bookings yet'}
            </p>
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
