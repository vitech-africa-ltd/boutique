import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Download, X, Filter, Loader2, Clock, ArrowUpDown } from 'lucide-react';
import { Product } from '@/src/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const productSchema = z.object({
  reference: z.string().min(1, 'Référence requise'),
  name: z.string().min(1, 'Désignation requise'),
  category: z.string().min(1, 'Catégorie requise'),
  brand: z.string().optional(),
  purchasePrice: z.number().min(0, 'Prix d\'achat invalide'),
  priceHT: z.number().min(0, 'Prix HT invalide'),
  tva: z.number().min(0, 'TVA invalide').max(100, 'TVA invalide'),
  stock: z.number().int().min(0, 'Stock invalide'),
  minStock: z.number().int().min(0, 'Seuil invalide'),
  expiryDate: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const adjustmentSchema = z.object({
  type: z.enum(['entry', 'exit']),
  quantity: z.number().int().min(1, 'Quantité invalide (min 1)'),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

import { InventoryAnalytics } from './InventoryAnalytics';
import { InventoryReport } from './InventoryReport';
import { useERP } from '@/src/lib/useERP';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  currencySymbol?: string;
}

export function Inventory({ products, onAddProduct, onUpdateProduct, onDeleteProduct, currencySymbol = 'FC' }: InventoryProps) {
  const { formatAmount, getBusinessHealth } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [isCriticalDetailsOpen, setIsCriticalDetailsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  const {
    register: registerProduct,
    handleSubmit: handleSubmitProduct,
    control: controlProduct,
    reset: resetProduct,
    formState: { errors: productErrors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      reference: '',
      name: '',
      category: '',
      brand: '',
      purchasePrice: 0,
      priceHT: 0,
      tva: 20,
      stock: 0,
      minStock: 5,
      expiryDate: ''
    }
  });

  const {
    register: registerAdjust,
    handleSubmit: handleSubmitAdjust,
    control: controlAdjust,
    reset: resetAdjust,
    formState: { errors: adjustErrors }
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: 'entry',
      quantity: 1
    }
  });

  useEffect(() => {
    if (editingProduct) {
      resetProduct({
        reference: editingProduct.reference,
        name: editingProduct.name,
        category: editingProduct.category,
        brand: editingProduct.brand || '',
        purchasePrice: editingProduct.purchasePrice,
        priceHT: editingProduct.priceHT,
        tva: editingProduct.tva,
        stock: editingProduct.stock,
        minStock: editingProduct.minStock,
        expiryDate: editingProduct.expiryDate || ''
      });
    } else if (!isDialogOpen) {
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      resetProduct({
        reference: `ART-${year}-${random}`,
        name: '',
        category: '',
        brand: '',
        purchasePrice: 0,
        priceHT: 0,
        tva: 20,
        stock: 0,
        minStock: 5,
        expiryDate: ''
      });
    }
  }, [editingProduct, isDialogOpen, resetProduct]);

  useEffect(() => {
    if (!isAdjustDialogOpen) {
      resetAdjust();
    }
  }, [isAdjustDialogOpen, resetAdjust]);

  const mockHistory = [
    { date: '2026-05-01 10:30', type: 'entry', quantity: 50, reason: 'Réapprovisionnement fournisseur', user: 'Admin' },
    { date: '2026-04-28 14:15', type: 'exit', quantity: 5, reason: 'Vente #POS-2026-102', user: 'Caissier' },
    { date: '2026-04-25 09:00', type: 'entry', quantity: 10, reason: 'Retour client approuvé', user: 'Gérant' },
    { date: '2026-04-20 16:45', type: 'exit', quantity: 2, reason: 'Ajustement inventaire (Dommage)', user: 'Magasinier' },
    { date: '2026-04-15 11:20', type: 'exit', quantity: 12, reason: 'Vente #POS-2026-088', user: 'Caissier' },
  ];

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const criticalItems = products.filter(p => p.stock <= p.minStock);
  const outOfStockItems = products.filter(p => p.stock <= 0);

  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesAlert = !showOnlyAlerts || p.stock <= p.minStock;
      return matchesSearch && matchesCategory && matchesAlert;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const onProductSubmit = (data: ProductFormData) => {
    if (data.priceHT < data.purchasePrice) {
      if (!confirm('Attention: Le prix de vente HT est inférieur au prix d\'achat. Voulez-vous continuer ?')) {
        return;
      }
    }

    const tvaVal = data.tva || 0;
    const product: Product = {
      ...data,
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      priceTTC: data.priceHT * (1 + tvaVal / 100),
    };

    if (editingProduct) {
      onUpdateProduct(product);
      toast.success(`Produit "${product.name}" mis à jour avec succès.`);
    } else {
      onAddProduct(product);
      toast.success(`Produit "${product.name}" ajouté à l'inventaire.`);
    }
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const confirmDelete = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      toast.success('Le produit a été définitivement supprimé de l\'inventaire.');
    }
  };

  const onAdjustSubmit = (data: AdjustmentFormData) => {
    if (!adjustingProduct) return;
    
    const { type, quantity } = data;
    const newStock = type === 'entry' 
      ? adjustingProduct.stock + quantity 
      : Math.max(0, adjustingProduct.stock - quantity);
      
    onUpdateProduct({
      ...adjustingProduct,
      stock: newStock
    });
    
    setIsAdjustDialogOpen(false);
    setAdjustingProduct(null);
    toast.success(`Le stock de "${adjustingProduct.name}" a été ajusté avec succès.`);
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Expiré', color: 'text-destructive', icon: AlertTriangle };
    if (diffDays <= 30) return { label: `Expire dans ${diffDays}j`, color: 'text-amber-500', icon: Clock };
    return null;
  };

  const downloadReport = async () => {
    setDownloadProgress(10);
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(20);
    doc.text('VI ERP Pro - Africa Edition', 105, 20, { align: 'center' });
    setDownloadProgress(30);
    
    doc.setFontSize(12);
    doc.text('Rapport d\'Inventaire Complet', 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 105, 38, { align: 'center' });
    setDownloadProgress(50);

    // Table
    const tableData = products.map(p => [
      p.reference,
      p.name,
      p.category,
      `${p.priceTTC.toFixed(2)} ${currencySymbol}`,
      p.stock.toString(),
      p.minStock.toString(),
      p.stock <= p.minStock ? 'CRITIQUE' : 'OK'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Réf', 'Désignation', 'Catégorie', 'Prix TTC', 'Stock', 'Seuil', 'Statut']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'right' }
      }
    });
    setDownloadProgress(80);

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const totalValue = products.reduce((acc, p) => acc + (p.priceTTC * p.stock), 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

    doc.setFontSize(11);
    doc.text(`Valeur Totale du Stock: ${totalValue.toLocaleString('fr-FR')} ${currencySymbol}`, 20, finalY);
    doc.text(`Articles en Alerte: ${lowStockCount}`, 20, finalY + 7);
    doc.text(`Nombre Total d'Articles: ${products.length}`, 20, finalY + 14);

    // Footer
    doc.setFontSize(8);
    doc.text('VI ERP Pro | Document Interne Confidentiel', 105, 285, { align: 'center' });

    setDownloadProgress(100);
    setTimeout(() => {
      doc.save(`rapport_inventaire_${new Date().toISOString().split('T')[0]}.pdf`);
      setDownloadProgress(null);
      toast.success('Rapport téléchargé avec succès !');
    }, 500);
  };

  return (
    <div className="space-y-6">
      {criticalItems.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight text-destructive">Alerte de Stock Diagnostiquée</p>
              <p className="text-[11px] font-bold text-muted-foreground">
                {outOfStockItems.length} article(s) en rupture totale et {criticalItems.length - outOfStockItems.length} en seuil critique.
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10"
            onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
          >
            {showOnlyAlerts ? "Afficher tout" : "Isoler les alertes"}
          </Button>
        </div>
      )}

      <InventoryAnalytics products={products} formatAmount={formatAmount} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou référence..."
              className="pl-10 bg-card/50 border-border focus:ring-primary shadow-sm h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <Button 
              variant="ghost" 
              onClick={() => setSearchTerm('')}
              className="text-xs text-muted-foreground hover:text-foreground h-11"
            >
              <X className="w-3 h-3 mr-1" />
              Effacer
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <InventoryReport products={products} />
          <Button
            variant={showOnlyAlerts ? "destructive" : "outline"}
            size="lg"
            className={cn(
              "h-11 px-4 gap-2 font-black uppercase text-[10px] tracking-widest transition-all rounded-xl",
              showOnlyAlerts ? "shadow-lg shadow-destructive/20" : "bg-card/50 border-border"
            )}
            onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
          >
            <AlertTriangle className={cn("w-4 h-4", showOnlyAlerts ? "text-white" : "text-destructive")} />
            {showOnlyAlerts ? "Alertes Actives" : "Voir Alertes"}
            {criticalItems.length > 0 && <Badge className="ml-1 bg-white/20 text-white border-none h-4 px-1">{criticalItems.length}</Badge>}
          </Button>

          {criticalItems.length > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-4 gap-2 font-black uppercase text-[10px] tracking-widest bg-destructive/5 border-destructive/20 text-destructive rounded-xl hover:bg-destructive hover:text-white transition-all shadow-lg shadow-destructive/10 animate-in zoom-in duration-300"
              onClick={() => setIsCriticalDetailsOpen(true)}
            >
              <AlertTriangle className="w-4 h-4" />
              Gérer Stock Critique
            </Button>
          )}

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[180px] bg-card/50 border-border text-foreground h-11 rounded-xl">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Catégorie" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat === 'all' ? 'Toutes catégories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button 
                size="lg" 
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 h-11 rounded-xl"
                onClick={() => setEditingProduct(null)}
              />}>
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nouveau
                </div>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{editingProduct ? 'Modifier l\'article' : 'Nouvel Article'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitProduct(onProductSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Référence (Auto)</label>
                      {productErrors.reference && <span className="text-[9px] text-destructive font-bold">{productErrors.reference.message}</span>}
                    </div>
                    <Input {...registerProduct('reference')} readOnly placeholder="REF-000" className={cn("bg-muted/10 border-border opacity-70 cursor-not-allowed font-mono", productErrors.reference && "border-destructive/50")} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Catégorie</label>
                      {productErrors.category && <span className="text-[9px] text-destructive font-bold">{productErrors.category.message}</span>}
                    </div>
                    <Input {...registerProduct('category')} placeholder="Informatique" className={cn("bg-muted/50 border-border", productErrors.category && "border-destructive/50")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Désignation</label>
                      {productErrors.name && <span className="text-[9px] text-destructive font-bold">{productErrors.name.message}</span>}
                    </div>
                    <Input {...registerProduct('name')} placeholder="Nom de l'article" className={cn("bg-muted/50 border-border", productErrors.name && "border-destructive/50")} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Marque</label>
                      {productErrors.brand && <span className="text-[9px] text-destructive font-bold">{productErrors.brand.message}</span>}
                    </div>
                    <Input {...registerProduct('brand')} placeholder="Ex: Apple, Samsung" className={cn("bg-muted/50 border-border")} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prix Achat</label>
                      {productErrors.purchasePrice && <span className="text-[9px] text-destructive font-bold">{productErrors.purchasePrice.message}</span>}
                    </div>
                    <Input 
                      {...registerProduct('purchasePrice', { valueAsNumber: true })} 
                      type="number" 
                      step="any" 
                      className={cn("bg-muted/50 border-border", productErrors.purchasePrice && "border-destructive/50")} 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prix HT</label>
                      {productErrors.priceHT && <span className="text-[9px] text-destructive font-bold">{productErrors.priceHT.message}</span>}
                    </div>
                    <Input 
                      {...registerProduct('priceHT', { valueAsNumber: true })} 
                      type="number" 
                      step="any" 
                      className={cn("bg-muted/50 border-border", productErrors.priceHT && "border-destructive/50")} 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">TVA (%)</label>
                      {productErrors.tva && <span className="text-[9px] text-destructive font-bold">{productErrors.tva.message}</span>}
                    </div>
                    <Input 
                      {...registerProduct('tva', { valueAsNumber: true })} 
                      type="number" 
                      step="any"
                      className={cn("bg-muted/50 border-border", productErrors.tva && "border-destructive/50")} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stock</label>
                      {productErrors.stock && <span className="text-[9px] text-destructive font-bold">{productErrors.stock.message}</span>}
                    </div>
                    <Input 
                      {...registerProduct('stock', { valueAsNumber: true })} 
                      type="number" 
                      className={cn("bg-muted/50 border-border", productErrors.stock && "border-destructive/50")} 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Seuil</label>
                      {productErrors.minStock && <span className="text-[9px] text-destructive font-bold">{productErrors.minStock.message}</span>}
                    </div>
                    <Input 
                      {...registerProduct('minStock', { valueAsNumber: true })} 
                      type="number" 
                      className={cn("bg-muted/50 border-border", productErrors.minStock && "border-destructive/50")} 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expiration</label>
                      {productErrors.expiryDate && <span className="text-[9px] text-destructive font-bold">{productErrors.expiryDate.message}</span>}
                    </div>
                    <Input {...registerProduct('expiryDate')} type="date" className={cn("bg-muted/50 border-border")} />
                  </div>
                </div>
                <DialogFooter className="pt-6 border-t border-border">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-foreground">Annuler</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 min-w-[120px]">Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Ajustement Manuel de Stock</DialogTitle>
          </DialogHeader>
          {adjustingProduct && (
            <form onSubmit={handleSubmitAdjust(onAdjustSubmit)} className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Article Sélectionné</p>
                  <p className="text-sm font-bold text-foreground">{adjustingProduct.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-background font-mono text-[10px]">
                      Stock actuel: {adjustingProduct.stock}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nature de l'opération</label>
                    {adjustErrors.type && <span className="text-[9px] text-destructive font-bold">{adjustErrors.type.message}</span>}
                  </div>
                  <Controller
                    name="type"
                    control={controlAdjust}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={cn("bg-muted/50 border-border h-12 rounded-xl px-4 font-bold", adjustErrors.type && "border-destructive/50")}>
                          <SelectValue placeholder="Choisir le type" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="entry" className="font-bold text-emerald-500">📥 Entrée de stock (+)</SelectItem>
                          <SelectItem value="exit" className="font-bold text-destructive">📤 Sortie de stock (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantité à impacter</label>
                    {adjustErrors.quantity && <span className="text-[9px] text-destructive font-bold">{adjustErrors.quantity.message}</span>}
                  </div>
                  <Input 
                    type="number" 
                    {...registerAdjust('quantity', { valueAsNumber: true })}
                    className={cn("bg-muted/50 border-border h-12 rounded-xl px-4 font-bold text-lg", adjustErrors.quantity && "border-destructive/50")} 
                  />
                  <p className="text-[9px] text-muted-foreground italic font-medium">Cette quantité sera ajoutée ou déduite du stock actuel.</p>
                </div>
              </div>
              <DialogFooter className="pt-6 border-t border-border gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAdjustDialogOpen(false)} 
                  className="text-muted-foreground hover:text-foreground font-black uppercase text-[10px] tracking-widest"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-primary/20"
                >
                  Confirmer l'opération
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCriticalDetailsOpen} onOpenChange={setIsCriticalDetailsOpen}>
        <DialogContent className="sm:max-w-[750px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Console de Réapprovisionnement ({criticalItems.length})
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[500px] overflow-auto pr-2 mt-4">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-b border-border text-[10px] font-black uppercase tracking-widest">
                  <TableHead className="px-4 py-3">Produit</TableHead>
                  <TableHead className="text-center px-4 py-3">Stock Actuel</TableHead>
                  <TableHead className="text-center px-4 py-3">Déficit</TableHead>
                  <TableHead className="text-right px-4 py-3">Actions Rapides</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalItems.map((product) => {
                  const deficit = product.minStock - product.stock;

                  return (
                    <TableRow key={product.id} className="hover:bg-muted/20 border-border group whitespace-nowrap">
                      <TableCell className="px-4 py-3 border-b border-border/50">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{product.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase opacity-70">{product.reference}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-4 py-3 border-b border-border/50">
                        <div className="flex flex-col items-center">
                          <Badge variant="destructive" className="font-mono text-[10px] bg-destructive/10 text-destructive border-none mb-1">
                            {product.stock}
                          </Badge>
                          <span className="text-muted-foreground text-[9px] font-bold">Seuil: {product.minStock}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-4 py-3 border-b border-border/50">
                        <span className="text-[11px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          +{deficit > 0 ? deficit : 1} requis
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-4 py-3 border-b border-border/50">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[9px] font-black uppercase tracking-widest border-border hover:bg-emerald-500/10 hover:text-emerald-500 transition-all font-mono"
                            onClick={() => {
                              onUpdateProduct({ ...product, stock: product.minStock + 10 });
                              toast.success(`Réapprovisionnement rapide de +10 effectué pour ${product.name}`);
                            }}
                          >
                             Réappro. +10
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => {
                                setEditingProduct(product);
                                setIsDialogOpen(true);
                                setIsCriticalDetailsOpen(false);
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="pt-6 border-t border-border mt-4 flex items-center justify-between sm:justify-between">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-50 italic">
              Actions directes sur le stock physique.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsCriticalDetailsOpen(false)} 
              className="font-black uppercase text-[10px] tracking-widest h-10 px-8 rounded-xl border-border hover:bg-muted"
            >
              Fermer la console
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col shadow-xl">
        <div className="overflow-x-auto">
          <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead 
                      className="text-[11px] font-bold uppercase text-muted-foreground px-6 py-4 tracking-widest whitespace-nowrap cursor-pointer hover:text-primary transition-colors group/th"
                      onClick={() => handleSort('reference')}
                    >
                      <div className="flex items-center gap-2">
                        Référence
                        <ArrowUpDown className={cn("w-3 h-3 group-hover/th:opacity-100", sortConfig?.key === 'reference' ? "opacity-100" : "opacity-0")} />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-[11px] font-bold uppercase text-muted-foreground px-6 py-4 tracking-widest whitespace-nowrap cursor-pointer hover:text-primary transition-colors group/th"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Désignation
                        <ArrowUpDown className={cn("w-3 h-3 group-hover/th:opacity-100", sortConfig?.key === 'name' ? "opacity-100" : "opacity-0")} />
                      </div>
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase text-muted-foreground px-6 py-4 tracking-widest whitespace-nowrap">Marque</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase text-muted-foreground px-6 py-4 tracking-widest text-right whitespace-nowrap">Achat</TableHead>
                    <TableHead 
                      className="text-[11px] font-bold uppercase text-muted-foreground px-6 py-4 tracking-widest text-right whitespace-nowrap cursor-pointer hover:text-primary transition-colors group/th"
                      onClick={() => handleSort('priceTTC')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Vente TTC
                        <ArrowUpDown className={cn("w-3 h-3 group-hover/th:opacity-100", sortConfig?.key === 'priceTTC' ? "opacity-100" : "opacity-0")} />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-[11px] font-bold uppercase text-muted-foreground px-6 py-4 tracking-widest text-center whitespace-nowrap cursor-pointer hover:text-primary transition-colors group/th"
                      onClick={() => handleSort('stock')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Stock
                        <ArrowUpDown className={cn("w-3 h-3 group-hover/th:opacity-100", sortConfig?.key === 'stock' ? "opacity-100" : "opacity-0")} />
                      </div>
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase text-muted-foreground px-6 py-4 tracking-widest text-center whitespace-nowrap">Statut</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase text-muted-foreground px-6 py-4 tracking-widest text-center whitespace-nowrap">DLC / DLUO</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase text-muted-foreground px-6 py-4 tracking-widest text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center text-muted-foreground italic">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <Search className="w-8 h-8" />
                        <p>Aucun article ne correspond à votre recherche</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const expiryInfo = getExpiryStatus(product.expiryDate);
                    const abc = getBusinessHealth().abcAnalysis.find(a => a.id === product.id);

                    return (
                      <TableRow key={product.id} className="hover:bg-muted/20 border-b border-border transition-colors group">
                        <TableCell className="font-mono text-[11px] px-6 py-4 font-bold text-muted-foreground group-hover:text-foreground">
                          <div className="flex items-center gap-2">
                             {product.reference}
                             {abc && (
                               <Badge 
                                 variant="outline" 
                                 className={cn(
                                   "text-[8px] font-black px-1 py-0 h-4 min-w-[18px] justify-center items-center flex",
                                   abc.category === 'A' ? "bg-primary/20 text-primary border-primary/30" :
                                   abc.category === 'B' ? "bg-amber-500/20 text-amber-500 border-amber-500/30" :
                                   "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"
                                 )}
                                 title={abc.category === 'A' ? "Article à forte valeur (Top 70%)" : abc.category === 'B' ? "Article à valeur moyenne (20%)" : "Faible contribution (10%)"}
                               >
                                 {abc.category}
                               </Badge>
                             )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-foreground line-clamp-1">{product.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">{product.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[12px] px-6 py-4 text-muted-foreground font-medium">{product.brand || '-'}</TableCell>
                        <TableCell className="text-right text-[12px] px-6 py-4 text-muted-foreground font-mono">
                          {formatAmount(product.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-right text-[14px] px-6 py-4 font-black text-foreground">
                          {formatAmount(product.priceTTC)}
                        </TableCell>
                        <TableCell className={`text-center text-[14px] px-6 py-4 font-bold ${product.stock <= product.minStock ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                          {product.stock}
                        </TableCell>
                        <TableCell className="text-center px-6 py-4">
                          {product.stock <= 0 ? (
                            <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-none text-[9px] font-black">RUPTURE</Badge>
                          ) : product.stock <= product.minStock ? (
                            <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-none text-[9px] font-black">CRITIQUE</Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none text-[9px] font-black">EN STOCK</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-[12px] px-6 py-4">
                          {product.expiryDate ? (
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant="outline" className={cn(
                                "px-2 py-0 h-5 text-[10px] font-bold border-none",
                                expiryInfo?.color.includes('destructive') ? "bg-destructive/10 text-destructive" :
                                expiryInfo?.color.includes('amber') ? "bg-amber-500/10 text-amber-500" :
                                "bg-muted text-muted-foreground"
                              )}>
                                {new Date(product.expiryDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                              </Badge>
                              {expiryInfo && (
                                <span className={cn("text-[9px] font-black uppercase tracking-tighter", expiryInfo.color)}>
                                  {expiryInfo.label}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 font-mono text-[9px] uppercase">Permanent</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                console.log('View details', product);
                                toast.info(`Détails: ${product.name} (${product.reference})`);
                              }}
                              title="Détails"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setHistoryProduct(product);
                              setIsHistoryOpen(true);
                            }}
                            title="Historique des mouvements"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                            onClick={() => {
                              setAdjustingProduct(product);
                              setIsAdjustDialogOpen(true);
                            }}
                            title="Ajuster le stock"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => confirmDelete(product.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
                )}
              </TableBody>
          </Table>
        </div>
        
        <div className="mt-auto p-4 lg:p-6 bg-muted/30 border-t border-border flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="text-[10px] font-black uppercase tracking-widest">{products.length} articles au total</span>
            <div className="w-1.5 h-1.5 rounded-full bg-border" />
            <span className="text-[10px] font-black uppercase tracking-widest">{products.filter(p => p.stock <= p.minStock).length} alertes stock</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Download className="w-3 h-3" />
            <span>Mise à jour: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <Button 
            variant="outline" 
            className="border-primary/20 hover:bg-primary/5 text-primary text-[10px] h-10 px-6 gap-2 font-black uppercase tracking-widest shadow-sm"
            onClick={downloadReport}
            disabled={downloadProgress !== null}
          >
            {downloadProgress !== null ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Traitement {downloadProgress}%
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Exporter PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[650px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Journal des Mouvements de Stock
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {historyProduct && (
              <div className="mb-6 p-4 bg-muted/30 rounded-2xl border border-border/50 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Produit</p>
                  <p className="text-sm font-bold text-foreground">{historyProduct.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Réf / Stock Actuel</p>
                  <p className="text-sm font-mono font-bold text-primary">{historyProduct.reference} / {historyProduct.stock} PCS</p>
                </div>
              </div>
            )}
            
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-4 py-3">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-4 py-3">Action</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-4 py-3">Raison</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-4 py-3 text-right">Auteur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHistory.map((log, idx) => (
                    <TableRow key={idx} className="border-b border-border hover:bg-muted/10 transition-colors">
                      <TableCell className="px-4 py-3 text-[11px] font-medium text-muted-foreground">{log.date}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className={cn(
                          "font-black text-[9px] uppercase border-none",
                          log.type === 'entry' ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                        )}>
                          {log.type === 'entry' ? `+${log.quantity}` : `-${log.quantity}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-foreground font-medium">{log.reason}</TableCell>
                      <TableCell className="px-4 py-3 text-right text-[11px] font-black text-muted-foreground capitalize">{log.user}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-8">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Supprimer l'article ?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Êtes-vous certain de vouloir supprimer cet article de l'inventaire ? 
              <br/><br/>
              <span className="font-bold text-foreground">Cette action est irréversible</span> et supprimera également toutes les données liées à ce produit.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6">
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6">
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
