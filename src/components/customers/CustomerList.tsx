import React, { useState, useEffect } from 'react';
import { Customer } from '@/src/types';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Mail, Phone, MapPin, Trophy, Plus, Minus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const customerSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  email: z.string().email('Format d\'email invalide'),
  phone: z.string().regex(/^(\+?\d{1,4}\s?)?(\d\s?){8,}$/, 'Format de téléphone invalide (min 8 chiffres)'),
  address: z.string().min(5, 'L\'adresse est trop courte'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const loyaltySchema = z.object({
  type: z.enum(['add', 'remove']),
  amount: z.number().int().min(1, 'Montant invalide (min 1)'),
});

type LoyaltyFormData = z.infer<typeof loyaltySchema>;

interface CustomerListProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

export function CustomerList({ customers, onAddCustomer, onUpdateCustomer }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoyaltyDialogOpen, setIsLoyaltyDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const {
    register: registerCustomer,
    handleSubmit: handleSubmitCustomer,
    reset: resetCustomer,
    formState: { errors: customerErrors }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: ''
    }
  });

  const {
    register: registerLoyalty,
    handleSubmit: handleSubmitLoyalty,
    control: controlLoyalty,
    reset: resetLoyalty,
    formState: { errors: loyaltyErrors }
  } = useForm<LoyaltyFormData>({
    resolver: zodResolver(loyaltySchema),
    defaultValues: {
      type: 'add',
      amount: 10
    }
  });

  useEffect(() => {
    if (!isDialogOpen) {
      resetCustomer();
    }
  }, [isDialogOpen, resetCustomer]);

  useEffect(() => {
    if (!isLoyaltyDialogOpen) {
      resetLoyalty();
    }
  }, [isLoyaltyDialogOpen, resetLoyalty]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const onAddSubmit = (data: CustomerFormData) => {
    const random = Math.floor(1000 + Math.random() * 9000);
    const customer: Customer = {
      ...data,
      id: `VI-CLT-${random}`,
      balance: 0,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
    };
    onAddCustomer(customer);
    setIsDialogOpen(false);
    toast.success(`Client ${data.name} ajouté avec succès`);
  };

  const onLoyaltySubmit = (data: LoyaltyFormData) => {
    if (!selectedCustomer) return;

    const { type, amount } = data;
    const newPoints = type === 'add' 
      ? selectedCustomer.loyaltyPoints + amount 
      : Math.max(0, selectedCustomer.loyaltyPoints - amount);

    onUpdateCustomer({
      ...selectedCustomer,
      loyaltyPoints: newPoints
    });

    setIsLoyaltyDialogOpen(false);
    setSelectedCustomer(null);
    toast.success(`Points de fidélité mis à jour pour ${selectedCustomer.name}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              className="pl-10 bg-[#1F2125] border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <Button 
              variant="ghost" 
              onClick={() => setSearchTerm('')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Effacer
            </Button>
          )}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="gap-2 bg-[#00A3FF] hover:bg-[#0082CC]">
              <UserPlus className="w-4 h-4" />
              Nouveau Client
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px] bg-[#1F2125] border-border text-white">
            <DialogHeader>
              <DialogTitle>Ajouter un client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitCustomer(onAddSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Nom complet *</label>
                  {customerErrors.name && <span className="text-[9px] text-destructive font-bold">{customerErrors.name.message}</span>}
                </div>
                <Input {...registerCustomer('name')} placeholder="Ex: Jean Dupont" className={cn("bg-[#151619] border-border", customerErrors.name && "border-destructive/50")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Email *</label>
                    {customerErrors.email && <span className="text-[9px] text-destructive font-bold">{customerErrors.email.message}</span>}
                  </div>
                  <Input {...registerCustomer('email')} type="email" placeholder="jean@example.com" className={cn("bg-[#151619] border-border", customerErrors.email && "border-destructive/50")} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Téléphone *</label>
                    {customerErrors.phone && <span className="text-[9px] text-destructive font-bold">{customerErrors.phone.message}</span>}
                  </div>
                  <Input {...registerCustomer('phone')} placeholder="01 23 45 67 89" className={cn("bg-[#151619] border-border", customerErrors.phone && "border-destructive/50")} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Adresse *</label>
                  {customerErrors.address && <span className="text-[9px] text-destructive font-bold">{customerErrors.address.message}</span>}
                </div>
                <Input {...registerCustomer('address')} placeholder="Adresse complète" className={cn("bg-[#151619] border-border", customerErrors.address && "border-destructive/50")} />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-white">Annuler</Button>
                <Button type="submit" className="bg-[#00A3FF] hover:bg-[#0082CC]">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isLoyaltyDialogOpen} onOpenChange={setIsLoyaltyDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1F2125] border-border text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase tracking-tighter font-black">
              <Trophy className="w-5 h-5 text-amber-500" />
              Gérer la Fidélité
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <form onSubmit={handleSubmitLoyalty(onLoyaltySubmit)} className="space-y-6 py-4">
              <div className="p-4 bg-[#151619] rounded-xl border border-border">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Client</p>
                <p className="text-sm font-bold">{selectedCustomer.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-transparent border-primary/30 text-primary font-mono text-[10px]">
                    Points actuels: {selectedCustomer.loyaltyPoints}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type d'opération</label>
                    {loyaltyErrors.type && <span className="text-[9px] text-destructive font-bold">{loyaltyErrors.type.message}</span>}
                  </div>
                  <Controller
                    name="type"
                    control={controlLoyalty}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={cn("bg-[#151619] border-border h-12 rounded-xl px-4 font-bold", loyaltyErrors.type && "border-destructive/50")}>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1F2125] border-border text-white">
                          <SelectItem value="add" className="font-bold text-emerald-500">📥 Ajouter des points (+)</SelectItem>
                          <SelectItem value="remove" className="font-bold text-destructive">📤 Retirer des points (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre de points</label>
                    {loyaltyErrors.amount && <span className="text-[9px] text-destructive font-bold">{loyaltyErrors.amount.message}</span>}
                  </div>
                  <Input 
                    type="number" 
                    {...registerLoyalty('amount')}
                    className={cn("bg-[#151619] border-border h-12 rounded-xl px-4 font-bold text-lg", loyaltyErrors.amount && "border-destructive/50")} 
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsLoyaltyDialogOpen(false)} 
                  className="text-muted-foreground hover:text-white font-black uppercase text-[10px]"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-widest h-11 px-8 rounded-xl"
                >
                  Valider
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#151619]">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="text-[12px] uppercase text-muted-foreground px-6 py-3">Nom</TableHead>
              <TableHead className="text-[12px] uppercase text-muted-foreground px-6 py-3">Contact</TableHead>
              <TableHead className="text-[12px] uppercase text-muted-foreground px-6 py-3">Solde (Crédit)</TableHead>
              <TableHead className="text-[12px] uppercase text-muted-foreground px-6 py-3 text-center">Points</TableHead>
              <TableHead className="text-[12px] uppercase text-muted-foreground px-6 py-3 text-right">Actions</TableHead>
              <TableHead className="text-[12px] uppercase text-muted-foreground px-6 py-3 text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Aucun client trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-white/[0.02] border-b border-border transition-colors">
                  <TableCell className="font-medium px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white">{customer.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{customer.address}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={cn(
                      "font-bold text-[13px]",
                      customer.balance < 0 ? "text-[#FF4D4D]" : "text-[#00E676]"
                    )}>
                      {customer.balance.toLocaleString('fr-FR')} FCFA
                    </span>
                  </TableCell>
                  <TableCell className="text-center px-6 py-4">
                    <Badge variant="secondary" className="bg-[#00A3FF]/10 text-[#00A3FF] border-none text-[10px] font-bold">
                      {customer.loyaltyPoints} pts
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6 py-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-amber-500 hover:bg-amber-500/10 rounded-lg"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsLoyaltyDialogOpen(true);
                      }}
                      title="Gérer la fidélité"
                    >
                      <Trophy className="w-4 h-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground px-6 py-4">
                    {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
