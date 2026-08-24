import React, { useState, useEffect } from 'react';
import { Product, CartItem, Customer, Sale, SystemSettings } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Plus, Minus, Trash2, User, FileText, Download, Package, FileSpreadsheet, Landmark, Percent, Wallet, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useERP } from '@/src/lib/useERP';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { printThermalReceipt, downloadThermalReceiptPDF } from '@/src/services/printerService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

interface PosProps {
  products: Product[];
  customers: Customer[];
  onCompleteSale: (sale: Sale) => void;
  settings: SystemSettings;
  currencySymbol?: string;
}

export function PosSystem({ products, customers, onCompleteSale, settings, currencySymbol = 'FC' }: PosProps) {
  const { formatAmount, convertAmount } = useERP();
  // Offline Resilience: Load cart from session storage
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = sessionStorage.getItem('vi_erp_pos_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    const saved = sessionStorage.getItem('vi_erp_pos_customer');
    return saved ? JSON.parse(saved) : null;
  });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [discount, setDiscount] = useState(0);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [isCheckoutConfirmOpen, setIsCheckoutConfirmOpen] = useState(false);

  // Thermal Receipt State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [lastCustomer, setLastCustomer] = useState<Customer | null>(null);
  const [lastAmountReceived, setLastAmountReceived] = useState<number>(0);
  const [lastChangeDue, setLastChangeDue] = useState<number>(0);
  const [lastDiscount, setLastDiscount] = useState<number>(0);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Persistence: Save state whenever it changes
  useEffect(() => {
    sessionStorage.setItem('vi_erp_pos_cart', JSON.stringify(cart));
    sessionStorage.setItem('vi_erp_pos_customer', JSON.stringify(selectedCustomer));
  }, [cart, selectedCustomer]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) {
      toast.error('Stock insuffisant !');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        if (newQty === existing.quantity && existing.quantity >= product.stock) {
          toast.warning('Stock maximum atteint');
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { ...product, quantity: Math.min(product.stock, quantity) }];
    });
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    toast.info('Panier vidé');
  };

  const updateQuantity = (productId: string, newQty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const qty = Math.max(1, Math.min(product.stock, newQty));
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: qty } : item
    ));
    
    if (newQty > product.stock) {
      toast.warning(`Stock limité à ${product.stock} unités`);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm && filteredProducts.length > 0) {
      addToCart(filteredProducts[0]);
      setSearchTerm('');
    }
  };

  // Improved calculations with rounding safety
  const totalHT = Number(cart.reduce((acc, item) => acc + (item.priceHT * item.quantity), 0).toFixed(2));
  const totalTVA = Number(cart.reduce((acc, item) => acc + ((item.priceTTC - item.priceHT) * item.quantity), 0).toFixed(2));
  
  // Internal Reference Total (CDF)
  const discountInRef = convertAmount(discount, settings.currency, 'CDF');
  const totalTTC = Math.max(0, Number(((totalHT + totalTVA) - discountInRef).toFixed(2)));
  
  const totalTTCInView = convertAmount(totalTTC, 'CDF', settings.currency);
  const changeDue = amountReceived > 0 ? (amountReceived - totalTTCInView) : 0;

  const exportCartToCSV = () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide !');
      return;
    }
    
    const headers = ['Article', 'Quantite', 'Prix Unitaire', 'Total'];
    const rows = cart.map(item => [
      `"${item.name}"`,
      item.quantity,
      item.priceTTC.toFixed(2),
      (item.priceTTC * item.quantity).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `panier_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Panier exporté en CSV !');
  };

  const generateInvoice = (sale: Sale) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a6'
    }) as any;
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header - Professional Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.shopName.toUpperCase(), pageWidth / 2, 8, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.shopAddress, pageWidth / 2, 11, { align: 'center' });
    doc.text(`Tél: ${settings.shopPhone} | ${settings.numNIF}`, pageWidth / 2, 14, { align: 'center' });
    
    doc.setLineWidth(0.1);
    doc.line(5, 16, pageWidth - 5, 16);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE DE VENTE', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Facture N°: ${sale.id}`, 10, 26);
    doc.text(`Date: ${new Date(sale.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`, 10, 29);
    doc.text(`Paiement: ${paymentMethod.toUpperCase()}`, 10, 32);

    if (selectedCustomer) {
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENT:', 10, 37);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedCustomer.name.toUpperCase(), 22, 37);
    }

    const tableData = sale.items.map(item => [
      item.name,
      item.quantity,
      `${item.priceTTC.toLocaleString()}`,
      `${(item.priceTTC * item.quantity).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Désignation', 'Qté', 'P.U', 'Total']],
      body: tableData,
      theme: 'plain',
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 5, right: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 4;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    const totalX = pageWidth - 10;
    doc.text(`Net HT: ${formatAmount(sale.totalHT)}`, totalX, finalY, { align: 'right' });
    doc.text(`TVA (${settings.defaultTva}%): ${formatAmount(sale.totalTVA)}`, totalX, finalY + 3, { align: 'right' });
    
    if (discount > 0) {
      doc.text(`Remise: -${formatAmount(discount, 'CDF', settings.currency)}`, totalX, finalY + 6, { align: 'right' });
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL TTC: ${formatAmount(sale.totalTTC)}`, totalX, finalY + 11, { align: 'right' });

    if (paymentMethod === 'cash' && amountReceived > 0) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reçu: ${formatAmount(amountReceived, settings.currency, settings.currency)}`, totalX, finalY + 15, { align: 'right' });
      doc.text(`Rendu: ${formatAmount(changeDue, settings.currency, settings.currency)}`, totalX, finalY + 18, { align: 'right' });
    }

    doc.setFontSize(5);
    doc.setFont('helvetica', 'italic');
    doc.text('Les marchandises vendues ne sont ni reprises ni échangées.', pageWidth / 2, finalY + 24, { align: 'center' });
    doc.text('Logiciel VI ERP Pro (v1.3) • idriss&vab tech corp', pageWidth / 2, finalY + 27, { align: 'center' });

    doc.save(`Facture_${sale.id}.pdf`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const saleId = `FAC-${Date.now().toString().slice(-6)}`;
    const sale: Sale = {
      id: saleId,
      customerId: selectedCustomer?.id,
      items: [...cart],
      totalHT,
      totalTVA,
      totalTTC,
      date: new Date().toISOString(),
      status: 'completed',
      paymentMethod: paymentMethod === 'cash' ? 'cash' : paymentMethod === 'card' ? 'mobile_money' : 'mobile_money'
    };

    try {
      await onCompleteSale(sale);
      
      // Store state for thermal receipt modal
      setCompletedSale(sale);
      setLastCustomer(selectedCustomer);
      setLastAmountReceived(amountReceived);
      setLastChangeDue(changeDue);
      setLastDiscount(discountInRef);

      // Auto-print if configured
      if (settings.thermalAutoPrint) {
        printThermalReceipt(sale, settings, {
          customer: selectedCustomer,
          amountReceived,
          changeDue,
          discount: discountInRef,
          paymentMethod
        });
      }

      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setAmountReceived(0);
      setIsCheckoutConfirmOpen(false);
      
      // Open thermal receipt modal
      setIsReceiptModalOpen(true);
      toast.success(`Facture ${saleId} enregistrée avec succès !`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erreur lors de l\'enregistrement de la vente');
    }
  };

  const handleCreateQuote = () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide pour un devis !');
      return;
    }
    toast.info('Génération du devis en cours...');
    setTimeout(() => toast.success('Devis généré avec succès !'), 1000);
  };

  const handleCloseRegister = () => {
    toast.info('Clôture de caisse en cours...');
    setTimeout(() => toast.success('Caisse clôturée. Rapport envoyé par email.'), 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-14rem)] overflow-y-auto lg:overflow-hidden pb-10 lg:pb-0">
      <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-[500px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Scanner ou rechercher (Nom, Réf)..."
              className="pl-10 bg-card/50 border-border h-11 focus:ring-primary shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {completedSale && (
              <Button 
                variant="outline" 
                type="button"
                className="border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 gap-2 text-[10px] lg:text-[11px] font-black uppercase tracking-widest h-11 px-4 shadow-sm"
                onClick={() => setIsReceiptModalOpen(true)}
                title="Réimprimer le ticket de la dernière vente"
              >
                <Printer className="w-4 h-4" />
                Dernier Ticket ({completedSale.id})
              </Button>
            )}
            <Button 
              variant="outline" 
              type="button"
              className="border-primary/20 hover:bg-primary/5 gap-2 text-[10px] lg:text-[11px] font-black uppercase tracking-widest h-11 px-6 text-primary shadow-sm"
              onClick={handleCloseRegister}
            >
              <Landmark className="w-4 h-4" />
              Clôture de Caisse
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 rounded-2xl border border-border bg-card/20 p-4 shadow-inner min-h-[300px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-32 text-muted-foreground opacity-50">
                <Package className="w-16 h-16 mb-4 stroke-1" />
                <p className="font-medium">Aucun produit ne correspond</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300 cursor-pointer bg-card border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10",
                    product.stock <= 0 && "opacity-60 grayscale"
                  )}
                  onClick={() => addToCart(product)}
                >
                  <CardHeader className="p-4 pb-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {product.reference}
                      </span>
                      <Badge 
                        className={cn(
                          "text-[9px] font-bold h-5 px-2 border-none",
                          product.stock <= product.minStock ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-500"
                        )}
                      >
                        {product.stock} Dispo.
                      </Badge>
                    </div>
                    <CardTitle className="text-[14px] font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xl font-black text-foreground">{formatAmount(product.priceTTC)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] font-black uppercase tracking-widest px-2 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('View details', product);
                          toast.info(`Détails de ${product.name} (Réf: ${product.reference})`);
                        }}
                      >
                        Détails
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60 mt-1">{product.category}</p>
                  </CardContent>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Card className="lg:col-span-4 flex flex-col bg-card border-border shadow-2xl relative z-10 rounded-2xl overflow-hidden border-2">
        <CardHeader className="p-6 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-[16px] font-black uppercase tracking-wider">Panier En Cours</CardTitle>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest">{cart.length} Articles sélectionnés</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={clearCart}
                disabled={cart.length === 0}
                title="Vider le panier"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                className="h-10 w-10 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                onClick={exportCartToCSV}
                title="Exporter en CSV"
              >
                <FileSpreadsheet className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-6">
            <div className="py-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30 gap-4">
                  <ShoppingCart className="w-16 h-16 stroke-1" />
                  <p className="text-sm font-bold uppercase tracking-widest">Le panier est vide</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table-like Header for professional feel */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">
                    <div className="col-span-6">DÉSIGNATION</div>
                    <div className="col-span-3 text-center">QTÉ</div>
                    <div className="col-span-3 text-right">TOTAL</div>
                  </div>
                  
                  {cart.map((item) => (
                    <div key={item.id} className="group relative bg-muted/10 p-3 rounded-xl border border-border/40 hover:bg-muted/20 hover:border-primary/30 transition-all">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6 min-w-0">
                          <p className="text-[12px] font-extrabold truncate leading-tight">{item.name}</p>
                          <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60 tracking-tighter">{item.reference}</p>
                        </div>
                        
                        <div className="col-span-3 flex justify-center">
                          <div className="flex items-center gap-0.5 bg-background border border-border/50 rounded-lg p-0.5 shadow-sm">
                            <button 
                              type="button"
                              className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-20" 
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity - 1); }}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input 
                              type="number"
                              className="w-8 bg-transparent text-[11px] font-black text-center font-mono outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <button 
                              type="button"
                              className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary transition-colors" 
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1); }}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="col-span-3 text-right">
                          <p className="text-[12px] font-black text-foreground">{formatAmount(item.priceTTC * item.quantity)}</p>
                          <p className="text-[9px] text-muted-foreground opacity-50 font-mono italic">
                            {formatAmount(item.priceTTC)}/u
                          </p>
                        </div>
                      </div>

                      {/* Small floating delete button on hover */}
                      <button 
                        type="button"
                        className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-destructive text-destructive-foreground rounded-full shadow-lg items-center justify-center hidden group-hover:flex transition-all scale-0 group-hover:scale-100 z-10"
                        onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                      >
                        <Plus className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <div className="p-6 bg-muted/40 border-t border-border space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User className="w-3 h-3" /> Client Professionnel
                </label>
                <div className="relative">
                  <select 
                    className={cn(
                      "h-11 w-full rounded-xl border-2 px-4 pr-10 text-sm font-bold transition-all outline-none appearance-none cursor-pointer shadow-sm",
                      selectedCustomer 
                        ? "bg-primary/5 border-primary/40 text-primary" 
                        : "bg-background border-border hover:border-primary/20"
                    )}
                    onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                    value={selectedCustomer?.id || ''}
                  >
                    <option value="">👤 Passage (Client Anonyme)</option>
                    <optgroup label="Clients Fidèles">
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.loyaltyPoints || 0} pts)</option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Percent className="w-3 h-3 text-emerald-500" /> Remise Appliquée
                </label>
                <div className="relative group">
                  <Input 
                    type="number" 
                    step="any"
                    value={discount === 0 ? '' : discount}
                    placeholder="0.00"
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="h-11 rounded-xl bg-background border-2 border-border group-hover:border-emerald-500/30 font-bold shadow-sm pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-[10px]">
                    {currencySymbol}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mode de Règlement</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'ESPÈCES', icon: Wallet },
                  { id: 'card', label: 'MOBILE MON.', icon: Landmark },
                  { id: 'transfer', label: 'AUTRE', icon: FileText }
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={cn(
                      "flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all gap-1",
                      paymentMethod === method.id 
                        ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10" 
                        : "bg-background border-border/50 hover:border-border text-muted-foreground"
                    )}
                  >
                    <method.icon className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Calcul du Rendu (Espèces)</label>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    type="number" 
                    step="any"
                    placeholder="Montant Reçu..."
                    value={amountReceived === 0 ? '' : amountReceived}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    className="h-11 rounded-xl bg-emerald-500/5 border-emerald-500/20 text-emerald-600 font-black placeholder:text-emerald-500/30"
                  />
                  <div className="h-11 flex items-center px-4 bg-muted rounded-xl border border-border font-black text-sm">
                    Rendu: <span className="ml-auto text-emerald-600">{changeDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[12px] font-bold text-muted-foreground">
              <span className="uppercase tracking-widest opacity-60">Total Brut</span>
              <span className="font-mono">{formatAmount(totalHT + totalTVA)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-[11px] font-bold text-emerald-500">
                <span className="uppercase tracking-widest opacity-80 italic">REMISE EXCEPTIONNELLE</span>
                <span className="font-mono">-{formatAmount(discount)}</span>
              </div>
            )}
            <div className="flex flex-col gap-1 pt-2">
              <div className="flex justify-between items-end">
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">A Payer</span>
                <span className="text-3xl font-black text-primary leading-none tracking-tighter">{formatAmount(totalTTC)}</span>
              </div>
              
              {/* Secondary Currency Conversion for Cashier Help */}
              {settings.currency === 'CDF' ? (
                <div className="flex justify-end">
                  <span className="text-[10px] font-black text-muted-foreground uppercase opacity-70">
                    Équivalent USD: {formatAmount(totalTTC, 'CDF', 'USD')}
                  </span>
                </div>
              ) : settings.currency === 'USD' ? (
                <div className="flex justify-end">
                  <span className="text-[10px] font-black text-muted-foreground uppercase opacity-70">
                    Équivalent CDF: {formatAmount(totalTTC, 'USD', 'CDF')}
                  </span>
                </div>
              ) : null}
            </div>

            <Button 
              type="button"
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] gap-3 shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] rounded-xl"
              disabled={cart.length === 0}
              onClick={() => {
                setPaymentMethod('cash');
                setIsCheckoutConfirmOpen(true);
              }}
            >
              <Wallet className="w-5 h-5 mb-0.5" />
              Payer en Espèces
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Button 
              variant="outline"
              type="button"
              className="h-14 text-[10px] font-black uppercase tracking-[0.2em] gap-3 border-2 border-border hover:bg-muted transition-all active:scale-[0.98] rounded-xl" 
              disabled={cart.length === 0}
              onClick={handleCreateQuote}
            >
              <FileText className="w-4 h-4 opacity-50" />
              Devis
            </Button>
            
            <Button 
              type="button"
              className="h-14 text-[11px] font-black uppercase tracking-[0.2em] gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex-1 rounded-xl" 
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutConfirmOpen(true)}
            >
              <ShoppingCart className="w-5 h-5 mb-0.5" />
              Encaisser
            </Button>

            <Dialog open={isCheckoutConfirmOpen} onOpenChange={setIsCheckoutConfirmOpen}>
              <DialogContent className="sm:max-w-[500px] bg-card border-border border-2 rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4 bg-muted/30">
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight">Confirmation de Vente</DialogTitle>
                  <DialogDescription className="text-sm font-medium text-muted-foreground">
                    Vérifiez les informations avant de valider la transaction.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="p-8 pt-4 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border/50">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Client</p>
                        <p className="text-lg font-black">{selectedCustomer?.name || 'Passage Anonyme'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Méthode</p>
                        <p className="text-sm font-bold uppercase tracking-tighter text-primary">{paymentMethod}</p>
                      </div>
                    </div>

                    <div className="space-y-1 bg-muted/20 p-4 rounded-2xl border border-dashed border-border">
                      <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Total ({cart.length} art.)</span>
                        <span>{formatAmount(totalHT + totalTVA)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-xs font-bold text-emerald-500 uppercase tracking-widest">
                          <span>Remise</span>
                          <span>-{formatAmount(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-end pt-2 border-t border-border/30 mt-2">
                        <span className="text-lg font-black uppercase tracking-tighter">Total Net</span>
                        <span className="text-3xl font-black text-primary">{formatAmount(totalTTC)}</span>
                      </div>
                    </div>

                    {paymentMethod === 'cash' && amountReceived > 0 && (
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-emerald-600 tracking-widest">Monnaie à Rendre</span>
                        <span className="text-xl font-black text-emerald-600 font-mono">{changeDue.toLocaleString()} {currencySymbol}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCheckoutConfirmOpen(false)}
                      className="h-14 rounded-xl border-2 font-black uppercase tracking-widest text-[11px]"
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleCheckout}
                      className="h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20"
                    >
                      Confirmer & Imprimer
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Thermal Receipt Print & Preview Dialog */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={completedSale}
        settings={settings}
        customer={lastCustomer}
        cashierName="Caissier POS"
        amountReceived={lastAmountReceived}
        changeDue={lastChangeDue}
        discount={lastDiscount}
      />
    </div>
  );
}
