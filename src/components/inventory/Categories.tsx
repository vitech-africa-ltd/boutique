import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Tag, Star, Edit2, Trash2, FolderTree, X, Upload, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  productCount: number;
}

interface Brand {
  id: string;
  name: string;
  productCount: number;
}

export function Categories({ products }: { products: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string, name: string, type: 'category' | 'brand' } | null>(null);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [extraBrands, setExtraBrands] = useState<string[]>([]);

  const handleCSVImport = (e: ChangeEvent<HTMLInputElement>, type: 'category' | 'brand') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Assume first line is header if it contains common keywords, otherwise treat as data
      const startIdx = (lines[0].toLowerCase().includes('nom') || lines[0].toLowerCase().includes('name')) ? 1 : 0;
      const newItems = lines.slice(startIdx).map(line => line.split(',')[0].trim().replace(/^"|"$/g, ''));
      
      let addedCount = 0;
      if (type === 'category') {
        const uniqueNew = newItems.filter(item => !extraCategories.includes(item) && !products.some(p => p.category === item));
        setExtraCategories(prev => [...prev, ...uniqueNew]);
        addedCount = uniqueNew.length;
      } else {
        const uniqueNew = newItems.filter(item => !extraBrands.includes(item) && !products.some(p => p.brand === item));
        setExtraBrands(prev => [...prev, ...uniqueNew]);
        addedCount = uniqueNew.length;
      }

      toast.success(`${addedCount} ${type === 'category' ? 'catégories' : 'marques'} importées avec succès`);
      e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
  };

  const handleSave = (e: FormEvent<HTMLFormElement>, type: 'category' | 'brand') => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    
    if (type === 'category' && !extraCategories.includes(name) && !products.some(p => p.category === name)) {
      setExtraCategories([...extraCategories, name]);
    }
    if (type === 'brand' && !extraBrands.includes(name) && !products.some(p => p.brand === name)) {
      setExtraBrands([...extraBrands, name]);
    }

    toast.success(`${type === 'category' ? 'Catégorie' : 'Marque'} ${editingItem ? 'modifiée' : 'ajoutée'} avec succès`);
    setIsCategoryDialogOpen(false);
    setIsBrandDialogOpen(false);
    setEditingItem(null);
  };

  const categoryCounts = products.reduce((acc: any, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  
  // Add extra categories (those without products yet)
  extraCategories.forEach(cat => {
    if (!categoryCounts[cat]) categoryCounts[cat] = 0;
  });

  const brandCounts = products.reduce((acc: any, p) => {
    if (p.brand) {
      acc[p.brand] = (acc[p.brand] || 0) + 1;
    }
    return acc;
  }, {});

  // Add extra brands
  extraBrands.forEach(brand => {
    if (!brandCounts[brand]) brandCounts[brand] = 0;
  });

  const categories = Object.keys(categoryCounts).map(name => ({
    id: name,
    name,
    productCount: categoryCounts[name]
  }));

  const brands = Object.keys(brandCounts).map(name => ({
    id: name,
    name,
    productCount: brandCounts[name]
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Catégories & Marques</h2>
          <p className="text-sm text-muted-foreground">Organisez votre catalogue pour une meilleure visibilité et des rapports précis.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="csv-import-categories"
              onChange={(e) => handleCSVImport(e, 'category')}
            />
            <Button 
              variant="outline" 
              className="gap-2 border-border hover:bg-white/5 h-10" 
              onClick={() => document.getElementById('csv-import-categories')?.click()}
            >
              <Upload className="w-4 h-4" />
              Importer CSV
            </Button>
          </div>

          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger 
              className={cn(
                buttonVariants({ variant: "default" }),
                "gap-2 bg-[#00A3FF] hover:bg-[#0082CC] h-10 px-4"
              )} 
              onClick={() => setEditingItem(null)}
            >
              <Plus className="w-4 h-4" />
              Nouvelle Catégorie
            </DialogTrigger>
            <DialogContent className="bg-[#1F2125] border-border text-white">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => handleSave(e, 'category')} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom de la catégorie</label>
                  <Input name="name" defaultValue={editingItem?.name} required placeholder="Ex: Informatique, Alimentaire..." className="bg-[#151619] border-border" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optionnel)</label>
                  <Input name="description" placeholder="Courte description de la catégorie" className="bg-[#151619] border-border" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsCategoryDialogOpen(false)} className="text-muted-foreground hover:text-white">Annuler</Button>
                  <Button type="submit" className="bg-[#00A3FF] hover:bg-[#0082CC]">Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="relative">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="csv-import-brands"
              onChange={(e) => handleCSVImport(e, 'brand')}
            />
            <Button 
              variant="outline" 
              className="gap-2 border-border hover:bg-white/5 h-10 px-3" 
              onClick={() => document.getElementById('csv-import-brands')?.click()}
            >
              <FileDown className="w-4 h-4" />
              Brands CSV
            </Button>
          </div>

          <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
            <DialogTrigger 
              className={cn(
                buttonVariants({ variant: "outline" }),
                "gap-2 border-border hover:bg-white/5 h-10 px-4"
              )} 
              onClick={() => setEditingItem(null)}
            >
              <Plus className="w-4 h-4" />
              Nouvelle Marque
            </DialogTrigger>
            <DialogContent className="bg-[#1F2125] border-border text-white">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Modifier la marque' : 'Nouvelle marque'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => handleSave(e, 'brand')} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom de la marque</label>
                  <Input name="name" defaultValue={editingItem?.name} required placeholder="Ex: Apple, Samsung..." className="bg-[#151619] border-border" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsBrandDialogOpen(false)} className="text-muted-foreground hover:text-white">Annuler</Button>
                  <Button type="submit" className="bg-[#00A3FF] hover:bg-[#0082CC]">Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une catégorie ou marque..."
          className="pl-10 bg-[#1F2125] border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00A3FF]/10 flex items-center justify-center">
                <FolderTree className="w-4 h-4 text-[#00A3FF]" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Catégories</h3>
            </div>
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
              {categories.length} au total
            </Badge>
          </div>
          <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-[#151619]">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Nom de la Catégorie</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Articles</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((cat) => (
                  <TableRow key={cat.id} className="hover:bg-white/[0.02] border-b border-border transition-colors group">
                    <TableCell className="px-6 py-4">
                      <span className="text-[13px] font-medium text-white group-hover:text-[#00A3FF] transition-colors">{cat.name}</span>
                    </TableCell>
                    <TableCell className="text-center px-6 py-4">
                      <Badge variant="secondary" className="bg-[#00A3FF]/10 text-[#00A3FF] border-none text-[10px] font-bold">
                        {cat.productCount} PRODUITS
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-muted-foreground hover:text-white"
                          onClick={() => {
                            setEditingItem({ id: cat.id, name: cat.name, type: 'category' });
                            setIsCategoryDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-muted-foreground hover:text-[#FF4D4D]"
                          onClick={() => toast.success('Catégorie supprimée')}
                        >
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

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFB300]/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-[#FFB300]" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Marques</h3>
            </div>
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
              {brands.length} au total
            </Badge>
          </div>
          <div className="rounded-xl border border-border bg-[#1F2125] overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-[#151619]">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Nom de la Marque</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Articles</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map((brand) => (
                  <TableRow key={brand.id} className="hover:bg-white/[0.02] border-b border-border transition-colors group">
                    <TableCell className="px-6 py-4">
                      <span className="text-[13px] font-medium text-white group-hover:text-[#FFB300] transition-colors">{brand.name}</span>
                    </TableCell>
                    <TableCell className="text-center px-6 py-4">
                      <Badge variant="secondary" className="bg-[#FFB300]/10 text-[#FFB300] border-none text-[10px] font-bold">
                        {brand.productCount} PRODUITS
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-muted-foreground hover:text-white"
                          onClick={() => {
                            setEditingItem({ id: brand.name, name: brand.name, type: 'brand' });
                            setIsBrandDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-muted-foreground hover:text-[#FF4D4D]"
                          onClick={() => toast.success('Marque supprimée')}
                        >
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
      </div>
    </div>
  );
}
