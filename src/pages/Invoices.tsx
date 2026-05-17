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
  FileText
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../services/pdfService.ts';

export const Invoices: React.FC = () => {
  const { invoices, deleteInvoice, addInvoice, customers, profile } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleDownload = (inv: any) => {
    const customer = customers.find(c => c.id === inv.customerId);
    generateInvoicePDF(inv, profile, customer);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.customerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Invoices</h1>
          <p className="text-muted text-sm">Manage and track all your outgoing bills in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2 py-2.5 text-sm">
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
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            className="input-field py-3 text-sm flex-1 md:w-48 appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
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
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight">#{inv.number}</p>
                            <p className="text-[10px] text-muted">ID: {inv.customerId.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                          inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                          inv.status === 'draft' ? 'bg-white/10 text-muted' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {inv.status}
                        </span>
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
                <div key={inv.id} className="glass-card flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">#{inv.number}</p>
                        <p className="text-[10px] text-muted">{format(inv.date, 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      inv.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                      inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                      inv.status === 'draft' ? 'bg-white/10 text-muted' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-xl font-black font-mono tracking-tighter">${inv.total.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
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
                        className="p-2.5 glass rounded-xl text-muted hover:text-primary"
                        title="Duplicate Invoice"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={() => handleDownload(inv)}
                        className="p-2.5 glass rounded-xl text-muted"
                      >
                        <Download size={16} />
                      </button>
                      <NavLink 
                        to={`/invoices/${inv.id}`} 
                        className="p-2.5 glass rounded-xl text-primary"
                      >
                        <ExternalLink size={16} />
                      </NavLink>
                      <button 
                        onClick={() => deleteInvoice(inv.id)}
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
    </div>
  );
};

const SummaryCard = ({ label, count, highlight = 'text-white' }: any) => (
  <div className="glass-card flex items-center justify-between !py-4">
    <span className="text-xs font-bold uppercase tracking-widest text-muted">{label}</span>
    <span className={`text-2xl font-black font-mono tracking-tighter ${highlight}`}>{count}</span>
  </div>
);
