import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Landmark, ArrowUpRight, ArrowDownRight, Calendar, Filter, Share2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Sale, Expense } from '@/src/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useERP } from '@/src/lib/useERP';

interface CashflowProps {
  sales: Sale[];
  expenses: Expense[];
}

export function Cashflow({ sales, expenses }: CashflowProps) {
  const { formatAmount } = useERP();
  // Merge and sort transactions
  const transactions = useMemo(() => {
    const saleTransactions = sales.map(s => ({
      id: s.id,
      date: s.date,
      description: `Vente #${s.id.slice(-6)}`,
      type: 'income' as const,
      amount: s.totalTTC,
      category: 'Ventes'
    }));

    const expenseTransactions = expenses.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      type: 'expense' as const,
      amount: e.amount,
      category: e.category
    }));

    return [...saleTransactions, ...expenseTransactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [sales, expenses]);

  // Aggregate data for the last 7 days
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return format(d, 'yyyy-MM-dd');
    });

    return last7Days.map(dateStr => {
      const daySales = sales.filter(s => s.date.startsWith(dateStr));
      const dayExpenses = expenses.filter(e => e.date.startsWith(dateStr));
      
      return {
        name: format(new Date(dateStr), 'EEE', { locale: fr }),
        income: daySales.reduce((sum, s) => sum + s.totalTTC, 0),
        expense: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
      };
    });
  }, [sales, expenses]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Flux de Trésorerie (Cashflow)</h2>
          <p className="text-sm text-muted-foreground">Données consolidées basées sur les ventes et les charges réelles.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2 font-bold text-[10px] uppercase tracking-widest border-border hover:bg-white/5">
            <Share2 className="w-3.5 h-3.5" />
            Exporter PDF
          </Button>
          <Badge variant="outline" className={cn(
            "px-3 py-1 font-bold",
            netBalance >= 0 ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : "bg-destructive/5 text-destructive border-destructive/20"
          )}>
            {netBalance >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            Solde {netBalance >= 0 ? 'Positif' : 'Négatif'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Entrées (Mois)</span>
              <div className="w-8 h-8 rounded-lg bg-[#00E676]/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-[#00E676]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{formatAmount(totalIncome)}</div>
            <p className="text-[10px] text-[#00E676] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Revenus totaux cumulés
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Sorties (TOTAL)</span>
              <div className="w-8 h-8 rounded-lg bg-[#FF4D4D]/10 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-[#FF4D4D]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{formatAmount(totalExpense)}</div>
            <p className="text-[10px] text-[#FF4D4D] mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Dépenses totales cumulées
            </p>
          </CardContent>
        </Card>
        <Card className={cn(
          "border-border/20",
          netBalance >= 0 ? "bg-emerald-500/5" : "bg-destructive/5"
        )}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className={cn(
                "text-[11px] uppercase tracking-wider font-bold",
                netBalance >= 0 ? "text-emerald-500" : "text-destructive"
              )}>Solde Net</span>
              <Landmark className={cn(
                "w-4 h-4",
                netBalance >= 0 ? "text-emerald-500" : "text-destructive"
              )} />
            </div>
            <div className="text-2xl font-bold text-white">{formatAmount(netBalance)}</div>
            <p className={cn(
              "text-[10px] mt-1 uppercase font-bold",
              netBalance >= 0 ? "text-emerald-500/60" : "text-destructive/60"
            )}>Liquidités Disponibles</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1F2125] border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">Évolution de la Trésorerie (7 jours)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] min-w-0 w-full relative">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E676" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00E676" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D32" vertical={false} />
              <XAxis dataKey="name" stroke="#8E9299" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8E9299" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151619', border: '1px solid #2A2D32', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="income" stroke="#00E676" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke="#FF4D4D" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden">
        <div className="p-4 px-6 border-b border-border flex justify-between items-center bg-[#1F2125]">
          <div className="font-semibold text-white">Dernières Transactions</div>
          <Button variant="ghost" size="sm" className="text-[11px] gap-2 text-muted-foreground hover:text-white">
            <Filter className="w-3 h-3" /> Filtrer
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-[#151619]">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Date</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Description</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Catégorie</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id} className="hover:bg-white/[0.02] border-b border-border transition-colors">
                <TableCell className="px-6 py-4 text-[13px] text-muted-foreground">
                  {new Date(t.date).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      t.type === 'income' ? "bg-[#00E676]/10" : "bg-[#FF4D4D]/10"
                    )}>
                      {t.type === 'income' ? <ArrowUpRight className="w-4 h-4 text-[#00E676]" /> : <ArrowDownRight className="w-4 h-4 text-[#FF4D4D]" />}
                    </div>
                    <span className="text-[13px] font-medium text-white">{t.description}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge variant="secondary" className="bg-white/5 text-muted-foreground border-none text-[10px]">
                    {t.category}
                  </Badge>
                </TableCell>
                <TableCell className={cn(
                  "px-6 py-4 text-right font-bold",
                  t.type === 'income' ? "text-[#00E676]" : "text-[#FF4D4D]"
                )}>
                  {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
