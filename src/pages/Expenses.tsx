import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Calendar, 
  Tag, 
  DollarSign, 
  Wallet,
  ArrowUpRight,
  TrendingDown,
  BarChart3,
  X,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { Expense } from '../types.ts';
import { format } from 'date-fns';

export const Expenses: React.FC = () => {
  const { expenses, addExpense, deleteExpense, products, profile } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', 'Operations', 'Inventory', 'Marketing', 'Rent', 'Wages', 'Utilities', 'Other'];

  const liveInventoryExpenses = useMemo(() => {
    return products
      .filter(p => p.stockLevel > 0)
      .map(p => {
        const amount = p.stockLevel * (p.costPrice || p.price);
        return {
          id: `live-inv-${p.id}`,
          title: p.name,
          amount: amount,
          category: 'Inventory',
          date: p.createdAt || Date.now(),
          paymentMethod: 'Asset Stock',
          notes: `Automatic dynamic inventory expense. ${p.stockLevel} units remaining. (SKU: ${p.sku || 'N/A'})`,
          isLiveInventory: true,
          productId: p.id,
          updatedAt: p.createdAt || Date.now()
        } as Expense;
      });
  }, [products]);

  const allExpenses = useMemo(() => {
    return [...expenses, ...liveInventoryExpenses];
  }, [expenses, liveInventoryExpenses]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => b.date - a.date);
  }, [allExpenses, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const total = allExpenses.reduce((acc, e) => acc + e.amount, 0);
    const thisMonth = allExpenses.filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((acc, e) => acc + e.amount, 0);

    return { total, thisMonth };
  }, [allExpenses]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      title: formData.get('title') as string,
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as string,
      date: new Date(formData.get('date') as string).getTime(),
      paymentMethod: formData.get('paymentMethod') as string,
      notes: formData.get('notes') as string,
      updatedAt: Date.now()
    };
    await addExpense(newExpense);
    setShowAddModal(false);
  };

  const currSymbol = profile?.currency === 'INR' ? '₹' : (profile?.currency === 'USD' ? '$' : (profile?.currency || '₹'));

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Expenses</h1>
          <p className="text-muted mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Track operational spending</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="glass p-4 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Monthly spend</p>
              <p className="text-xl font-black">{currSymbol}{stats.thisMonth.toLocaleString()}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary p-4 px-6 rounded-3xl flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by title..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                categoryFilter === c 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-white/5 border-white/5 text-muted hover:border-white/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredExpenses.map((exp) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={exp.id}
              className="glass p-6 rounded-[2rem] border border-white/5 group hover:border-white/10 transition-all relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                    <Calendar size={12} />
                    {format(exp.date, 'MMMM dd, yyyy')}
                  </div>
                  <h3 className="text-xl font-bold">{exp.title}</h3>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <span className="text-2xl font-black text-primary">-{currSymbol}{exp.amount.toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    {exp.isLiveInventory && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[8px] font-black uppercase tracking-wider border border-emerald-500/20">
                        Live Link
                      </span>
                    )}
                    <span className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-bold uppercase text-muted tracking-widest border border-white/5">
                      {exp.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted">
                  <Wallet size={14} />
                  {exp.paymentMethod}
                </div>
                <div className="flex items-center gap-2">
                  {exp.isLiveInventory ? (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Lock size={10} />
                      Auto Active
                    </span>
                  ) : (
                    <button 
                      onClick={() => deleteExpense(exp.id)}
                      className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {exp.notes && (
                <div className="mt-4 p-3 bg-white/5 rounded-2xl text-[10px] text-muted leading-relaxed">
                  {exp.notes}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-lg glass border border-white/10 rounded-[2rem] overflow-hidden p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Plus size={24} />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Record Expense</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Expense Title</label>
                    <input name="title" required className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-4 focus:outline-none focus:border-primary/50" placeholder="e.g. Office Stationery" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Amount</label>
                      <input name="amount" type="number" step="0.01" required className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-4 focus:outline-none focus:border-primary/50" placeholder="0.00" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Date</label>
                      <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-4 focus:outline-none focus:border-primary/50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Category</label>
                      <select name="category" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-4 focus:outline-none focus:border-primary/50 appearance-none">
                        {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Payment Method</label>
                      <select name="paymentMethod" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-4 focus:outline-none focus:border-primary/50 appearance-none">
                        <option>Cash</option>
                        <option>Bank Transfer</option>
                        <option>Credit Card</option>
                        <option>UPI</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest px-1">Notes (Optional)</label>
                    <textarea name="notes" rows={3} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-4 focus:outline-none focus:border-primary/50 resize-none" placeholder="Add additional details..." />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest">Cancel</button>
                  <button type="submit" className="flex-1 py-4 btn-primary rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">Save Expense</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
