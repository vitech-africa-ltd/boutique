import React, { useMemo } from 'react';
import { Product } from '@/src/types';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface InventoryAnalyticsProps {
  products: Product[];
  formatAmount: (amount: number) => string;
}

export function InventoryAnalytics({ products, formatAmount }: InventoryAnalyticsProps) {
  const stats = useMemo(() => {
    const totalPurchaseValue = products.reduce((acc, p) => acc + (p.purchasePrice * Math.max(0, p.stock)), 0);
    const totalRetailValue = products.reduce((acc, p) => acc + (p.priceTTC * Math.max(0, p.stock)), 0);
    const potentialMargin = totalRetailValue - totalPurchaseValue;
    const marginPercentage = totalRetailValue > 0 ? (potentialMargin / totalRetailValue) * 100 : 0;
    
    const lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
    const outOfStockItems = products.filter(p => p.stock <= 0).length;
    
    // Loss estimation (expired or close to expiry - within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const expiredProducts = products.filter(p => p.expiryDate && new Date(p.expiryDate) < today);
    const atRiskProducts = products.filter(p => {
      if (!p.expiryDate) return false;
      const expiry = new Date(p.expiryDate);
      return expiry >= today && expiry <= thirtyDaysFromNow;
    });
    
    const actualLossValue = expiredProducts.reduce((acc, p) => acc + (p.purchasePrice * Math.max(0, p.stock)), 0);
    const potentialLossValue = atRiskProducts.reduce((acc, p) => acc + (p.purchasePrice * Math.max(0, p.stock)), 0);

    // ABC Analysis: Valorization Priority
    const sortedByValue = [...products].sort((a, b) => (b.purchasePrice * b.stock) - (a.purchasePrice * a.stock));
    const highValueCount = Math.ceil(products.length * 0.2); // Top 20%
    const highValueStockValue = sortedByValue.slice(0, highValueCount).reduce((acc, p) => acc + (p.purchasePrice * p.stock), 0);
    
    return {
      totalPurchaseValue,
      totalRetailValue,
      potentialMargin,
      marginPercentage,
      lowStockItems,
      outOfStockItems,
      atRiskCount: atRiskProducts.length,
      expiredCount: expiredProducts.length,
      actualLossValue,
      potentialLossValue,
      highValueConcentration: totalPurchaseValue > 0 ? (highValueStockValue / totalPurchaseValue) * 100 : 0
    };
  }, [products]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-[#1F2125] border-border overflow-hidden group hover:border-primary/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Capital Immobilisé</p>
                <h3 className="text-2xl font-black tracking-tighter">{formatAmount(stats.totalPurchaseValue)}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                <BarChart3 className="w-3 h-3" />
                <span>INVENTAIRE</span>
              </div>
              <span className="text-[9px] text-muted-foreground font-bold uppercase">{products.length} RÉFÉRENCES</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-[#1F2125] border-border overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Performance Marge</p>
                <h3 className="text-2xl font-black text-emerald-500 tracking-tighter">{formatAmount(stats.potentialMargin)}</h3>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                <span className="bg-emerald-500/10 px-2 py-0.5 rounded-md">ROI: {stats.marginPercentage.toFixed(1)}%</span>
              </div>
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">Potentiel de profit</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#1F2125] border-border overflow-hidden group hover:border-amber-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Indice de Rupture</p>
                <h3 className="text-2xl font-black text-amber-500 tracking-tighter">{stats.lowStockItems + stats.outOfStockItems} <span className="text-sm text-muted-foreground font-medium">Items</span></h3>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md border border-destructive/20">{stats.outOfStockItems} CRITIQUES</span>
              <span className="text-[9px] text-muted-foreground font-bold uppercase">Risque de vente perdue</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-[#1F2125] border-border overflow-hidden group hover:border-rose-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pertes sêches (Périmés)</p>
                <h3 className="text-2xl font-black text-rose-500 tracking-tighter">{formatAmount(stats.actualLossValue)}</h3>
              </div>
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 group-hover:scale-110 transition-transform">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 uppercase">DESTRUCTION CAPITAL</span>
              <span className="text-[9px] text-muted-foreground font-bold uppercase">{stats.expiredCount} PRODS</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
