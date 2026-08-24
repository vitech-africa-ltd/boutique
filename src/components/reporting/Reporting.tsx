import { useState, useMemo } from 'react';
import { Sale, Product, Expense } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Download, TrendingUp, ShoppingBag, Landmark, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, Box, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '@/lib/utils';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

import { useERP } from '@/src/lib/useERP';

interface ReportingProps {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  currencySymbol?: string;
}

type FilterPeriod = 'day' | 'week' | 'month' | 'year' | 'all';

export function Reporting({ sales, products, expenses, currencySymbol = 'FC' }: ReportingProps) {
  const { formatAmount } = useERP();
  const [period, setPeriod] = useState<FilterPeriod>('all');

  const filteredSales = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
      default:
        return sales;
    }

    return sales.filter(s => isAfter(new Date(s.date), startDate));
  }, [sales, period]);

  const sortedSales = useMemo(() => 
    [...filteredSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredSales]
  );

  const stats = useMemo(() => {
    const revenue = filteredSales.reduce((acc, s) => acc + s.totalTTC, 0);
    const purchases = filteredSales.reduce((acc, s) => {
      return acc + s.items.reduce((itemAcc, item) => itemAcc + (item.purchasePrice * item.quantity), 0);
    }, 0);
    const profit = revenue - purchases;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const tva = filteredSales.reduce((acc, s) => acc + s.totalTVA, 0);

    return { revenue, profit, margin, tva, count: filteredSales.length, purchases };
  }, [filteredSales]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string, total: number, count: number, profit: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, total: 0, count: 0, profit: 0 };
        }
        const prodData = productSales[item.id];
        prodData.total += (item.priceTTC * item.quantity);
        prodData.count += item.quantity;
        // Search in real products to get purchasePrice for true profit
        const prod = products.find(p => p.id === item.id);
        if (prod) {
          prodData.profit += (item.priceTTC - prod.purchasePrice) * item.quantity;
        }
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredSales, products]);

  const salesByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const cat = item.category || 'Divers';
        categories[cat] = (categories[cat] || 0) + (item.priceTTC * item.quantity);
      });
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSales]);

  const currentMonthSalesByCategory = useMemo(() => {
    const now = new Date();
    const startOfCurrMonth = startOfMonth(now);
    const monthSales = sales.filter(s => isAfter(new Date(s.date), startOfCurrMonth));
    
    const categories: Record<string, number> = {};
    monthSales.forEach(sale => {
      sale.items.forEach(item => {
        const cat = item.category || 'Divers';
        categories[cat] = (categories[cat] || 0) + (item.priceTTC * item.quantity);
      });
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sales]);

  const COLORS = ['#00A3FF', '#00E676', '#FFB300', '#FF4D4D', '#A78BFA', '#F472B6', '#2DD4BF'];

  const totalStockValue = products.reduce((acc, p) => acc + (p.purchasePrice * p.stock), 0);

  const downloadSalesReport = () => {
    const doc = new jsPDF() as any;
    
    doc.setFontSize(20);
    doc.text('VI ERP Pro - Africa Edition', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Rapport de Performance Financière Détaillé', 105, 30, { align: 'center' });
    doc.setFontSize(10);
    
    const periodLabels: Record<FilterPeriod, string> = {
      day: "Aujourd'hui",
      week: "Cette Semaine",
      month: "Ce Mois-ci",
      year: "Cette Année",
      all: "Toutes les périodes"
    };

    doc.text(`Période Filtrée: ${periodLabels[period]} (au ${new Date().toLocaleDateString('fr-FR')})`, 105, 38, { align: 'center' });

    const tableData = sortedSales.map(s => {
      const saleProfit = s.items.reduce((acc, item) => acc + (item.priceTTC - item.purchasePrice) * item.quantity, 0);
      return [
        s.id,
        new Date(s.date).toLocaleString('fr-FR'),
        s.items.length,
        `${s.totalTTC.toFixed(0)} ${currencySymbol}`,
        `${saleProfit.toFixed(0)} ${currencySymbol}`
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['N° Facture', 'Date', 'Articles', 'Total TTC', 'Bénéfice']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 163, 255] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(11);
    doc.text(`Nombre de transactions: ${stats.count}`, 20, finalY);
    doc.text(`Chiffre d'Affaires Total: ${stats.revenue.toLocaleString('fr-FR')} ${currencySymbol}`, 20, finalY + 7);
    doc.text(`Bénéfice Brut Total: ${stats.profit.toLocaleString('fr-FR')} ${currencySymbol}`, 20, finalY + 14);
    doc.text(`Marge Bénéficiaire Moyenne: ${stats.margin.toFixed(1)}%`, 20, finalY + 21);

    doc.save(`rapport_ventes_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Analyse de l'Activité & Rentabilité</h2>
          <p className="text-xs text-muted-foreground mt-1">Génération de rapports détaillés basés sur vos flux de trésorerie.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-[#1F2125] p-1.5 rounded-2xl border border-border shadow-inner">
            {(['day', 'week', 'month', 'year', 'all'] as FilterPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  period === p 
                    ? "bg-[#00A3FF] text-white shadow-[0_4px_12px_rgba(0,163,255,0.3)] scale-105" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : p === 'year' ? 'Année' : 'Tout'}
              </button>
            ))}
          </div>
          <Button 
            variant="outline" 
            type="button"
            className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 gap-2 font-black uppercase tracking-widest h-12 px-6 rounded-xl shadow-lg shadow-primary/5"
            onClick={downloadSalesReport}
          >
            <Download className="w-4 h-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-[#1F2125] border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transactions</CardTitle>
            <ShoppingBag className="w-4 h-4 text-[#00A3FF]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">
              {stats.count.toString().padStart(2, '0')}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Volume de vente</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">C.A BruT</CardTitle>
            <TrendingUp className="w-4 h-4 text-[#00E676]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">
              {formatAmount(stats.revenue)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Encaissements sur période</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border border-l-4 border-l-[#00E676] shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-[#00E676]">Bénéfice Net</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-[#00E676]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#00E676]">
              {formatAmount(stats.profit)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold">Marge: {stats.margin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valeur Stock</CardTitle>
            <Box className="w-4 h-4 text-[#FFB300]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">
              {formatAmount(totalStockValue)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Investissement actuel</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">TVA Collectée</CardTitle>
            <Landmark className="w-4 h-4 text-[#FFB300]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">
              {formatAmount(stats.tva)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">À reverser à l'État</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-2xl border border-border bg-[#1F2125] overflow-hidden shadow-xl">
          <div className="p-5 border-b border-border bg-[#151619] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00A3FF]/10 rounded-lg">
                <FileText className="w-5 h-5 text-[#00A3FF]" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">Historique des Transactions</h3>
                <p className="text-[10px] text-muted-foreground font-bold">{sortedSales.length} opérations enregistrées</p>
              </div>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-[#151619]">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-12">N° Facture</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-12">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-12 text-right">Total TTC</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-12 text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic text-sm">
                    Aucune transaction sur cette période
                  </TableCell>
                </TableRow>
              ) : (
                sortedSales.slice(0, 15).map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-white/[0.02] border-b border-border transition-colors group">
                    <TableCell className="font-mono text-[11px] font-black text-[#00A3FF] px-6">{sale.id}</TableCell>
                    <TableCell className="text-xs font-bold text-foreground/80 px-6">
                      {new Date(sale.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right font-mono font-black text-[#00E676] text-[13px] px-6">
                      {sale.totalTTC.toLocaleString('fr-FR')} {currencySymbol}
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <Badge variant="outline" className="bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20 text-[9px] font-black tracking-widest px-2 py-0.5">
                        VALIDÉ
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1F2125] border-border shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border bg-[#151619]">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00E676]" />
                Top Catégories (Ce Mois)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                  <BarChart data={currentMonthSalesByCategory} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2D32" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      width={80}
                      tick={{ fill: '#888888', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      contentStyle={{ backgroundColor: '#151619', border: '1px solid #2A2D32', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(value: number) => [`${value.toLocaleString()} ${currencySymbol}`, 'Ventes']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {currentMonthSalesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1F2125] border-border shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border bg-[#151619]">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[#00A3FF]" />
                Répartition des Ventes
              </CardTitle>
              <CardDescription className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">Volume financier par catégorie</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#151619', border: '1px solid #2A2D32', borderRadius: '8px', fontSize: '11px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                      formatter={(value: number) => [`${value.toLocaleString()} ${currencySymbol}`, 'Ventes']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1F2125] border-border shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border bg-[#151619]">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                Performance Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-6 divide-y divide-border/30">
              {topProducts.length > 0 ? topProducts.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center group">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-[11px] font-black uppercase truncate group-hover:text-primary transition-colors">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{item.count} unités vendues</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-emerald-500">{formatAmount(item.total)}</p>
                    <p className="text-[9px] text-muted-foreground/60 font-bold italic">Marge: {formatAmount(item.profit)}</p>
                  </div>
                </div>
              )) : (
                <p className="py-8 text-center text-[10px] text-muted-foreground uppercase font-black opacity-30">Aucun produit vendu</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1F2125] border-border shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border bg-[#151619]">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00A3FF]" />
                Structure des Coûts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 px-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Coût des Marchandises</span>
                  <span className="font-mono text-sm font-bold">{stats.purchases.toLocaleString('fr-FR')} {currencySymbol}</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-border/50">
                  <div 
                    className="h-full bg-[#FFB300] transition-all duration-1000" 
                    style={{ width: `${stats.revenue > 0 ? (stats.purchases / stats.revenue) * 100 : 0}%` }} 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00E676]">Marge Brute Réalisée</span>
                  <span className="font-mono text-sm font-black text-[#00E676]">{stats.profit.toLocaleString('fr-FR')} {currencySymbol}</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-border/50">
                  <div 
                    className="h-full bg-[#00E676] transition-all duration-1000 shadow-[0_0_10px_rgba(0,230,118,0.3)]" 
                    style={{ width: `${stats.margin}%` }} 
                  />
                </div>
              </div>
              <div className="pt-6 border-t border-border mt-2 space-y-3">
                <div className="flex items-center gap-2 text-[#00E676] bg-[#00E676]/5 p-3 rounded-xl border border-[#00E676]/10">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="text-xs font-black uppercase tracking-tight">Rentabilité Optimale</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                      Votre marge brute est de <strong>{stats.margin.toFixed(1)}%</strong> sur cette période.
                    </p>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground font-medium italic leading-relaxed px-1">
                  * Ces chiffres sont basés exclusivement sur les articles vendus. Ils n'incluent pas les charges fixes d'exploitation.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-[#00A3FF]/10 border border-[#00A3FF]/20 p-5 rounded-2xl space-y-3">
             <Calendar className="w-6 h-6 text-[#00A3FF]" />
             <h4 className="text-xs font-black uppercase tracking-widest text-[#00A3FF]">Stratégie de Pilotage</h4>
             <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
               Utilisez ces rapports pour identifier vos pics d'activité hebdomadaires et ajuster vos stocks en conséquence. Un suivi mensuel rigoureux permet d'anticiper les besoins de trésorerie.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
