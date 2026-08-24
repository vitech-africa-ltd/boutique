import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Layers, 
  Settings2, 
  RotateCw, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Sale, Customer, SystemSettings } from '@/src/types';
import { 
  printThermalReceipt, 
  downloadThermalReceiptPDF, 
  generateReceiptSummaryText,
  ThermalPrintOptions 
} from '@/src/services/printerService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: SystemSettings;
  customer?: Customer | null;
  cashierName?: string;
  amountReceived?: number;
  changeDue?: number;
  discount?: number;
  onNewSale?: () => void;
}

export function ThermalReceiptModal({
  isOpen,
  onClose,
  sale,
  settings,
  customer,
  cashierName = 'Caissier',
  amountReceived = 0,
  changeDue = 0,
  discount = 0,
  onNewSale
}: ThermalReceiptModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(
    settings.thermalPrinterWidth || '80mm'
  );

  if (!sale) return null;

  const cur = settings.currency || 'USD';

  const options: ThermalPrintOptions = {
    paperWidth,
    customer,
    cashierName,
    amountReceived,
    changeDue,
    discount,
    paymentMethod: sale.paymentMethod
  };

  const handlePrintSingle = async () => {
    setIsPrinting(true);
    try {
      const success = await printThermalReceipt(sale, settings, {
        ...options,
        copyType: 'ORIGINAL'
      });
      if (success) {
        toast.success('Ordre d\'impression envoyé à l\'imprimante thermique !');
      } else {
        toast.error('Échec d\'envoi à l\'imprimante');
      }
    } catch (e) {
      toast.error('Erreur d\'impression');
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintDuplicate = async () => {
    setIsPrinting(true);
    try {
      // Print Client copy
      await printThermalReceipt(sale, settings, {
        ...options,
        copyType: 'CLIENT'
      });
      // Small pause then print Merchant copy
      setTimeout(async () => {
        await printThermalReceipt(sale, settings, {
          ...options,
          copyType: 'MAGASIN'
        });
        toast.success('Double exemplaire imprimé (Client + Magasin)');
        setIsPrinting(false);
      }, 700);
    } catch (e) {
      toast.error('Erreur lors du double tirage');
      setIsPrinting(false);
    }
  };

  const handleDownloadPDF = () => {
    downloadThermalReceiptPDF(sale, settings, options);
    toast.success(`PDF ${sale.id} téléchargé`);
  };

  const handleCopyText = () => {
    const text = generateReceiptSummaryText(sale, settings, options);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Résumé du ticket copié dans le presse-papier');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompleteAndClose = () => {
    onClose();
    if (onNewSale) {
      onNewSale();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCompleteAndClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border-border border-2 rounded-2xl shadow-2xl">
        {/* Header Bar */}
        <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                Ticket de Vente Prêt
                <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
                  {sale.id}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Transaction validée avec succès. Choisissez vos options d'impression thermique.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={cn(
                "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all",
                paperWidth === '80mm'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              80mm (Standard)
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={cn(
                "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all",
                paperWidth === '58mm'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              58mm (Compact)
            </button>
          </div>
        </div>

        {/* Modal Body: Thermal Paper Live Preview & Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start bg-muted/20">
          
          {/* Visual Thermal Receipt Ticket */}
          <div className="md:col-span-7 flex justify-center">
            <div 
              className={cn(
                "relative bg-[#FFFDF9] text-[#1E1E1E] shadow-2xl rounded-sm p-4 sm:p-5 font-mono text-xs border border-[#E8E4D8] select-none transition-all",
                paperWidth === '58mm' ? "w-[260px]" : "w-[320px]"
              )}
              style={{
                backgroundImage: 'radial-gradient(#F0EDE6 0.5px, transparent 0.5px)',
                backgroundSize: '12px 12px'
              }}
            >
              {/* Top Jagged Edge Decoration */}
              <div className="absolute -top-1 left-0 w-full h-2 bg-background flex items-center justify-around overflow-hidden opacity-80">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} className="inline-block w-2 h-2 rotate-45 bg-[#FFFDF9] shrink-0 transform -translate-y-1 border-t border-l border-[#E8E4D8]" />
                ))}
              </div>

              {/* Store Header */}
              <div className="text-center space-y-0.5 pt-2">
                <h2 className="font-black text-sm tracking-wider uppercase text-black font-sans">
                  {settings.shopName || 'VI ERP PRO'}
                </h2>
                <p className="text-[10px] text-[#555]">{settings.shopAddress}</p>
                <p className="text-[10px] text-[#555]">
                  Tél : {settings.shopPhone} {settings.numNIF && `| NIF: ${settings.numNIF}`}
                </p>
              </div>

              <div className="my-2 border-b border-dashed border-[#888]" />

              {/* Ticket Info */}
              <div className="text-[10px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>TICKET :</span>
                  <span className="font-mono text-black">{sale.id}</span>
                </div>
                <div className="flex justify-between text-[#555]">
                  <span>DATE :</span>
                  <span>{new Date(sale.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between text-[#555]">
                  <span>CAISSIER :</span>
                  <span className="font-semibold text-black uppercase">{cashierName}</span>
                </div>
                {customer && (
                  <div className="flex justify-between text-[#555] pt-0.5">
                    <span>CLIENT :</span>
                    <span className="font-bold text-black uppercase truncate max-w-[140px]">{customer.name}</span>
                  </div>
                )}
              </div>

              <div className="my-2 border-b border-dashed border-[#888]" />

              {/* Items Table */}
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between font-bold text-[#444] border-b border-[#CCC] pb-1">
                  <span>DÉSIGNATION</span>
                  <div className="flex gap-2">
                    <span className="w-6 text-center">QTÉ</span>
                    <span className="w-14 text-right">TOTAL</span>
                  </div>
                </div>

                <div className="divide-y divide-[#F0EDE6] space-y-1">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="pt-1">
                      <div className="font-medium truncate max-w-[190px]">{item.name}</div>
                      <div className="flex justify-between text-[9px] text-[#666]">
                        <span>{item.quantity} x {item.priceTTC.toFixed(2)} {cur}</span>
                        <span className="font-bold text-black">
                          {(item.priceTTC * item.quantity).toFixed(2)} {cur}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="my-2 border-b border-dashed border-[#888]" />

              {/* Totals */}
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between text-[#555]">
                  <span>Total HT :</span>
                  <span>{sale.totalHT.toFixed(2)} {cur}</span>
                </div>
                <div className="flex justify-between text-[#555]">
                  <span>TVA ({settings.defaultTva}%) :</span>
                  <span>{sale.totalTVA.toFixed(2)} {cur}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Remise :</span>
                    <span>-{discount.toFixed(2)} {cur}</span>
                  </div>
                )}
                
                <div className="my-1 border-t-2 border-black" />

                <div className="flex justify-between items-baseline font-black text-sm font-sans text-black py-0.5">
                  <span>TOTAL TTC :</span>
                  <span className="text-base">{sale.totalTTC.toFixed(2)} {cur}</span>
                </div>

                <div className="my-1 border-b-2 border-black" />

                <div className="text-[10px] space-y-0.5 pt-0.5 text-[#555]">
                  <div className="flex justify-between">
                    <span>Paiement :</span>
                    <span className="font-bold text-black uppercase">{sale.paymentMethod || 'Espèces'}</span>
                  </div>
                  {amountReceived > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Montant Reçu :</span>
                        <span>{amountReceived.toFixed(2)} {cur}</span>
                      </div>
                      <div className="flex justify-between font-bold text-black">
                        <span>Monnaie Rendue :</span>
                        <span>{changeDue.toFixed(2)} {cur}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="my-2 border-b border-dashed border-[#888]" />

              {/* Simulated Barcode */}
              <div className="text-center pt-1 pb-2">
                <div className="h-7 mx-auto flex items-center justify-center gap-0.5 opacity-85">
                  {Array.from({ length: paperWidth === '58mm' ? 32 : 44 }).map((_, i) => {
                    const isThick = (i * 7) % 3 === 0;
                    return (
                      <span
                        key={i}
                        className={cn(
                          "inline-block bg-black h-full",
                          isThick ? "w-[2.5px]" : "w-[1px]",
                          (i % 5 === 0) ? "mr-[1px]" : ""
                        )}
                      />
                    );
                  })}
                </div>
                <p className="text-[8px] font-mono tracking-widest text-[#444] mt-1">* {sale.id} *</p>
              </div>

              {/* Footer text */}
              <div className="text-center space-y-1 text-[9px] text-[#666] pt-1">
                <p className="font-bold text-black uppercase">Merci de votre confiance !</p>
                <p className="text-[8px] italic leading-tight">
                  {settings.thermalReceiptFooter || 'Les marchandises vendues ne sont ni reprises ni échangées.'}
                </p>
                <p className="text-[7px] text-[#999] font-mono">VI ERP Pro POS Service</p>
              </div>

              {/* Bottom Serrated Edge */}
              <div className="absolute -bottom-1 left-0 w-full h-2 bg-background flex items-center justify-around overflow-hidden opacity-80">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} className="inline-block w-2 h-2 rotate-45 bg-[#FFFDF9] shrink-0 transform translate-y-1 border-b border-r border-[#E8E4D8]" />
                ))}
              </div>
            </div>
          </div>

          {/* Action Panels */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Quick Print Primary Card */}
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary" />
                Actions d'Impression
              </h4>

              <Button
                type="button"
                size="lg"
                onClick={handlePrintSingle}
                disabled={isPrinting}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Printer className="w-5 h-5" />
                {isPrinting ? 'Envoi en cours...' : 'Imprimer le Ticket'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handlePrintDuplicate}
                disabled={isPrinting}
                className="w-full h-10 border-border bg-background hover:bg-muted font-bold text-xs gap-2 rounded-xl"
              >
                <Layers className="w-4 h-4 text-amber-500" />
                Double Exemplaire (Client + Caisse)
              </Button>
            </div>

            {/* Document Export & Sharing */}
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Export & Partage
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  className="h-10 text-xs font-bold gap-1.5 rounded-xl border-border bg-background hover:bg-muted"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  PDF Thermique
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                  className="h-10 text-xs font-bold gap-1.5 rounded-xl border-border bg-background hover:bg-muted"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-primary" />
                      Copier Texte
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Summary Highlights */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Articles vendus :</span>
                <span className="font-bold text-foreground">{sale.items.length} lignes ({sale.items.reduce((a, b) => a + b.quantity, 0)} pcs)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total payé :</span>
                <span className="font-black text-emerald-500">{sale.totalTTC.toFixed(2)} {cur}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format actuel :</span>
                <span className="font-mono font-bold text-foreground">{paperWidth} Roll</span>
              </div>
            </div>

            {/* Close / Next Sale Button */}
            <Button
              type="button"
              variant="secondary"
              onClick={handleCompleteAndClose}
              className="w-full h-11 font-black text-xs uppercase tracking-wider rounded-xl gap-2 hover:bg-muted"
            >
              <RotateCw className="w-4 h-4" />
              Nouvelle Vente (Fermer)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
