import React, { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_CURRENCIES, INTERNATIONAL_CURRENCIES } from '@/src/constants';
import { Globe, CreditCard, Shield, Bell, UserPlus, Trash2, Users, Download, RefreshCw, Activity, Printer, FileText, CheckCircle } from 'lucide-react';
import { User, User as UserType, SystemSettings } from '@/src/types';
import { AuditLogEntry } from '@/src/lib/db';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CurrencyIntelligence } from './CurrencyIntelligence';
import { printTestReceipt } from '@/src/services/printerService';

interface SettingsProps {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  onInitializeDemoData?: () => void;
  users: UserType[];
  onAddUser: (user: UserType) => void;
  onDeleteUser: (id: string) => void;
  currentUser: UserType;
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  auditLogs: AuditLogEntry[];
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onRefreshExchangeRates?: (forced?: boolean) => void;
}

export function Settings({ 
  currency, 
  onCurrencyChange, 
  onInitializeDemoData, 
  users, 
  onAddUser, 
  onDeleteUser,
  currentUser,
  settings,
  onUpdateSettings,
  auditLogs,
  onExportBackup,
  onImportBackup,
  onRefreshExchangeRates
}: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState('regional');
  const isAdmin = currentUser.role === 'admin';

  const handleUpdateShopInfo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onUpdateSettings({
      ...settings,
      shopName: formData.get('shopName') as string,
      shopAddress: formData.get('shopAddress') as string,
      shopPhone: formData.get('shopPhone') as string,
      numNIF: formData.get('numNIF') as string,
      logoUrl: formData.get('logoUrl') as string,
    });
    toast.success('Informations de la boutique mises à jour');
  };

  const handleUpdateTva = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onUpdateSettings({
      ...settings,
      defaultTva: parseFloat(formData.get('defaultTva') as string),
    });
    toast.success('Paramètres TVA mis à jour');
  };

  const handleAddUser = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newUser: UserType = {
      id: Math.random().toString(36).substr(2, 9),
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as 'admin' | 'manager' | 'cashier',
    };
    onAddUser(newUser);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter uppercase">Configuration Système</h1>
        <p className="text-muted-foreground font-medium">Pilotage centralisé des préférences et des accès de l'établissement.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-1 gap-2 bg-card/30 p-2 rounded-2xl border border-border/50 backdrop-blur-sm self-start">
          {[
            { id: 'regional', label: 'Boutique', icon: Globe },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'payments', label: 'Finance', icon: CreditCard },
            { id: 'printer', label: 'Imprimante & Reçus', icon: Printer },
            { id: 'security', label: 'Sécurité', icon: Shield },
          ].map((tab) => (
            <Button 
              key={tab.id}
              variant="ghost" 
              type="button"
              className={cn(
                "w-full justify-start lg:justify-start gap-2 lg:gap-3 h-11 px-3 lg:px-4 font-bold text-[11px] lg:text-[13px] rounded-xl transition-all duration-200",
                activeSubTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
              onClick={() => setActiveSubTab(tab.id)}
            >
              <tab.icon className={cn("w-4 h-4 shrink-0", activeSubTab === tab.id ? "text-primary-foreground" : "text-primary")} />
              <span className="truncate">{tab.label}</span>
            </Button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-8">
          {activeSubTab === 'regional' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-2 border-primary/20">
                <CardHeader className="bg-primary/5 border-b border-border p-6 font-black uppercase">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg tracking-wider">Devise Opérationnelle</CardTitle>
                  </div>
                  <CardDescription className="text-[10px] font-bold font-mono opacity-70">Définissez la monnaie utilisée pour vos transactions</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sélectionner la Monnaie de Base</label>
                      <Select value={currency} onValueChange={onCurrencyChange}>
                        <SelectTrigger className="bg-muted/50 border-border h-14 rounded-xl px-6 font-black text-lg">
                          <SelectValue placeholder="Choisir une devise" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border max-h-[400px]">
                          <div className="px-2 py-1.5 text-[10px] font-black uppercase text-muted-foreground opacity-50 tracking-widest border-b border-border mb-1">Afrique Centrale</div>
                          {ALL_CURRENCIES.filter(c => !INTERNATIONAL_CURRENCIES.find(ic => ic.code === c.code)).map((c) => (
                            <SelectItem key={c.code} value={c.code} className="hover:bg-primary/10 h-10">
                              <span className="font-extrabold text-sm">{c.name}</span> <span className="text-primary font-mono ml-2 font-black">({c.symbol})</span>
                            </SelectItem>
                          ))}
                          <div className="px-2 py-1.5 text-[10px] font-black uppercase text-muted-foreground opacity-50 tracking-widest border-b border-border my-1">International</div>
                          {INTERNATIONAL_CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code} className="hover:bg-primary/10 h-10">
                              <span className="font-extrabold text-sm">{c.name}</span> <span className="text-primary font-mono ml-2 font-black">({c.symbol})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#00E676]" />
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Marché des Changes (Base: {currency})</label>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onRefreshExchangeRates?.(true)}
                          className="h-8 rounded-lg font-black text-[9px] uppercase tracking-widest gap-2"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Actualiser
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                        {ALL_CURRENCIES.filter(c => c.code !== currency).map(c => {
                          const rate = settings.exchangeRates?.[c.code];
                          return (
                            <div key={c.code} className="bg-muted/30 p-3 rounded-xl border border-border group hover:border-primary/30 transition-all opacity-80 hover:opacity-100">
                              <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">1 {currency} =</p>
                              <p className="text-sm font-extrabold text-foreground flex items-center justify-between">
                                {rate ? rate.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '---'}
                                <span className="text-[10px] text-primary opacity-50 font-mono ml-2">{c.code}</span>
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                         <p className="text-[10px] text-muted-foreground italic font-medium">
                          Dernière synchronisation : {settings.lastExchangeRateUpdate ? format(new Date(settings.lastExchangeRateUpdate), 'pp', { locale: fr }) : 'Jamais'}
                        </p>
                        <Badge className="bg-[#00E676]/10 text-[#00E676] text-[8px] font-black uppercase border-none h-5">API Temps Réel Active</Badge>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                      <CurrencyIntelligence />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-2">
                <CardHeader className="bg-muted/30 border-b border-border p-6">
                  <CardTitle className="text-lg font-black uppercase tracking-wider">Identité Boutique</CardTitle>
                  <CardDescription className="text-xs font-bold font-mono uppercase opacity-70">Marquage et visuels officiels</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleUpdateShopInfo} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nom Commerçant</label>
                        <Input name="shopName" defaultValue={settings.shopName} className="bg-muted/50 border-border h-12 rounded-xl px-4 font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Téléphone Officiel</label>
                        <Input name="shopPhone" defaultValue={settings.shopPhone} className="bg-muted/50 border-border h-12 rounded-xl px-4 font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Adresse Physique</label>
                        <Input name="shopAddress" defaultValue={settings.shopAddress} className="bg-muted/50 border-border h-12 rounded-xl px-4 font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Numéro Fiscal (NIF/RCCM)</label>
                        <Input name="numNIF" defaultValue={settings.numNIF} className="bg-muted/50 border-border h-12 rounded-xl px-4 font-bold" />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Logo de l'Entité (URL)</label>
                        <div className="flex gap-4 items-center">
                          <Input name="logoUrl" defaultValue={settings.logoUrl} placeholder="https://..." className="bg-muted/50 border-border h-12 rounded-xl px-4 font-bold flex-1" />
                          {settings.logoUrl && (
                            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center overflow-hidden border-2 border-primary/20 shadow-inner">
                              <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-1" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-[11px] font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all">
                      Enregistrer les modifications
                    </Button>
                  </form>
                </CardContent>
              </Card>



              <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-dashed border-2">
                <CardHeader className="bg-background/50 border-b border-border p-6">
                  <CardTitle className="text-lg font-black uppercase tracking-wider text-amber-500">Maintenance & Labs</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between p-5 bg-muted/30 border border-border rounded-2xl group hover:border-amber-500/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-black text-sm uppercase tracking-tight">Injection de Données</p>
                      <p className="text-xs text-muted-foreground font-medium">Pré-remplissage du catalogue avec le pack de démonstration.</p>
                    </div>
                    <Button 
                      variant="outline"
                      type="button"
                      className="border-amber-500/30 text-amber-600 hover:bg-amber-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl"
                      onClick={onInitializeDemoData}
                    >
                      Amorcer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSubTab === 'users' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {isAdmin ? (
                <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-2">
                  <CardHeader className="bg-muted/30 border-b border-border p-6">
                    <CardTitle className="text-lg font-black uppercase tracking-wider">Nouvel Accès</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleAddUser} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Utilisateur</label>
                          <Input name="username" required className="bg-muted/50 border-border h-11 rounded-xl font-bold" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mot de passe</label>
                          <Input name="password" type="password" required className="bg-muted/50 border-border h-11 rounded-xl font-bold" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Habilitations</label>
                        <Select name="role" defaultValue="cashier">
                          <SelectTrigger className="bg-muted/50 border-border h-11 rounded-xl font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="cashier" className="font-bold">Caissier / POS</SelectItem>
                            <SelectItem value="manager" className="font-bold">Manager / Gérant</SelectItem>
                            <SelectItem value="admin" className="font-bold text-primary">Directeur / Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Attribuer l'Accès
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="py-20 text-center border-4 border-dashed border-border rounded-3xl bg-muted/20 opacity-50">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground stroke-1" />
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Droits Administrateur Requis</p>
                </div>
              )}

              <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="p-6 bg-muted/20 border-b border-border">
                  <CardTitle className="text-lg font-black uppercase tracking-wider">Annuaire du Personnel</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-b border-border">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-12">Identité</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-12">Niveau d'Accès</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 h-12 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id} className="hover:bg-muted/20 border-b border-border group transition-colors">
                          <TableCell className="font-bold px-6 py-4">{u.username}</TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black uppercase tracking-tighter px-2 h-5 border-none",
                              u.role === 'admin' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                              {u.role === 'admin' ? 'Administrateur' : 'Opérateur Vente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-6 py-4">
                            {isAdmin && u.id !== currentUser.id && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                type="button"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onDeleteUser(u.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSubTab === 'payments' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-2">
                <CardHeader className="bg-muted/30 border-b border-border p-6">
                  <CardTitle className="text-lg font-black uppercase tracking-wider">Fiscalité (TVA)</CardTitle>
                  <CardDescription className="text-xs font-bold font-mono opacity-70">Calcul automatique sur les nouvelles références</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleUpdateTva} className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Taux Standar (%)</label>
                      <Input name="defaultTva" type="number" step="0.01" defaultValue={settings.defaultTva} className="bg-muted/50 border-border h-12 rounded-xl px-4 font-bold" />
                    </div>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 font-black text-[11px] uppercase tracking-widest h-12 px-8 rounded-xl transition-all">
                      Actualiser la Fiscalité
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border p-6">
                  <CardTitle className="text-lg font-black uppercase tracking-wider text-emerald-500">Flux de Trésorerie acceptés</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {[
                    { label: 'Espèces (Cash Flow)', status: 'ACTIF', color: 'bg-emerald-500/10 text-emerald-500' },
                    { label: 'Mobile Money (Orange/MTN/Moov)', status: 'ACTIF', color: 'bg-emerald-500/10 text-emerald-500' },
                    { label: 'Cartes Bancaires (Visa/Mastercard)', status: 'LATENCE', color: 'bg-muted text-muted-foreground', disabled: true },
                  ].map((method) => (
                    <div key={method.label} className={cn("flex items-center justify-between p-4 border border-border rounded-2xl transition-all", method.disabled && "opacity-40 grayscale")}>
                      <span className="text-sm font-black uppercase tracking-tighter">{method.label}</span>
                      <Badge className={cn("text-[9px] font-black px-2 h-5 border-none", method.color)}>{method.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSubTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-2 border-primary/20">
                <CardHeader className="bg-primary/5 border-b border-border p-6">
                  <CardTitle className="text-lg font-black uppercase tracking-wider text-primary">Maintenance & Sauvegarde</CardTitle>
                  <CardDescription className="text-xs font-bold font-mono opacity-70">Garantie de continuité de service</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-5 bg-muted/20 border border-border rounded-2xl">
                    <div className="space-y-1">
                      <p className="font-black text-sm uppercase tracking-tight">Exportation Coffre-Fort</p>
                      <p className="text-[11px] text-muted-foreground font-medium">Télécharger une sauvegarde complète (.json) de toutes vos données.</p>
                    </div>
                    <Button 
                      variant="outline"
                      className="border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl"
                      onClick={onExportBackup}
                    >
                      Sauvegarder
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-muted/20 border border-border rounded-2xl">
                    <div className="space-y-1">
                      <p className="font-black text-sm uppercase tracking-tight text-amber-500">Restauration Système</p>
                      <p className="text-[11px] text-muted-foreground font-medium">Récupérer vos données à partir d'un fichier de sauvegarde.</p>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".json" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onImportBackup(file);
                        }}
                      />
                      <Button 
                        variant="outline"
                        className="border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl"
                      >
                        Restaurer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-6 bg-muted/30 border-b border-border">
                  <div>
                    <CardTitle className="text-lg font-black uppercase tracking-wider">Journal d'Audit Intègre</CardTitle>
                    <CardDescription className="text-xs font-mono font-bold opacity-60">Historique sécurisé (SHA-256)</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {auditLogs.length === 0 ? (
                      <p className="text-center py-10 text-muted-foreground text-xs font-black uppercase italic">Aucun log enregistré</p>
                    ) : (
                      auditLogs.map((log) => (
                        <div key={log.id} className="text-[11px] font-mono text-muted-foreground border-l-4 border-primary/40 pl-4 py-3 bg-muted/20 rounded-r-lg group hover:bg-muted/40 transition-colors">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-primary font-black uppercase tracking-tighter">
                              {format(new Date(log.timestamp), "dd MMM yyyy HH:mm:ss", { locale: fr })}
                            </span>
                            <span className="text-[9px] bg-background px-2 py-0.5 rounded border border-border font-black text-foreground">
                              {log.entityType} • {log.action}
                            </span>
                          </div>
                          <p className="font-bold text-foreground/90">{log.details}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[9px] opacity-50 italic">Par: {log.userName}</span>
                            <span className="text-[8px] opacity-30 font-mono hidden group-hover:inline-block">HASH: {log.integrityHash.slice(0, 16)}...</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSubTab === 'printer' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden border-2 border-primary/20">
                <CardHeader className="bg-primary/5 border-b border-border p-6 font-black uppercase">
                  <div className="flex items-center gap-2">
                    <Printer className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg tracking-wider">Configuration Imprimante Thermique (POS)</CardTitle>
                  </div>
                  <CardDescription className="text-[10px] font-bold font-mono opacity-70">
                    Paramétrez le format de ticket, l'impression automatique et l'en-tête de caisse
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      onUpdateSettings({
                        ...settings,
                        thermalPrinterWidth: formData.get('thermalPrinterWidth') as '80mm' | '58mm',
                        thermalAutoPrint: formData.get('thermalAutoPrint') === 'true',
                        thermalShowBarcode: formData.get('thermalShowBarcode') === 'true',
                        thermalShowTVA: formData.get('thermalShowTVA') === 'true',
                        thermalCopies: parseInt(formData.get('thermalCopies') as string) || 1,
                        thermalReceiptHeader: formData.get('thermalReceiptHeader') as string,
                        thermalReceiptFooter: formData.get('thermalReceiptFooter') as string,
                      });
                      toast.success('Paramètres d\'impression thermique enregistrés !');
                    }} 
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Largeur Papier Reçu
                        </label>
                        <Select 
                          name="thermalPrinterWidth" 
                          defaultValue={settings.thermalPrinterWidth || '80mm'}
                        >
                          <SelectTrigger className="bg-muted/50 border-border h-12 rounded-xl px-4 font-bold">
                            <SelectValue placeholder="Largeur Papier" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="80mm" className="font-bold">
                              80mm (Standard Thermique Caissier)
                            </SelectItem>
                            <SelectItem value="58mm" className="font-bold">
                              58mm (Compact Mobile / Mini ESC/POS)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[9px] text-muted-foreground">La largeur 80mm est le standard universel des terminaux de vente.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Impression Automatique
                        </label>
                        <Select 
                          name="thermalAutoPrint" 
                          defaultValue={settings.thermalAutoPrint ? 'true' : 'false'}
                        >
                          <SelectTrigger className="bg-muted/50 border-border h-12 rounded-xl px-4 font-bold">
                            <SelectValue placeholder="Impression auto" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="true" className="font-bold text-emerald-500">
                              Activée (Imprime dès l'encaissement)
                            </SelectItem>
                            <SelectItem value="false" className="font-bold text-muted-foreground">
                              Désactivée (Aperçu à l'écran avant validation)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[9px] text-muted-foreground">Déclenche automatiquement la boîte de dialogue d'impression.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Afficher Code-barres
                        </label>
                        <Select 
                          name="thermalShowBarcode" 
                          defaultValue={settings.thermalShowBarcode !== false ? 'true' : 'false'}
                        >
                          <SelectTrigger className="bg-muted/50 border-border h-11 rounded-xl px-4 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="true" className="font-bold">Oui (Numéro Facture)</SelectItem>
                            <SelectItem value="false" className="font-bold">Non (Masqué)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Ventilation TVA
                        </label>
                        <Select 
                          name="thermalShowTVA" 
                          defaultValue={settings.thermalShowTVA !== false ? 'true' : 'false'}
                        >
                          <SelectTrigger className="bg-muted/50 border-border h-11 rounded-xl px-4 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="true" className="font-bold">Oui (Détail HT + TVA)</SelectItem>
                            <SelectItem value="false" className="font-bold">Non (Total TTC seul)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Nombre d'Exemplaires
                        </label>
                        <Input 
                          name="thermalCopies" 
                          type="number" 
                          min={1} 
                          max={5} 
                          defaultValue={settings.thermalCopies || 1} 
                          className="bg-muted/50 border-border h-11 rounded-xl font-bold font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Message Personnalisé de Pied de Ticket (Conditions & Remerciements)
                      </label>
                      <Input 
                        name="thermalReceiptFooter" 
                        defaultValue={settings.thermalReceiptFooter || "Merci de votre visite et à bientôt ! Les articles vendus ne sont ni repris ni échangés."} 
                        placeholder="Ex: Merci pour votre confiance ! Échange sous 48h sur présentation du ticket."
                        className="bg-muted/50 border-border h-12 rounded-xl font-medium text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => printTestReceipt(settings)}
                        className="gap-2 border-primary/30 text-primary hover:bg-primary/10 font-bold uppercase tracking-wider text-xs h-11 px-5 rounded-xl"
                      >
                        <Printer className="w-4 h-4" />
                        Tester l'Impression (Page Diagnostic)
                      </Button>

                      <Button 
                        type="submit" 
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-xs h-11 px-8 rounded-xl shadow-lg shadow-primary/20"
                      >
                        Enregistrer la Configuration
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="bg-card/50 border-border shadow-md rounded-2xl overflow-hidden border-2 mb-12">
            <CardHeader className="p-6 bg-background/50 border-b border-border">
              <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Signature Noyau Logiciel</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Build Logiciel</label>
                  <div className="text-[13px] font-black text-foreground">v1.3.0-PREMIUM (Stable)</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Hash d'Empreinte</label>
                  <div className="text-[12px] font-mono font-bold text-primary translate-y-1 uppercase tracking-tight">VI-BM-2026-AFR-CORE-X</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
