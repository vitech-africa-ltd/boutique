import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package, Users, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock, CreditCard, ShoppingCart, Activity, Star, ShieldCheck, ShieldAlert, AlertOctagon } from 'lucide-react';
import React, { useMemo } from 'react';
import { Product, Sale, User } from '@/src/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuditLogEntry } from '@/src/lib/db';
import { cn } from '@/lib/utils';
import { useERP } from '@/src/lib/useERP';
import { CurrencyIntelligence } from '../settings/CurrencyIntelligence';
import { StockAlertNotificationCenter } from './StockAlertNotificationCenter';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  auditLogs: AuditLogEntry[];
  currentUser: User | null;
}

export function Dashboard({ products, sales, auditLogs, currentUser }: DashboardProps) {
  const { formatAmount, getBusinessHealth, settings, setActiveTab } = useERP();
  const health = getBusinessHealth();
  const today = new Date().toDateString();
  const salesToday = sales.filter(s => new Date(s.date).toDateString() === today);
  
  const revenueToday = salesToday.reduce((acc, s) => acc + s.totalTTC, 0);
  const profitToday = salesToday.reduce((acc, s) => {
    const saleProfit = s.items.reduce((itemAcc, item) => itemAcc + (item.priceTTC - item.purchasePrice) * item.quantity, 0);
    return acc + saleProfit;
  }, 0);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalTTC, 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const lowStockCount = lowStockProducts.length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const scrollToStockAlerts = () => {
    const el = document.getElementById('stock-alerts-notification-center');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Analysis Insights
  const insights = useMemo(() => {
    const criticalItems = products.filter(p => {
      const abc = health.abcAnalysis?.find((a: any) => a.id === p.id);
      return abc?.category === 'A' && p.stock <= p.minStock;
    });
    return {
      stockRisk: criticalItems.length,
      healthScore: health.expiredLoss > 0 ? 'Moyen' : 'Excellent',
    };
  }, [products, health]);

  // Prepare chart data
  const salesByDate = sales.reduce((acc: any, sale) => {
    const date = new Date(sale.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    if (!acc[date]) acc[date] = 0;
    acc[date] += sale.totalTTC;
    return acc;
  }, {});

  const chartData = Object.keys(salesByDate).map(date => ({
    date,
    revenue: salesByDate[date]
  })).slice(-7);

  // Category data
  const categoryData = products.reduce((acc: any, p) => {
    if (!acc[p.category]) acc[p.category] = 0;
    acc[p.category] += p.stock;
    return acc;
  }, {});

  const barChartData = Object.keys(categoryData).map(cat => ({
    name: cat,
    value: categoryData[cat]
  }));

  // Top Products
  const productSales = sales.reduce((acc: any, sale) => {
    sale.items.forEach(item => {
      if (!acc[item.name]) acc[item.name] = 0;
      acc[item.name] += item.quantity;
    });
    return acc;
  }, {});

  const topProducts = Object.keys(productSales)
    .map(name => ({ name, quantity: productSales[name] }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const recentSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de Bord</h1>
          <p className="text-muted-foreground text-sm">Intelligence d'affaires, alertes de stock et performance commerciale.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 animate-pulse">
            <Activity className="w-3 h-3 mr-1" /> Live
          </Badge>
          <span className="text-[10px] text-muted-foreground uppercase hidden sm:inline-block">Dernière mise à jour: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border rounded-xl shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-1">
            <Badge variant="secondary" className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 border-none px-1 uppercase">Opérationnel</Badge>
          </div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] text-muted-foreground uppercase tracking-wider block font-medium">Chiffre d'Affaires</span>
              <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">{formatAmount(revenueToday)}</div>
            <div className="text-[11px] text-emerald-500 mt-2 flex items-center gap-1 font-bold">
              <ArrowUpRight className="w-3 h-3" />
              Performances du jour
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-xl shadow-sm hover:shadow-md transition-shadow group">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] text-muted-foreground uppercase tracking-wider block font-medium">Marge Nette (Jour)</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-emerald-500">{formatAmount(profitToday)}</div>
            <p className="text-[11px] text-muted-foreground mt-2 font-medium italic">Rentabilité: {revenueToday > 0 ? ((profitToday / revenueToday) * 100).toFixed(1) : 0}%</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-xl shadow-sm hover:shadow-md transition-shadow group">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] text-muted-foreground uppercase tracking-wider block font-medium">Capital Immobilisé</span>
              <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4 text-indigo-500" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-foreground">{formatAmount(health.totalInventoryValue)}</div>
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">Valeur totale du stock</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-xl shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
          <div className="absolute top-0 right-0 p-1">
            <Badge className={cn(
              "text-[8px] font-black border-none px-1 uppercase",
              health.expiredLoss > 0 ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/20 text-emerald-500"
            )}>
              {health.expiredLoss > 0 ? "Risque Élevé" : "Sain"}
            </Badge>
          </div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] text-muted-foreground uppercase tracking-wider block font-medium">Indice de Perte</span>
              <div className="p-2 bg-rose-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-rose-500">{formatAmount(health.expiredLoss)}</div>
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">Pertes sèches détectées</p>
          </CardContent>
        </Card>

        {/* Stock Alerts KPI Card with interactive trigger */}
        <Card 
          onClick={scrollToStockAlerts}
          className={cn(
            "bg-card border-border rounded-xl shadow-sm hover:shadow-md transition-all group cursor-pointer overflow-hidden relative",
            lowStockCount > 0 
              ? outOfStockCount > 0 
                ? "border-rose-500/30 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10" 
                : "border-amber-500/30 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10"
              : "border-border hover:border-primary/40"
          )}
        >
          <div className="absolute top-0 right-0 p-1">
            {lowStockCount > 0 ? (
              <Badge variant="destructive" className="text-[8px] font-black uppercase border-none px-1 animate-pulse">
                {outOfStockCount > 0 ? 'Action Requise' : 'Attention'}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 border-none px-1 uppercase">
                Optimal
              </Badge>
            )}
          </div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[12px] text-muted-foreground uppercase tracking-wider block font-medium">Alertes Stock</span>
              <div className={cn(
                "p-2 rounded-xl group-hover:scale-110 transition-transform",
                lowStockCount > 0 
                  ? outOfStockCount > 0 
                    ? "bg-rose-500/15 text-rose-500" 
                    : "bg-amber-500/15 text-amber-500"
                  : "bg-emerald-500/10 text-emerald-500"
              )}>
                {outOfStockCount > 0 ? (
                  <AlertOctagon className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className={cn(
              "text-2xl font-black tracking-tight",
              outOfStockCount > 0 ? "text-rose-500" : lowStockCount > 0 ? "text-amber-500" : "text-foreground"
            )}>
              {lowStockCount.toString().padStart(2, '0')}
            </div>
            <div className="text-[11px] text-muted-foreground mt-2 font-medium flex items-center justify-between">
              <span>{outOfStockCount} en rupture (0)</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-primary group-hover:translate-y-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts & Threshold Notification Center Component */}
      <StockAlertNotificationCenter 
        products={products} 
        onNavigate={setActiveTab} 
      />

      {/* AI Currency Intelligence */}
      <CurrencyIntelligence />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Évolution Financière</CardTitle>
              <CardDescription className="text-xs">Chiffre d'affaires sur les 7 derniers jours</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-[10px] font-bold">REVENUS</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] pt-6 pr-6 w-full relative min-h-[320px]" id="revenue-chart">
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="currentColor" 
                    className="text-muted-foreground" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="currentColor" 
                    className="text-muted-foreground" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value.toLocaleString()}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--foreground)', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--primary)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }} 
                    activeDot={{ r: 6, strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Notifications Système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {lowStockCount > 0 && (
                <div 
                  onClick={scrollToStockAlerts}
                  className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20 group cursor-pointer hover:bg-destructive/10 transition-all hover:scale-[1.01]"
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-foreground">{lowStockCount} article(s) sous le seuil min</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {outOfStockCount > 0 ? `${outOfStockCount} rupture(s) totale(s) détectée(s)` : 'Réapprovisionnement conseillé'}
                    </p>
                  </div>
                  <ArrowDownRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive group-hover:translate-y-0.5 transition-all" />
                </div>
              )}
              <div 
                onClick={() => setActiveTab('credits')}
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 group cursor-pointer hover:bg-amber-500/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-foreground">Impayés & Crédits Clients</p>
                  <p className="text-[10px] text-muted-foreground">Consulter le registre des créances</p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div 
                onClick={() => setActiveTab('dlc-tracking')}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 group cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-foreground">Suivi des Dates DLC/DLUO</p>
                  <p className="text-[10px] text-muted-foreground">Surveillance des produits périssables</p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Dernières Activités (Anti-Fraude)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {currentUser?.role === 'admin' || currentUser?.role === 'manager' ? (
                  auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex flex-col p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest",
                          log.action === 'DELETE' ? "bg-destructive/10 text-destructive border-destructive/20" :
                          log.action === 'UPDATE' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          "bg-primary/10 text-primary border-primary/20"
                        )}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] font-bold text-foreground/80 line-clamp-1">{log.details}</p>
                      <span className="text-[9px] text-muted-foreground uppercase font-black opacity-40 mt-1">{log.userName}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 flex flex-col items-center gap-2 text-center">
                    <ShieldAlert className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Accès Restreint à l'Audit</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/10 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground">Activités Récentes</CardTitle>
            <CardDescription className="text-xs">Historique des 5 dernières ventes</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[320px]">
              <div className="divide-y divide-border">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Transaction #{sale.id.slice(-6)}</p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{new Date(sale.date).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-500">{formatAmount(sale.totalTTC)}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">{sale.items.length} articles</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-card border-border overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/10 border-b border-border/50">
            <CardTitle className="text-base font-bold text-foreground">Stock par Catégorie</CardTitle>
            <CardDescription className="text-xs">Répartition volumétrique de l'inventaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] pt-6 pr-6 w-full relative min-h-[320px]" id="category-chart">
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <BarChart data={barChartData} margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="currentColor" 
                    className="text-muted-foreground" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    stroke="currentColor" 
                    className="text-muted-foreground" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : 'var(--muted-foreground)'} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

