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
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Search, Filter, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  date: string;
  time_slot: string;
  status: string;
  notes: string | null;
  created_at: string;
  service_id: string;
  services?: {
    name_sk: string;
    name_en: string;
  };
}

const BookingManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name_sk, name_en)
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

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = 
      booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client_phone.includes(searchTerm);
    
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
      <Card className="border-border/50">
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>
          {language === 'sk' ? 'Všetky rezervácie' : 'All Bookings'}
        </CardTitle>
        <CardDescription>
          {language === 'sk' 
            ? `Celkom ${bookings?.length || 0} rezervácií` 
            : `Total ${bookings?.length || 0} bookings`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={language === 'sk' ? 'Hľadať podľa mena, emailu alebo telefónu...' : 'Search by name, email or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            className="w-full sm:w-[180px]"
          />
        </div>

        {/* Table */}
        {filteredBookings && filteredBookings.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'sk' ? 'Klient' : 'Client'}</TableHead>
                  <TableHead>{language === 'sk' ? 'Služba' : 'Service'}</TableHead>
                  <TableHead>{language === 'sk' ? 'Dátum' : 'Date'}</TableHead>
                  <TableHead>{language === 'sk' ? 'Čas' : 'Time'}</TableHead>
                  <TableHead>{language === 'sk' ? 'Stav' : 'Status'}</TableHead>
                  <TableHead className="text-right">{language === 'sk' ? 'Akcie' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.client_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.client_email}</p>
                        <p className="text-sm text-muted-foreground">{booking.client_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.services 
                        ? (language === 'sk' ? booking.services.name_sk : booking.services.name_en)
                        : '-'}
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
                        {booking.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'cancelled' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || dateFilter
              ? (language === 'sk' ? 'Žiadne rezervácie nezodpovedajú filtrom' : 'No bookings match the filters')
              : (language === 'sk' ? 'Zatiaľ nie sú žiadne rezervácie' : 'No bookings yet')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingManagement;
