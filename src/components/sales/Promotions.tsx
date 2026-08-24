import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tag, Plus, Calendar, Percent, ShoppingBag, Clock, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Promotion {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
  usageCount: number;
}

const PROMOTIONS: Promotion[] = [
  { id: 'PROM-001', name: 'Soldes d\'Été', type: 'percentage', value: 20, startDate: '2026-06-01', endDate: '2026-08-31', status: 'scheduled', usageCount: 0 },
  { id: 'PROM-002', name: 'Déstockage Frais', type: 'percentage', value: 50, startDate: '2026-04-10', endDate: '2026-04-20', status: 'active', usageCount: 145 },
  { id: 'PROM-003', name: 'Remise Fidélité OR', type: 'fixed', value: 5000, startDate: '2026-01-01', endDate: '2026-12-31', status: 'active', usageCount: 89 },
];

export function Promotions() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Promotions & Remises Spéciales</h2>
          <p className="text-sm text-muted-foreground">Boostez vos ventes avec des campagnes promotionnelles ciblées.</p>
        </div>
        <Button className="gap-2 bg-[#00A3FF] hover:bg-[#0082CC] h-9 text-[12px]">
          <Plus className="w-4 h-4" />
          Nouvelle Promotion
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Promotions Actives</span>
              <Tag className="w-4 h-4 text-[#00E676]" />
            </div>
            <div className="text-2xl font-bold text-white">02</div>
            <p className="text-[10px] text-muted-foreground mt-1">Générant +12% de volume de vente</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Remises (Mois)</span>
              <Percent className="w-4 h-4 text-[#00A3FF]" />
            </div>
            <div className="text-2xl font-bold text-white">450 000 FCFA</div>
            <p className="text-[10px] text-muted-foreground mt-1">Investis en marketing direct</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Planifiées</span>
              <Calendar className="w-4 h-4 text-[#FFB300]" />
            </div>
            <div className="text-2xl font-bold text-white">01</div>
            <p className="text-[10px] text-muted-foreground mt-1">Prête à être lancée automatiquement</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-[#1F2125]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Liste des Campagnes</h3>
        </div>
        <Table>
          <TableHeader className="bg-[#151619]">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Promotion</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Valeur</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Dates</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Utilisation</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Statut</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PROMOTIONS.map((promo) => (
              <TableRow key={promo.id} className="hover:bg-white/[0.02] border-b border-border transition-colors group">
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-white">{promo.name}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-mono">{promo.id}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <Badge variant="secondary" className="bg-[#00A3FF]/10 text-[#00A3FF] border-none text-[11px] font-bold">
                    {promo.type === 'percentage' ? `-${promo.value}%` : `-${promo.value} FCFA`}
                  </Badge>
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] text-white font-medium">{new Date(promo.startDate).toLocaleDateString()}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest">au {new Date(promo.endDate).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <span className="text-[12px] text-white font-bold">{promo.usageCount} fois</span>
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <Badge className={cn(
                    "border-none text-[9px] font-bold px-2 py-0.5",
                    promo.status === 'active' ? "bg-[#00E676]/20 text-[#00E676]" :
                    promo.status === 'scheduled' ? "bg-[#FFB300]/20 text-[#FFB300]" :
                    "bg-[#FF4D4D]/20 text-[#FF4D4D]"
                  )}>
                    {promo.status === 'active' ? 'EN COURS' : promo.status === 'scheduled' ? 'PLANIFIÉE' : 'EXPIRÉE'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-[#FF4D4D]">
                      <Trash2 className="w-3.5 h-3.5" />
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
