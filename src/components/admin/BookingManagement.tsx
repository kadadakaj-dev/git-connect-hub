import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import BookingDetailsDialog, { type AdminBookingDetails } from '@/components/admin/BookingDetailsDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Search, Filter, CheckCircle, XCircle, Clock, Calendar, Eye, Trash2 } from 'lucide-react';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

type Booking = AdminBookingDetails & {
  service_id: string;
  employee_id: string | null;
};

const BookingManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name_sk, name_en, category, price, duration),
          employees (full_name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Booking[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success(language === 'sk' ? 'Stav rezervácie aktualizovaný' : 'Booking status updated');
    },
    onError: () => {
      toast.error(language === 'sk' ? 'Chyba pri aktualizácii' : 'Error updating status');
    }
  });
  
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      // We rely on ON DELETE CASCADE in the database to remove 
      // booking_reminders, therapist_notes, and booking_events.
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success(language === 'sk' ? 'Rezervácia bola natrvalo odstránená' : 'Booking permanently deleted');
    },
    onError: (error: Error) => {
      console.error('Delete error:', error);
      toast.error(language === 'sk' ? 'Chyba pri mazaní rezervácie' : 'Error deleting booking');
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async (password: string) => {
      // 1. Verify password by re-authenticating
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) throw new Error('No active session');

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: password
      });

      if (authError) {
        throw new Error(language === 'sk' ? 'Nesprávne admin heslo' : 'Incorrect admin password');
      }

      // 2. Perform the deletion (cleaned up related data first)
      await supabase.from('booking_reminders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('therapist_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success(language === 'sk' ? 'Všetky rezervácie boli vymazané' : 'All bookings deleted');
    },
    onError: () => {
      toast.error(language === 'sk' ? 'Chyba pri mazaní rezervácií' : 'Error deleting bookings');
    }
  });

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch =
      booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.client_phone || '').includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesDate = !dateFilter || booking.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

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
    return format(date, 'd. MMMM yyyy', { locale: language === 'sk' ? sk : undefined });
  };

  if (isLoading) {
    return (
      <Card className="rounded-[24px] border-[var(--glass-border-subtle)] bg-white/60">
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[24px] border-[var(--glass-border-subtle)] bg-white/60">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-base sm:text-2xl">
          {language === 'sk' ? 'Všetky rezervácie' : 'All Bookings'}
        </CardTitle>
        <CardDescription>
          {language === 'sk'
            ? `Celkom ${bookings?.length || 0} rezervácií`
            : `Total ${bookings?.length || 0} bookings`}
        </CardDescription>
        {bookings && bookings.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="mt-2 w-fit"
            disabled={deleteAllMutation.isPending}
            onClick={() => {
              const confirmMsg = language === 'sk'
                ? 'Táto akcia VYMAŽE VŠETKY rezervácie z databázy. Akcia je nevratná! Ak chcete pokračovať, zadajte vaše admin heslo:'
                : 'This action will DELETE ALL bookings from the database. This is irreversible! To continue, enter your admin password:';
              
              const password = window.prompt(confirmMsg);
              if (password) {
                deleteAllMutation.mutate(password);
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {language === 'sk' ? 'Vymazať všetky rezervácie' : 'Delete all bookings'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/50 p-2.5 sm:p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={language === 'sk' ? 'Hľadať podľa mena, emailu alebo telefónu...' : 'Search by name, email or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-[14px] border-[var(--glass-border-subtle)]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-[14px] border-[var(--glass-border-subtle)]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={language === 'sk' ? 'Stav' : 'Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'sk' ? 'Všetky stavy' : 'All statuses'}</SelectItem>
              <SelectItem value="pending">{language === 'sk' ? 'Čakajúce' : 'Pending'}</SelectItem>
              <SelectItem value="confirmed">{language === 'sk' ? 'Potvrdené' : 'Confirmed'}</SelectItem>
              <SelectItem value="cancelled">{language === 'sk' ? 'Zrušené' : 'Cancelled'}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-[180px] rounded-[14px] border-[var(--glass-border-subtle)]"
          />
        </div>

        {/* Table */}
        {filteredBookings && filteredBookings.length > 0 ? (
          <>
            {/* Mobile card view */}
            <div className="space-y-2 md:hidden">
              {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="w-full rounded-[24px] border border-[var(--glass-border-subtle)] bg-white/72 p-3 text-left shadow-[0_8px_16px_rgba(126,195,255,0.06)] transition-colors hover:bg-white/82 cursor-pointer"
                  >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[hsl(var(--soft-navy))] truncate">{booking.client_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.services
                          ? (language === 'sk' ? booking.services.name_sk : booking.services.name_en)
                          : '-'}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(booking.date)} • {booking.time_slot}</span>
                    <div className="flex gap-1">
                      {booking.status !== 'confirmed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-green-600"
                          onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: booking.id, status: 'confirmed' }); }}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-red-700"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          const msg = language === 'sk' ? 'Naozaj chcete túto rezerváciu natrvalo VYMAZAŤ?' : 'Permanently DELETE this booking?';
                          if (window.confirm(msg)) {
                            deleteBookingMutation.mutate(booking.id); 
                          }
                        }}
                        disabled={deleteBookingMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden rounded-[16px] border border-[var(--glass-border-subtle)] overflow-x-auto md:block">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
                  <TableRow>
                    <TableHead>{language === 'sk' ? 'Klient' : 'Client'}</TableHead>
                    <TableHead>{language === 'sk' ? 'Služba' : 'Service'}</TableHead>
                    <TableHead>{language === 'sk' ? 'Zamestnanec' : 'Employee'}</TableHead>
                    <TableHead>{language === 'sk' ? 'Dátum' : 'Date'}</TableHead>
                    <TableHead>{language === 'sk' ? 'Čas' : 'Time'}</TableHead>
                    <TableHead>{language === 'sk' ? 'Stav' : 'Status'}</TableHead>
                    <TableHead className="text-right">{language === 'sk' ? 'Akcie' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="even:bg-muted/20">
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.client_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.client_email}</p>
                          <p className="text-sm text-muted-foreground">{booking.client_phone || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.services
                          ? (language === 'sk' ? booking.services.name_sk : booking.services.name_en)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {booking.employees?.full_name || (language === 'sk' ? 'Nepriradený' : 'Unassigned')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(booking.date)}
                        </div>
                      </TableCell>
                      <TableCell>{booking.time_slot}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBooking(booking)}
                            className="text-[hsl(var(--soft-navy))] hover:text-[hsl(var(--navy))]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {booking.status !== 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'confirmed' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 hover:text-red-800 hover:bg-red-50"
                            onClick={() => {
                              const msg = language === 'sk' ? 'Naozaj chcete túto rezerváciu natrvalo VYMAZAŤ?' : 'Permanently DELETE this booking?';
                              if (window.confirm(msg)) {
                                deleteBookingMutation.mutate(booking.id);
                              }
                            }}
                            disabled={deleteBookingMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || dateFilter
              ? (language === 'sk' ? 'Žiadne rezervácie nezodpovedajú filtrom' : 'No bookings match the filters')
              : (language === 'sk' ? 'Zatiaľ nie sú žiadne rezervácie' : 'No bookings yet')}
          </div>
        )}
      </CardContent>

      <BookingDetailsDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBooking(null);
          }
        }}
      />
    </Card>
  );
};

export default BookingManagement;
