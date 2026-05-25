import { create } from 'zustand';
import { Invoice, Customer, Product, BusinessProfile, AppSettings, Expense } from '../types.ts';
import { dbService } from '../services/db.ts';
import { WorkspaceService } from '../services/workspaceService.ts';

interface AppState {
  invoices: Invoice[];
  customers: Customer[];
  products: Product[];
  expenses: Expense[];
  profile: BusinessProfile | null;
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  
  // Workspace State
  workspaceConnected: boolean;
  workspaceName: string | null;
  workspaceError: string | null;
  needsPermission: boolean;

  // Google Drive Status/Sync State
  gdriveSyncEnabled: boolean;
  isSyncingCloud: boolean;
  lastSyncFingerprint: string | null;
  lastSyncTime: number | null;
  lastSyncResult: 'idle' | 'syncing' | 'success' | 'failed';

  // Actions
  init: () => Promise<void>;
  connectWorkspace: (mode?: 'new' | 'existing') => Promise<void>;
  connectDriveWorkspace: () => Promise<void>;
  requestWorkspacePermission: () => Promise<void>;
  disconnectWorkspace: () => void;
  setGdriveSyncEnabled: (enabled: boolean) => void;
  syncCloudData: (force?: boolean) => Promise<void>;
  postSync: () => Promise<void>;
  
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

  // Expense Actions
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Profile Actions
  updateProfile: (profile: BusinessProfile) => Promise<void>;
  
  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  invoices: [],
  customers: [],
  products: [],
  expenses: [],
  profile: null,
  settings: {
    theme: 'dark',
    accentColor: '#FF4444',
    language: 'en',
    currencyDefault: 'INR',
    density: 'comfortable',
    autoBackup: true,
  },
  isLoading: true,
  isSaving: false,
  workspaceConnected: false,
  workspaceName: null,
  workspaceError: null,
  needsPermission: false,
  gdriveSyncEnabled: localStorage.getItem('novabill_gdrive_sync_enabled') !== 'false',
  isSyncingCloud: false,
  lastSyncFingerprint: null,
  lastSyncTime: null,
  lastSyncResult: 'idle',

  init: async () => {
    set({ isLoading: true });
    try {
      // 1. Try to restore workspace
      const restored = await WorkspaceService.restore();
      if (restored) {
        set({ 
          workspaceConnected: true, 
          workspaceName: restored.name,
          needsPermission: restored.needsPermission
        });
      }

      // 2. Load from Excel if connected and permission is granted, otherwise IndexedDB
      let invoices: Invoice[] = [];
      let customers: Customer[] = [];
      let products: Product[] = [];
      let expenses: Expense[] = [];
      let settings: (AppSettings & { profile?: BusinessProfile }) | null = null;

      if (get().workspaceConnected && !get().needsPermission) {
        const [invRes, custRes, prodRes, expRes, setRes, fp] = await Promise.all([
          WorkspaceService.loadData<Invoice>('invoices'),
          WorkspaceService.loadData<Customer>('customers'),
          WorkspaceService.loadData<Product>('products'),
          WorkspaceService.loadData<Expense>('expenses'),
          WorkspaceService.loadSettings(),
          WorkspaceService.getDriveFingerprint()
        ]);
        invoices = invRes;
        customers = custRes;
        products = prodRes;
        expenses = expRes;
        settings = setRes;
        if (fp) {
          set({ lastSyncFingerprint: fp, lastSyncTime: Date.now() });
        }
      } else {
        [invoices, customers, products, expenses, settings] = await Promise.all([
          dbService.getAll<Invoice>('invoices'),
          dbService.getAll<Customer>('customers'),
          dbService.getAll<Product>('products'),
          dbService.getAll<Expense>('expenses'),
          dbService.getById<AppSettings>('settings', 'main'),
        ]);
      }

      // If we loaded from Excel, sync to IndexedDB (as cache)
      if (get().workspaceConnected && !get().needsPermission) {
        for (const i of invoices) await dbService.put('invoices', i);
        for (const c of customers) await dbService.put('customers', c);
        for (const p of products) await dbService.put('products', p);
        for (const e of expenses) await dbService.put('expenses', e);
        if (settings?.profile) await dbService.put('profiles', settings.profile);
      }

      // Handle Defaults if empty
      // ... (rest of defaults) ...

      let profileFromDb = (await dbService.getAll<BusinessProfile>('profiles'))[0];
      let profile = settings?.profile || profileFromDb || null;

      if (!profile) {
        profile = {
          id: 'default',
          name: 'NovaBill Business',
          email: 'hello@novabill.app',
          currency: 'INR',
          address: 'Your Business Address',
          website: 'www.novabill.app',
          phone: '+91 00000 00000',
          logoUrl: ''
        };
        // Persist default profile if it didn't exist
        await dbService.put('profiles', profile);
      }

      set({
        invoices,
        customers,
        products,
        expenses,
        profile,
        settings: settings ? { ...get().settings, theme: settings.theme || get().settings.theme } : get().settings,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ isLoading: false });
    }
  },

