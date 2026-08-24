import React, { useState } from 'react';
import { Sale, Customer, SystemSettings } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Search, Calendar, Filter, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter, parseISO, isWithinInterval, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ThermalReceiptModal } from '@/src/components/pos/ThermalReceiptModal';
import { downloadThermalReceiptPDF } from '@/src/services/printerService';

interface SalesHistoryProps {
  sales: Sale[];
  customers: Customer[];
  currencySymbol?: string;
  settings?: SystemSettings;
}

export function SalesHistory({ sales, customers, currencySymbol = 'FC', settings }: SalesHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Selected sale for thermal ticket modal
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  const fallbackSettings: SystemSettings = settings || {
    shopName: 'Global Boutique Manager',
    shopAddress: '123 Business Avenue',
    shopPhone: '+000 000 000 000',
    numNIF: 'TAX-IDENTIFIER-001',
    currency: 'USD',
    defaultTva: 16,
    exchangeRates: { 'USD': 1, 'CDF': 2800 }
  };

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const filteredSales = sales.filter(s => {
    const saleDate = parseISO(s.date);
    const now = new Date();
    
    // Search filter
    const matchesSearch = s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customers.find(c => c.id === s.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Period filter
    if (period === 'all') return true;
    
    if (period === 'custom') {
      try {
        const start = startOfDay(parseISO(customRange.start));
        const end = endOfDay(parseISO(customRange.end));
        return isWithinInterval(saleDate, { start, end });
      } catch (e) {
        return true;
      }
    }

    if (period === 'specific-month') {
      return saleDate.getMonth() === selectedMonth && saleDate.getFullYear() === selectedYear;
    }

    if (period === 'specific-year') {
      return saleDate.getFullYear() === selectedYear;
    }

    let startDate: Date;
    let endDate: Date = endOfDay(now);

    switch (period) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'yesterday':
        startDate = startOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
        endDate = endOfDay(startDate);
        return isWithinInterval(saleDate, { start: startDate, end: endDate });
      case 'last7':
        startDate = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        break;
      case 'last30':
        startDate = startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
        break;
      case 'week':
        startDate = startOfWeek(now, { locale: fr });
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = startOfMonth(lastMonthDate);
        endDate = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
        return isWithinInterval(saleDate, { start: startDate, end: endDate });
      case 'year':
        startDate = startOfYear(now);
        break;
      default:
        return true;
    }
    
    return isWithinInterval(saleDate, { start: startDate, end: endDate });
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPeriod = filteredSales.reduce((acc, sale) => acc + sale.totalTTC, 0);
  const countPeriod = filteredSales.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter uppercase">Historique des Flux</h1>
        <p className="text-muted-foreground font-medium">Journal exhaustif des transactions et mouvements de caisse.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 border-2 border-border shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Volume de Facturation</p>
          <p className="text-2xl font-black tracking-tight">{totalPeriod.toLocaleString('fr-FR')} {currencySymbol}</p>
          <div className="mt-4 flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] px-2 h-5">STABLE</Badge>
            <span className="text-[10px] text-muted-foreground font-bold">Sur la période sélectionnée</span>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 border-2 border-border shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Nombre d'Actes</p>
          <p className="text-2xl font-black tracking-tight">{countPeriod} Factures</p>
          <div className="mt-4 flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-2 h-5">INTÉGRITÉ</Badge>
            <span className="text-[10px] text-muted-foreground font-bold">Transactions vérifiées</span>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 border-2 border-border shadow-xl md:col-span-1 border-dashed">
          <div className="flex flex-col h-full justify-center gap-3">
             <Button variant="outline" className="w-full h-11 border-2 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-muted transition-all gap-2">
               <Download className="w-4 h-4" /> Rapport complet (PDF)
             </Button>
             <Button variant="outline" className="w-full h-11 border-2 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-muted transition-all gap-2">
               <Download className="w-4 h-4" /> Export Comptable (CSV)
             </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-muted/30 p-4 rounded-2xl border-2 border-border/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input
              placeholder="N° de facture, Client..."
              className="pl-12 bg-background border-border h-11 rounded-xl font-bold shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {(period !== 'all' || searchTerm !== '') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setPeriod('all');
                  setSearchTerm('');
                }}
                className="h-11 px-4 text-[10px] font-black uppercase tracking-widest text-[#FF4D4D] hover:bg-[#FF4D4D]/10 rounded-xl"
              >
                Réinitialiser
              </Button>
            )}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[220px] bg-background border-border h-11 rounded-xl font-bold">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="font-bold">Afficher Tout</SelectItem>
                <SelectItem value="today" className="font-bold">Aujourd'hui</SelectItem>
                <SelectItem value="yesterday" className="font-bold">Hier</SelectItem>
                <SelectItem value="last7" className="font-bold">7 derniers jours</SelectItem>
                <SelectItem value="last30" className="font-bold">30 derniers jours</SelectItem>
                <SelectItem value="week" className="font-bold">Cette semaine</SelectItem>
                <SelectItem value="month" className="font-bold">Ce mois</SelectItem>
                <SelectItem value="lastMonth" className="font-bold">Mois dernier</SelectItem>
                <SelectItem value="year" className="font-bold">Cette année</SelectItem>
                <SelectItem value="specific-month" className="font-bold text-primary italic">Choisir un mois...</SelectItem>
                <SelectItem value="specific-year" className="font-bold text-primary italic">Choisir une année...</SelectItem>
                <SelectItem value="custom" className="font-bold text-primary">Plage personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {period === 'specific-month' && (
          <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-border/20 animate-in slide-in-from-top-2 duration-300">
             <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sélectionner le mois</label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[180px] bg-background border-border h-11 rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {months.map((m, i) => (
                    <SelectItem key={m} value={i.toString()} className="font-bold">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Année</label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[120px] bg-background border-border h-11 rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {period === 'specific-year' && (
          <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-border/20 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sélectionner l'année</label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[180px] bg-background border-border h-11 rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()} className="font-bold">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {period === 'custom' && (
          <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-border/20 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date de début</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/50" />
                <Input 
                  type="date" 
                  value={customRange.start}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-background border-border h-11 pl-10 w-44 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date de fin</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/50" />
                <Input 
                  type="date" 
                  value={customRange.end}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-background border-border h-11 pl-10 w-44 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="pb-1">
              <Badge variant="outline" className="h-11 px-4 border-dashed border-2 border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2">
                <Filter className="w-3 h-3" />
                Filtrage Actif
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border-2 border-border bg-card shadow-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 border-b-2 border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">N° Transaction</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">Horodatage</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14">Client / Porteur</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14 text-right">Montant Final</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14 text-center">État</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-14 text-right">Flux</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <Search className="w-12 h-12 mb-2" />
                    <p className="font-black uppercase tracking-widest text-sm">Néant documentaire</p>
                    <p className="text-xs font-bold">Aucun flux ne correspond aux critères de filtrage</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/30 border-b border-border transition-colors group">
                  <TableCell className="font-mono text-[12px] font-black px-6 py-4 text-primary">{sale.id}</TableCell>
                  <TableCell className="text-[12px] font-bold px-6 py-4 opacity-80 uppercase">
                    {new Date(sale.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell className="text-[12px] font-black px-6 py-4 uppercase">
                    {customers.find(c => c.id === sale.customerId)?.name || 'Opération de Comptoir'}
                  </TableCell>
                  <TableCell className="text-right font-black text-foreground px-6 py-4 text-[13px]">
                    {sale.totalTTC.toLocaleString('fr-FR')} {currencySymbol}
                  </TableCell>
                  <TableCell className="text-center px-6 py-4">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] px-2 h-5 uppercase tracking-tighter">Liquidité</Badge>
                  </TableCell>
                  <TableCell className="text-right px-6 py-4">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Imprimer / Voir le Ticket Thermique"
                        onClick={() => setSelectedSaleForReceipt(sale)}
                        className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Télécharger Ticket PDF (80mm)"
                        onClick={() => downloadThermalReceiptPDF(sale, fallbackSettings)}
                        className="h-9 w-9 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Thermal Receipt Print & Preview Dialog */}
      <ThermalReceiptModal
        isOpen={!!selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
        sale={selectedSaleForReceipt}
        settings={fallbackSettings}
        customer={selectedSaleForReceipt ? customers.find(c => c.id === selectedSaleForReceipt.customerId) : null}
        cashierName="Comptoir POS"
      />
    </div>
  );
}
