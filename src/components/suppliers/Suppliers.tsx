import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Truck, Users,
  Globe, Briefcase, X, Save, AlertTriangle
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, 
  DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Supplier } from '@/src/types';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';

const supplierSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  contact: z.string().min(2, 'Le contact doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'email invalide'),
  phone: z.string().regex(/^(\+?\d{1,4}\s?)?(\d\s?){8,}$/, 'Format de téléphone invalide (min 8 chiffres)'),
  address: z.string().min(5, 'L\'adresse est trop courte'),
  category: z.string().min(1, 'Veuillez choisir une catégorie'),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SuppliersProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

const SUPPLIER_CATEGORIES = [
  'Matériel Informatique',
  'Mobilier',
  'Alimentaire',
  'Logistique',
  'Maintenance',
  'Divers',
  'Textile',
  'Électronique'
];

export function Suppliers({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier }: SuppliersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const mockPurchases = [
    { id: 'ACH-2026-001', date: '2026-04-15', amount: 1250000, status: 'payé' },
    { id: 'ACH-2026-024', date: '2026-04-20', amount: 450000, status: 'payé' },
    { id: 'ACH-2026-088', date: '2026-04-28', amount: 890000, status: 'en attente' },
  ];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      category: 'Divers'
    }
  });

  useEffect(() => {
    if (editingSupplier) {
      reset({
        name: editingSupplier.name,
        contact: editingSupplier.contact,
        email: editingSupplier.email,
        phone: editingSupplier.phone,
        address: editingSupplier.address,
        category: editingSupplier.category
      });
    } else if (!isDialogOpen) {
      reset({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
        category: 'Divers'
      });
    }
  }, [editingSupplier, isDialogOpen, reset]);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const onSubmit = (data: SupplierFormData) => {
    if (editingSupplier) {
      onUpdateSupplier({ ...data, id: editingSupplier.id });
      toast.success('Fournisseur mis à jour');
    } else {
      const random = Math.floor(1000 + Math.random() * 9000);
      const newSupplier: Supplier = {
        ...data,
        id: `VI-SUP-${random}`
      };
      onAddSupplier(newSupplier);
      toast.success('Nouveau fournisseur enregistré');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) {
      onDeleteSupplier(id);
      toast.success('Fournisseur supprimé');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            Gestion des Fournisseurs
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Répertoire de vos partenaires logistiques et commerciaux.</p>
        </div>

        <div className="flex w-full lg:w-auto gap-3">
          <div className="flex bg-muted p-1 rounded-xl">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-lg h-8 text-[11px] font-bold"
              onClick={() => setViewMode('grid')}
            >
              Grille
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-lg h-8 text-[11px] font-bold"
              onClick={() => setViewMode('table')}
            >
              Tableau
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button onClick={handleOpenAdd} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 h-11 rounded-xl">
                <Plus className="w-4 h-4" />
                Nouveau
              </Button>
            }/>
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{editingSupplier ? 'Modifier le fournisseur' : 'Nouveau Fournisseur'}</DialogTitle>
                  <DialogDescription>Remplissez les informations de contact de votre partenaire.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-6">
                  <div className="grid gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Nom de l'entreprise *</label>
                      {errors.name && <span className="text-[9px] text-destructive font-bold">{errors.name.message}</span>}
                    </div>
                    <Input 
                      placeholder="Ex: Africa Logistics SA"
                      {...register('name')}
                      className={cn("bg-muted/50 border-border h-11", errors.name && "border-destructive/50")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Contact Principal</label>
                        {errors.contact && <span className="text-[9px] text-destructive font-bold">{errors.contact.message}</span>}
                      </div>
                      <Input 
                        placeholder="Ex: Jean Dupont"
                        {...register('contact')}
                        className={cn("bg-muted/50 border-border h-11", errors.contact && "border-destructive/50")}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Catégorie</label>
                        {errors.category && <span className="text-[9px] text-destructive font-bold">{errors.category.message}</span>}
                      </div>
                      <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={cn("bg-muted/50 border-border h-11", errors.category && "border-destructive/50")}>
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {SUPPLIER_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Email *</label>
                        {errors.email && <span className="text-[9px] text-destructive font-bold">{errors.email.message}</span>}
                      </div>
                      <Input 
                        type="email"
                        placeholder="contact@fournisseur.com"
                        {...register('email')}
                        className={cn("bg-muted/50 border-border h-11", errors.email && "border-destructive/50")}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Téléphone *</label>
                        {errors.phone && <span className="text-[9px] text-destructive font-bold">{errors.phone.message}</span>}
                      </div>
                      <Input 
                        placeholder="+225 ..."
                        {...register('phone')}
                        className={cn("bg-muted/50 border-border h-11", errors.phone && "border-destructive/50")}
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Adresse</label>
                      {errors.address && <span className="text-[9px] text-destructive font-bold">{errors.address.message}</span>}
                    </div>
                    <Input 
                      placeholder="Rue, Ville, Pays"
                      {...register('address')}
                      className={cn("bg-muted/50 border-border h-11", errors.address && "border-destructive/50")}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">Annuler</Button>
                  <Button type="submit" className="bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-xl gap-2 h-11 px-8">
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, contact ou catégorie..."
            className="pl-10 bg-card border-border h-11 rounded-xl shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-muted-foreground bg-card/50 border-2 border-dashed border-border rounded-3xl opacity-50">
              <Truck size={48} className="mb-4" />
              <p className="font-bold uppercase tracking-widest">Aucun fournisseur trouvé</p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} id={`supplier-card-${supplier.id}`} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all group shadow-sm hover:shadow-xl">
                <CardHeader className="pb-4 relative">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => handleEdit(supplier)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg border border-transparent hover:border-primary/10">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDelete(supplier.id)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg border border-transparent hover:border-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors truncate">{supplier.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] uppercase font-black tracking-widest px-2 py-0.5">
                        {supplier.category}
                      </Badge>
                      <span className="text-[10px] font-mono opacity-50">{supplier.id}</span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="p-3 bg-muted/30 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-3 text-[12px] text-foreground font-medium">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{supplier.contact || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-foreground font-medium">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-foreground font-medium overflow-hidden">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-foreground font-medium overflow-hidden">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full h-10 border-border hover:bg-primary/5 hover:text-primary font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-sm"
                    onClick={() => {
                      setSelectedSupplier(supplier);
                      setIsDetailOpen(true);
                    }}
                  >
                    Historique Achats
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest">Nom / Entreprise</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest">Catégorie</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest">Contact</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest">Téléphone</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest">Email</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-muted-foreground px-6 py-4 tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground opacity-50 uppercase text-xs font-bold tracking-widest">
                    Aucun fournisseur enregistré
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="group border-b border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="px-6 py-4 font-bold text-foreground truncate max-w-[200px] uppercase text-[13px]">
                      {supplier.name}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] uppercase font-black px-2">
                        {supplier.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      {supplier.contact}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs font-mono text-muted-foreground">
                      {supplier.phone}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                      {supplier.email}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setIsDetailOpen(true);
                          }} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Détails et historique"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleEdit(supplier)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDelete(supplier.id)} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Détails Fournisseur & Historique
            </DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-muted/30 border-border">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Entreprise</CardDescription>
                    <CardTitle className="text-base font-black uppercase">{selectedSupplier.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <p className="flex items-center gap-2"><Briefcase className="w-3 h-3"/> {selectedSupplier.category}</p>
                    <p className="flex items-center gap-2"><MapPin className="w-3 h-3"/> {selectedSupplier.address}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Contact</CardDescription>
                    <CardTitle className="text-base font-black uppercase">{selectedSupplier.contact}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <p className="flex items-center gap-2"><Phone className="w-3 h-3"/> {selectedSupplier.phone}</p>
                    <p className="flex items-center gap-2"><Mail className="w-3 h-3"/> {selectedSupplier.email}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Derniers Achats Effectués</h3>
                <div className="border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-b border-border">
                        <TableHead className="text-[10px] font-black tracking-widest px-4 py-2">RÉF</TableHead>
                        <TableHead className="text-[10px] font-black tracking-widest px-4 py-2">DATE</TableHead>
                        <TableHead className="text-[10px] font-black tracking-widest px-4 py-2">STATUT</TableHead>
                        <TableHead className="text-[10px] font-black tracking-widest px-4 py-2 text-right">MONTANT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPurchases.map((p) => (
                        <TableRow key={p.id} className="border-b border-border text-[13px]">
                          <TableCell className="px-4 py-3 font-mono font-bold">{p.id}</TableCell>
                          <TableCell className="px-4 py-3 text-muted-foreground">{p.date}</TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge className={cn(
                              "text-[9px] font-black uppercase border-none",
                              p.status === 'payé' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right font-bold">{p.amount.toLocaleString()} FC</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-8">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