  connectWorkspace: async (mode?: 'new' | 'existing') => {
    set({ workspaceError: null });
    try {
      const name = await WorkspaceService.connect();
      set({ workspaceConnected: true, workspaceName: name, workspaceError: null });

      if (mode === 'new') {
        const type = localStorage.getItem('novabill_workspace_type');
        if (type === 'local') {
          await Promise.all([
            WorkspaceService.syncData('invoices', get().invoices),
            WorkspaceService.syncData('customers', get().customers),
            WorkspaceService.syncData('products', get().products),
            WorkspaceService.syncData('expenses', get().expenses),
            WorkspaceService.saveSettings({ 
              theme: 'dark', 
              accentColor: '#FF4444', 
              density: 'comfortable', 
              language: 'en', 
              currencyDefault: 'INR', 
              autoBackup: true, 
              profile: get().profile || undefined 
            })
          ]);
        }
      }

      await get().init(); 
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Workspace connection failed', err);
      set({ workspaceError: err.message || 'Workspace connection failed' });
    }
  },

  connectDriveWorkspace: async () => {
    set({ workspaceError: null });
    try {
      const name = await WorkspaceService.connectDrive();
      set({ workspaceConnected: true, workspaceName: name, needsPermission: false, workspaceError: null });
      await get().init(); 
    } catch (err: any) {
      console.error('Google Drive workspace connection failed', err);
      let userFriendlyMsg = err.message || 'Google Drive connection failed';
      if (userFriendlyMsg.includes('auth/popup-closed-by-user')) {
        userFriendlyMsg = 'The authentication popup was closed. Please follow these steps to proceed:\n1. Enable popups and third-party cookies in your browser settings.\n2. Click "Open in New Tab" in the top right window to bypass iframe restriction completely.';
      } else if (userFriendlyMsg.includes('auth/cancelled-popup-request')) {
        userFriendlyMsg = 'The popup sign-in request was cancelled. Please make sure that popups are not blocked and retry.';
      } else if (userFriendlyMsg.includes('auth/unauthorized-domain') || userFriendlyMsg.toLowerCase().includes('unauthorized-domain')) {
        userFriendlyMsg = `Domain Authorization Required (unauthorized-domain):\nYour deployed domain ${window.location.hostname} must be added to the Firebase Console Authorized Domains list.`;
      }
      set({ workspaceError: userFriendlyMsg });
    }
  },

  requestWorkspacePermission: async () => {
    set({ workspaceError: null });
    try {
      const granted = await WorkspaceService.requestPermission();
      if (granted) {
        set({ needsPermission: false, workspaceConnected: true, workspaceError: null });
        await get().init();
      } else {
        set({ workspaceError: 'Permission was not granted to the workspace.' });
      }
    } catch (err: any) {
      set({ workspaceError: err.message || 'Permission request failed' });
    }
  },

  disconnectWorkspace: () => {
    WorkspaceService.disconnect();
    set({ workspaceConnected: false, workspaceName: null, needsPermission: false, workspaceError: null });
  },

  setGdriveSyncEnabled: (enabled: boolean) => {
    localStorage.setItem('novabill_gdrive_sync_enabled', String(enabled));
    set({ gdriveSyncEnabled: enabled });
  },

