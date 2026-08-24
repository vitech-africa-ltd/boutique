import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Plus, Download, Send, Trash2, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Proforma {
  id: string;
  customerName: string;
  date: string;
  expiryDate: string;
  totalTTC: number;
  status: 'draft' | 'sent' | 'converted';
}

export function Proformas({ currencySymbol = 'FC' }: { currencySymbol?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [proformas, setProformas] = useState<Proforma[]>([
    { id: 'PRO-2026-001', customerName: 'Marie Ngo', date: '2026-04-10', expiryDate: '2026-04-25', totalTTC: 536625, status: 'sent' },
    { id: 'PRO-2026-002', customerName: 'Jean Dupont', date: '2026-04-12', expiryDate: '2026-04-27', totalTTC: 1431000, status: 'draft' },
  ]);

  const filteredProformas = proformas.filter(p => 
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Devis & Factures Proforma</h2>
          <p className="text-sm text-muted-foreground">Gérez vos propositions commerciales avant validation finale.</p>
        </div>
        <Button className="gap-2 bg-[#00A3FF] hover:bg-[#0082CC]">
          <Plus className="w-4 h-4" />
          Nouveau Devis
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Devis Actifs</span>
            <div className="text-2xl font-bold text-white">2</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Valeur Potentielle</span>
            <div className="text-2xl font-bold text-[#00A3FF]">1 967 625 {currencySymbol}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 block">Taux de Conversion</span>
            <div className="text-2xl font-bold text-[#00E676]">65%</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un devis ou un client..."
          className="pl-10 bg-[#1F2125] border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#151619]">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">N° Devis</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Client</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Date / Validité</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Montant TTC</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Statut</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProformas.map((pro) => (
              <TableRow key={pro.id} className="hover:bg-white/[0.02] border-b border-border transition-colors">
                <TableCell className="px-6 py-4 font-mono text-[12px] text-white">
                  {pro.id}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[13px] font-medium text-white">{pro.customerName}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[12px] text-white">{new Date(pro.date).toLocaleDateString('fr-FR')}</span>
                    <span className="text-[10px] text-muted-foreground">Expire le {new Date(pro.expiryDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-right font-bold text-[#00A3FF]">
                  {pro.totalTTC.toLocaleString('fr-FR')} {currencySymbol}
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <Badge className={cn(
                    "border-none text-[10px] font-bold",
                    pro.status === 'sent' ? "bg-[#00A3FF]/20 text-[#00A3FF]" : "bg-white/10 text-muted-foreground"
                  )}>
                    {pro.status === 'sent' ? 'ENVOYÉ' : 'BROUILLON'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-[#00A3FF]">
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-[#FF4D4D]">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
