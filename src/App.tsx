import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore.ts';
import { Layout } from './components/Layout.tsx';

// Lazy load pages for performance
import { Dashboard } from './pages/Dashboard.tsx';
import { Invoices } from './pages/Invoices.tsx';
import { InvoiceEditor } from './pages/InvoiceEditor.tsx';
import { Customers } from './pages/Customers.tsx';
import { Products } from './pages/Products.tsx';
import { Expenses } from './pages/Expenses.tsx';
import { Reports } from './pages/Reports.tsx';
import { Settings } from './pages/Settings.tsx';
import { Templates } from './pages/Templates.tsx';

export default function App() {
  const init = useStore((state) => state.init);
  const isLoading = useStore((state) => state.isLoading);
  const profile = useStore((state) => state.profile);

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted text-sm font-medium tracking-widest uppercase">Initializing NovaBill</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Protected Routes (Pseudo-protected by Guest Mode) */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/invoices" element={<Layout><Invoices /></Layout>} />
        <Route path="/invoices/new" element={<Layout><InvoiceEditor /></Layout>} />
        <Route path="/invoices/:id" element={<Layout><InvoiceEditor /></Layout>} />
        <Route path="/customers" element={<Layout><Customers /></Layout>} />
        <Route path="/products" element={<Layout><Products /></Layout>} />
        <Route path="/expenses" element={<Layout><Expenses /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/templates" element={<Layout><Templates /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
