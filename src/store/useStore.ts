import { create } from 'zustand';
import { Invoice, Customer, Product, BusinessProfile, AppSettings } from '../types.ts';
import { dbService } from '../services/db.ts';
import { WorkspaceService } from '../services/workspaceService.ts';

interface AppState {
  invoices: Invoice[];
  customers: Customer[];
  products: Product[];
  profile: BusinessProfile | null;
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  
  // Workspace State
  workspaceConnected: boolean;
  workspaceName: string | null;
  needsPermission: boolean;

  // Actions
  init: () => Promise<void>;
  connectWorkspace: () => Promise<void>;
  requestWorkspacePermission: () => Promise<void>;
  disconnectWorkspace: () => void;
  
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
  isSaving: false,
  workspaceConnected: false,
  workspaceName: null,
  needsPermission: false,

  init: async () => {
    set({ isLoading: true });
    try {
      // 1. Try to restore workspace
      const restoredName = await WorkspaceService.restore();
      if (restoredName) {
        set({ workspaceConnected: true, workspaceName: restoredName });
      } else {
        // Check if handle exists but needs permission
        const needsPerm = !!(await WorkspaceService.restore() === null); 
        // This is simplified, if restore fails it might just be the first time
      }

      // 2. Load from Excel if connected, otherwise IndexedDB
      let [invoices, customers, products, profiles, settings] = await Promise.all([
        get().workspaceConnected ? WorkspaceService.loadData<Invoice>('invoices') : dbService.getAll<Invoice>('invoices'),
        get().workspaceConnected ? WorkspaceService.loadData<Customer>('customers') : dbService.getAll<Customer>('customers'),
        get().workspaceConnected ? WorkspaceService.loadData<Product>('products') : dbService.getAll<Product>('products'),
        get().workspaceConnected ? WorkspaceService.loadData<BusinessProfile>('businesses') : dbService.getAll<BusinessProfile>('profiles'),
        get().workspaceConnected ? WorkspaceService.loadSettings() : dbService.getById<AppSettings & { id: string }>('settings', 'main'),
      ]);

      // If we loaded from Excel, sync to IndexedDB (as cache)
      if (get().workspaceConnected) {
        for (const i of invoices) await dbService.put('invoices', i);
        for (const c of customers) await dbService.put('customers', c);
        for (const p of products) await dbService.put('products', p);
        if (profiles[0]) await dbService.put('profiles', profiles[0]);
      }

      // Handle Defaults if empty
      if (customers.length === 0 && !get().workspaceConnected) {
        customers = [
          { id: 'c1', name: 'Alex Rivera', email: 'alex@nebula.com', companyName: 'Nebula Creative', address: 'San Francisco, CA', createdAt: Date.now() },
          { id: 'c2', name: 'Sarah Chen', email: 'sarah@zenith.io', companyName: 'Zenith Labs', address: 'Austin, TX', createdAt: Date.now() },
        ];
      }

      if (products.length === 0 && !get().workspaceConnected) {
        products = [
          { id: 'p1', name: 'Brand Strategy', price: 2500, taxRate: 15, unit: 'Project', category: 'Consulting', createdAt: Date.now() },
          { id: 'p2', name: 'UI/UX Design', price: 150, taxRate: 10, unit: 'Hour', category: 'Design', createdAt: Date.now() },
        ];
      }

      let profile = profiles[0] || null;
      if (!profile && !get().workspaceConnected) {
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
      }

      set({
        invoices,
        customers,
        products,
        profile,
        settings: settings ? { ...get().settings, ...settings } : get().settings,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ isLoading: false });
    }
  },

  connectWorkspace: async () => {
    try {
      const name = await WorkspaceService.connect();
      set({ workspaceConnected: true, workspaceName: name });
      await get().init(); // Reload data from new workspace
    } catch (err) {
      console.error('Workspace connection failed', err);
    }
  },

  requestWorkspacePermission: async () => {
    const granted = await WorkspaceService.requestPermission();
    if (granted) {
      set({ needsPermission: false, workspaceConnected: true });
      await get().init();
    }
  },

  disconnectWorkspace: () => {
    WorkspaceService.disconnect();
    set({ workspaceConnected: false, workspaceName: null });
    // Keep data in cache (IndexedDB)
  },

  addInvoice: async (invoice) => {
    set({ isSaving: true });
    const newInvoices = [...get().invoices, invoice];
    set({ invoices: newInvoices });
    await dbService.put('invoices', invoice);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('invoices', newInvoices);
    }
    set({ isSaving: false });
  },

  updateInvoice: async (invoice) => {
    set({ isSaving: true });
    const newInvoices = get().invoices.map((inv) => (inv.id === invoice.id ? invoice : inv));
    set({ invoices: newInvoices });
    await dbService.put('invoices', invoice);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('invoices', newInvoices);
    }
    set({ isSaving: false });
  },

  deleteInvoice: async (id) => {
    set({ isSaving: true });
    const newInvoices = get().invoices.filter((inv) => inv.id !== id);
    set({ invoices: newInvoices });
    await dbService.delete('invoices', id);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('invoices', newInvoices);
    }
    set({ isSaving: false });
  },

  addCustomer: async (customer) => {
    set({ isSaving: true });
    const newItems = [...get().customers, customer];
    set({ customers: newItems });
    await dbService.put('customers', customer);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('customers', newItems);
    }
    set({ isSaving: false });
  },

  updateCustomer: async (customer) => {
    set({ isSaving: true });
    const newItems = get().customers.map((c) => (c.id === customer.id ? customer : c));
    set({ customers: newItems });
    await dbService.put('customers', customer);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('customers', newItems);
    }
    set({ isSaving: false });
  },

  deleteCustomer: async (id) => {
    set({ isSaving: true });
    const newItems = get().customers.filter((c) => c.id !== id);
    set({ customers: newItems });
    await dbService.delete('customers', id);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('customers', newItems);
    }
    set({ isSaving: false });
  },

  addProduct: async (product) => {
    set({ isSaving: true });
    const newItems = [...get().products, product];
    set({ products: newItems });
    await dbService.put('products', product);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('products', newItems);
    }
    set({ isSaving: false });
  },

  updateProduct: async (product) => {
    set({ isSaving: true });
    const newItems = get().products.map((p) => (p.id === product.id ? product : p));
    set({ products: newItems });
    await dbService.put('products', product);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('products', newItems);
    }
    set({ isSaving: false });
  },

  deleteProduct: async (id) => {
    set({ isSaving: true });
    const newItems = get().products.filter((p) => p.id !== id);
    set({ products: newItems });
    await dbService.delete('products', id);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('products', newItems);
    }
    set({ isSaving: false });
  },

  updateProfile: async (profile) => {
    set({ isSaving: true });
    set({ profile });
    await dbService.put('profiles', profile);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('businesses', [profile]);
    }
    set({ isSaving: false });
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated, isSaving: true });
    await dbService.put('settings', { ...updated, id: 'main' });
    if (get().workspaceConnected) {
      await WorkspaceService.saveSettings(updated);
    }
    set({ isSaving: false });
  },
}));
