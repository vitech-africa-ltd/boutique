import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Plus, Truck, Calendar, Download, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import { Purchase, Product, Supplier } from '@/src/types';

interface PurchasesProps {
  currencySymbol?: string;
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  onAddPurchase: (purchase: Purchase) => void;
}

export function Purchases({ currencySymbol = 'FC', purchases, products, suppliers, onAddPurchase }: PurchasesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOrders = purchases.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suppliers.find(s => s.id === o.supplierId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Bons de Commande (Achats)</h2>
          <p className="text-sm text-muted-foreground">Gérez vos approvisionnements auprès des fournisseurs.</p>
        </div>
        <Button className="gap-2 bg-[#00A3FF] hover:bg-[#0082CC]">
          <Plus className="w-4 h-4" />
          Nouvelle Commande
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Commandes en Cours</span>
            <div className="text-2xl font-bold text-[#FFB300]">1</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Total Achats (Mois)</span>
            <div className="text-2xl font-bold text-white">3 350 000 {currencySymbol}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Délai Moyen Réception</span>
            <div className="text-2xl font-bold text-[#00E676]">3 jours</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un bon de commande..."
          className="pl-10 bg-[#1F2125] border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#151619]">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">N° Commande</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Fournisseur</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Date</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Montant Total</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Statut</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((purchase) => {
              const supplier = suppliers.find(s => s.id === purchase.supplierId);
              return (
                <TableRow key={purchase.id} className="hover:bg-white/[0.02] border-b border-border transition-colors">
                  <TableCell className="px-6 py-4 font-mono text-[12px] text-white">
                    {purchase.id}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[13px] font-medium text-white">{supplier?.name || 'Inconnu'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[13px] text-muted-foreground">
                    {new Date(purchase.date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right font-bold text-white">
                    {purchase.totalAmount.toLocaleString('fr-FR')} {currencySymbol}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Badge className={cn(
                      "border-none text-[10px] font-bold",
                      purchase.status === 'received' ? "bg-[#00E676]/20 text-[#00E676]" : "bg-[#FFB300]/20 text-[#FFB300]"
                    )}>
                      {purchase.status === 'received' ? 'REÇU' : 'EN ATTENTE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-[#00A3FF]">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
