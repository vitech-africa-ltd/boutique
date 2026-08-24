import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Package, 
  TrendingDown, 
  Plus, 
  RefreshCw, 
  Download, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  SlidersHorizontal,
  DollarSign,
  Truck,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Edit3
} from 'lucide-react';
import { Product, Supplier } from '@/src/types';
import { useERP } from '@/src/lib/useERP';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface StockAlertNotificationCenterProps {
  products: Product[];
  suppliers?: Supplier[];
  onNavigate?: (tab: string) => void;
}

export function StockAlertNotificationCenter({ products, suppliers = [], onNavigate }: StockAlertNotificationCenterProps) {
  const { formatAmount, updateProduct, getBusinessHealth, settings, setActiveTab } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'out_of_stock' | 'low_stock' | 'class_a'>('all');
  
  // Quick Restock Dialog state
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(10);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  // Edit Min Stock Threshold Dialog state
  const [editingThresholdProduct, setEditingThresholdProduct] = useState<Product | null>(null);
  const [newMinStock, setNewMinStock] = useState<number>(5);
  const [isThresholdDialogOpen, setIsThresholdDialogOpen] = useState(false);

  // Batch Restock Confirmation Dialog state
  const [isBatchRestockOpen, setIsBatchRestockOpen] = useState(false);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  const health = getBusinessHealth();

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(set);
  }, [products]);

  // All alerted products (stock <= minStock)
  const allAlertedProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  // Out of stock (stock === 0)
  const outOfStockProducts = useMemo(() => {
    return products.filter(p => p.stock === 0);
  }, [products]);

  // Low stock but not 0 (0 < stock <= minStock)
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  }, [products]);

  // Total deficit calculation
  const totalDeficitUnits = useMemo(() => {
    return allAlertedProducts.reduce((acc, p) => {
      const deficit = Math.max(0, p.minStock - p.stock);
      return acc + (deficit === 0 ? p.minStock : deficit);
    }, 0);
  }, [allAlertedProducts]);

  // Total estimated replenishment cost
  const totalReplenishmentCost = useMemo(() => {
    return allAlertedProducts.reduce((acc, p) => {
      const deficit = Math.max(0, p.minStock - p.stock);
      const unitsNeeded = deficit === 0 ? Math.max(1, p.minStock) : deficit;
      return acc + (unitsNeeded * p.purchasePrice);
    }, 0);
  }, [allAlertedProducts]);

  // Filtered alerted products based on UI selections
  const filteredAlerts = useMemo(() => {
    return allAlertedProducts.filter(p => {
      // Search term
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Category
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Severity
      if (selectedSeverity === 'out_of_stock') {
        return p.stock === 0;
      }
      if (selectedSeverity === 'low_stock') {
        return p.stock > 0 && p.stock <= p.minStock;
      }
      if (selectedSeverity === 'class_a') {
        const abc = health.abcAnalysis?.find((a: any) => a.id === p.id);
        return abc?.category === 'A';
      }

      return true;
    }).sort((a, b) => {
      // Sort by urgency: 0 stock first, then ratio of stock/minStock
      if (a.stock === 0 && b.stock > 0) return -1;
      if (b.stock === 0 && a.stock > 0) return 1;
      const ratioA = a.stock / (a.minStock || 1);
      const ratioB = b.stock / (b.minStock || 1);
      return ratioA - ratioB;
    });
  }, [allAlertedProducts, searchTerm, selectedCategory, selectedSeverity, health]);

  // Handle Quick Single Product Restock
  const handleOpenQuickRestock = (product: Product) => {
    setQuickRestockProduct(product);
    const deficit = Math.max(1, product.minStock * 2 - product.stock);
    setRestockQuantity(deficit > 0 ? deficit : 10);
    setIsRestockDialogOpen(true);
  };

  const handleConfirmQuickRestock = async () => {
    if (!quickRestockProduct) return;
    setIsSubmittingRestock(true);
    try {
      const updatedStock = quickRestockProduct.stock + Number(restockQuantity);
      await updateProduct({
        ...quickRestockProduct,
        stock: updatedStock
      });
      toast.success(`Stock réapprovisionné avec succès !`, {
        description: `${quickRestockProduct.name}: +${restockQuantity} unités (Nouveau stock: ${updatedStock})`
      });
      setIsRestockDialogOpen(false);
      setQuickRestockProduct(null);
    } catch (error) {
      toast.error('Erreur lors du réapprovisionnement');
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Handle Edit Min Stock Threshold
  const handleOpenThresholdDialog = (product: Product) => {
    setEditingThresholdProduct(product);
    setNewMinStock(product.minStock);
    setIsThresholdDialogOpen(true);
  };

  const handleConfirmThresholdUpdate = async () => {
    if (!editingThresholdProduct) return;
    try {
      await updateProduct({
        ...editingThresholdProduct,
        minStock: Number(newMinStock)
      });
      toast.success(`Seuil d'alerte mis à jour pour ${editingThresholdProduct.name}`, {
        description: `Nouveau seuil minimum: ${newMinStock} unités`
      });
      setIsThresholdDialogOpen(false);
      setEditingThresholdProduct(null);
    } catch (error) {
      toast.error('Erreur lors de la modification du seuil');
    }
  };

  // Handle Batch Restock (Restock all items to 2x minStock or minStock + safety)
  const handleConfirmBatchRestock = async () => {
    setIsBatchSubmitting(true);
    try {
      let count = 0;
      for (const product of allAlertedProducts) {
        const targetStock = Math.max(product.minStock * 2, product.minStock + 10);
        const addAmount = Math.max(1, targetStock - product.stock);
        await updateProduct({
          ...product,
          stock: product.stock + addAmount
        });
        count++;
      }
      toast.success(`Réassort global terminé avec succès !`, {
        description: `${count} articles ont été réapprovisionnés au niveau optimal.`
      });
      setIsBatchRestockOpen(false);
    } catch (error) {
      toast.error('Erreur lors du réassort global');
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  // Export PDF Report of Low Stock Alerts
  const exportStockAlertsPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(220, 38, 38);
      doc.text('RAPPORT DES ALERTES DE STOCK CRITIQUE', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Établissement: ${settings.shopName}`, 14, 28);
      doc.text(`Date du rapport: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 34);
      doc.text(`Total articles en alerte: ${allAlertedProducts.length} (Ruptures: ${outOfStockProducts.length})`, 14, 40);

      const tableData = allAlertedProducts.map(p => {
        const deficit = Math.max(0, p.minStock - p.stock);
        const isRupture = p.stock === 0;
        return [
          p.reference,
          p.name,
          p.category,
          isRupture ? 'RUPTURE (0)' : `${p.stock}`,
          `${p.minStock}`,
          `${deficit > 0 ? `-${deficit}` : '0'}`,
          formatAmount(p.purchasePrice),
          formatAmount((deficit > 0 ? deficit : p.minStock) * p.purchasePrice)
        ];
      });

      autoTable(doc, {
        head: [['Réf', 'Désignation', 'Catégorie', 'Stock Actuel', 'Seuil Min', 'Déficit', 'Prix Achat', 'Budget Réassort']],
        body: tableData,
        startY: 46,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`Alertes_Stock_${settings.shopName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Rapport des alertes exporté en PDF');
    } catch (e) {
      toast.error('Erreur lors de l\'exportation PDF');
    }
  };

  // Export CSV Report
  const exportStockAlertsCSV = () => {
    try {
      const headers = ['Reference', 'Designation', 'Categorie', 'Marque', 'Stock_Actuel', 'Seuil_Min', 'Deficit', 'Prix_Achat', 'Budget_Reassort'];
      const rows = allAlertedProducts.map(p => {
        const deficit = Math.max(0, p.minStock - p.stock);
        return [
          `"${p.reference}"`,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.category}"`,
          `"${p.brand || ''}"`,
          p.stock,
          p.minStock,
          deficit,
          p.purchasePrice,
          (deficit > 0 ? deficit : p.minStock) * p.purchasePrice
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `alertes_stock_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export CSV téléchargé');
    } catch (e) {
      toast.error('Erreur lors de l\'exportation CSV');
    }
  };

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <Card id="stock-alerts-notification-center" className="bg-card border-border shadow-sm overflow-hidden border-2 relative">
      {/* Decorative top accent bar */}
      <div className={cn(
        "h-1.5 w-full transition-all",
        outOfStockProducts.length > 0 
          ? "bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" 
          : allAlertedProducts.length > 0 
            ? "bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500"
            : "bg-emerald-500"
      )} />

      <CardHeader className="bg-muted/20 border-b border-border/60 pb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-2 rounded-xl flex items-center justify-center transition-all",
                outOfStockProducts.length > 0 
                  ? "bg-rose-500/15 text-rose-500 ring-2 ring-rose-500/20" 
                  : allAlertedProducts.length > 0 
                    ? "bg-amber-500/15 text-amber-500 ring-2 ring-amber-500/20"
                    : "bg-emerald-500/15 text-emerald-500"
              )}>
                {outOfStockProducts.length > 0 ? (
                  <AlertOctagon className="w-5 h-5 animate-bounce" />
                ) : allAlertedProducts.length > 0 ? (
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
                  Système de Notification & Alertes de Stock
                  {allAlertedProducts.length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-[10px] font-black uppercase px-2 py-0.5 animate-pulse">
                      {allAlertedProducts.length} {allAlertedProducts.length === 1 ? 'Alerte' : 'Alertes'}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Surveillance en temps réel des produits dont la quantité est inférieure ou égale au stock minimum configuré.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {allAlertedProducts.length > 0 && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={exportStockAlertsPDF}
                  className="h-9 text-xs font-bold gap-1.5 border-border hover:bg-muted"
                >
                  <Download className="w-3.5 h-3.5" />
                  Rapport PDF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={exportStockAlertsCSV}
                  className="h-9 text-xs font-bold gap-1.5 border-border hover:bg-muted"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setIsBatchRestockOpen(true)}
                  className="h-9 text-xs font-black gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tout Réapprovisionner
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Real-time KPI Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className={cn(
            "p-3 rounded-xl border transition-all",
            outOfStockProducts.length > 0 
              ? "bg-rose-500/10 border-rose-500/30" 
              : "bg-muted/30 border-border"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ruptures Totales (0)</span>
              <AlertOctagon className={cn("w-3.5 h-3.5", outOfStockProducts.length > 0 ? "text-rose-500" : "text-muted-foreground")} />
            </div>
            <div className={cn("text-xl font-black mt-1", outOfStockProducts.length > 0 ? "text-rose-500" : "text-foreground")}>
              {outOfStockProducts.length.toString().padStart(2, '0')}
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">Articles indisponibles</span>
          </div>

          <div className={cn(
            "p-3 rounded-xl border transition-all",
            lowStockProducts.length > 0 
              ? "bg-amber-500/10 border-amber-500/30" 
              : "bg-muted/30 border-border"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Stock Sous Seuil</span>
              <AlertTriangle className={cn("w-3.5 h-3.5", lowStockProducts.length > 0 ? "text-amber-500" : "text-muted-foreground")} />
            </div>
            <div className={cn("text-xl font-black mt-1", lowStockProducts.length > 0 ? "text-amber-500" : "text-foreground")}>
              {lowStockProducts.length.toString().padStart(2, '0')}
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">Quantité ≤ Seuil Min</span>
          </div>

          <div className="p-3 rounded-xl border bg-muted/30 border-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Unités Manquantes</span>
              <Package className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-xl font-black mt-1 text-foreground">
              {totalDeficitUnits.toLocaleString('fr-FR')}
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">Déficit pour seuil nominal</span>
          </div>

          <div className="p-3 rounded-xl border bg-muted/30 border-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Budget Estimé</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-black mt-1 text-emerald-500">
              {formatAmount(totalReplenishmentCost)}
            </div>
            <span className="text-[9px] text-muted-foreground font-medium">Coût d'achat total requis</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {allAlertedProducts.length === 0 ? (
          /* Empty State: All Good */
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-black text-foreground">Stocks Parfaitement Approvisionnés</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tous vos produits disposent actuellement d'un niveau de stock supérieur à leurs seuils minimaux définis. Aucune rupture imminente détectée.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleNavigate('inventory')}
                className="text-xs font-bold gap-2 border-emerald-500/30 hover:bg-emerald-500/10 text-foreground"
              >
                <Package className="w-3.5 h-3.5 text-emerald-500" />
                Consulter le Catalogue Complet
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-muted/30 p-3 rounded-xl border border-border">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrer par nom, référence, marque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background border-border h-9 text-xs rounded-lg"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Category selector */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[140px] bg-background border-border h-9 text-xs font-bold rounded-lg">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all" className="text-xs font-bold">Toutes Catégories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-xs font-medium">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Severity pill selector */}
                <div className="flex items-center bg-background border border-border p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSelectedSeverity('all')}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors",
                      selectedSeverity === 'all' 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Tous ({allAlertedProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeverity('out_of_stock')}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1",
                      selectedSeverity === 'out_of_stock' 
                        ? "bg-rose-600 text-white shadow-sm" 
                        : "text-muted-foreground hover:text-rose-500"
                    )}
                  >
                    Ruptures ({outOfStockProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeverity('low_stock')}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors",
                      selectedSeverity === 'low_stock' 
                        ? "bg-amber-500 text-white shadow-sm" 
                        : "text-muted-foreground hover:text-amber-500"
                    )}
                  >
                    Critique ({lowStockProducts.length})
                  </button>
                </div>
              </div>
            </div>

            {/* List of alert items */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence>
                {filteredAlerts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
                    Aucun article ne correspond à vos filtres de recherche.
                  </div>
                ) : (
                  filteredAlerts.map((product) => {
                    const isRupture = product.stock === 0;
                    const deficit = Math.max(0, product.minStock - product.stock);
                    const stockRatio = Math.min(100, Math.round((product.stock / (product.minStock || 1)) * 100));
                    const replenishmentBudget = (deficit > 0 ? deficit : product.minStock) * product.purchasePrice;

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                          "p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group",
                          isRupture 
                            ? "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/25 hover:border-rose-500/40" 
                            : "bg-card hover:bg-muted/40 border-border hover:border-amber-500/30"
                        )}
                      >
                        {/* Left Info */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold transition-transform group-hover:scale-105",
                            isRupture 
                              ? "bg-rose-500/15 text-rose-500 border border-rose-500/30 shadow-sm shadow-rose-500/10" 
                              : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                          )}>
                            {isRupture ? (
                              <AlertOctagon className="w-5 h-5" />
                            ) : (
                              <AlertTriangle className="w-5 h-5" />
                            )}
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-foreground truncate">{product.name}</h4>
                              <Badge 
                                variant={isRupture ? "destructive" : "secondary"}
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5",
                                  isRupture 
                                    ? "bg-rose-500 text-white border-none" 
                                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                )}
                              >
                                {isRupture ? "Rupture Totale" : "Stock Critique"}
                              </Badge>
                              {product.brand && (
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {product.brand}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="font-mono text-[11px] text-foreground/80">Réf: {product.reference}</span>
                              <span>•</span>
                              <span>Catégorie: <strong className="text-foreground">{product.category}</strong></span>
                              <span>•</span>
                              <span>Prix Achat: <strong className="text-foreground">{formatAmount(product.purchasePrice)}</strong></span>
                              <span>•</span>
                              <span>Budget réassort: <strong className="text-emerald-500 font-bold">{formatAmount(replenishmentBudget)}</strong></span>
                            </div>

                            {/* Stock Level Visual Bar */}
                            <div className="pt-1.5 max-w-md">
                              <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                <span className={cn(
                                  isRupture ? "text-rose-500 font-black" : "text-amber-500"
                                )}>
                                  Actuel: {product.stock} {product.stock <= 1 ? 'unité' : 'unités'}
                                </span>
                                <span className="text-muted-foreground">
                                  Seuil Min: {product.minStock} | Déficit: <span className="text-rose-500">-{deficit > 0 ? deficit : product.minStock}</span>
                                </span>
                              </div>
                              <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden border border-border/40">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isRupture 
                                      ? "w-0" 
                                      : stockRatio <= 50 
                                        ? "bg-rose-500" 
                                        : "bg-amber-500"
                                  )}
                                  style={{ width: `${Math.max(0, Math.min(100, stockRatio))}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Quick Actions */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenThresholdDialog(product)}
                            className="h-8 px-2.5 text-xs font-bold border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Modifier le seuil minimum d'alerte"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-primary" />
                            Seuil ({product.minStock})
                          </Button>

                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleOpenQuickRestock(product)}
                            className="h-8 px-3 text-xs font-black gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Réapprovisionner
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Quick Navigation & Assistance */}
            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Pour créer un bon d'achat officiel auprès d'un fournisseur :</span>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-xs font-black text-primary gap-1"
                  onClick={() => handleNavigate('purchases')}
                >
                  Ouvrir les Bons de Commande <ArrowRight className="w-3 h-3" />
                </Button>
              </div>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleNavigate('inventory-opt')}
                className="h-7 text-xs font-bold text-muted-foreground hover:text-foreground gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Matrice ABC & Optimisation Stock
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* Dialog: Quick Restock for single product */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent className="sm:max-w-[440px] bg-card border-border border-2 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              Réapprovisionnement Rapide
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ajouter des unités en stock pour combler le déficit de cet article.
            </DialogDescription>
          </DialogHeader>

          {quickRestockProduct && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">{quickRestockProduct.name}</h4>
                  <Badge variant="outline" className="text-[10px] font-mono">{quickRestockProduct.reference}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Stock Actuel: <strong className="text-foreground">{quickRestockProduct.stock}</strong></span>
                  <span>Seuil Min: <strong className="text-amber-500">{quickRestockProduct.minStock}</strong></span>
                  <span>Prix Achat: <strong className="text-foreground">{formatAmount(quickRestockProduct.purchasePrice)}</strong></span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Quantité à ajouter au stock</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-background border-border h-11 text-base font-black rounded-xl"
                  />
                  <div className="flex gap-1.5">
                    {[5, 10, 25, 50].map((q) => (
                      <Button
                        key={q}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRestockQuantity(q)}
                        className="h-11 px-2.5 text-xs font-bold rounded-xl border-border hover:bg-muted"
                      >
                        +{q}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Nouveau stock estimé :</span>
                  <strong className="text-foreground font-black text-sm">
                    {quickRestockProduct.stock + Number(restockQuantity)} unités
                  </strong>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Coût d'approvisionnement :</span>
                  <strong className="text-emerald-500 font-black text-sm">
                    {formatAmount(Number(restockQuantity) * quickRestockProduct.purchasePrice)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRestockDialogOpen(false)}
              className="border-border rounded-xl font-bold"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirmQuickRestock}
              disabled={isSubmittingRestock}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Valider le Réassort (+{restockQuantity})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Min Stock Threshold */}
      <Dialog open={isThresholdDialogOpen} onOpenChange={setIsThresholdDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border border-2 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              Ajuster le Seuil Minimum d'Alerte
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Définir la quantité minimale à partir de laquelle le système déclenche une alerte de réapprovisionnement.
            </DialogDescription>
          </DialogHeader>

          {editingThresholdProduct && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <h4 className="text-sm font-bold text-foreground">{editingThresholdProduct.name}</h4>
                <p className="text-xs text-muted-foreground font-mono">Stock actuel : {editingThresholdProduct.stock} unités</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Nouveau Seuil Minimum (Min Stock)</label>
                <Input
                  type="number"
                  min="0"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-background border-border h-11 text-base font-black rounded-xl"
                />
                <p className="text-[11px] text-muted-foreground italic">
                  Si le stock passe sous ce chiffre ({newMinStock}), une notification rouge ou orange s'affichera sur le tableau de bord.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsThresholdDialogOpen(false)}
              className="border-border rounded-xl font-bold"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirmThresholdUpdate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black gap-2"
            >
              Enregistrer le Seuil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Batch Restock All Alerted Items */}
      <Dialog open={isBatchRestockOpen} onOpenChange={setIsBatchRestockOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border border-2 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Réapprovisionnement Global des Stocks
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cette action va automatiquement réajuster le stock de l'ensemble des {allAlertedProducts.length} articles en alerte vers un niveau de sécurité optimal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span>Articles concernés :</span>
                <span className="text-amber-600 dark:text-amber-400 font-black">{allAlertedProducts.length} produits</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span>Budget total d'achat estimé :</span>
                <span className="text-emerald-500 font-black">{formatAmount(totalReplenishmentCost)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-amber-500/20">
                Chaque article recevra les unités nécessaires pour atteindre le double de son seuil minimal configuré.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBatchRestockOpen(false)}
              className="border-border rounded-xl font-bold"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirmBatchRestock}
              disabled={isBatchSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black gap-2"
            >
              {isBatchSubmitting ? 'Traitement...' : 'Confirmer le Réapprovisionnement Global'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
