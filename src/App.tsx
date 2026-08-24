/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearch } from './components/layout/GlobalSearch';
import { Dashboard } from './components/dashboard/Stats';
import { Inventory } from './components/inventory/InventoryTable';
import { PosSystem } from './components/pos/PosSystem';
import { CustomerList } from './components/customers/CustomerList';
import { Credits } from './components/customers/Credits';
import { Loyalty } from './components/customers/Loyalty';
import { Reporting } from './components/reporting/Reporting';
import { Settings } from './components/settings/Settings';
import { Login } from './components/auth/Login';
import { SalesHistory } from './components/sales/SalesHistory';
import { Returns } from './components/sales/Returns';
import { Proformas } from './components/sales/Proformas';
import { Suppliers } from './components/suppliers/Suppliers';
import { Expenses } from './components/finance/Expenses';
import { Cashflow } from './components/finance/Cashflow';
import { Categories } from './components/inventory/Categories';
import { StockAdjustment } from './components/inventory/StockAdjustment';
import { DLCTracking } from './components/inventory/DLCTracking';
import { Purchases } from './components/purchases/Purchases';
import { Planning } from './components/hr/Planning';
import { InventoryOptimization } from './components/inventory/InventoryOptimization';
import { Warehouses } from './components/inventory/Warehouses';
import { Promotions } from './components/sales/Promotions';
import { Employees } from './components/hr/Employees';
import { AuditTrail } from './components/admin/AuditTrail';
import { InstallPWA } from './components/InstallPWA';
import { OfflineIndicator } from './components/OfflineIndicator';
import { StockNotificationBell } from './components/layout/StockNotificationBell';
import { useERP } from './lib/useERP';
import { ERPProvider } from './context/ERPContext';
import { ALL_CURRENCIES } from './constants';
import { Toaster, toast } from 'sonner';
import { Loader2, ShieldCheck, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

function AppContent() {
  const {
    products,
    customers,
    sales,
    users,
    auditLogs,
    activeTab,
    setActiveTab,
    currentUser,
    settings,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    completeSale,
    login,
    logout,
    registerUser,
    updateSettings,
    addUser,
    deleteUser,
    exportBackup,
    importBackup,
    expenses,
    purchases,
    suppliers,
    addExpense,
    addPurchase,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    refreshExchangeRates
  } = useERP();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [progress, setProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setProgress(80);
    } else {
      setProgress(0);
    }
  }, [activeTab]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'theme-nature', 'theme-royal');
    if (theme !== 'light') {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const currency = ALL_CURRENCIES.find(c => c.code === settings.currency) || ALL_CURRENCIES[0];

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
          Initialisation du Système ERP...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Login onLogin={login} onRegister={registerUser} />
        <Toaster position="top-right" theme={theme === 'light' ? 'light' : 'dark'} richColors />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={logout} 
        settings={settings}
        theme={theme}
        setTheme={setTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Barre de progression globale */}
        <div className="absolute top-0 left-0 w-full h-1 z-50 pointer-events-none bg-primary/5">
          <motion.div 
            className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </div>
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              className="lg:hidden h-10 w-10 text-muted-foreground hover:text-foreground flex items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-base lg:text-lg font-bold text-foreground capitalize tracking-tight">
              {activeTab.replace('-', ' ')}
            </h2>
            <span className="text-[10px] border border-border px-2 py-0.5 rounded font-mono text-muted-foreground hidden sm:inline-block">
              V{settings.shopName.slice(0, 2).toUpperCase()}-2026
            </span>
          </div>

          <div className="hidden md:block">
            <GlobalSearch 
              products={products} 
              customers={customers} 
              sales={sales} 
              onNavigate={setActiveTab} 
            />
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <StockNotificationBell 
              products={products} 
              onNavigate={setActiveTab} 
            />

            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">{currentUser.username}</span>
                {currentUser.authProvider === 'google' && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Google
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {currentUser.role} • {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner shrink-0 overflow-hidden">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.username} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                currentUser.username[0]?.toUpperCase() || 'U'
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative">
          <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {activeTab === 'dashboard' && <Dashboard products={products} sales={sales} auditLogs={auditLogs} currentUser={currentUser} />}
            
            {/* Ventes */}
            {activeTab === 'pos' && (
              <PosSystem 
                products={products} 
                customers={customers} 
                onCompleteSale={completeSale} 
                settings={settings}
                currencySymbol={currency.symbol}
              />
            )}
            {activeTab === 'sales-history' && <SalesHistory sales={sales} customers={customers} currencySymbol={currency.symbol} settings={settings} />}
            {activeTab === 'proformas' && <Proformas currencySymbol={currency.symbol} />}
            {activeTab === 'returns' && <Returns sales={sales} currencySymbol={currency.symbol} />}
            {activeTab === 'promotions' && <Promotions />}

            {/* Stocks */}
            {activeTab === 'inventory' && (
              <Inventory 
                products={products} 
                onAddProduct={addProduct} 
                onUpdateProduct={updateProduct} 
                onDeleteProduct={deleteProduct} 
                currencySymbol={currency.symbol}
              />
            )}
            {activeTab === 'categories' && <Categories products={products} />}
            {activeTab === 'stock-adjust' && <StockAdjustment products={products} onUpdateProduct={updateProduct} />}
            {activeTab === 'inventory-opt' && <InventoryOptimization products={products} />}
            {activeTab === 'dlc-tracking' && <DLCTracking products={products} />}

            {/* CRM */}
            {activeTab === 'customers' && (
              <CustomerList 
                customers={customers} 
                onAddCustomer={addCustomer}
                onUpdateCustomer={updateCustomer}
              />
            )}
            {activeTab === 'credits' && <Credits customers={customers} currencySymbol={currency.symbol} />}
            {activeTab === 'loyalty' && <Loyalty customers={customers} />}

            {/* Achats */}
            {activeTab === 'suppliers' && (
              <Suppliers 
                suppliers={suppliers} 
                onAddSupplier={addSupplier} 
                onUpdateSupplier={updateSupplier}
                onDeleteSupplier={deleteSupplier}
              />
            )}
            {activeTab === 'purchases' && <Purchases currencySymbol={currency.symbol} purchases={purchases} onAddPurchase={addPurchase} products={products} suppliers={suppliers} />}
            {activeTab === 'warehouses' && <Warehouses onNavigate={setActiveTab} />}

            {/* Finance */}
            {activeTab === 'expenses' && <Expenses currencySymbol={currency.symbol} expenses={expenses} onAddExpense={addExpense} />}
            {activeTab === 'cashflow' && <Cashflow sales={sales} expenses={expenses} />}

            {/* Analyses */}
            {activeTab === 'reporting' && <Reporting sales={sales} products={products} expenses={expenses} currencySymbol={currency.symbol} />}

            {/* RH */}
            {activeTab === 'employees' && <Employees />}
            {activeTab === 'planning' && <Planning />}

            {activeTab === 'audit' && (
              currentUser?.role === 'admin' ? (
                <AuditTrail logs={auditLogs} />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                  <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-10 h-10 text-destructive" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-destructive">Accès Restreint</h3>
                  <p className="text-muted-foreground text-center max-w-sm font-medium">
                    Vous n'avez pas les autorisations nécessaires pour consulter les journaux de sécurité. Veuillez contacter un administrateur.
                  </p>
                </div>
              )
            )}

            {/* Système */}
            {activeTab === 'settings' && (
              <Settings 
                currency={settings.currency} 
                onCurrencyChange={(code) => updateSettings({ ...settings, currency: code })} 
                onInitializeDemoData={() => {
                  toast.info('Initialisation des données de démonstration...');
                }}
                users={users}
                onAddUser={addUser}
                onDeleteUser={deleteUser}
                currentUser={currentUser}
                settings={settings}
                onUpdateSettings={updateSettings}
                auditLogs={auditLogs}
                onExportBackup={exportBackup}
                onImportBackup={importBackup}
                onRefreshExchangeRates={refreshExchangeRates}
              />
            )}
          </div>
        </div>

        <footer className="h-10 border-t border-border bg-card/30 backdrop-blur-sm flex items-center justify-between px-8 text-[10px] text-muted-foreground shrink-0 z-20">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] shadow-[0_0_8px_rgba(0,230,118,0.4)]" />
            <span className="font-medium">Noyau de Gestion Opérationnel • v1.3.0 stable</span>
          </div>
          <p className="font-mono">
            {settings.shopName} | <span className="opacity-50">vab&idriss tech corp</span>
          </p>
        </footer>
      </main>

      <Toaster position="top-right" theme={theme === 'light' ? 'light' : 'dark'} richColors closeButton />
      <InstallPWA />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ERPProvider>
      <AppContent />
    </ERPProvider>
  );
}