  syncCloudData: async (force = false) => {
    const type = localStorage.getItem('novabill_workspace_type');
    if (type !== 'gdrive' || get().needsPermission || !get().workspaceConnected) return;

    // Fetch the fingerprint
    const currentFingerprint = await WorkspaceService.getDriveFingerprint();
    if (!currentFingerprint) return;

    // Check if anything changed
    if (!force && get().lastSyncFingerprint === currentFingerprint) {
      return;
    }

    set({ isSyncingCloud: true, lastSyncResult: 'syncing' });
    try {
      // Clear local IndexedDB tables to prevent duplicate / zombie records
      await Promise.all([
        dbService.clear('invoices'),
        dbService.clear('customers'),
        dbService.clear('products'),
        dbService.clear('expenses')
      ]);

      const [invoices, customers, products, expenses, settings] = await Promise.all([
        WorkspaceService.loadData<Invoice>('invoices'),
        WorkspaceService.loadData<Customer>('customers'),
        WorkspaceService.loadData<Product>('products'),
        WorkspaceService.loadData<Expense>('expenses'),
        WorkspaceService.loadSettings(),
      ]);

      // Cache records into local DB
      for (const i of invoices) await dbService.put('invoices', i);
      for (const c of customers) await dbService.put('customers', c);
      for (const p of products) await dbService.put('products', p);
      for (const e of expenses) await dbService.put('expenses', e);
      if (settings?.profile) {
        await dbService.put('profiles', settings.profile);
      }

      const profileFromDb = (await dbService.getAll<BusinessProfile>('profiles'))[0];
      const profile = settings?.profile || profileFromDb || get().profile;

      set({
        invoices,
        customers,
        products,
        expenses,
        profile,
        settings: settings ? { ...get().settings, theme: settings.theme || get().settings.theme } : get().settings,
        lastSyncFingerprint: currentFingerprint,
        lastSyncTime: Date.now(),
        lastSyncResult: 'success'
      });
    } catch (err) {
      console.error('Failed to auto-sync Google Drive cloud:', err);
      set({ lastSyncResult: 'failed' });
    } finally {
      // Reset result after a short delay
      setTimeout(() => {
        set({ lastSyncResult: 'idle' });
      }, 3000);
      set({ isSyncingCloud: false });
    }
  },

  postSync: async () => {
    if (get().workspaceConnected) {
      try {
        const fp = await WorkspaceService.getDriveFingerprint();
        if (fp) {
          set({ lastSyncFingerprint: fp, lastSyncTime: Date.now() });
        }
      } catch (err) {
        console.error('Failed to postSync fingerprint update:', err);
      }
    }
  },

  addInvoice: async (invoice) => {
    set({ isSaving: true });
    
    // Inventory Auto-Deduction ONLY if paid
    const currentProducts = [...get().products];
    const touchedIds = new Set<string>();
    
    if (invoice.status === 'paid') {
      invoice.items.forEach(item => {
        const prodId = item.productId || currentProducts.find(p => p.name === item.description)?.id;
        if (prodId) {
          const idx = currentProducts.findIndex(p => p.id === prodId);
          if (idx !== -1) {
            currentProducts[idx] = { 
              ...currentProducts[idx], 
              stockLevel: Math.max(0, currentProducts[idx].stockLevel - item.quantity) 
            };
            touchedIds.add(prodId as string);
          }
        }
      });
    }

    const newInvoices = [...get().invoices, invoice];
    set({ invoices: newInvoices, products: currentProducts });
    
    const productUpdates = Array.from(touchedIds).map(id => currentProducts.find(p => p.id === id)!);

    await Promise.all([
      dbService.put('invoices', invoice),
      ...productUpdates.map(p => dbService.put('products', p))
    ]);

    if (get().workspaceConnected) {
      await Promise.all([
        WorkspaceService.syncData('invoices', newInvoices),
        WorkspaceService.syncData('products', currentProducts)
      ]);
      await get().postSync();
    }
    set({ isSaving: false });
  },

