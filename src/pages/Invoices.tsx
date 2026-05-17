import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Copy,
  MoreVertical, 
  Download, 
  Share2, 
  Trash2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  X,
  CreditCard,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../services/pdfService.ts';
import { motion, AnimatePresence } from 'motion/react';

const STATUSES = ['draft', 'pending', 'partial', 'paid', 'overdue'] as const;

const StatusSlider = ({ currentStatus, onUpdate, compact = false, className = '' }: { 
  currentStatus: string, 
  onUpdate: (s: any) => void, 
  compact?: boolean,
  className?: string
}) => {
  return (
    <div 
      className={`relative ${compact ? 'h-8 px-1' : 'h-12 p-1.5'} glass border border-white/10 rounded-2xl flex items-center ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div 
        className={`absolute ${compact ? 'inset-y-1' : 'inset-y-1.5'} rounded-xl bg-primary shadow-lg shadow-primary/20`}
        initial={false}
        animate={{ 
          left: `${(STATUSES.indexOf(currentStatus as any === 'partial' ? 'partial' : currentStatus as any) / STATUSES.length) * 100}%`,
          width: `${100 / STATUSES.length}%`
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      {STATUSES.map((status) => (
        <button
          key={status}
          onClick={() => onUpdate(status)}
          className={`relative z-10 flex-1 h-full font-bold uppercase tracking-widest transition-colors duration-300 ${compact ? 'text-[7px]' : 'text-[10px]'}`}
          style={{ 
            color: currentStatus === status ? 'white' : 'rgba(255,255,255,0.4)' 
          }}
        >
          {status}
        </button>
      ))}
    </div>
  );
};

export const Invoices: React.FC = () => {
  const { invoices, deleteInvoice, addInvoice, updateInvoice, customers, profile } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
  const selectedCustomer = customers.find(c => c.id === selectedInvoice?.customerId);

  const handleDownload = (inv: any) => {
    const customer = customers.find(c => c.id === inv.customerId);
    generateInvoicePDF(inv, profile, customer);
  };

  const exportToCSV = () => {
    if (invoices.length === 0) return;
    
    const headers = ['Invoice Number', 'Client', 'Date', 'Due Date', 'Status', 'Category', 'Total', 'Currency'];
    const rows = invoices.map(inv => [
      inv.number,
      customers.find(c => c.id === inv.customerId)?.name || inv.customerId,
      format(inv.date, 'yyyy-MM-dd'),
      format(inv.dueDate, 'yyyy-MM-dd'),
      inv.status,
      inv.category || '',
      inv.total.toFixed(2),
      inv.currency
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInvoices = invoices.filter(inv => {
    const customer = customers.find(c => c.id === inv.customerId);
    const clientName = customer?.name || '';
    const matchesSearch = inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || inv.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(invoices.map(inv => inv.category).filter(Boolean)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Invoices</h1>
          <p className="text-muted text-sm">Manage and track all your outgoing bills in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2 py-2.5 text-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
          <NavLink to="/invoices/new" className="btn-primary flex items-center gap-2 py-2.5 text-sm">
            <Plus size={18} />
            New Invoice
          </NavLink>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Drafts" count={invoices.filter(i => i.status === 'draft').length} />
        <SummaryCard label="Pending" count={invoices.filter(i => i.status === 'pending').length} highlight="text-yellow-500" />
        <SummaryCard label="Paid" count={invoices.filter(i => i.status === 'paid').length} highlight="text-green-500" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by invoice number or client name..." 
            className="w-full py-3 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select 
            className="input-field py-3 text-sm flex-1 md:w-40 appearance-none bg-background"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <select 
            className="input-field py-3 text-sm flex-1 md:w-40 appearance-none bg-background"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button className="p-3 glass rounded-xl text-muted hover:text-white transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Table / Mobile Cards */}
      <div className="glass-card !p-0 overflow-hidden border-none bg-transparent lg:glass-card lg:!p-0 lg:overflow-hidden lg:border lg:bg-white/5">
        {filteredInvoices.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-xs font-bold uppercase tracking-widest text-muted border-b border-white/5">
                    <th className="px-6 py-4">Invoice</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group relative">
                      <td className="px-6 py-6 cursor-pointer" onClick={() => setSelectedInvoiceId(inv.id)}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/5 shrink-0">
                            <FileText size={24} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold tracking-tight">#{inv.number}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                inv.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                                inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                                inv.status === 'draft' ? 'bg-white/10 text-muted shadow-inner' :
                                'bg-red-500/10 text-red-500'
                              }`}>
                                {inv.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-muted">{customers.find(c => c.id === inv.customerId)?.name || 'Unknown Client'}</p>
                              {inv.category && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-primary/5 text-primary/70 border border-primary/10 uppercase font-black">
                                  {inv.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 border-l border-white/[0.02]">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Update Status</p>
                        <StatusSlider 
                          currentStatus={inv.status} 
                          onUpdate={(status) => updateInvoice({ ...inv, status })}
                          compact
                          className="w-44"
                        />
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-muted">{format(inv.dueDate, 'MMM dd, yyyy')}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black font-mono tracking-tighter">${inv.total.toFixed(2)}</span>
                          {inv.status === 'paid' && <TrendingUp size={14} className="text-green-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={async () => {
                              const newNum = `INV-REF-${Date.now().toString().slice(-4)}`;
                              const newInvoice = { 
                                ...inv, 
                                id: Math.random().toString(36).substr(2, 9), 
                                number: newNum, 
                                date: Date.now(), 
                                createdAt: Date.now(),
                                status: 'draft' 
                              };
                              // @ts-ignore
                              await addInvoice(newInvoice);
                              alert(`Invoice duplicated as ${newNum}`);
                            }}
                            className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-primary transition-all"
                            title="Duplicate Invoice"
                          >
                            <Copy size={18} />
                          </button>
                          <button 
                            onClick={() => handleDownload(inv)}
                            className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-all"
                          >
                            <Download size={18} />
                          </button>
                          <NavLink 
                            to={`/invoices/${inv.id}`} 
                            className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-all"
                          >
                            <ExternalLink size={18} />
                          </NavLink>
                          <button 
                            onClick={() => deleteInvoice(inv.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredInvoices.map((inv) => (
                <div key={inv.id} className="glass-card flex flex-col gap-4 group" onClick={() => setSelectedInvoiceId(inv.id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">#{inv.number}</p>
                        <p className="text-[10px] text-muted">{format(inv.date, 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        inv.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                        inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                        inv.status === 'draft' ? 'bg-white/10 text-muted shadow-inner' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {inv.status}
                      </span>
                      {inv.category && (
                        <span className="text-[7px] px-1.5 py-0.5 rounded-md bg-white/5 text-muted border border-white/5 uppercase font-medium">
                          {inv.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5">
                    <div>
                      <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-lg font-black font-mono tracking-tighter">${inv.total.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Client</p>
                      <p className="text-[11px] font-bold truncate">{customers.find(c => c.id === inv.customerId)?.name || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Update Status</p>
                    <StatusSlider 
                      currentStatus={inv.status} 
                      onUpdate={(status) => updateInvoice({ ...inv, status })}
                      compact
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newNum = `INV-REF-${Date.now().toString().slice(-4)}`;
                          const newInvoice = { 
                            ...inv, 
                            id: Math.random().toString(36).substr(2, 9), 
                            number: newNum, 
                            date: Date.now(), 
                            createdAt: Date.now(),
                            status: 'draft' 
                          };
                          // @ts-ignore
                          await addInvoice(newInvoice);
                        }}
                        className="p-2.5 glass rounded-xl text-muted hover:text-primary"
                        title="Duplicate Invoice"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(inv);
                        }}
                        className="p-2.5 glass rounded-xl text-muted"
                      >
                        <Download size={16} />
                      </button>
                      <NavLink 
                        to={`/invoices/${inv.id}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 glass rounded-xl text-primary"
                      >
                        <ExternalLink size={16} />
                      </NavLink>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteInvoice(inv.id);
                        }}
                        className="p-2.5 glass rounded-xl text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-muted border border-white/5">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">No invoices found</h3>
            <p className="text-muted text-sm mb-8">Try adjusting your search or create a new invoice.</p>
            <NavLink to="/invoices/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} />
              Create Invoice
            </NavLink>
          </div>
        )}
      </div>
      {/* Invoice Management Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoiceId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">Manage Invoice</h3>
                      <p className="text-xs text-muted">#{selectedInvoice.number}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedInvoiceId(null)}
                    className="p-2 rounded-xl hover:bg-white/5 text-muted hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-muted">
                      <User size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Client</span>
                    </div>
                    <p className="text-sm font-bold">{selectedCustomer?.name || 'Unknown'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-muted">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Due Date</span>
                    </div>
                    <p className="text-sm font-bold">{format(selectedInvoice.dueDate, 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-muted">
                      <CreditCard size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Amount</span>
                    </div>
                    <p className="text-sm font-black font-mono tracking-tighter">${selectedInvoice.total.toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-muted">
                      <Hash size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Category</span>
                    </div>
                    <p className="text-sm font-bold">{selectedInvoice.category || 'Uncategorized'}</p>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDownload(selectedInvoice)}
                    className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3"
                  >
                    <Download size={18} />
                    Download
                  </button>
                  <NavLink 
                    to={`/invoices/${selectedInvoice.id}`} 
                    className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    <ExternalLink size={18} />
                    Edit
                  </NavLink>
                </div>

                {/* Payment Recording */}
                {(selectedInvoice.status === 'partial' || selectedInvoice.status === 'paid') && (
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4">
                     <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary">Record Payment</label>
                        <span className="text-[10px] font-mono text-muted">Total: ${selectedInvoice.total.toFixed(2)}</span>
                     </div>
                     <div className="flex gap-3">
                        <div className="relative flex-1">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">$</span>
                           <input 
                              type="number"
                              value={selectedInvoice.paidAmount || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateInvoice({ 
                                  ...selectedInvoice, 
                                  paidAmount: val,
                                  status: val >= selectedInvoice.total ? 'paid' : val > 0 ? 'partial' : selectedInvoice.status 
                                });
                              }}
                              className="input-field w-full pl-8 py-3 text-sm font-black font-mono border-primary/20 focus:border-primary"
                              placeholder="0.00"
                           />
                        </div>
                        <button 
                          onClick={() => updateInvoice({ ...selectedInvoice, paidAmount: selectedInvoice.total, status: 'paid' })}
                          className="px-4 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                        >
                          Full
                        </button>
                     </div>
                     <p className="text-[9px] text-muted italic">This amount will reflect as revenue in your accounting dashboard.</p>
                  </div>
                )}

                {/* Status Slider Container */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Update Status</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      selectedInvoice.status === 'paid' ? 'text-green-500' : 
                      selectedInvoice.status === 'pending' ? 'text-yellow-500' : 
                      selectedInvoice.status === 'draft' ? 'text-muted' :
                      'text-red-500'
                    }`}>{selectedInvoice.status}</span>
                  </div>
                  
                  {/* The Sliding Bar */}
                  <StatusSlider 
                    currentStatus={selectedInvoice.status} 
                    onUpdate={(status) => updateInvoice({ ...selectedInvoice, status })}
                  />
                </div>

                {/* Danger Zone */}
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this invoice?')) {
                      deleteInvoice(selectedInvoice.id);
                      setSelectedInvoiceId(null);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400/50 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SummaryCard = ({ label, count, highlight = 'text-white' }: any) => (
  <div className="glass-card flex items-center justify-between !py-4">
    <span className="text-xs font-bold uppercase tracking-widest text-muted">{label}</span>
    <span className={`text-2xl font-black font-mono tracking-tighter ${highlight}`}>{count}</span>
  </div>
);
