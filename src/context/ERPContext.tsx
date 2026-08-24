import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addAuditLog, AuditLogEntry } from '../lib/db';
import { Product, Customer, Sale, User, SystemSettings, Expense, Purchase, Supplier } from '../types';
import { toast } from 'sonner';
import { fetchExchangeRates } from '../services/exchangeRateService';
import { getCurrencyIntelligence } from '../services/geminiService';

interface ERPContextType {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  users: User[];
  expenses: Expense[];
  purchases: Purchase[];
  suppliers: Supplier[];
  auditLogs: AuditLogEntry[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  settings: SystemSettings;
  isLoading: boolean;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  completeSale: (sale: Sale) => Promise<void>;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (user: User) => Promise<boolean>;
  updateSettings: (settings: SystemSettings) => void;
  refreshExchangeRates: (forced?: boolean) => Promise<void>;
  convertAmount: (amount: number, from: string, to: string) => number;
  formatAmount: (amount: number, fromCurrency?: string, targetCurrency?: string) => string;
  getBusinessHealth: () => any;
  addUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  addPurchase: (purchase: Purchase) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export function ERPProvider({ children }: { children: React.ReactNode }) {
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const sales = useLiveQuery(() => db.sales.orderBy('date').reverse().toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray()) || [];
  const purchases = useLiveQuery(() => db.purchases.orderBy('date').reverse().toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const auditLogs = useLiveQuery(() => db.auditLogs.orderBy('timestamp').reverse().limit(100).toArray()) || [];

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vi_erp_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('vi_erp_settings');
    return saved ? JSON.parse(saved) : {
      shopName: 'Global Boutique Manager',
      shopAddress: '123 Business Avenue',
      shopPhone: '+000 000 000 000',
      numNIF: 'TAX-IDENTIFIER-001',
      currency: 'USD',
      defaultTva: 16,
      logoUrl: '',
      exchangeRates: { 'USD': 1, 'EUR': 0.92, 'CDF': 2800, 'XAF': 600 },
      lastExchangeRateUpdate: ''
    };
  });

  const isLoading = products === undefined;

  const logAction = useCallback(async (action: any, type: string, id: string, details: string) => {
    if (currentUser) {
      await addAuditLog(currentUser.id, currentUser.username, action, type, id, details);
    }
  }, [currentUser]);

  const refreshExchangeRates = useCallback(async (forced = false) => {
    const lastUpdate = settings.lastExchangeRateUpdate;
    const oneHourInMs = 60 * 60 * 1000;
    
    // We always want to fetch if the currency has changed even if it's within the hour
    // but the forced flag or the time check also works.
    if (forced || !lastUpdate || (new Date().getTime() - new Date(lastUpdate).getTime() > oneHourInMs)) {
      try {
        console.log(`Refreshing exchange rates for base: ${settings.currency}`);
        const result = await fetchExchangeRates(settings.currency);
        if (result) {
          let aiInsight = settings.aiInsight;
          const oneDayInMs = 24 * 60 * 60 * 1000;
          const lastAiUpdate = settings.aiInsight?.timestamp;
          
          if (forced || !lastAiUpdate || (new Date().getTime() - new Date(lastAiUpdate).getTime() > oneDayInMs)) {
            console.log('Fetching AI Currency Intelligence...');
            const insight = await getCurrencyIntelligence(settings.currency, result.rates);
            if (insight) {
              aiInsight = { ...insight, timestamp: new Date().toISOString() };
            }
          }

          const newSettings = {
            ...settings,
            exchangeRates: result.rates,
            lastExchangeRateUpdate: result.lastUpdate,
            aiInsight
          };

          setSettings(newSettings);
          localStorage.setItem('vi_erp_settings', JSON.stringify(newSettings));
          if (forced) toast.success(`Intelligence financière mise à jour (${settings.currency})`);
        }
      } catch (error) {
        console.error('Exchange rate refresh error:', error);
      }
    }
  }, [settings.currency, settings.lastExchangeRateUpdate, settings.aiInsight]);

  // Effect to handle currency changes and initial load
  useEffect(() => {
    refreshExchangeRates();
  }, [settings.currency, refreshExchangeRates]);

  const addProduct = useCallback(async (product: Product) => {
    if (currentUser?.role === 'cashier') {
      toast.error('Accès refusé: Permissions insuffisantes');
      return;
    }
    try {
      await db.products.add(product);
      await logAction('CREATE', 'PRODUCT', product.id, `Produit: ${product.name} (Réf: ${product.reference})`);
      toast.success('Produit ajouté au stock local');
    } catch (e) {
      toast.error('Erreur lors de l\'ajout local');
    }
  }, [currentUser, logAction]);

  const updateProduct = useCallback(async (product: Product) => {
    if (currentUser?.role === 'cashier') {
      toast.error('Accès refusé');
      return;
    }
    try {
      await db.products.put(product);
      await logAction('UPDATE', 'PRODUCT', product.id, `Mise à jour stock/prix: ${product.name}`);
      toast.success('Produit mis à jour');
    } catch (e) {
      toast.error('Erreur de mise à jour');
    }
  }, [currentUser, logAction]);

  const deleteProduct = useCallback(async (id: string) => {
    if (currentUser?.role !== 'admin') {
      toast.error('Action réservée aux directeurs (Admin)');
      return;
    }
    try {
      const product = await db.products.get(id);
      await db.products.delete(id);
      await logAction('DELETE', 'PRODUCT', id, `Suppression de l'article: ${product?.name}`);
      toast.success('Produit supprimé du catalogue');
    } catch (e) {
      toast.error('Action refusée');
    }
  }, [currentUser, logAction]);

  const addCustomer = useCallback(async (customer: Customer) => {
    await db.customers.add(customer);
    await logAction('CREATE', 'CUSTOMER', customer.id, `Nouveau client: ${customer.name}`);
    toast.success('Client enregistré');
  }, [logAction]);

  const updateCustomer = useCallback(async (customer: Customer) => {
    await db.customers.put(customer);
    await logAction('UPDATE', 'CUSTOMER', customer.id, `Profil client modifié: ${customer.name}`);
    toast.success('Client mis à jour');
  }, [logAction]);

  const completeSale = useCallback(async (sale: Sale) => {
    try {
      await db.transaction('rw', db.products, db.sales, db.auditLogs, async () => {
        await db.sales.add(sale);
        for (const item of sale.items) {
          const product = await db.products.get(item.id);
          if (product) {
            const newStock = product.stock - item.quantity;
            await db.products.update(item.id, { stock: newStock });
            if (newStock <= product.minStock) {
              toast.warning(`Alerte Stock: ${product.name} est au seuil critique`, {
                description: `Plus que ${newStock} restants.`,
                duration: 5000,
              });
            }
          }
        }
        await logAction('CREATE', 'SALE', sale.id, `Vente complétée - Total: ${sale.totalTTC}`);
      });
      toast.success('Vente validée');
    } catch (e) {
      toast.error('Erreur transactionnelle critique');
    }
  }, [logAction]);

  const login = useCallback(async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('vi_erp_user', JSON.stringify(user));
    await addAuditLog(user.id, user.username, 'LOGIN', 'SYSTEM', user.id, 'Session utilisateur ouverte');
    toast.success(`Session ouverte: ${user.username}`);
  }, []);

