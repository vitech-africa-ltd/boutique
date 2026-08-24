import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, CreditCard, ArrowUpRight, ArrowDownRight, User, AlertCircle, Save, X, DollarSign, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customer } from '@/src/types';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

const paymentSchema = z.object({
  customerId: z.string().min(1, 'Veuillez sélectionner un client'),
  amount: z.number().min(1, 'Le montant doit être au moins 1'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function Credits({ customers, currencySymbol = 'FC' }: { customers: Customer[], currencySymbol?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>('');
  const [initialAmount, setInitialAmount] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customerId: '',
      amount: 0
    }
  });

  useEffect(() => {
    if (isDialogOpen) {
      reset({
        customerId: selectedDebtorId,
        amount: initialAmount ? parseFloat(initialAmount) : 0
      });
    } else {
      reset();
      setSelectedDebtorId('');
      setInitialAmount('');
    }
  }, [isDialogOpen, selectedDebtorId, initialAmount, reset]);
  
  const debtors = customers.filter(c => c.balance < 0);
  const totalDebt = Math.abs(debtors.reduce((acc, c) => acc + c.balance, 0));

  const filteredDebtors = debtors.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const onSubmit = (data: PaymentFormData) => {
    const debtor = debtors.find(d => d.id === data.customerId);
    if (!debtor) return;

    // In a real app, we'd call an update function here
    toast.success(`Paiement de ${data.amount.toLocaleString()} ${currencySymbol} enregistré pour ${debtor.name}`);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Gestion des Crédits & Arriérés</h2>
          <p className="text-sm text-muted-foreground">Suivez les dettes de vos clients et gérez les recouvrements.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="gap-2 bg-[#FF4D4D] hover:bg-[#D43F3F]">
              <CreditCard className="w-4 h-4" />
              Enregistrer un Paiement
            </Button>
          }/>
          <DialogContent className="sm:max-w-[450px] bg-[#1F2125] border-border text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#00E676]" />
                Encaisser un Recouvrement
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">Saisissez les détails du paiement client pour mettre à jour sa balance.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Client Débiteur *</label>
                  {errors.customerId && <span className="text-[9px] text-destructive font-bold">{errors.customerId.message}</span>}
                </div>
                <Controller
                  name="customerId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={cn("bg-[#151619] border-border h-12 rounded-xl px-4 font-bold", errors.customerId && "border-destructive/50")}>
                        <SelectValue placeholder="Sélectionner le client" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1F2125] border-border text-white">
                        {debtors.map(d => (
                          <SelectItem key={d.id} value={d.id} className="font-medium">
                            {d.name} ({Math.abs(d.balance).toLocaleString()} {currencySymbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Montant Reçu ({currencySymbol}) *</label>
                  {errors.amount && <span className="text-[9px] text-destructive font-bold">{errors.amount.message}</span>}
                </div>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00E676]/50" />
                  <Input 
                    type="number" 
                    placeholder="0"
                    {...register('amount')}
                    className={cn("bg-[#151619] border-border h-12 rounded-xl pl-12 font-bold text-lg", errors.amount && "border-destructive/50")}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground italic ml-1">Le montant sera déduit du solde débiteur du client.</p>
              </div>

              <DialogFooter className="pt-6 border-t border-border gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground">Annuler</Button>
                <Button type="submit" className="bg-[#00E676] hover:bg-[#00C868] text-black font-black uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-[#00E676]/10">
                  Valider l'Encaissement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Total Créances Clients</span>
            <div className="text-2xl font-bold text-[#FF4D4D]">{totalDebt.toLocaleString('fr-FR')} {currencySymbol}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Nombre de Débiteurs</span>
            <div className="text-2xl font-bold text-white">{debtors.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Recouvrement (Mois)</span>
            <div className="text-2xl font-bold text-[#00E676]">0 {currencySymbol}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un débiteur..."
          className="pl-10 bg-[#1F2125] border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#151619]">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Client</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Contact</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Montant Dû</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Niveau d'Alerte</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDebtors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Aucun arriéré de paiement détecté.
                </TableCell>
              </TableRow>
            ) : (
              filteredDebtors.map((debtor) => (
                <TableRow key={debtor.id} className="hover:bg-white/[0.02] border-b border-border transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-muted-foreground font-bold text-xs">
                        {debtor.name[0]}
                      </div>
                      <span className="text-[13px] font-medium text-white">{debtor.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[13px] text-muted-foreground">
                    {debtor.phone}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right font-bold text-[#FF4D4D]">
                    {Math.abs(debtor.balance).toLocaleString('fr-FR')} {currencySymbol}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    {Math.abs(debtor.balance) > 100000 ? (
                      <Badge className="bg-[#FF4D4D]/20 text-[#FF4D4D] border-none text-[10px]">CRITIQUE</Badge>
                    ) : (
                      <Badge className="bg-[#FFB300]/20 text-[#FFB300] border-none text-[10px]">MODÉRÉ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 text-[11px] border-border hover:bg-[#00E676]/10 hover:text-[#00E676]"
                  onClick={() => {
                    setSelectedDebtorId(debtor.id);
                    setInitialAmount(Math.abs(debtor.balance).toString());
                    setIsDialogOpen(true);
                  }}
                    >
                      Régler
                    </Button>
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
