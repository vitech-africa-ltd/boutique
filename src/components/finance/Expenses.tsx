import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Wallet, Calendar, Tag, ArrowDownRight, Filter, Receipt, Landmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Expense } from '@/src/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const EXPENSE_CATEGORIES = [
  'Loyer', 'Utilités', 'Salaires', 'Transport', 'Marketing', 'Maintenance', 'Stock', 'Divers'
];

interface ExpensesProps {
  currencySymbol?: string;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
}

export function Expenses({ currencySymbol = 'FC', expenses, onAddExpense }: ExpensesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Divers',
    paymentMethod: 'cash'
  });

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  
  const biggestCategory = expenses.length > 0 
    ? [...expenses].sort((a, b) => b.amount - a.amount)[0].category
    : '-';

  const handleSubmit = () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const expense: Expense = {
      id: `EXP-${Math.random().toString(36).substr(2, 9)}`,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      paymentMethod: newExpense.paymentMethod,
      date: new Date().toISOString()
    };

    onAddExpense(expense);
    setIsDialogOpen(false);
    setNewExpense({ description: '', amount: '', category: 'Divers', paymentMethod: 'cash' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Comptabilité des Charges</h2>
          <p className="text-sm text-muted-foreground font-medium">Contrôlez vos sorties de fonds et optimisez votre rentabilité.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="gap-2 bg-destructive hover:bg-destructive/90 text-white font-black uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl shadow-lg shadow-destructive/20" />}>
            <div className="flex items-center gap-2 text-white">
              <Plus className="w-4 h-4" />
              Nouvelle Dépense
            </div>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Saisir une Dépense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
                <Input 
                  placeholder="ex: Facture Électricité, Loyer..." 
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                  className="bg-background border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Montant ({currencySymbol})</label>
                  <Input 
                    type="number" 
                    step="any"
                    placeholder="0.00" 
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                    className="bg-background border-border font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catégorie</label>
                  <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleSubmit} 
                className="w-full bg-primary font-black uppercase text-[10px] tracking-widest h-12"
              >
                Confirmer l'Enregistrement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-card border-border shadow-sm border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 block">Total des Charges</span>
            <div className="text-2xl font-black text-destructive">{totalExpenses.toLocaleString('fr-FR')} {currencySymbol}</div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">Données cumulées de la période</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 block">Poste de Dépense Majeur</span>
            <div className="text-2xl font-black text-white">{biggestCategory}</div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">Basé sur le volume financier</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 block">Ratio de Cashflow</span>
            <div className="text-2xl font-black text-emerald-500">82.4%</div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">Santé financière globale</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="p-4 px-8 border-b border-border bg-muted/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-black uppercase tracking-widest">Journal des Transactions Sortantes</h3>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 opacity-50">
            {expenses.length} entrées
          </Badge>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-b border-border text-[10px] font-black uppercase tracking-widest">
              <TableHead className="px-8 py-4">Transaction / Description</TableHead>
              <TableHead className="px-8 py-4">Secteur</TableHead>
              <TableHead className="px-8 py-4">Date de Valeur</TableHead>
              <TableHead className="px-8 py-4 text-right">Débit</TableHead>
              <TableHead className="px-8 py-4 text-center">Mode de Paiement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic text-sm">
                  Aucune charge enregistrée pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted/30 border-b border-border transition-colors group">
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-destructive/5 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                        <ArrowDownRight className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block leading-none mb-1">{expense.description}</span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter opacity-60">REF: {expense.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-[12px] font-medium text-muted-foreground underline decoration-border underline-offset-4">
                    {new Date(expense.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right font-black text-destructive text-sm tabular-nums">
                    -{expense.amount.toLocaleString('fr-FR')} {currencySymbol}
                  </TableCell>
                  <TableCell className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                      <Landmark className="w-3 h-3" />
                      Espèces
                    </div>
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