  const logout = useCallback(async () => {
    if (currentUser) {
      await addAuditLog(currentUser.id, currentUser.username, 'LOGOUT', 'SYSTEM', currentUser.id, 'Session fermée');
    }
    setCurrentUser(null);
    localStorage.removeItem('vi_erp_user');
    setActiveTab('dashboard');
    toast.info('Session terminée');
  }, [currentUser]);

  const registerUser = useCallback(async (user: User) => {
    const existing = await db.users.where('username').equals(user.username).first();
    if (existing) {
      toast.error('Pseudo déjà pris');
      return false;
    }
    await db.users.add(user);
    toast.success(`Compte créé !`);
    return true;
  }, []);

  const updateSettings = useCallback((newSettings: SystemSettings) => {
    setSettings(newSettings);
    localStorage.setItem('vi_erp_settings', JSON.stringify(newSettings));
    toast.success('Paramètres système mis à jour');
  }, []);

  const addUser = useCallback(async (user: User) => {
    if (currentUser?.role !== 'admin') return;
    await db.users.add(user);
    toast.success(`Accès créé pour ${user.username}`);
  }, [currentUser]);

  const deleteUser = useCallback(async (id: string) => {
    if (currentUser?.role !== 'admin') return;
    await db.users.delete(id);
    toast.success('Utilisateur supprimé');
  }, [currentUser]);

