import React, { useState } from 'react';
import { Bell, AlertOctagon, AlertTriangle, Package, Check, ArrowRight, Plus, ExternalLink } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Product } from '@/src/types';
import { useERP } from '@/src/lib/useERP';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StockNotificationBellProps {
  products: Product[];
  onNavigate: (tab: string) => void;
}

export function StockNotificationBell({ products, onNavigate }: StockNotificationBellProps) {
  const { updateProduct, formatAmount } = useERP();
  const [isOpen, setIsOpen] = useState(false);

  // Filter products below or at minStock
  const alertedProducts = products.filter(p => p.stock <= p.minStock);
  const outOfStockCount = alertedProducts.filter(p => p.stock === 0).length;
  const lowStockCount = alertedProducts.filter(p => p.stock > 0).length;
  const totalAlerts = alertedProducts.length;

  const handleQuickRestock = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    try {
      const quantityToAdd = Math.max(10, product.minStock * 2 - product.stock);
      await updateProduct({
        ...product,
        stock: product.stock + quantityToAdd
      });
      toast.success(`Réassort rapide effectué pour ${product.name}`, {
        description: `+${quantityToAdd} unités ajoutées (Stock: ${product.stock + quantityToAdd})`
      });
    } catch (err) {
      toast.error('Erreur lors du réassort');
    }
  };

  const handleGoToDashboardAlerts = () => {
    setIsOpen(false);
    onNavigate('dashboard');
    setTimeout(() => {
      const el = document.getElementById('stock-alerts-notification-center');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  const handleGoToInventory = () => {
    setIsOpen(false);
    onNavigate('inventory');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Alertes et notifications de stock"
          className={cn(
            "relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center",
            totalAlerts > 0 
              ? outOfStockCount > 0 
                ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20 shadow-sm shadow-rose-500/10"
                : "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
              : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Bell className={cn("w-5 h-5", totalAlerts > 0 && "animate-wiggle")} />
          
          {totalAlerts > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-md ring-2 ring-background animate-pulse">
              {totalAlerts > 99 ? '99+' : totalAlerts}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[380px] sm:w-[420px] p-0 bg-card border-border border-2 rounded-2xl shadow-2xl overflow-hidden z-50">
        {/* Header */}
        <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              totalAlerts > 0 ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"
            )}>
              {totalAlerts > 0 ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">Alertes de Stock Minimum</h3>
              <p className="text-[10px] text-muted-foreground">
                {totalAlerts === 0 ? "Aucune alerte active" : `${totalAlerts} produit(s) requièrent votre attention`}
              </p>
            </div>
          </div>

          {totalAlerts > 0 && (
            <Badge variant="destructive" className="text-[10px] font-black uppercase">
              {outOfStockCount > 0 ? `${outOfStockCount} Ruptures` : `${lowStockCount} Faibles`}
            </Badge>
          )}
        </div>

        {/* Content list */}
        {totalAlerts === 0 ? (
          <div className="py-10 px-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Tous les niveaux sont sains</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Aucun produit n'est actuellement sous son seuil de réapprovisionnement minimum.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[320px] divide-y divide-border">
            <div className="divide-y divide-border">
              {alertedProducts.map((product) => {
                const isRupture = product.stock === 0;
                const deficit = Math.max(0, product.minStock - product.stock);

                return (
                  <div 
                    key={product.id} 
                    className="p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        isRupture ? "bg-rose-500/15 text-rose-500" : "bg-amber-500/15 text-amber-500"
                      )}>
                        {isRupture ? <AlertOctagon className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">{product.name}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          Réf: {product.reference} • {product.category}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 text-[10px] font-bold">
                          <span className={isRupture ? "text-rose-500 font-black" : "text-amber-500"}>
                            Stock: {product.stock}
                          </span>
                          <span className="text-muted-foreground">/ Seuil: {product.minStock}</span>
                          <span className="text-rose-500/90 font-mono">(Déficit: -{deficit > 0 ? deficit : product.minStock})</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleQuickRestock(e, product)}
                        className="h-7 px-2 text-[10px] font-bold gap-1 bg-background hover:bg-emerald-600 hover:text-white border-border"
                        title="Ajouter du stock immédiatement"
                      >
                        <Plus className="w-3 h-3 text-emerald-500 group-hover:text-white" />
                        +Réassort
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoToInventory}
            className="text-xs font-bold text-muted-foreground hover:text-foreground h-8"
          >
            Catalogue Articles
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleGoToDashboardAlerts}
            className="text-xs font-black bg-primary hover:bg-primary/90 text-primary-foreground h-8 gap-1.5 rounded-lg"
          >
            Centre d'Alertes <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
