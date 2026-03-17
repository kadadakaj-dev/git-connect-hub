import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, UserCircle } from 'lucide-react';

interface EmployeeForm {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  bio_sk: string;
  bio_en: string;
  is_active: boolean;
  sort_order: number;
}

const defaultForm: EmployeeForm = {
  full_name: '', email: '', phone: '', position: 'therapist',
  bio_sk: '', bio_en: '', is_active: true, sort_order: 0,
};

const EmployeeManagement = () => {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(defaultForm);
  const [editing, setEditing] = useState(false);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['admin-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (d: EmployeeForm) => {
      const payload = {
        full_name: d.full_name, email: d.email || null, phone: d.phone || null,
        position: d.position, bio_sk: d.bio_sk || null, bio_en: d.bio_en || null,
        is_active: d.is_active, sort_order: d.sort_order,
      };
      if (d.id) {
        const { error } = await supabase.from('employees').update(payload).eq('id', d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('employees').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-employees'] });
      toast.success(language === 'sk' ? 'Uložené' : 'Saved');
      reset();
    },
    onError: () => toast.error(language === 'sk' ? 'Chyba pri ukladaní' : 'Error saving'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-employees'] });
      toast.success(language === 'sk' ? 'Zamestnanec zmazaný' : 'Employee deleted');
    },
    onError: () => toast.error(language === 'sk' ? 'Chyba pri mazaní' : 'Error deleting'),
  });

  const reset = () => { setForm(defaultForm); setEditing(false); setOpen(false); };

  const handleEdit = (e: any) => {
    setForm({
      id: e.id, full_name: e.full_name, email: e.email || '', phone: e.phone || '',
      position: e.position, bio_sk: e.bio_sk || '', bio_en: e.bio_en || '',
      is_active: e.is_active, sort_order: e.sort_order,
    });
    setEditing(true);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(language === 'sk' ? 'Naozaj chcete zmazať tohto zamestnanca?' : 'Delete this employee?')) {
      deleteMutation.mutate(id);
    }
  };

  const positionLabels: Record<string, Record<string, string>> = {
    therapist: { sk: 'Terapeut', en: 'Therapist' },
    chiropractor: { sk: 'Chiropraktik', en: 'Chiropractor' },
    receptionist: { sk: 'Recepčná', en: 'Receptionist' },
    manager: { sk: 'Manažér', en: 'Manager' },
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{language === 'sk' ? 'Správa zamestnancov' : 'Employee Management'}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(false); setForm(defaultForm); }}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'sk' ? 'Pridať zamestnanca' : 'Add Employee'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing
                  ? (language === 'sk' ? 'Upraviť zamestnanca' : 'Edit Employee')
                  : (language === 'sk' ? 'Nový zamestnanec' : 'New Employee')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'sk' ? 'Meno' : 'Full Name'} *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Telefón' : 'Phone'}</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Pozícia' : 'Position'}</Label>
                  <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(positionLabels).map(([key, labels]) => (
                        <SelectItem key={key} value={key}>{labels[language]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Poradie' : 'Sort Order'}</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Bio (SK)' : 'Bio (SK)'}</Label>
                  <Textarea value={form.bio_sk} onChange={(e) => setForm({ ...form, bio_sk: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Bio (EN)' : 'Bio (EN)'}</Label>
                  <Textarea value={form.bio_en} onChange={(e) => setForm({ ...form, bio_en: e.target.value })} rows={3} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>{language === 'sk' ? 'Aktívny' : 'Active'}</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={reset}>{language === 'sk' ? 'Zrušiť' : 'Cancel'}</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editing ? (language === 'sk' ? 'Uložiť' : 'Save') : (language === 'sk' ? 'Vytvoriť' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'sk' ? 'Meno' : 'Name'}</TableHead>
              <TableHead>{language === 'sk' ? 'Pozícia' : 'Position'}</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>{language === 'sk' ? 'Telefón' : 'Phone'}</TableHead>
              <TableHead>{language === 'sk' ? 'Stav' : 'Status'}</TableHead>
              <TableHead className="text-right">{language === 'sk' ? 'Akcie' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-muted-foreground" />
                    {emp.full_name}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                    {positionLabels[emp.position]?.[language] || emp.position}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{emp.email || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{emp.phone || '-'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${emp.is_active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                    {emp.is_active ? (language === 'sk' ? 'Aktívny' : 'Active') : (language === 'sk' ? 'Neaktívny' : 'Inactive')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(emp)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(emp.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {employees?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {language === 'sk' ? 'Žiadni zamestnanci' : 'No employees'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EmployeeManagement;
