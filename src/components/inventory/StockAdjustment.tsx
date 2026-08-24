import React, { useState, FormEvent } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Barcode, ArrowUpRight, ArrowDownRight, History, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/src/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface StockAdjustmentProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
}

interface AdjustmentLog {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  user: string;
}

export function StockAdjustment({ products, onUpdateProduct }: StockAdjustmentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentLogs, setAdjustmentLogs] = useState<AdjustmentLog[]>([
    { id: '1', productId: '1', productName: 'Ordinateur Portable Pro', type: 'out', quantity: 1, reason: 'Casse écran', date: new Date().toISOString(), user: 'admin' },
    { id: '2', productId: '10', productName: 'Huile de Palme 1L', type: 'in', quantity: 50, reason: 'Réception fournisseur', date: '2026-04-14T09:00:00Z', user: 'admin' },
    { id: '3', productId: '12', productName: 'Yaourt Nature x4', type: 'out', quantity: 2, reason: 'Produit périmé', date: '2026-04-13T16:45:00Z', user: 'admin' },
    { id: '4', productId: '3', productName: 'Clavier Mécanique RGB', type: 'in', quantity: 10, reason: 'Retour client (non déballé)', date: '2026-04-12T11:20:00Z', user: 'admin' },
  ]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjust = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as 'in' | 'out';
    const quantity = parseInt(formData.get('quantity') as string);
    const reason = formData.get('reason') as string;

    const newStock = type === 'in' ? selectedProduct.stock + quantity : selectedProduct.stock - quantity;

    if (newStock < 0) {
      toast.error('Le stock ne peut pas être négatif');
      return;
    }

    const updatedProduct = { ...selectedProduct, stock: newStock };
    onUpdateProduct(updatedProduct);

    const log: AdjustmentLog = {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      type,
      quantity,
      reason,
      date: new Date().toISOString(),
      user: 'admin',
    };

    setAdjustmentLogs([log, ...adjustmentLogs]);
    setIsDialogOpen(false);
    setSelectedProduct(null);
    toast.success('Stock ajusté avec succès');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Ajustements de Stock</h2>
          <p className="text-sm text-muted-foreground">Corrigez manuellement les niveaux de stock (pertes, casses, inventaire).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit à ajuster..."
              className="pl-10 bg-[#1F2125] border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#151619]">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Produit</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">P. Achat</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Stock Actuel</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-white/[0.02] border-b border-border transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{product.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{product.reference}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4 text-xs text-muted-foreground">
                      {product.purchasePrice.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-center px-6 py-4">
                      <Badge variant="outline" className={product.stock <= product.minStock ? "text-[#FF4D4D] border-[#FF4D4D]/20" : "text-[#00E676] border-[#00E676]/20"}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-[11px] h-8 border-border hover:bg-[#00A3FF]/10 hover:text-[#00A3FF]"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsDialogOpen(true);
                        }}
                      >
                        Ajuster
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1F2125] border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#00A3FF]" />
                Historique Récent
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {adjustmentLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-white/[0.01] transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[12px] font-medium text-white truncate max-w-[150px]">{log.productName}</span>
                      <span className={log.type === 'in' ? "text-[#00E676] text-[12px] font-bold" : "text-[#FF4D4D] text-[12px] font-bold"}>
                        {log.type === 'in' ? '+' : '-'}{log.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground">{log.reason}</span>
                      <span className="text-[9px] text-muted-foreground/50">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FFB300]/5 border-[#FFB300]/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-[#FFB300] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#FFB300] mb-1">Note Importante</h4>
                  <p className="text-[11px] text-[#FFB300]/80 leading-relaxed">
                    Chaque ajustement est tracé. Assurez-vous de justifier les sorties de stock pour la comptabilité de fin de mois.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1F2125] border-border text-white">
          <DialogHeader>
            <DialogTitle>Ajuster le stock : {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'opération</label>
                <Select name="type" defaultValue="out">
                  <SelectTrigger className="bg-[#151619] border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1F2125] border-border text-white">
                    <SelectItem value="in">Entrée (Réapprovisionnement)</SelectItem>
                    <SelectItem value="out">Sortie (Perte / Casse / Autre)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantité</label>
                <Input name="quantity" type="number" min="1" required className="bg-[#151619] border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motif de l'ajustement</label>
              <Input name="reason" required placeholder="Ex: Casse lors du déchargement" className="bg-[#151619] border-border" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-white">Annuler</Button>
              <Button type="submit" className="bg-[#00A3FF] hover:bg-[#0082CC]">Confirmer l'ajustement</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
