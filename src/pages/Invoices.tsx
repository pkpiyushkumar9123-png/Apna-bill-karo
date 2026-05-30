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
  Clock,
  CheckCircle2,
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
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredInvoices.map(inv => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (status: string) => {
    for (const id of selectedIds) {
      const inv = invoices.find(i => i.id === id);
      if (inv) {
        const newPaidAmount = status === 'paid' ? inv.total : status === 'draft' ? 0 : inv.paidAmount || 0;
        await updateInvoice({ ...inv, status: status as any, paidAmount: newPaidAmount });
      }
    }
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteInvoice(id);
    }
    setSelectedIds([]);
  };

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
    <div className="space-y-8 lg:space-y-12 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-10">
        <div className="lg:space-y-1">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-2 italic">Register</h1>
          <p className="text-muted text-sm font-bold uppercase tracking-widest lg:tracking-[0.2em]">Manage and track all your outgoing bills</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2 py-3 lg:px-8 text-xs lg:text-sm group"
          >
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
            <span className="hidden sm:inline">Export History</span>
            <span className="sm:hidden">Export</span>
          </button>
          <NavLink to="/invoices/new" className="btn-primary flex items-center gap-2 py-3 lg:px-8 text-xs lg:text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
            <Plus size={18} />
            New Invoice
          </NavLink>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <SummaryCard label="Drafts" count={invoices.filter(i => i.status === 'draft').length} icon={<FileText size={18} />} />
        <SummaryCard label="Pending" count={invoices.filter(i => i.status === 'pending').length} highlight="text-yellow-500" icon={<Clock size={18} />} />
        <SummaryCard label="Paid" count={invoices.filter(i => i.status === 'paid').length} highlight="text-green-500" icon={<CheckCircle2 size={18} />} />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
        <div className="relative flex-1 w-full lg:max-w-2xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by invoice number or client name..." 
            className="w-full py-4 pl-14 pr-6 bg-white/[0.03] border border-white/5 rounded-2xl text-sm focus:outline-none focus:border-primary/50 lg:text-base transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-48 group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={16} />
            <select 
              className="input-field py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest w-full appearance-none bg-background cursor-pointer hover:bg-white/5"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Every Status</option>
              <option value="draft">Draft Only</option>
              <option value="pending">Due Now</option>
              <option value="paid">Settled</option>
              <option value="overdue">Lapsed</option>
            </select>
          </div>
          <select 
            className="input-field py-4 text-xs font-bold uppercase tracking-widest w-full lg:w-48 appearance-none bg-background cursor-pointer hover:bg-white/5"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Groups</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table / Mobile Cards */}
      <div className="glass-card !p-0 overflow-hidden border-none bg-transparent lg:glass-card lg:!p-0 lg:overflow-hidden lg:border-[0.5px] lg:border-white/10 lg:bg-white/[0.02] shadow-2xl">
        {filteredInvoices.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-white/[0.03] text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">
                    <th className="px-8 py-5 border-b border-white/5 w-12 text-center select-none" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={filteredInvoices.length > 0 && filteredInvoices.every(inv => selectedIds.includes(inv.id))}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 focus:outline-none w-4 h-4 cursor-pointer accent-primary"
                      />
                    </th>
                    <th className="px-8 py-5 border-b border-white/5">Ref / Identity</th>
                    <th className="px-8 py-5 border-b border-white/5">Pipeline Status</th>
                    <th className="px-8 py-5 border-b border-white/5">Schedule</th>
                    <th className="px-8 py-5 border-b border-white/5">Valuation</th>
                    <th className="px-8 py-5 border-b border-white/5 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInvoices.map((inv) => (
                    <tr 
                      key={inv.id} 
                      className={`hover:bg-white/[0.04] transition-all group relative cursor-pointer ${selectedIds.includes(inv.id) ? 'bg-primary/5 hover:bg-primary/5' : ''}`} 
                      onClick={() => setSelectedInvoiceId(inv.id)}
                    >
                      <td className="px-8 py-8 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(inv.id)}
                          onChange={(e) => handleToggleSelect(inv.id, e)}
                          className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 focus:outline-none w-4 h-4 cursor-pointer accent-primary"
                        />
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center text-primary/50 border border-white/5 group-hover:border-primary/30 group-hover:text-primary transition-all shadow-inner">
                            <FileText size={28} />
                          </div>
                          <div>
                            <p className="text-base font-black tracking-tighter group-hover:text-primary transition-colors">#{inv.number}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[11px] font-bold text-muted truncate max-w-[150px]">{customers.find(c => c.id === inv.customerId)?.name || 'Direct Sale'}</p>
                              {inv.category && (
                                <span className="text-[8px] px-2 py-0.5 rounded-full bg-primary/5 text-primary/60 border border-primary/10 uppercase font-black tracking-widest">
                                  {inv.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between max-w-[180px]">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                              inv.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                              inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                              inv.status === 'draft' ? 'bg-white/5 text-muted border-white/10' :
                              'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                              {inv.status}
                            </span>
                            <span className="text-[9px] font-bold text-muted/40 uppercase tracking-widest">Set</span>
                          </div>
                          <StatusSlider 
                            currentStatus={inv.status} 
                            onUpdate={(status) => updateInvoice({ ...inv, status })}
                            compact
                            className="w-48 shadow-lg shadow-black/20"
                          />
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white/80">{format(inv.date, 'MMM dd')}</p>
                          <div className="flex items-center gap-1.5">
                            <Clock size={10} className="text-muted" />
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Due {format(inv.dueDate, 'MMM dd')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-lg font-black font-mono tracking-tighter text-white/90">
                              {profile?.currency || 'INR'} {inv.total.toLocaleString()}
                            </p>
                            {inv.paidAmount && inv.paidAmount > 0 && inv.paidAmount < inv.total && (
                              <p className="text-[10px] font-bold text-green-500/70 tracking-widest uppercase">
                                Paid: {profile?.currency || 'INR'} {inv.paidAmount.toLocaleString()}
                              </p>
                            )}
                          </div>
                          {inv.status === 'paid' && (
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                              <TrendingUp size={16} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-8 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
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
                             }}
                            className="p-3 rounded-xl bg-white/[0.03] hover:bg-primary/20 text-muted hover:text-white transition-all border border-white/5"
                            title="Clone Entry"
                          >
                            <Copy size={18} />
                          </button>
                          <button 
                            onClick={() => handleDownload(inv)}
                            className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/10 text-muted hover:text-white transition-all border border-white/5"
                            title="Obtain PDF"
                          >
                            <Download size={18} />
                          </button>
                          <NavLink 
                            to={`/invoices/${inv.id}`} 
                            className="p-3 rounded-xl bg-white/[0.03] hover:bg-primary text-white transition-all border border-white/5 shadow-lg shadow-primary/20"
                            title="Edit Record"
                          >
                            <ExternalLink size={18} />
                          </NavLink>
                          <button 
                            onClick={() => {
                              if(confirm('Erase this record from local storage?')) deleteInvoice(inv.id);
                            }}
                            className="p-3 rounded-xl bg-white/[0.03] hover:bg-red-500/20 text-muted hover:text-red-500 transition-all border border-white/5"
                            title="Discard"
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
                <div 
                  key={inv.id} 
                  className={`glass-card flex flex-col gap-4 group transition-all duration-200 ${selectedIds.includes(inv.id) ? 'border-primary/40 bg-primary/[0.02]' : ''}`} 
                  onClick={() => setSelectedInvoiceId(inv.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center mr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(inv.id)}
                          onChange={(e) => handleToggleSelect(inv.id, e)}
                          className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 focus:outline-none w-4.5 h-4.5 cursor-pointer accent-primary"
                        />
                      </div>
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
                    onUpdate={(status) => {
                      const newPaidAmount = status === 'paid' ? selectedInvoice.total : status === 'draft' ? 0 : selectedInvoice.paidAmount || 0;
                      updateInvoice({ ...selectedInvoice, status, paidAmount: newPaidAmount });
                    }}
                  />
                </div>

                {/* Payment Recording (Permanently Below Slider) */}
                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4">
                   <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-widest text-primary block">RECORD PAYMENT</label>
                      <p className="text-[10px] text-muted leading-relaxed font-medium">This amount will reflect as revenue in your accounting</p>
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

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40 mx-auto w-[calc(100%-2rem)] max-w-4xl"
          >
            <div className="p-4 md:p-5 rounded-3xl border border-white/10 bg-neutral-950/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black font-mono text-sm shadow-inner">
                  {selectedIds.length}
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight text-white uppercase tracking-widest">Invoices Selected</h4>
                  <button 
                    onClick={() => setSelectedIds([])} 
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest text-left mt-0.5"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
              
              <div className="h-px w-full md:h-10 md:w-px bg-white/10" />
              
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted/60 mr-1 hidden sm:inline">Set Status:</span>
                <div className="flex flex-wrap gap-1.5 flex-1 sm:flex-initial">
                  {['draft', 'pending', 'paid', 'overdue'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleBulkStatusUpdate(status)}
                      className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                        status === 'paid' ? 'hover:bg-green-500/10 hover:text-green-500 border-green-500/20 text-white bg-white/5' : 
                        status === 'pending' ? 'hover:bg-yellow-500/10 hover:text-yellow-500 border-yellow-500/20 text-white bg-white/5' : 
                        status === 'overdue' ? 'hover:bg-red-500/10 hover:text-red-500 border-red-500/20 text-white bg-white/5' :
                        'hover:bg-white/10 border-white/10 text-white bg-white/5'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                
                <div className="h-4 w-px bg-white/10 hidden sm:block mx-1" />
                
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete the ${selectedIds.length} selected invoices?`)) {
                      handleBulkDelete();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border border-red-500/30 text-red-500 hover:bg-red-500/10 bg-white/5 flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0 transition-colors"
                  title="Delete Selected"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SummaryCard = ({ label, count, highlight = 'text-white', icon }: any) => (
  <div className="glass-card flex items-center justify-between !py-6 px-8 group hover:bg-white/[0.05] transition-all cursor-default">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl bg-white/[0.03] group-hover:bg-white/10 transition-all border border-white/5 ${highlight.replace('text-', 'text- opacity-80')}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-muted/80 transition-colors">{label}</span>
    </div>
    <span className={`text-4xl font-black font-mono tracking-tighter ${highlight} drop-shadow-sm`}>{count}</span>
  </div>
);
