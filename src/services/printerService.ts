import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, SystemSettings, Customer, CartItem } from '@/src/types';

export interface ThermalPrintOptions {
  paperWidth?: '80mm' | '58mm';
  duplicate?: boolean; // Print 2 copies (Client + Merchant)
  copyType?: 'CLIENT' | 'MAGASIN' | 'ORIGINAL';
  cashierName?: string;
  customer?: Customer | null;
  amountReceived?: number;
  changeDue?: number;
  discount?: number;
  paymentMethod?: string;
  notes?: string;
}

/**
 * Format currency amount with given currency symbol / code
 */
function formatReceiptAmount(amount: number, currency = 'USD'): string {
  const rounded = Number(amount || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${rounded} ${currency}`;
}

/**
 * Calculate dynamic height for thermal roll paper based on content
 */
function calculateThermalHeight(sale: Sale, options: ThermalPrintOptions): number {
  const baseHeight = 105; // Header, info, totals, footer
  const itemHeight = (sale.items?.length || 1) * 8.5; // per item row
  const customerHeight = options.customer ? 15 : 0;
  const paymentHeight = options.amountReceived ? 16 : 8;
  const discountHeight = options.discount && options.discount > 0 ? 8 : 0;
  const notesHeight = options.notes ? 12 : 0;
  
  // Total calculated height in mm (with safety margin)
  return Math.max(130, Math.ceil(baseHeight + itemHeight + customerHeight + paymentHeight + discountHeight + notesHeight));
}

/**
 * Draw a clean dashed line across thermal width
 */
function drawDashedLine(doc: jsPDF, y: number, startX: number, endX: number) {
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(startX, y, endX, y);
  doc.setLineDashPattern([], 0); // reset
}

/**
 * Draw simulated barcode on thermal receipt
 */
function drawBarcode(doc: jsPDF, text: string, x: number, y: number, width: number, height: number) {
  doc.setFillColor(20, 20, 20);
  
  // Generate pseudo barcode bars from string
  const totalBars = 35;
  const barUnitWidth = width / (totalBars * 1.5);
  
  let currentX = x;
  for (let i = 0; i < totalBars; i++) {
    const charCode = text.charCodeAt(i % text.length) || 65;
    const isThick = (charCode + i) % 3 === 0;
    const barW = isThick ? barUnitWidth * 1.8 : barUnitWidth * 0.9;
    
    if ((charCode + i) % 2 === 0) {
      doc.rect(currentX, y, barW, height, 'F');
    }
    currentX += barW + barUnitWidth * 0.6;
    if (currentX > x + width) break;
  }

  // Draw barcode text below
  doc.setFontSize(6);
  doc.setFont('courier', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`* ${text} *`, x + width / 2, y + height + 3, { align: 'center' });
}

/**
 * Generate a high-fidelity thermal receipt jsPDF document
 */
export function generateThermalReceiptPDF(
  sale: Sale,
  settings: SystemSettings,
  options: ThermalPrintOptions = {}
): jsPDF {
  const paperWidthType = options.paperWidth || settings.thermalPrinterWidth || '80mm';
  const width = paperWidthType === '58mm' ? 58 : 80;
  const height = calculateThermalHeight(sale, options);
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, height],
    compress: true
  });

  const margin = paperWidthType === '58mm' ? 3 : 5;
  const contentWidth = width - (margin * 2);
  const centerX = width / 2;
  const rightX = width - margin;
  let currentY = 7;

  // 1. HEADER SECTION (Store Branding)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(paperWidthType === '58mm' ? 10 : 12);
  doc.setTextColor(0, 0, 0);
  
  // Store Name
  const storeName = (settings.shopName || 'VI ERP PRO').toUpperCase();
  doc.text(storeName, centerX, currentY, { align: 'center' });
  currentY += 4.5;

  // Copy Type Badge (Client / Caisse)
  if (options.copyType) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`--- EXEMPLAIRE ${options.copyType} ---`, centerX, currentY, { align: 'center' });
    currentY += 3.5;
  }

  // Address & Contact Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 60);

  if (settings.shopAddress) {
    const splitAddress = doc.splitTextToSize(settings.shopAddress, contentWidth);
    doc.text(splitAddress, centerX, currentY, { align: 'center' });
    currentY += splitAddress.length * 3;
  }

  if (settings.shopPhone) {
    doc.text(`Tél : ${settings.shopPhone}`, centerX, currentY, { align: 'center' });
    currentY += 3;
  }

  if (settings.numNIF) {
    doc.text(`NIF/RCCM : ${settings.numNIF}`, centerX, currentY, { align: 'center' });
    currentY += 3;
  }

  // Top Separator
  drawDashedLine(doc, currentY, margin, rightX);
  currentY += 3.5;

  // 2. RECEIPT METADATA (Ticket #, Date, Cashier, Customer)
  doc.setFont('courier', 'bold');
  doc.setFontSize(paperWidthType === '58mm' ? 7 : 8);
  doc.setTextColor(0, 0, 0);
  
  doc.text(`TICKET : ${sale.id}`, margin, currentY);
  currentY += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(50, 50, 50);

  const saleDate = new Date(sale.date || Date.now());
  const dateFormatted = saleDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeFormatted = saleDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  doc.text(`Date : ${dateFormatted}  ${timeFormatted}`, margin, currentY);
  currentY += 3;

  if (options.cashierName) {
    doc.text(`Caissier : ${options.cashierName.toUpperCase()}`, margin, currentY);
    currentY += 3;
  }

  // Customer Info
  if (options.customer) {
    doc.setFont('courier', 'bold');
    doc.text(`Client : ${options.customer.name.toUpperCase()}`, margin, currentY);
    currentY += 3;
    doc.setFont('courier', 'normal');
    if (options.customer.phone) {
      doc.text(`Tél : ${options.customer.phone}`, margin, currentY);
      currentY += 3;
    }
    if (options.customer.loyaltyPoints !== undefined) {
      doc.text(`Points Fidélité : ${options.customer.loyaltyPoints} pts`, margin, currentY);
      currentY += 3;
    }
  }

  // Table Header Separator
  drawDashedLine(doc, currentY, margin, rightX);
  currentY += 2;

  // 3. ITEMS TABLE
  const tableHead = [['ART', 'QTÉ', 'P.U', 'TOTAL']];
  const tableBody = (sale.items || []).map((item: CartItem) => {
    const unitPrice = item.priceTTC.toLocaleString('fr-FR', { minimumFractionDigits: 1 });
    const lineTotal = (item.priceTTC * item.quantity).toLocaleString('fr-FR', { minimumFractionDigits: 1 });
    return [
      item.name.length > (paperWidthType === '58mm' ? 14 : 20)
        ? item.name.substring(0, paperWidthType === '58mm' ? 13 : 19) + '.'
        : item.name,
      `${item.quantity}`,
      unitPrice,
      lineTotal
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'plain',
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    styles: {
      font: 'courier',
      fontSize: paperWidthType === '58mm' ? 6 : 7,
      cellPadding: 0.8,
      overflow: 'linebreak',
      textColor: [0, 0, 0]
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: paperWidthType === '58mm' ? 6 : 7,
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      cellPadding: 1
    },
    columnStyles: {
      0: { cellWidth: paperWidthType === '58mm' ? 22 : 32 },
      1: { cellWidth: paperWidthType === '58mm' ? 8 : 10, halign: 'center' },
      2: { cellWidth: paperWidthType === '58mm' ? 10 : 14, halign: 'right' },
      3: { cellWidth: paperWidthType === '58mm' ? 12 : 14, halign: 'right', fontStyle: 'bold' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 2;

  // Separator below items
  drawDashedLine(doc, currentY, margin, rightX);
  currentY += 3.5;

  // 4. TOTALS & FINANCIAL SUMMARY
  doc.setFont('courier', 'normal');
  doc.setFontSize(paperWidthType === '58mm' ? 6.5 : 7.5);
  doc.setTextColor(40, 40, 40);

  const cur = settings.currency || 'USD';

  // Total HT
  doc.text('Total HT :', margin, currentY);
  doc.text(formatReceiptAmount(sale.totalHT, cur), rightX, currentY, { align: 'right' });
  currentY += 3.5;

  // TVA
  if (settings.thermalShowTVA !== false) {
    const tvaRate = settings.defaultTva || 16;
    doc.text(`TVA (${tvaRate}%) :`, margin, currentY);
    doc.text(formatReceiptAmount(sale.totalTVA, cur), rightX, currentY, { align: 'right' });
    currentY += 3.5;
  }

  // Remise / Discount
  if (options.discount && options.discount > 0) {
    doc.setFont('courier', 'bold');
    doc.setTextColor(180, 40, 40);
    doc.text('Remise appliquée :', margin, currentY);
    doc.text(`- ${formatReceiptAmount(options.discount, cur)}`, rightX, currentY, { align: 'right' });
    currentY += 3.5;
    doc.setFont('courier', 'normal');
    doc.setTextColor(40, 40, 40);
  }

  // Thick line before GRAND TOTAL
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, rightX, currentY);
  currentY += 4;

  // GRAND TOTAL TTC (Large & Bold)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(paperWidthType === '58mm' ? 10 : 12);
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL TTC :', margin, currentY);
  doc.text(formatReceiptAmount(sale.totalTTC, cur), rightX, currentY, { align: 'right' });
  currentY += 5;

  doc.setLineWidth(0.4);
  doc.line(margin, currentY, rightX, currentY);
  currentY += 3.5;

  // 5. PAYMENT BREAKDOWN
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(50, 50, 50);

  const paymentLabelMap: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte Bancaire',
    mobile_money: 'Mobile Money',
    credit: 'À Crédit'
  };
  const payMethod = paymentLabelMap[options.paymentMethod || sale.paymentMethod || 'cash'] || 'Espèces';

  doc.text(`Mode de Règlement : ${payMethod.toUpperCase()}`, margin, currentY);
  currentY += 3.2;

  if (options.amountReceived && options.amountReceived > 0) {
    doc.text(`Montant Reçu :`, margin, currentY);
    doc.text(formatReceiptAmount(options.amountReceived, cur), rightX, currentY, { align: 'right' });
    currentY += 3.2;

    const change = options.changeDue || Math.max(0, options.amountReceived - sale.totalTTC);
    doc.setFont('courier', 'bold');
    doc.text(`Monnaie Rendue :`, margin, currentY);
    doc.text(formatReceiptAmount(change, cur), rightX, currentY, { align: 'right' });
    currentY += 3.5;
    doc.setFont('courier', 'normal');
  }

  // 6. FOOTER & BARCODE SECTION
  drawDashedLine(doc, currentY, margin, rightX);
  currentY += 4;

  // Barcode
  if (settings.thermalShowBarcode !== false) {
    const barcodeWidth = paperWidthType === '58mm' ? 44 : 54;
    const barcodeX = centerX - (barcodeWidth / 2);
    drawBarcode(doc, sale.id, barcodeX, currentY, barcodeWidth, 8);
    currentY += 14;
  }

  // Thank You Message & Policy
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('MERCI DE VOTRE VISITE !', centerX, currentY, { align: 'center' });
  currentY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(80, 80, 80);
  
  const customFooter = settings.thermalReceiptFooter || 'Les marchandises vendues ne sont ni reprises ni échangées.';
  const splitFooter = doc.splitTextToSize(customFooter, contentWidth);
  doc.text(splitFooter, centerX, currentY, { align: 'center' });
  currentY += splitFooter.length * 2.8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(140, 140, 140);
  doc.text(`Système VI ERP Pro • ${new Date().getFullYear()}`, centerX, currentY, { align: 'center' });

  return doc;
}

/**
 * Direct Print Thermal Receipt using a hidden sandboxed iframe
 */
export async function printThermalReceipt(
  sale: Sale,
  settings: SystemSettings,
  options: ThermalPrintOptions = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const doc = generateThermalReceiptPDF(sale, settings, options);
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Create hidden iframe for direct printing
      const iframeId = 'vi-erp-thermal-printer-iframe';
      let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
      
      if (iframe) {
        document.body.removeChild(iframe);
      }

      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = blobUrl;

      iframe.onload = () => {
        setTimeout(() => {
          try {
            if (iframe?.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            }
            resolve(true);
          } catch (printErr) {
            console.warn('Silent iframe print failed, falling back to window popup:', printErr);
            // Fallback: open blob URL directly
            window.open(blobUrl, '_blank');
            resolve(true);
          } finally {
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl);
            }, 60000);
          }
        }, 300);
      };

      document.body.appendChild(iframe);
    } catch (err) {
      console.error('Print thermal receipt failed:', err);
      resolve(false);
    }
  });
}

/**
 * Download thermal receipt as standalone PDF
 */
export function downloadThermalReceiptPDF(
  sale: Sale,
  settings: SystemSettings,
  options: ThermalPrintOptions = {}
): void {
  const doc = generateThermalReceiptPDF(sale, settings, options);
  doc.save(`Ticket_${sale.id}.pdf`);
}

/**
 * Generate plain-text thermal receipt representation (for sharing or raw printing)
 */
export function generateReceiptSummaryText(
  sale: Sale,
  settings: SystemSettings,
  options: ThermalPrintOptions = {}
): string {
  const cur = settings.currency || 'USD';
  const width = 38;
  const line = '-'.repeat(width);
  const doubleLine = '='.repeat(width);

  const lines = [
    (settings.shopName || 'VI ERP PRO').toUpperCase(),
    settings.shopAddress || '',
    settings.shopPhone ? `Tel: ${settings.shopPhone}` : '',
    settings.numNIF ? `NIF: ${settings.numNIF}` : '',
    doubleLine,
    `TICKET N°: ${sale.id}`,
    `DATE: ${new Date(sale.date).toLocaleString('fr-FR')}`,
    options.cashierName ? `CAISSIER: ${options.cashierName}` : '',
    options.customer ? `CLIENT: ${options.customer.name}` : '',
    line,
    'ARTICLES           QTE    P.U    TOTAL',
    line,
    ...(sale.items || []).map(i => {
      const name = (i.name.length > 16 ? i.name.substring(0, 15) + '.' : i.name).padEnd(17);
      const qty = `${i.quantity}`.padStart(3);
      const total = `${(i.priceTTC * i.quantity).toFixed(2)}`.padStart(10);
      return `${name} ${qty} ${total}`;
    }),
    line,
    `Total HT : ${sale.totalHT.toFixed(2)} ${cur}`,
    `TVA (${settings.defaultTva}%) : ${sale.totalTVA.toFixed(2)} ${cur}`,
    options.discount ? `Remise : -${options.discount.toFixed(2)} ${cur}` : '',
    doubleLine,
    `NET A PAYER : ${sale.totalTTC.toFixed(2)} ${cur}`,
    doubleLine,
    `Paiement: ${(sale.paymentMethod || 'Espèces').toUpperCase()}`,
    options.amountReceived ? `Reçu: ${options.amountReceived.toFixed(2)} ${cur}` : '',
    options.changeDue ? `Rendu: ${options.changeDue.toFixed(2)} ${cur}` : '',
    line,
    'MERCI DE VOTRE VISITE !',
    settings.thermalReceiptFooter || 'Marchandises vendues non reprises.'
  ].filter(Boolean);

  return lines.join('\n');
}

/**
 * Print a test diagnostic ticket
 */
export async function printTestReceipt(settings: SystemSettings): Promise<boolean> {
  const testSale: Sale = {
    id: `TEST-${Date.now().toString().slice(-4)}`,
    items: [
      {
        id: 'test-1',
        reference: 'TST-001',
        name: 'Produit de Test Imprimante',
        purchasePrice: 10,
        priceHT: 12.93,
        tva: 16,
        priceTTC: 15.00,
        stock: 99,
        minStock: 10,
        category: 'TEST',
        quantity: 2
      },
      {
        id: 'test-2',
        reference: 'TST-002',
        name: 'Article Diagnostic 80mm',
        purchasePrice: 5,
        priceHT: 8.62,
        tva: 16,
        priceTTC: 10.00,
        stock: 50,
        minStock: 5,
        category: 'TEST',
        quantity: 1
      }
    ],
    totalHT: 34.48,
    totalTVA: 5.52,
    totalTTC: 40.00,
    date: new Date().toISOString(),
    status: 'completed',
    paymentMethod: 'cash'
  };

  return printThermalReceipt(testSale, settings, {
    cashierName: 'ADMIN TEST',
    amountReceived: 50.00,
    changeDue: 10.00,
    notes: 'TICKET DIAGNOSTIC IMPRIMANTE THERMIQUE'
  });
}
