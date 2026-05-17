import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { Customer } from '../types.ts';
import { format } from 'date-fns';

export const Customers: React.FC = () => {
  const { customers, deleteCustomer, addCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state for new customer
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    companyName: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email) return;

    const customer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCustomer.name as string,
      email: newCustomer.email as string,
      phone: newCustomer.phone,
      address: newCustomer.address,
      companyName: newCustomer.companyName,
      createdAt: Date.now()
    };

    await addCustomer(customer);
    setNewCustomer({ name: '', email: '', phone: '', address: '', companyName: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Customer CRM</h1>
          <p className="text-muted text-sm">Manage your client relationships and track their billing history.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 py-2.5 text-sm"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Filters & Grid */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input 
          type="text" 
          placeholder="Search by name, email, or company..." 
          className="w-full py-4 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-primary/50 transition-all shadow-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
          <div key={customer.id} className="glass-card hover:border-primary/30 group relative">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/10">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">{customer.name}</h3>
                  <p className="text-[10px] text-primary uppercase font-black tracking-widest">{customer.companyName || 'Individual'}</p>
                </div>
              </div>
              <button className="p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 rounded-lg">
                <MoreVertical size={16} />
              </button>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-xs text-muted">
                <Mail size={14} className="text-primary" />
                <span>{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3 text-xs text-muted">
                  <Phone size={14} className="text-primary" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3 text-xs text-muted">
                  <MapPin size={14} className="text-primary" />
                  <span className="truncate">{customer.address}</span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="text-[10px] text-muted uppercase font-bold tracking-widest flex items-center gap-2">
                <History size={12} />
                Added {format(customer.createdAt, 'MMM dd, yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-all">
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => deleteCustomer(customer.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-muted border border-white/5">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">No customers found</h3>
            <p className="text-muted text-sm border-b border-primary/20 inline-block pb-1">Start growing your network.</p>
          </div>
        )}
      </div>

      {/* Basic Modal for creation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg shadow-[0_0_100px_rgba(255,68,68,0.2)] animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Add New Client</h2>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted">Full Name</label>
                  <input 
                    type="text" required 
                    className="input-field w-full"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted">Company (Optional)</label>
                  <input 
                    type="text" 
                    className="input-field w-full"
                    value={newCustomer.companyName}
                    onChange={(e) => setNewCustomer({...newCustomer, companyName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Email Address</label>
                <input 
                  type="email" required 
                  className="input-field w-full"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Phone Number</label>
                <input 
                  type="text" 
                  className="input-field w-full"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Business Address</label>
                <textarea 
                  className="input-field w-full h-24 resize-none"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
