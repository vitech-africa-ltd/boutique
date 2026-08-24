import Dexie, { type Table } from 'dexie';
import { Product, Sale, Customer, Expense, User, ReturnRecord, Promotion, Purchase, Supplier } from '../types';
import CryptoJS from 'crypto-js';

// Security: Audit Log Entry
export interface AuditLogEntry {
  id?: number;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'STOCK_ADJUSTMENT' | 'REFUND';
  entityType: string;
  entityId: string;
  details: string;
  integrityHash: string; // Hash of the entry to detect tampering
}

export class ERPDatabase extends Dexie {
  products!: Table<Product>;
  sales!: Table<Sale>;
  customers!: Table<Customer>;
  expenses!: Table<Expense>;
  users!: Table<User>;
  returns!: Table<ReturnRecord>;
  promotions!: Table<Promotion>;
  purchases!: Table<Purchase>;
  suppliers!: Table<Supplier>;
  auditLogs!: Table<AuditLogEntry>;

  constructor() {
    super('AfricanERP_ProDB');
    this.version(3).stores({
      products: 'id, reference, name, category, brand',
      sales: 'id, customerId, date, totalTTC, status',
      customers: 'id, name, email, phone',
      expenses: 'id, category, date, amount',
      users: 'id, username, role',
      returns: 'id, saleId, timestamp',
      promotions: 'id, name, code, status',
      purchases: 'id, supplierId, date, status',
      suppliers: 'id, name, category',
      auditLogs: '++id, timestamp, userId, action, entityType'
    });
    this.version(4).stores({
      users: 'id, username, role, email, authProvider'
    });
  }

  // Backup Engine: Export all tables to a single JSON
  async exportData(): Promise<string> {
    const allData: any = {};
    for (const table of this.tables) {
      allData[table.name] = await table.toArray();
    }
    return JSON.stringify(allData, null, 2);
  }

  // Restore Engine: Overwrite current database with imported data
  async importData(jsonContent: string): Promise<void> {
    const data = JSON.parse(jsonContent);
    await this.transaction('rw', this.tables, async () => {
      for (const table of this.tables) {
        if (data[table.name]) {
          await table.clear();
          await table.bulkAdd(data[table.name]);
        }
      }
    });
  }
}

export const db = new ERPDatabase();

// Security Helper: Generate Integrity Hash using SHA-256
export function generateLogHash(entry: Partial<AuditLogEntry>) {
  const data = `${entry.timestamp}-${entry.userId}-${entry.action}-${entry.entityId}-${entry.details}`;
  // Use professional SHA-256 hashing for tamper detection
  return CryptoJS.SHA256(data).toString();
}

// Global Audit Logger
export async function addAuditLog(
  userId: string, 
  userName: string, 
  action: AuditLogEntry['action'], 
  entityType: string, 
  entityId: string, 
  details: string
) {
  const timestamp = new Date().toISOString();
  const log: AuditLogEntry = {
    timestamp,
    userId,
    userName,
    action,
    entityType,
    entityId,
    details,
    integrityHash: generateLogHash({ timestamp, userId, action, entityId, details })
  };
  await db.auditLogs.add(log);
}
