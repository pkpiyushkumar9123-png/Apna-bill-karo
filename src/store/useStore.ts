import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Invoice, Customer, Product, BusinessProfile, AppSettings } from '../types.ts';
import { dbService } from '../services/db.ts';

interface AppState {
  invoices: Invoice[];
  customers: Customer[];
  products: Product[];
  profile: BusinessProfile | null;
  settings: AppSettings;
  isLoading: boolean;

  // Actions
  init: () => Promise<void>;
  
  // Invoice Actions
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Customer Actions
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Product Actions
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Profile Actions
  updateProfile: (profile: BusinessProfile) => Promise<void>;
  
  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  invoices: [],
  customers: [],
  products: [],
  profile: null,
  settings: {
    theme: 'dark',
    accentColor: '#FF4444',
    language: 'en',
    currencyDefault: 'INR',
    density: 'comfortable',
  },
  isLoading: true,

  init: async () => {
    set({ isLoading: true });
    try {
      let [invoices, customers, products, profiles, settings] = await Promise.all([
        dbService.getAll<Invoice>('invoices'),
        dbService.getAll<Customer>('customers'),
        dbService.getAll<Product>('products'),
        dbService.getAll<BusinessProfile>('profiles'),
        dbService.getById<AppSettings & { id: string }>('settings', 'main'),
      ]);

      // Ensure mock data matches the theme and is saved if it's the first run
      if (customers.length === 0) {
        customers = [
          { id: 'c1', name: 'Alex Rivera', email: 'alex@nebula.com', companyName: 'Nebula Creative', address: 'San Francisco, CA', createdAt: Date.now() },
          { id: 'c2', name: 'Sarah Chen', email: 'sarah@zenith.io', companyName: 'Zenith Labs', address: 'Austin, TX', createdAt: Date.now() },
        ];
        for (const c of customers) await dbService.put('customers', c);
      }

      if (products.length === 0) {
        products = [
          { id: 'p1', name: 'Brand Strategy', price: 2500, taxRate: 15, unit: 'Project', category: 'Consulting', createdAt: Date.now() },
          { id: 'p2', name: 'UI/UX Design', price: 150, taxRate: 10, unit: 'Hour', category: 'Design', createdAt: Date.now() },
        ];
        for (const p of products) await dbService.put('products', p);
      }

      // Handle Profile Persistence
      let profile = profiles[0];
      if (!profile) {
        profile = {
          id: 'default',
          name: 'apna-bill-karo',
          email: 'hello@apnabillkaro.com',
          currency: 'INR',
          address: 'Your Business Address, India',
          website: 'www.apna-bill-karo.com',
          phone: '+91 99999 00000',
          logoUrl: '/logo.png'
        };
        await dbService.put('profiles', profile);
      }

      // Handle Settings Persistence
      if (!settings) {
        settings = { ...get().settings, id: 'main' };
        await dbService.put('settings', settings);
      }

      set({
        invoices,
        customers,
        products,
        profile,
        settings: { ...get().settings, ...settings },
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ isLoading: false });
    }
  },

  addInvoice: async (invoice) => {
    await dbService.put('invoices', invoice);
    set((state) => ({ invoices: [...state.invoices, invoice] }));
  },
  updateInvoice: async (invoice) => {
    await dbService.put('invoices', invoice);
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === invoice.id ? invoice : inv)),
    }));
  },
  deleteInvoice: async (id) => {
    await dbService.delete('invoices', id);
    set((state) => ({
      invoices: state.invoices.filter((inv) => inv.id !== id),
    }));
  },

  addCustomer: async (customer) => {
    await dbService.put('customers', customer);
    set((state) => ({ customers: [...state.customers, customer] }));
  },
  updateCustomer: async (customer) => {
    await dbService.put('customers', customer);
    set((state) => ({
      customers: state.customers.map((c) => (c.id === customer.id ? customer : c)),
    }));
  },
  deleteCustomer: async (id) => {
    await dbService.delete('customers', id);
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    }));
  },

  addProduct: async (product) => {
    await dbService.put('products', product);
    set((state) => ({ products: [...state.products, product] }));
  },
  updateProduct: async (product) => {
    await dbService.put('products', product);
    set((state) => ({
      products: state.products.map((p) => (p.id === product.id ? product : p)),
    }));
  },
  deleteProduct: async (id) => {
    await dbService.delete('products', id);
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  updateProfile: async (profile) => {
    await dbService.put('profiles', profile);
    set({ profile });
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    await dbService.put('settings', { ...updated, id: 'main' });
    set({ settings: updated });
  },
}));
