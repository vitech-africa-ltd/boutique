import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, AlertTriangle, CheckCircle2, Calendar, Filter, X } from 'lucide-react';
import { Product } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DLCTrackingProps {
  products: Product[];
}

export function DLCTracking({ products }: DLCTrackingProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  const productsWithExpiry = useMemo(() => products.filter(p => p.expiryDate), [products]);
  
  const categories = useMemo(() => ['all', ...Array.from(new Set(productsWithExpiry.map(p => p.category)))], [productsWithExpiry]);
  const brands = useMemo(() => ['all', ...Array.from(new Set(productsWithExpiry.map(p => p.brand || 'Sans marque')))], [productsWithExpiry]);

  const filteredProducts = useMemo(() => {
    return productsWithExpiry.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesBrand = selectedBrand === 'all' || (p.brand || 'Sans marque') === selectedBrand;
      return matchesCategory && matchesBrand;
    });
  }, [productsWithExpiry, selectedCategory, selectedBrand]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      return new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime();
    });
  }, [filteredProducts]);

  const getStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'EXPIRÉ', color: 'bg-[#FF4D4D]/20 text-[#FF4D4D]', icon: AlertTriangle };
    if (diffDays <= 30) return { label: 'URGENT', color: 'bg-[#FFB300]/20 text-[#FFB300]', icon: Clock };
    return { label: 'OPTIMAL', color: 'bg-[#00E676]/20 text-[#00E676]', icon: CheckCircle2 };
  };

  const urgentCount = filteredProducts.filter(p => {
    const diff = new Date(p.expiryDate!).getTime() - new Date().getTime();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const expiredCount = filteredProducts.filter(p => new Date(p.expiryDate!) < new Date()).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Suivi des Dates d'Expiration (DLC)</h2>
          <p className="text-sm text-muted-foreground">Surveillez la fraîcheur de votre stock et évitez les pertes.</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {(selectedCategory !== 'all' || selectedBrand !== 'all') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedCategory('all');
                setSelectedBrand('all');
              }}
              className="h-10 text-[10px] font-black uppercase tracking-widest border-[#FF4D4D]/20 text-[#FF4D4D] hover:bg-[#FF4D4D]/10"
            >
              <X className="w-3 h-3 mr-2" />
              Réinitialiser
            </Button>
          )}

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[180px] bg-[#1F2125] border-border text-foreground h-10 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#00A3FF]" />
                <SelectValue placeholder="Catégorie" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1F2125] border-border">
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize text-xs">
                  {cat === 'all' ? 'Toutes catégories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-full md:w-[180px] bg-[#1F2125] border-border text-foreground h-10 text-xs text-left">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#00E676]" />
                <SelectValue placeholder="Fournisseur/Marque" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1F2125] border-border">
              {brands.map(brand => (
                <SelectItem key={brand} value={brand} className="capitalize text-xs">
                  {brand === 'all' ? 'Tous les fournisseurs' : brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Articles Expirés</span>
              <AlertTriangle className="w-4 h-4 text-[#FF4D4D]" />
            </div>
            <div className="text-2xl font-bold text-[#FF4D4D]">{expiredCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">À retirer immédiatement du rayon</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Alerte Proche (30j)</span>
              <Clock className="w-4 h-4 text-[#FFB300]" />
            </div>
            <div className="text-2xl font-bold text-[#FFB300]">{urgentCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Envisager une promotion de déstockage</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Filtré</span>
              <Calendar className="w-4 h-4 text-[#00A3FF]" />
            </div>
            <div className="text-2xl font-bold text-white">{filteredProducts.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Articles correspondant aux filtres</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#151619]">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Produit</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Réf / Batch</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">P. Achat</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Date d'Expiration</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Jours Restants</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Statut</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Aucun article avec date d'expiration ne correspond à vos filtres.
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts.map((product) => {
                const status = getStatus(product.expiryDate!);
                const diffDays = Math.ceil((new Date(product.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const StatusIcon = status.icon;

                return (
                  <TableRow key={product.id} className="hover:bg-white/[0.02] border-b border-border transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{product.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{product.reference}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-white uppercase">{product.reference}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{product.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4 text-xs text-muted-foreground">
                      {product.purchasePrice.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-center px-6 py-4 text-[13px] text-white font-medium">
                      {new Date(product.expiryDate!).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-center px-6 py-4">
                      <span className={cn(
                        "text-[13px] font-bold",
                        diffDays < 0 ? "text-[#FF4D4D]" : diffDays <= 30 ? "text-[#FFB300]" : "text-[#00E676]"
                      )}>
                        {diffDays < 0 ? `Expiré il y a ${Math.abs(diffDays)}j` : `${diffDays} jours`}
                      </span>
                    </TableCell>
                    <TableCell className="text-center px-6 py-4">
                      <Badge className={cn("gap-1.5 border-none text-[10px] font-bold px-2 py-1", status.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                      {diffDays < 0 ? (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="h-7 text-[10px] font-bold bg-[#FF4D4D] hover:bg-[#D32F2F]"
                          onClick={() => {
                            toast.warning(`Retrait de ${product.name} du stock pour péremption.`);
                          }}
                        >
                          Retirer du Stock
                        </Button>
                      ) : diffDays <= 30 ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px] font-bold border-[#FFB300] text-[#FFB300] hover:bg-[#FFB300]/10"
                          onClick={() => {
                            toast.info(`Mise en promotion de déstockage pour ${product.name}`);
                          }}
                        >
                          Mettre en Promo
                        </Button>
                      ) : (
                        <div className="text-[10px] text-muted-foreground italic">Aucune action requise</div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

