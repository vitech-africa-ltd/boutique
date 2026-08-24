import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, UserCheck, Clock, Mail, Phone, ShieldCheck, Save, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const employeeSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  role: z.string().min(1, 'Veuillez choisir un rôle'),
  email: z.string().email('Format d\'email invalide'),
  phone: z.string().regex(/^(\+?\d{1,4}\s?)?(\d\s?){8,}$/, 'Format de téléphone invalide (min 8 chiffres)'),
  status: z.enum(['active', 'on-leave', 'inactive']),
  joinDate: z.string().min(1, 'La date est requise'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Employee extends EmployeeFormData {
  id: string;
}

export function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 'EMP-001', name: 'Alain Tchakounté', role: 'Gérant', email: 'alain@vi-boutique.com', phone: '+237 670 00 00 00', status: 'active', joinDate: '2025-01-10' },
    { id: 'EMP-002', name: 'Sonia Bella', role: 'Vendeuse Senior', email: 'sonia@vi-boutique.com', phone: '+237 690 11 11 11', status: 'active', joinDate: '2025-03-15' },
    { id: 'EMP-003', name: 'Paul Atangana', role: 'Vendeur', email: 'paul@vi-boutique.com', phone: '+237 650 22 22 22', status: 'on-leave', joinDate: '2025-06-01' },
  ]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      role: 'Vendeur',
      email: '',
      phone: '',
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    if (!isDialogOpen) {
      reset();
    }
  }, [isDialogOpen, reset]);

  const onSubmit = (data: EmployeeFormData) => {
    const newEmployee: Employee = {
      ...data,
      id: `VI-EMP-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`
    };

    setEmployees([...employees, newEmployee]);
    setIsDialogOpen(false);
    toast.success('Nouvel employé enregistré avec succès');
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Gestion des Employés (RH)</h2>
          <p className="text-sm text-muted-foreground">Gérez votre équipe, les rôles et les présences.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="gap-2 bg-[#00A3FF] hover:bg-[#0082CC]">
              <UserPlus className="w-4 h-4" />
              Nouvel Employé
            </Button>
          }/>
          <DialogContent className="sm:max-w-[500px] bg-[#1F2125] border-border text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Ajouter un Employé</DialogTitle>
              <DialogDescription className="text-muted-foreground">Enregistrez un nouveau collaborateur dans le système.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Nom Complet *</label>
                  {errors.name && <span className="text-[9px] text-destructive font-bold">{errors.name.message}</span>}
                </div>
                <Input 
                  placeholder="Ex: Jean Dupont"
                  {...register('name')}
                  className={cn("bg-[#151619] border-border h-11", errors.name && "border-destructive/50 focus-visible:ring-destructive/20")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Rôle *</label>
                    {errors.role && <span className="text-[9px] text-destructive font-bold">{errors.role.message}</span>}
                  </div>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={cn("bg-[#151619] border-border h-11", errors.role && "border-destructive/50")}>
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1F2125] border-border text-white">
                          <SelectItem value="Gérant">Gérant</SelectItem>
                          <SelectItem value="Vendeuse Senior">Vendeuse Senior</SelectItem>
                          <SelectItem value="Vendeur">Vendeur</SelectItem>
                          <SelectItem value="Magasinier">Magasinier</SelectItem>
                          <SelectItem value="Caissier">Caissier</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Statut</label>
                    {errors.status && <span className="text-[9px] text-destructive font-bold">{errors.status.message}</span>}
                  </div>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={cn("bg-[#151619] border-border h-11", errors.status && "border-destructive/50")}>
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1F2125] border-border text-white">
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="on-leave">En Congé</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Email *</label>
                    {errors.email && <span className="text-[9px] text-destructive font-bold">{errors.email.message}</span>}
                  </div>
                  <Input 
                    type="email"
                    placeholder="email@entreprise.com"
                    {...register('email')}
                    className={cn("bg-[#151619] border-border h-11", errors.email && "border-destructive/50 focus-visible:ring-destructive/20")}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Téléphone *</label>
                    {errors.phone && <span className="text-[9px] text-destructive font-bold">{errors.phone.message}</span>}
                  </div>
                  <Input 
                    placeholder="+243 ..."
                    {...register('phone')}
                    className={cn("bg-[#151619] border-border h-11", errors.phone && "border-destructive/50 focus-visible:ring-destructive/20")}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Date d'embauche</label>
                  {errors.joinDate && <span className="text-[9px] text-destructive font-bold">{errors.joinDate.message}</span>}
                </div>
                <Input 
                  type="date"
                  {...register('joinDate')}
                  className={cn("bg-[#151619] border-border h-11", errors.joinDate && "border-destructive/50")}
                />
              </div>
              <DialogFooter className="pt-4 border-t border-border mt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground">Annuler</Button>
                <Button type="submit" className="bg-[#00A3FF] hover:bg-[#0082CC] gap-2">
                  <Save className="w-4 h-4" />
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Effectif Total</span>
            <div className="text-2xl font-bold text-white">{employees.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Présents ce Jour</span>
            <div className="text-2xl font-bold text-[#00E676]">{employees.filter(e => e.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">En Congé</span>
            <div className="text-2xl font-bold text-[#FFB300]">{employees.filter(e => e.status === 'on-leave').length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un employé..."
          className="pl-10 bg-[#1F2125] border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#151619]">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Employé</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Rôle / Poste</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Contact</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Statut</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow key={emp.id} className="hover:bg-white/[0.02] border-b border-border transition-colors">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#00A3FF]/10 flex items-center justify-center text-[#00A3FF] font-bold">
                      {emp.name[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-white">{emp.name}</span>
                      <span className="text-[10px] text-muted-foreground">ID: {emp.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[13px] text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00A3FF]" />
                    {emp.role}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Mail className="w-3 h-3" /> {emp.email}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Phone className="w-3 h-3" /> {emp.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <Badge className={cn(
                    "border-none text-[10px] font-bold",
                    emp.status === 'active' ? "bg-[#00E676]/20 text-[#00E676]" : 
                    emp.status === 'on-leave' ? "bg-[#FFB300]/20 text-[#FFB300]" : "bg-white/10 text-muted-foreground"
                  )}>
                    {emp.status === 'active' ? 'ACTIF' : emp.status === 'on-leave' ? 'CONGÉ' : 'INACTIF'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <Button size="sm" variant="ghost" className="h-8 text-[11px] text-muted-foreground hover:text-white">Gérer</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
