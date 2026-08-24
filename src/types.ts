export interface Product {
  id: string;
  reference: string;
  name: string;
  brand?: string;
  purchasePrice: number;
  priceHT: number;
  tva: number;
  priceTTC: number;
  stock: number;
  minStock: number;
  category: string;
  expiryDate?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  balance: number; // For credit management
  loyaltyPoints: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  customerId?: string;
  items: CartItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'mobile_money' | 'credit';
}

export interface Purchase {
  id: string;
  supplierId: string;
  items: CartItem[];
  totalAmount: number;
  date: string;
  status: 'ordered' | 'received' | 'cancelled';
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  category: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'manager' | 'cashier';
  email?: string;
  photoURL?: string;
  authProvider?: 'local' | 'google';
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod?: string;
}

export interface ReturnRecord {
  id: string;
  saleId: string;
  items: CartItem[];
  reason: string;
  timestamp: string;
}

export interface Promotion {
  id: string;
  name: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  status: 'active' | 'expired';
}

export interface ExchangeRate {
  code: string;
  rate: number;
}

export interface SystemSettings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  numNIF: string; // Tax ID
  currency: string;
  defaultTva: number;
  logoUrl?: string;
  exchangeRates: Record<string, number>;
  lastExchangeRateUpdate?: string;
  thermalPrinterWidth?: '80mm' | '58mm';
  thermalAutoPrint?: boolean;
  thermalReceiptFooter?: string;
  thermalReceiptHeader?: string;
  thermalCopies?: number;
  thermalShowBarcode?: boolean;
  thermalShowTVA?: boolean;
  thermalShowLogo?: boolean;
  aiInsight?: {
    title: string;
    analysis: string;
    recommendation: string;
    riskLevel: 'low' | 'medium' | 'high';
    trend: 'up' | 'down' | 'stable';
    timestamp: string;
  };
}
