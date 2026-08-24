import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, ArrowRightLeft, Warehouse as WarehouseIcon, MapPin, Package, History, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface WarehouseData {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentStock: number;
  manager: string;
}

const WAREHOUSES: WarehouseData[] = [
  { id: 'WH-001', name: 'Entrepôt Principal - Douala', location: 'Zone Industrielle Bassa', capacity: 5000, currentStock: 3450, manager: 'M. Ibrahim' },
  { id: 'WH-002', name: 'Dépôt Yaoundé - Mvan', location: 'Quartier Mvan', capacity: 2000, currentStock: 850, manager: 'Mme. Claire' },
  { id: 'WH-003', name: 'Showroom Akwa', location: 'Boulevard de la Liberté', capacity: 500, currentStock: 420, manager: 'M. Samuel' },
];

interface WarehousesProps {
  onNavigate?: (tab: string) => void;
}

export function Warehouses({ onNavigate }: WarehousesProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Gestion des Entrepôts & Logistique</h2>
          <p className="text-sm text-muted-foreground">Optimisez vos transferts de stock et suivez vos inventaires multi-sites.</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2 bg-[#00A3FF] hover:bg-[#0082CC] h-9 text-[12px]">
            <Plus className="w-4 h-4" />
            Nouvel Entrepôt
          </Button>
          <Button variant="outline" className="gap-2 border-border hover:bg-white/5 h-9 text-[12px]">
            <ArrowRightLeft className="w-4 h-4 text-[#00E676]" />
            Nouveau Transfert
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {WAREHOUSES.map((wh) => (
          <Card key={wh.id} className="bg-[#1F2125] border-border group hover:border-[#00A3FF]/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-[#00A3FF]/10 flex items-center justify-center">
                  <WarehouseIcon className="w-5 h-5 text-[#00A3FF]" />
                </div>
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">{wh.id}</Badge>
              </div>
              <CardTitle className="text-base font-bold text-white mt-3">{wh.name}</CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-[11px]">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                {wh.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground uppercase">Capacité Utilisée</span>
                  <span className="text-white font-bold">{Math.round((wh.currentStock / wh.capacity) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#151619] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00A3FF] transition-all duration-500" 
                    style={{ width: `${(wh.currentStock / wh.capacity) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground italic">
                  <span>{wh.currentStock} articles</span>
                  <span>max {wh.capacity}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground uppercase">Responsable</span>
                  <span className="text-[12px] text-white font-medium">{wh.manager}</span>
                </div>
                <Button variant="ghost" className="h-8 text-[11px] text-[#00A3FF] hover:bg-[#00A3FF]/10">
                  Détails Catalogue
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1F2125] border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#FFB300]" />
              Derniers Transferts Inter-Sites
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#151619]">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="text-[10px] uppercase text-muted-foreground px-4 py-2">De</TableHead>
                  <TableHead className="text-[10px] uppercase text-muted-foreground px-4 py-2">Vers</TableHead>
                  <TableHead className="text-[10px] uppercase text-muted-foreground px-4 py-2">Articles</TableHead>
                  <TableHead className="text-[10px] uppercase text-muted-foreground px-4 py-2 text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-b border-border/50 hover:bg-white/[0.01]">
                  <TableCell className="text-[12px] text-white px-4 py-3">Principal</TableCell>
                  <TableCell className="text-[12px] text-white px-4 py-3">Yaoundé</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground px-4 py-3">150 x Lait Nido</TableCell>
                  <TableCell className="text-right px-4 py-3">
                    <Badge className="bg-[#00E676]/10 text-[#00E676] border-none text-[9px] font-bold">LIVRÉ</Badge>
                  </TableCell>
                </TableRow>
                <TableRow className="border-b border-border/50 hover:bg-white/[0.01]">
                  <TableCell className="text-[12px] text-white px-4 py-3">Principal</TableCell>
                  <TableCell className="text-[12px] text-white px-4 py-3">Showroom</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground px-4 py-3">12 x iPhone 15</TableCell>
                  <TableCell className="text-right px-4 py-3">
                    <Badge className="bg-[#FFB300]/10 text-[#FFB300] border-none text-[9px] font-bold">EN TRANSIT</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-[#111214] border-dashed border-border/50 flex flex-col items-center justify-center p-8 text-center transition-all hover:border-[#00A3FF]/50 group">
          <div className="w-16 h-16 rounded-full bg-[#1F2125] flex items-center justify-center mb-4 group-hover:bg-[#00A3FF]/10 transition-colors">
            <Zap className="w-8 h-8 text-muted-foreground/30 group-hover:text-[#00A3FF] transition-colors" />
          </div>
          <h4 className="text-sm font-bold text-white mb-2">Optimisation de l'Inventaire</h4>
          <p className="text-xs text-muted-foreground max-w-[250px]">
            Visualisez les manques de stock par entrepôt et déclenchez des réapprovisionnements optimisés.
          </p>
          <Button 
            onClick={() => onNavigate?.('inventory-opt')}
            variant="link" 
            className="mt-4 text-[#00A3FF] text-[12px] h-auto p-0 hover:no-underline"
          >
            Lancer l'analyse d'optimisation
            <Plus className="w-3 h-3 ml-1 rotate-45" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
