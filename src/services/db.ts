import { openDB, IDBPDatabase } from 'idb';
import { Invoice, Customer, Product, BusinessProfile, AppSettings, Expense } from '../types.ts';

const DB_NAME = 'novabill_db';
const DB_VERSION = 2; // Increment version for new store

export interface NovaBillDB {
  invoices: Invoice;
  customers: Customer;
  products: Product;
  profiles: BusinessProfile;
  settings: AppSettings & { id: string };
  expenses: Expense;
}

export async function initDB(): Promise<IDBPDatabase<any>> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('invoices')) {
        db.createObjectStore('invoices', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('expenses')) {
        db.createObjectStore('expenses', { keyPath: 'id' });
      }
    },
  });
}

export const dbService = {
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await initDB();
    return db.getAll(storeName);
  },
  async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await initDB();
    return db.get(storeName, id);
  },
  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await initDB();
    await db.put(storeName, data);
  },
  async delete(storeName: string, id: string): Promise<void> {
    const db = await initDB();
    await db.delete(storeName, id);
  },
  async clear(storeName: string): Promise<void> {
    const db = await initDB();
    await db.clear(storeName);
  },
};
