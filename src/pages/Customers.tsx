import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin, 
  History,
  Trash2,
  Edit2,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Tag as TagIcon,
  Filter,
  X,
  CreditCard,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  List
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { Customer, Invoice } from '../types.ts';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export const Customers: React.FC = () => {
  const { customers, deleteCustomer, addCustomer, updateCustomer, invoices } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTag, setSelectedTag] = useState('All');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const customerStats = useMemo(() => {
    return customers.map(c => {
      const cInvoices = invoices.filter(i => i.customerId === c.id);
      const totalBilled = cInvoices.reduce((acc, i) => acc + i.total, 0);
      const totalPaid = cInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.total, 0);
      const lastActive = cInvoices.length > 0 ? Math.max(...cInvoices.map(i => i.date)) : c.createdAt;
      
      return {
        ...c,
        totalBilled,
        totalPaid,
        balance: totalBilled - totalPaid,
        lastActive,
        invoiceCount: cInvoices.length
      };
    });
  }, [customers, invoices]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    customers.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return ['All', ...Array.from(tags)];
  }, [customers]);

  const filteredCustomers = customerStats.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'All' || c.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerData: any = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      companyName: formData.get('companyName') as string,
      taxId: formData.get('taxId') as string,
      notes: formData.get('notes') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
    };

    if (editingCustomer) {
      await updateCustomer({ ...editingCustomer, ...customerData });
    } else {
      await addCustomer({
        id: `CUST-${Date.now()}`,
        ...customerData,
        createdAt: Date.now()
      });
    }
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Customer CRM</h1>
          <p className="text-muted text-sm font-bold uppercase tracking-widest">Client relationships & Ledger history</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-white'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-white'}`}
            >
              <List size={18} />
            </button>
          </div>
          <button 
            onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
            className="btn-primary flex items-center gap-2 p-4 px-6 rounded-[2rem] text-sm font-bold shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            Acquire Client
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, company, or contact email..." 
            className="w-full py-5 pl-12 pr-4 bg-white/5 border border-white/10 rounded-[2rem] text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-6 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all border ${
                selectedTag === tag 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-white/5 border-white/5 text-muted hover:border-white/10'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCustomers.map((customer) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={customer.id}
                className="glass-card hover:border-primary/30 group !p-0 overflow-hidden border-white/5 bg-white/[0.01]"
              >
                <div className="p-8 pb-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl shadow-xl">
                        {customer.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-xl font-black tracking-tight truncate">{customer.name}</h3>
                        <p className="text-[10px] text-primary uppercase font-black tracking-[0.2em]">{customer.companyName || 'Private Client'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }} className="p-2 hover:bg-white/5 rounded-xl text-muted"><Edit2 size={16} /></button>
                      <button onClick={() => deleteCustomer(customer.id)} className="p-2 hover:bg-red-500/10 rounded-xl text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl text-[10px] font-bold text-muted uppercase tracking-widest border border-white/5">
                      <Mail size={14} className="text-primary" /> {customer.email}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-white/5 rounded-3xl text-center border border-white/5">
                         <p className="text-[8px] font-black text-muted uppercase mb-1">Total Billed</p>
                         <p className="text-lg font-black">${customer.totalBilled.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-3xl text-center border border-white/5">
                         <p className="text-[8px] font-black text-muted uppercase mb-1">Balance Due</p>
                         <p className="text-lg font-black text-primary">${customer.balance.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 bg-white/[0.03] border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {customer.tags?.map(t => (
                      <span key={t} className="px-2 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase rounded-lg border border-primary/10">{t}</span>
                    ))}
                  </div>
                  <div className="text-[8px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                    <History size={10} /> Active {format(customer.lastActive, 'MMM dd')}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-white/5">
                <tr>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted">Customer Name</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted">Contact Info</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted text-center">Invoices</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted text-right">Total Billings</th>
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted text-right">Outstanding</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                     <td className="p-6">
                        <div className="flex items-center gap-4 text-left">
                           <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center font-black text-primary">{c.name.charAt(0)}</div>
                           <div>
                              <p className="text-sm font-bold">{c.name}</p>
                              <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{c.companyName || 'N/A'}</p>
                           </div>
                        </div>
                     </td>
                     <td className="p-6">
                        <p className="text-xs font-mono">{c.email}</p>
                        <p className="text-[10px] text-muted">{c.phone}</p>
                     </td>
                     <td className="p-6 text-center">
                        <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs font-black">{c.invoiceCount}</span>
                     </td>
                     <td className="p-6 text-right font-black font-mono">${c.totalBilled.toLocaleString()}</td>
                     <td className="p-6 text-right font-black font-mono text-primary">${c.balance.toLocaleString()}</td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="py-24 text-center glass rounded-[3rem] border-dashed border-2 border-white/5">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-muted border border-white/5">
            <Users size={40} />
          </div>
          <h3 className="text-2xl font-black mb-2 italic">Client Directory Empty</h3>
          <p className="text-muted text-sm font-medium">Add customers to track billing history and ledgers.</p>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence mode="wait">
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-background/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="glass border border-white/10 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col relative shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute top-6 right-6 z-30 p-2 hover:bg-white/10 rounded-full text-muted transition-colors bg-background/50 backdrop-blur-md"
                type="button"
              >
                <X size={20} />
              </button>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                <div className="mb-10">
                  <h2 className="text-3xl font-black mb-1 tracking-tight italic">{editingCustomer ? 'Update Profile' : 'New CRM Entry'}</h2>
                  <p className="text-muted text-[10px] font-bold uppercase tracking-widest">Configure customer identification</p>
                </div>

                <form onSubmit={handleSave} className="space-y-8 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Primary Name</label>
                      <input name="name" required defaultValue={editingCustomer?.name} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold" placeholder="Individual/Main Contact" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Entity/Company</label>
                      <input name="companyName" defaultValue={editingCustomer?.companyName} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold" placeholder="Optional Company Name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Email Identity</label>
                      <input name="email" type="email" required defaultValue={editingCustomer?.email} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-mono" placeholder="client@example.com" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Phone Connectivity</label>
                      <input name="phone" defaultValue={editingCustomer?.phone} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold" placeholder="+00 00000 00000" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Physical Address</label>
                    <input name="address" defaultValue={editingCustomer?.address} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold" placeholder="Office/Billing Location" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Tags (Comma Separated)</label>
                      <input name="tags" defaultValue={editingCustomer?.tags?.join(', ')} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold" placeholder="Wholesale, High Value, Recurring" />
                    </div>
                     <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Tax ID / GST</label>
                      <input name="taxId" defaultValue={editingCustomer?.taxId} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-mono" placeholder="ID-000-000" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Private Notes</label>
                    <textarea name="notes" defaultValue={editingCustomer?.notes} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-primary/50 text-sm font-bold resize-none h-32" placeholder="Client preferences, payment terms..." />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-10">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-[2rem] font-bold text-xs uppercase tracking-widest transition-colors">Discard</button>
                    <button type="submit" className="flex-2 py-5 btn-primary rounded-[2rem] font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20">
                      {editingCustomer ? 'Update CRM Card' : 'Onboard Client'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