  updateInvoice: async (invoice) => {
    set({ isSaving: true });
    const oldInvoice = get().invoices.find(inv => inv.id === invoice.id);
    const products = [...get().products];
    const touchedIds = new Set<string>();

    // Inventory status change check
    const wasPaid = oldInvoice?.status === 'paid';
    const isPaid = invoice.status === 'paid';

    if (oldInvoice) {
      // 1. If it WAS paid, return old items to physical stock first
      if (wasPaid) {
        oldInvoice.items.forEach(item => {
          const prodId = item.productId || products.find(p => p.name === item.description)?.id;
          if (prodId) {
            const idx = products.findIndex(p => p.id === prodId);
            if (idx !== -1) {
              products[idx] = { 
                ...products[idx], 
                stockLevel: products[idx].stockLevel + item.quantity 
              };
              touchedIds.add(prodId as string);
            }
          }
        });
      }

      // 2. If it IS NOW paid, subtract new items from physical stock
      if (isPaid) {
        invoice.items.forEach(item => {
          const prodId = item.productId || products.find(p => p.name === item.description)?.id;
          if (prodId) {
            const idx = products.findIndex(p => p.id === prodId);
            if (idx !== -1) {
              products[idx] = { 
                ...products[idx], 
                stockLevel: Math.max(0, products[idx].stockLevel - item.quantity) 
              };
              touchedIds.add(prodId as string);
            }
          }
        });
      }
    }

    const newInvoices = get().invoices.map((inv) => (inv.id === invoice.id ? invoice : inv));
    set({ invoices: newInvoices, products });

    const productUpdates = Array.from(touchedIds).map(id => products.find(p => p.id === id)!);

    await Promise.all([
      dbService.put('invoices', invoice),
      ...productUpdates.map(p => dbService.put('products', p))
    ]);

    if (get().workspaceConnected) {
      await Promise.all([
        WorkspaceService.syncData('invoices', newInvoices),
        WorkspaceService.syncData('products', products)
      ]);
      await get().postSync();
    }
    set({ isSaving: false });
  },

  deleteInvoice: async (id) => {
    set({ isSaving: true });
    const invoice = get().invoices.find(inv => inv.id === id);
    const products = [...get().products];
    const touchedIds = new Set<string>();

    if (invoice && invoice.status === 'paid') {
      // Return items to physical stock only if they were deducted (was paid)
      invoice.items.forEach(item => {
        const prodId = item.productId || products.find(p => p.name === item.description)?.id;
        if (prodId) {
          const idx = products.findIndex(p => p.id === prodId);
          if (idx !== -1) {
            products[idx] = { 
              ...products[idx], 
              stockLevel: products[idx].stockLevel + item.quantity 
            };
            touchedIds.add(prodId as string);
          }
        }
      });
    }

    const newInvoices = get().invoices.filter((inv) => inv.id !== id);
    set({ invoices: newInvoices, products });

    const productUpdates = Array.from(touchedIds).map(id => products.find(p => p.id === id)!);

    await Promise.all([
      dbService.delete('invoices', id),
      ...productUpdates.map(p => dbService.put('products', p))
    ]);

    if (get().workspaceConnected) {
      await Promise.all([
        WorkspaceService.syncData('invoices', newInvoices),
        WorkspaceService.syncData('products', products)
      ]);
      await get().postSync();
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
      await get().postSync();
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
      await get().postSync();
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
      await get().postSync();
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
      await get().postSync();
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
      await get().postSync();
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
      await get().postSync();
    }
    set({ isSaving: false });
  },

  addExpense: async (expense) => {
    set({ isSaving: true });
    const newItems = [...get().expenses, expense];
    set({ expenses: newItems });
    await dbService.put('expenses', expense);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('expenses', newItems);
      await get().postSync();
    }
    set({ isSaving: false });
  },

  updateExpense: async (expense) => {
    set({ isSaving: true });
    const newItems = get().expenses.map((e) => (e.id === expense.id ? expense : e));
    set({ expenses: newItems });
    await dbService.put('expenses', expense);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('expenses', newItems);
      await get().postSync();
    }
    set({ isSaving: false });
  },

  deleteExpense: async (id) => {
    set({ isSaving: true });
    const newItems = get().expenses.filter((e) => e.id !== id);
    set({ expenses: newItems });
    await dbService.delete('expenses', id);
    if (get().workspaceConnected) {
      await WorkspaceService.syncData('expenses', newItems);
      await get().postSync();
    }
    set({ isSaving: false });
  },

  updateProfile: async (profile) => {
    set({ isSaving: true });
    set({ profile });
    await dbService.put('profiles', profile);
    if (get().workspaceConnected) {
      await WorkspaceService.saveSettings({ ...get().settings, profile });
      await get().postSync();
    }
    set({ isSaving: false });
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated, isSaving: true });
    await dbService.put('settings', { ...updated, id: 'main' });
    if (get().workspaceConnected) {
      await WorkspaceService.saveSettings(updated);
      await get().postSync();
    }
    set({ isSaving: false });
  },
}));
