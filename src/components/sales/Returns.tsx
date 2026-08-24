import React, { useState, FormEvent } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, RotateCcw, AlertCircle, CheckCircle2, FileText, User, ShoppingBag, Plus, X, CornerDownLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sale } from '@/src/types';
import { cn } from '@/lib/utils';

interface ReturnRequest {
  id: string;
  saleId: string;
  customerName: string;
  date: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function Returns({ sales, currencySymbol = 'FC' }: { sales: Sale[], currencySymbol?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [returns, setReturns] = useState<ReturnRequest[]>([
    { id: 'RET-001', saleId: 'SALE-123', customerName: 'Jean Dupont', date: new Date().toISOString(), amount: 15000, reason: 'Article défectueux', status: 'pending' },
    { id: 'RET-002', saleId: 'SALE-120', customerName: 'Marie Curie', date: '2026-04-10T10:00:00Z', amount: 4200, reason: 'Erreur de taille', status: 'approved' },
    { id: 'RET-003', saleId: 'SALE-115', customerName: 'Paul Biya', date: '2026-04-05T14:30:00Z', amount: 120000, reason: 'Changement d\'avis', status: 'rejected' },
  ]);

  const handleStatusUpdate = (id: string, newStatus: 'approved' | 'rejected') => {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast.success(`Retour ${newStatus === 'approved' ? 'approuvé' : 'rejeté'} avec succès`);
  };

  const handleCreateReturn = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const saleId = formData.get('saleId') as string;
    const sale = sales.find(s => s.id === saleId);

    const newReturn: ReturnRequest = {
      id: `RET-${Math.floor(Math.random() * 1000)}`,
      saleId: saleId,
      customerName: sale ? 'Client Vente' : 'Client Inconnu',
      date: new Date().toISOString(),
      amount: parseFloat(formData.get('amount') as string),
      reason: formData.get('reason') as string,
      status: 'pending'
    };

    setReturns([newReturn, ...returns]);
    setIsDialogOpen(false);
    toast.success('Demande de retour enregistrée');
  };

  const filteredReturns = returns.filter(r => 
    r.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Litiges & Retours</h1>
          <p className="text-muted-foreground font-medium">Gestion centralisée des remboursements et de la traçabilité des avoirs.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button type="button" className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-amber-500/20 gap-2" />}>
            <RotateCcw className="w-5 h-5" />
            Nouveau Dossier
          </DialogTrigger>
          <DialogContent className="bg-popover border-border text-foreground sm:max-w-md rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Initier un Retour</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateReturn} className="space-y-6 py-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Référence de Transaction</label>
                <Select name="saleId" required>
                  <SelectTrigger className="bg-muted/50 border-border h-12 rounded-xl font-bold">
                    <SelectValue placeholder="Sélectionner une vente" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {sales.map(sale => (
                      <SelectItem key={sale.id} value={sale.id} className="font-bold">
                        Vente <span className="text-primary">#{sale.id}</span> - {sale.totalTTC.toLocaleString()} {currencySymbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantum (Amount)</label>
                  <Input name="amount" type="number" step="0.01" required className="bg-muted/50 border-border h-12 rounded-xl font-bold" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horodatage</label>
                  <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} readOnly className="bg-muted/50 border-border h-12 rounded-xl font-bold opacity-50" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Motif & Justification</label>
                <Input name="reason" required placeholder="Description explicite du défaut..." className="bg-muted/50 border-border h-12 rounded-xl font-bold" />
              </div>
              <DialogFooter className="pt-4 border-t border-border mt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">Annuler</Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-xl px-8 h-12">Valider le Dossier</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 border-2 border-border shadow-xl border-l-amber-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <RotateCcw className="w-16 h-16" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Dossiers Instruits</p>
          <p className="text-3xl font-black tracking-tight text-amber-500">{returns.filter(r => r.status === 'pending').length}</p>
          <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-tighter">En attente d'arbitrage hiérarchique</p>
        </div>
        <div className="bg-card rounded-2xl p-6 border-2 border-border shadow-xl border-l-emerald-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Décaissé (Remboursements)</p>
          <p className="text-3xl font-black tracking-tight text-foreground">
            {returns.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.amount, 0).toLocaleString('fr-FR')} {currencySymbol}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-tighter">Impact direct sur la liquidité (Caisse)</p>
        </div>
        <div className="bg-card rounded-2xl p-6 border-2 border-border shadow-xl border-l-destructive relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertCircle className="w-16 h-16" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Efficacité Opérationnelle</p>
          <p className="text-3xl font-black tracking-tight text-destructive">
             {((returns.length / (sales.length || 1)) * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-tighter">Index de retour sur transactions totales</p>
        </div>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        <Input
          placeholder="Filtrer les dossiers (Vente, Client, ID)..."
          className="pl-12 bg-card/50 border-border h-12 rounded-xl font-bold shadow-inner"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border-2 border-border bg-card shadow-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 border-b-2 border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">Référence Dossier</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">Transaction / Identité</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">Justification</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14 text-right">Remboursement</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14 text-center">Statut Audit</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14 text-right">Décision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReturns.map((ret) => (
              <TableRow key={ret.id} className="hover:bg-muted/30 border-b border-border transition-colors group">
                <TableCell className="px-6 py-4 font-mono text-[12px] font-black text-primary">
                  {ret.id}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-black uppercase">Vente ID: {ret.saleId}</span>
                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 uppercase tracking-tighter">
                      <User className="w-3 h-3 text-primary" /> {ret.customerName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-[12px] text-muted-foreground font-medium italic">
                  "{ret.reason}"
                </TableCell>
                <TableCell className="px-6 py-4 text-right font-black text-foreground text-[13px]">
                  {ret.amount.toLocaleString('fr-FR')} {currencySymbol}
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-black px-2 h-5 border-none uppercase tracking-tighter",
                    ret.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                    ret.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-destructive/10 text-destructive"
                  )}>
                    {ret.status === 'pending' ? 'INSTRUCTION' : ret.status === 'approved' ? 'VALIDÉ' : 'REJETÉ'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {ret.status === 'pending' ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-[9px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg px-3 transition-all"
                          onClick={() => handleStatusUpdate(ret.id, 'approved')}
                        >
                          Approuver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-[9px] font-black uppercase tracking-widest border-destructive/30 text-destructive hover:bg-destructive hover:text-white rounded-lg px-3 transition-all"
                          onClick={() => handleStatusUpdate(ret.id, 'rejected')}
                        >
                          Rejeter
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-[8px] font-bold opacity-30 border-border uppercase tracking-widest h-6 rounded-md">Archive</Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
