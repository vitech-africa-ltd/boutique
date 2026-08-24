import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  History, 
  FileText, 
  RotateCcw, 
  Truck, 
  Wallet, 
  UserCheck, 
  Clock, 
  RefreshCw,
  CreditCard, 
  Tag, 
  Barcode,
  TrendingUp,
  Landmark,
  Percent,
  Building2,
  Zap,
  Palette,
  Check,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Logo } from './Logo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { THEMES } from '@/src/constants/themes';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  settings: {
    shopName: string;
    logoUrl?: string;
  };
  theme: string;
  setTheme: (theme: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const MENU_GROUPS = [
  {
    title: 'Principal',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Ventes & Caisse',
    items: [
      { id: 'pos', label: 'Terminal de Vente (POS)', icon: ShoppingCart },
      { id: 'sales-history', label: 'Historique des Ventes', icon: History },
      { id: 'proformas', label: 'Devis & Proformas', icon: FileText },
      { id: 'returns', label: 'Retours & Remboursements', icon: RotateCcw },
      { id: 'promotions', label: 'Promotions & Offres', icon: Percent },
    ]
  },
  {
    title: 'Produits & Stocks',
    items: [
      { id: 'inventory', label: 'Catalogue Articles', icon: Package },
      { id: 'categories', label: 'Catégories & Marques', icon: Tag },
      { id: 'stock-adjust', label: 'Gestion des Stocks', icon: Barcode },
      { id: 'inventory-opt', label: 'Optimisation Stock', icon: Zap },
      { id: 'dlc-tracking', label: 'Suivi des DLC', icon: Clock },
    ]
  },
  {
    title: 'Clients (CRM)',
    items: [
      { id: 'customers', label: 'Répertoire Clients', icon: Users },
      { id: 'credits', label: 'Gestion des Crédits', icon: CreditCard },
      { id: 'loyalty', label: 'Programme Fidélité', icon: TrendingUp },
    ]
  },
  {
    title: 'Achats & Logistique',
    items: [
      { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
      { id: 'purchases', label: 'Bons de Commande', icon: FileText },
      { id: 'warehouses', label: 'Gestion Entrepôts', icon: Building2 },
    ]
  },
  {
    title: 'Finance & Compta',
    items: [
      { id: 'expenses', label: 'Gestion des Dépenses', icon: Wallet },
      { id: 'cashflow', label: 'Flux de Trésorerie', icon: Landmark },
    ]
  },
  {
    title: 'Analyses',
    items: [
      { id: 'reporting', label: 'Rapports & Stats', icon: BarChart3 },
    ]
  },
  {
    title: 'Ressources Humaines',
    items: [
      { id: 'employees', label: 'Gestion Employés', icon: UserCheck },
      { id: 'planning', label: 'Planning & Présences', icon: Clock },
    ]
  },
  {
    title: 'Système & Sécurité',
    items: [
      { id: 'settings', label: 'Paramètres', icon: Settings },
      { id: 'audit', label: 'Journal d\'Audit (Sec)', icon: ShieldCheck },
    ]
  }
];

import { InstallPWA } from '../pwa/InstallPWA';
import { CurrencySelector } from '../common/CurrencySelector';

export function Sidebar({ activeTab, setActiveTab, onLogout, settings, theme, setTheme, isOpen, onClose }: SidebarProps) {
  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 z-[101] flex flex-col h-full w-72 bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden transition-transform duration-300 transform lg:translate-x-0 lg:static lg:z-50 shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-50" />
        
        <div className="p-6 lg:p-8 flex items-center gap-4 relative z-10 border-b border-sidebar-border/30">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl shadow-primary/30 border-2 border-white/10 shrink-0 transform transition-transform hover:scale-105 duration-500">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            <Logo className="w-7 h-7" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-base font-black tracking-tight text-foreground truncate uppercase leading-none">{settings.shopName}</h1>
          <div className="flex items-center gap-2 mt-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full w-fit border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse outline outline-2 outline-emerald-500/30" />
            <span className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.15em]">Système Actif</span>
          </div>
          <div className="flex items-center gap-2 mt-1 px-2 py-0.5 bg-primary/10 rounded-full w-fit border border-primary/20">
            <RefreshCw className="w-2.5 h-2.5 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-[8px] text-primary font-black uppercase tracking-[0.15em]">Live Sync</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full w-full px-4 py-8 overflow-y-auto">
          <div className="space-y-10 pb-12">
            {MENU_GROUPS.map((group) => (
              <div key={group.title} className="space-y-4">
                <div className="flex items-center gap-3 px-4">
                  <h2 className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] whitespace-nowrap">
                    {group.title}
                  </h2>
                  <div className="h-px w-full bg-sidebar-border/20" />
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-4 h-11 px-4 rounded-xl transition-all duration-300 group relative font-bold overflow-hidden',
                        activeTab === item.id 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                          : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/5 active:scale-[0.98]'
                      )}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (onClose) onClose();
                      }}
                    >
                       {/* Hover effect highlight */}
                       <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                       
                      <item.icon className={cn(
                        "w-5 h-5 transition-all duration-300 relative z-10", 
                        activeTab === item.id 
                          ? "scale-110 drop-shadow-sm" 
                          : "group-hover:text-primary group-hover:rotate-6"
                      )} />
                      <span className="font-bold text-[13px] relative z-10 tracking-tight">{item.label}</span>
                      
                      {activeTab === item.id && (
                        <motion.div 
                          layoutId="active-nav-indicator"
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white/40 rounded-l-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="p-6 border-t border-sidebar-border bg-sidebar/95 backdrop-blur-xl z-20 space-y-4">
        <div className="p-4 bg-muted/20 rounded-2xl border border-border/30">
          <CurrencySelector />
        </div>
        <InstallPWA />
        
        <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-2xl border border-border/50 transition-all hover:bg-muted/50 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
            {settings.shopName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-black text-foreground truncate uppercase tracking-tight">Poste Principal</span>
            <span className="text-[10px] text-muted-foreground/60 truncate font-bold uppercase tracking-tighter">Accès Super-Utilisateur</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Popover>
            <PopoverTrigger render={<Button variant="outline" type="button" className="w-full justify-center gap-2 h-11 text-[11px] border-border bg-card hover:bg-muted rounded-xl font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm" />}>
              <Palette size={16} className="text-primary" />
              Thème
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 bg-popover border-border shadow-2xl rounded-2xl border-2" side="right" align="end" sideOffset={20}>
              <div className="mb-4 px-1 flex flex-col gap-1">
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Atmosphère</h3>
                <p className="text-[10px] text-muted-foreground font-bold">Personnalisez votre interface professionnelle.</p>
              </div>
              <div className="flex flex-col gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "group w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left relative border-2 border-transparent",
                      theme === t.id 
                        ? "bg-primary/5 border-primary/20 shadow-inner" 
                        : "hover:bg-muted hover:border-border"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-300 group-hover:rotate-12",
                      t.color
                    )}>
                      <t.icon className={cn(
                        "w-5 h-5",
                        theme === t.id ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={cn(
                        "text-[12px] font-black uppercase tracking-tight",
                        theme === t.id ? "text-primary" : "text-foreground"
                      )}>{t.label}</span>
                      <span className="text-[9px] text-muted-foreground font-bold leading-tight opacity-70 italic">{t.description}</span>
                    </div>
                    {theme === t.id && (
                      <Check className="absolute right-4 w-5 h-5 text-primary stroke-[3px]" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            className="w-full justify-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11 px-3 rounded-xl font-black uppercase tracking-wider text-[11px] border border-transparent hover:border-destructive/20 active:scale-95"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" />
            Sortir
          </Button>
        </div>

        <div className="pt-4 border-t border-sidebar-border/30 flex flex-col items-center gap-1 opacity-20">
          <p className="text-[9px] font-black uppercase tracking-[0.3em]">© vab&idriss engineering</p>
          <div className="flex items-center gap-2">
             <div className="w-1 h-1 rounded-full bg-primary" />
             <p className="text-[8px] font-bold tracking-[0.4em] uppercase">V1.3.0-PRO-AFR</p>
             <div className="w-1 h-1 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  </>
  );
}
