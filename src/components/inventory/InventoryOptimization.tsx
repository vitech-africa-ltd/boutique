import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, AlertTriangle, RefreshCcw, Package, ShoppingCart, Info, BarChart3 } from 'lucide-react';
import { Product } from '@/src/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OptimizationProps {
  products: Product[];
}

export function InventoryOptimization({ products }: OptimizationProps) {
  // Logic to find critical items
  const lowStock = products.filter(p => p.stock <= p.minStock);
  const overStock = products.filter(p => p.stock > p.minStock * 10); // Simple logic for overstock
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Optimisation de l'Inventaire</h2>
          <p className="text-sm text-muted-foreground">Analyse prédictive et optimisation des niveaux de stock.</p>
        </div>
        <Button className="gap-2 bg-[#00A3FF] hover:bg-[#0082CC] h-9 text-[12px]">
          <RefreshCcw className="w-4 h-4" />
          Actualiser l'Analyse
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-[#1F2125] border-border relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Sous-Stock (Rupture Proche)</span>
              <TrendingDown className="w-4 h-4 text-[#FF4D4D]" />
            </div>
            <div className="text-2xl font-bold text-[#FF4D4D]">{lowStock.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Nécessite réapprovisionnement urgent</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FF4D4D]/20">
             <div className="h-full bg-[#FF4D4D]" style={{ width: `${(lowStock.length / products.length) * 100}%` }} />
          </div>
        </Card>
        
        <Card className="bg-[#1F2125] border-border relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Sur-Stock (Dormant)</span>
              <Package className="w-4 h-4 text-[#FFB300]" />
            </div>
            <div className="text-2xl font-bold text-[#FFB300]">{overStock.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Capital immobilisé à optimiser</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FFB300]/20">
             <div className="h-full bg-[#FFB300]" style={{ width: `${(overStock.length / products.length) * 100}%` }} />
          </div>
        </Card>

        <Card className="bg-[#1F2125] border-border relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Rotation Moyenne</span>
              <TrendingUp className="w-4 h-4 text-[#00E676]" />
            </div>
            <div className="text-2xl font-bold text-[#00E676]">14.2j</div>
            <p className="text-[10px] text-muted-foreground mt-1">Délai moyen d'écoulement</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00E676]/20">
             <div className="h-full bg-[#00E676]" style={{ width: '70%' }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1F2125] border-border h-fit">
          <CardHeader className="pb-3 border-b border-border/50 bg-[#151619]/30">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF4D4D]" />
              Priorités de Réapprovisionnement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#151619]/50">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="text-[10px] uppercase text-muted-foreground px-4 py-2">Article</TableHead>
                  <TableHead className="text-[10px] uppercase text-muted-foreground px-4 py-2 text-center">Stock Actuel</TableHead>
                  <TableHead className="text-[10px] uppercase text-muted-foreground px-4 py-2 text-center">Besoin</TableHead>
                  <TableHead className="text-[10px] uppercase text-muted-foreground px-4 py-2 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">Aucun besoin immédiat</TableCell></TableRow>
                ) : (
                  lowStock.map(p => (
                    <TableRow key={p.id} className="border-b border-border/50 hover:bg-white/[0.01]">
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-medium text-white">{p.name}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">{p.reference}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-4 py-3">
                        <span className="text-[12px] font-bold text-[#FF4D4D]">{p.stock}</span>
                      </TableCell>
                      <TableCell className="text-center px-4 py-3">
                        <Badge variant="outline" className="text-[10px] border-[#FF4D4D]/20 text-[#FF4D4D] bg-[#FF4D4D]/5">+{p.minStock * 2}</Badge>
                      </TableCell>
                      <TableCell className="text-right px-4 py-3">
                        <Button variant="ghost" className="h-7 text-[10px] text-[#00A3FF] hover:bg-[#00A3FF]/10">Commander</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-[#1F2125] border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-[#151619]/30">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00E676]" />
                Analyse de Rotation (ABC/FMR)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
               <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-border">
                    <div className="flex items-center gap-3">
                       <Badge className="bg-[#00E676] text-black font-black text-[10px]">CLASSE A</Badge>
                       <div>
                         <p className="text-[12px] text-white font-medium">Rotation Rapide (80% du CA)</p>
                         <p className="text-[10px] text-muted-foreground">12 articles • Stock de sécurité conseillé : +25%</p>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-border">
                    <div className="flex items-center gap-3">
                       <Badge className="bg-[#FFB300] text-black font-black text-[10px]">CLASSE B</Badge>
                       <div>
                         <p className="text-[12px] text-white font-medium">Rotation Modérée</p>
                         <p className="text-[10px] text-muted-foreground">45 articles • Stock à flux tendu conseillé</p>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-border">
                    <div className="flex items-center gap-3">
                       <Badge className="bg-[#8E9299] text-white font-black text-[10px]">CLASSE C</Badge>
                       <div>
                         <p className="text-[12px] text-white font-medium">Articles Dormants</p>
                         <p className="text-[10px] text-muted-foreground">120 articles • Envisager déstockage ou promo</p>
                       </div>
                    </div>
                  </div>
               </div>
            </CardContent>
            <CardHeader className="pt-0 p-4 pt-2 border-t border-border mt-2">
               <Button className="w-full text-[11px] h-8 bg-white/5 hover:bg-white/10 text-muted-foreground border-border" variant="outline">
                 <Info className="w-3.5 h-3.5 mr-2" />
                 Détails de l'Analyse ABC
               </Button>
            </CardHeader>
          </Card>

          <Card className="bg-[#151619] border-border p-4 shadow-inner">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#00A3FF]/10 rounded-lg">
                   <RefreshCcw className="w-4 h-4 text-[#00A3FF]" />
                </div>
                <div>
                   <h4 className="text-[13px] font-bold text-white leading-tight">Moteur d'Optimisation IA</h4>
                   <p className="text-[11px] text-muted-foreground">Le module va ajuster vos seuils d'alerte selon l'historique.</p>
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">Processus d'apprentissage</span>
                  <span className="text-[#00A3FF]">85%</span>
                </div>
                <div className="h-1.5 w-full bg-[#111214] rounded-full overflow-hidden">
                   <div className="h-full bg-[#00A3FF] w-[85%]" />
                </div>
             </div>
             <p className="text-[10px] text-muted-foreground italic mt-3">Analyse basée sur les 90 derniers jours d'activité.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