  const exportBackup = useCallback(async () => {
    try {
      const data = await db.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_erp_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Sauvegarde exportée');
    } catch (e) {
      toast.error('Échec export');
    }
  }, []);

  const importBackup = useCallback(async (file: File) => {
    if (currentUser?.role !== 'admin') return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await db.importData(content);
        toast.success('Données restaurées');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error('Fichier invalide');
      }
    };
    reader.readAsText(file);
  }, [currentUser]);

  const convertAmount = useCallback((amount: number, from: string, to: string) => {
    if (from === to) return amount;
    // The rates stored are: 1 Base (settings.currency) = X unit of local currency
    // So to convert FROM base currency TO local currency: amount * rates[to]
    // To convert FROM local currency TO base currency: amount / rates[from]
    // General formula: (amount / rates[from]) * rates[to]
    const fromRate = settings.exchangeRates[from] || 1;
    const toRate = settings.exchangeRates[to] || 1;
    return (amount / fromRate) * toRate;
  }, [settings.exchangeRates]);

  const formatAmount = useCallback((amount: number, fromCurrency: string = 'CDF', targetCurrency?: string) => {
    const toCurrency = targetCurrency || settings.currency;
    const converted = convertAmount(amount, fromCurrency, toCurrency);
    const rounded = Number(converted.toFixed(2));
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: toCurrency,
        minimumFractionDigits: (toCurrency === 'CDF' || toCurrency === 'XAF' || toCurrency === 'XOF') ? 0 : 2,
      }).format(rounded);
    } catch (e) {
      // Fallback for unsupported currencies in Intl
      return `${rounded.toLocaleString('fr-FR')} ${toCurrency}`;
    }
  }, [settings.currency, convertAmount]);

  const getBusinessHealth = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = sales.filter(s => new Date(s.date) >= thirtyDaysAgo);
    const revenue30d = recentSales.reduce((acc, s) => acc + s.totalTTC, 0);
    const today = new Date();
    const expiredLoss = products
      .filter(p => p.expiryDate && new Date(p.expiryDate) < today)
      .reduce((acc, p) => acc + (p.purchasePrice * p.stock), 0);
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.purchasePrice * p.stock), 0);
    const sortedByValue = [...products].sort((a, b) => (b.purchasePrice * b.stock) - (a.purchasePrice * a.stock));
    let cumulativeValue = 0;
    const abcAnalysis = sortedByValue.map(p => {
      cumulativeValue += (p.purchasePrice * p.stock);
      const percentage = (cumulativeValue / (totalInventoryValue || 1)) * 100;
      let category = percentage <= 70 ? 'A' : percentage <= 90 ? 'B' : 'C';
      return { id: p.id, category };
    });
    return { revenue30d, expiredLoss, totalInventoryValue, abcAnalysis };
  }, [products, sales]);

  const value = {
    products, customers, sales, users, expenses, purchases, suppliers, auditLogs,
    activeTab, setActiveTab, currentUser, settings, isLoading,
    addProduct, updateProduct, deleteProduct, addCustomer, updateCustomer, completeSale,
    login, logout, registerUser, updateSettings, refreshExchangeRates,
    convertAmount, formatAmount, getBusinessHealth, addUser, deleteUser,
    exportBackup, importBackup,
    addExpense: async (expense: Expense) => {
      await db.expenses.add(expense);
      toast.success('Dépense enregistrée');
    },
    addPurchase: async (purchase: Purchase) => {
      await db.transaction('rw', db.purchases, db.products, async () => {
        await db.purchases.add(purchase);
        for (const item of purchase.items) {
          const product = await db.products.get(item.id);
          if (product) await db.products.update(item.id, { stock: product.stock + item.quantity });
        }
      });
      toast.success('Stock augmenté');
    },
    addSupplier: async (supplier: Supplier) => { await db.suppliers.add(supplier); toast.success('Fournisseur ajouté'); },
    updateSupplier: async (supplier: Supplier) => { await db.suppliers.put(supplier); toast.success('Fournisseur mis à jour'); },
    deleteSupplier: async (id: string) => { await db.suppliers.delete(id); toast.success('Fournisseur supprimé'); },
  };

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

export const useERPContext = () => {
  const context = useContext(ERPContext);
  if (context === undefined) {
    throw new Error('useERPContext must be used within an ERPProvider');
  }
  return context;
};
