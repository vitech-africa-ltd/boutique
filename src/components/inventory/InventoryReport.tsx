import React, { useMemo } from 'react';
import { Product } from '@/src/types';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Printer, Download, TrendingUp, TrendingDown, Package, ShieldAlert } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useERP } from '@/src/lib/useERP';

interface InventoryReportProps {
  products: Product[];
}

export function InventoryReport({ products }: InventoryReportProps) {
  const { formatAmount } = useERP();

  const auditData = useMemo(() => {
    const totalPurchase = products.reduce((acc, p) => acc + (p.purchasePrice * Math.max(0, p.stock)), 0);
    const totalMarketValue = products.reduce((acc, p) => acc + (p.priceTTC * Math.max(0, p.stock)), 0);
    const potentialProfit = totalMarketValue - totalPurchase;
    
    // Detailed analysis per item
    const items = products.map(p => {
      const buyingValue = p.purchasePrice * p.stock;
      const retailValue = p.priceTTC * p.stock;
      const profit = retailValue - buyingValue;
      const margin = p.priceTTC > 0 ? ((p.priceTTC - p.purchasePrice) / p.priceTTC) * 100 : 0;
      
      const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();
      const loss = isExpired ? buyingValue : 0;
      
      return {
        ...p,
        buyingValue,
        retailValue,
        profit,
        margin,
        loss,
        isExpired
      };
    });

    const totalLoss = items.reduce((acc, i) => acc + i.loss, 0);

    return {
      totalPurchase,
      totalMarketValue,
      potentialProfit,
      totalLoss,
      items: items.sort((a, b) => b.profit - a.profit)
    };
  }, [products]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog>
      <DialogTrigger render={
        <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5 font-black uppercase tracking-widest h-10 px-6">
          <FileText className="w-4 h-4" />
          Audit Inventaire
        </Button>
      }>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col bg-[#1A1C1E] border-border p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-border bg-card/50">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-black tracking-tighter uppercase">Rapport d'Audit Professionnel</DialogTitle>
              <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-1">Analyse Automatique de Rentabilité & Pertes</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2 font-bold text-[10px] uppercase border-border" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" />
                Imprimer PDF
              </Button>
              <Button size="sm" className="gap-2 font-bold text-[10px] uppercase">
                <Download className="w-3.5 h-3.5" />
                Exporter CSV
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 print:p-0">
          {/* Summary Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-card rounded-2xl border border-border">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valeur d'Achat (Net)</span>
                <Package className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter">{formatAmount(auditData.totalPurchase)}</h2>
              <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">Capital immobilisé total</p>
            </div>

            <div className="p-6 bg-card rounded-2xl border border-border border-emerald-500/20">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Profit Estimé (Marge)</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-emerald-500">+{formatAmount(auditData.potentialProfit)}</h2>
              <p className="text-[10px] text-emerald-500/60 mt-2 font-medium italic">Projection de bénéfices bruts</p>
            </div>

            <div className="p-6 bg-card rounded-2xl border border-border border-rose-500/20">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pertes Identifiées</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-rose-500">{formatAmount(auditData.totalLoss)}</h2>
              <p className="text-[10px] text-rose-500/60 mt-2 font-medium italic">Valeur des produits périmés</p>
            </div>
          </div>

          {/* Detailed table */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-muted-foreground px-1">Détails de l'Inventaire par Article</h3>
            <div className="rounded-2xl border border-border overflow-hidden bg-card/30">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Article</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Stock</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Achat Total</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Profit Pot.</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Marge %</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData.items.map(item => (
                    <TableRow key={item.id} className="border-border hover:bg-muted/10 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold">{item.name}</span>
                          <span className="text-[9px] text-muted-foreground uppercase font-black">{item.reference}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-[12px]">{item.stock}</TableCell>
                      <TableCell className="text-right font-mono text-[11px] font-bold">{formatAmount(item.buyingValue)}</TableCell>
                      <TableCell className={cn(
                        "text-right font-mono text-[11px] font-black",
                        item.profit > 0 ? "text-emerald-500" : "text-muted-foreground"
                      )}>
                        {item.profit > 0 ? '+' : ''}{formatAmount(item.profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-[10px] font-black px-1.5 h-5 bg-muted/50 border-none">
                          {item.margin.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.isExpired ? (
                          <Badge className="bg-rose-500/10 text-rose-500 border-none text-[8px] font-black">PERTE SÊCHE</Badge>
                        ) : item.stock <= item.minStock ? (
                          <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px] font-black">RÉAPPRO</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black">VALIDE</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
