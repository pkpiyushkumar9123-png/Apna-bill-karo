import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Calendar,
  Plus,
  Users,
  FileText,
  ShoppingCart,
  Wallet,
  ArrowUpRight,
  Package,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useStore } from '../store/useStore.ts';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { invoices, customers, products, expenses, profile } = useStore();
  
  const stats = useMemo(() => {
    // Correct Revenue logic: Sum of all paid amounts
    const totalRev = invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
    const totalExp = expenses.reduce((acc, e) => acc + e.amount, 0);
    const profit = totalRev - totalExp;
    
    // Monthly P&L
    const now = new Date();
    const mStart = startOfMonth(now).getTime();
    const mEnd = endOfMonth(now).getTime();

    const monthRev = invoices
      .filter(i => i.date >= mStart && i.date <= mEnd)
      .reduce((acc, i) => acc + (i.paidAmount || 0), 0);

    const monthExp = expenses
      .filter(e => e.date >= mStart && e.date <= mEnd)
      .reduce((acc, e) => acc + e.amount, 0);

    const receivables = invoices
      .filter(i => i.status !== 'paid')
      .reduce((acc, i) => acc + (i.total - (i.paidAmount || 0)), 0);

    return {
      profit,
      monthProfit: monthRev - monthExp,
      totalRev,
      totalExp,
      receivables,
      invoiceCount: invoices.length,
      customerCount: customers.length
    };
  }, [invoices, customers, expenses]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        name: months[d.getMonth()],
        revenue: 0,
        expense: 0
      });
    }

    invoices.forEach(inv => {
      const invDate = new Date(inv.date);
      const dataPoint = last6Months.find(m => m.month === invDate.getMonth() && m.year === invDate.getFullYear());
      if (dataPoint) {
        dataPoint.revenue += (inv.paidAmount || 0);
      }
    });

    expenses.forEach(exp => {
      const expDate = new Date(exp.date);
      const dataPoint = last6Months.find(m => m.month === expDate.getMonth() && m.year === expDate.getFullYear());
      if (dataPoint) {
        dataPoint.expense += exp.amount;
      }
    });

    return last6Months;
  }, [invoices, expenses]);

  const lowStockProducts = useMemo(() => {
    return products.map(p => {
      const pendingQty = invoices
        .filter(inv => inv.status !== 'paid' && inv.status !== 'draft')
        .reduce((sum, inv) => {
          const productItems = inv.items.filter(i => 
            i.productId === p.id || (!i.productId && i.description === p.name)
          );
          return sum + productItems.reduce((s, item) => s + item.quantity, 0);
        }, 0);
      return { ...p, available: Math.max(0, p.stockLevel - pendingQty) };
    }).filter(p => p.available <= (p.minStockLevel || 0) * 2).sort((a, b) => (a.available / (a.minStockLevel || 1)) - (b.available / (b.minStockLevel || 1))).slice(0, 4);
  }, [products, invoices]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 italic">Business Pulse</h1>
          <p className="text-muted text-sm font-bold uppercase tracking-widest">Real-time local metrics from your workspace</p>
        </div>
        <div className="flex items-center gap-3">
          <NavLink to="/invoices/new" className="btn-primary py-3 px-6 flex items-center gap-2 text-xs shadow-lg shadow-primary/30 rounded-2xl bg-primary text-white">
            <Plus size={18} />
            Create Invoice
          </NavLink>
          <div className="flex items-center gap-2 glass px-4 py-3 rounded-2xl text-sm font-bold border border-white/5 bg-white/5">
            <Calendar size={18} className="text-primary" />
            {format(new Date(), 'MMMM dd')}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Profit" 
          value={`${profile?.currency || 'INR'} ${stats.profit.toLocaleString()}`} 
          trend={`${stats.monthProfit >= 0 ? '+' : ''}${stats.monthProfit.toLocaleString()} this month`} 
          isPositive={stats.monthProfit >= 0} 
          icon={<Zap size={20} className="text-primary fill-primary" />} 
        />
        <StatCard 
          title="Accounts Receivable" 
          value={`${profile?.currency || 'INR'} ${stats.receivables.toLocaleString()}`} 
          trend="Pending Collection" 
          isPositive={true} 
          icon={<Clock className="text-yellow-500" />} 
        />
        <StatCard 
          title="Total Revenue" 
          value={`${profile?.currency || 'INR'} ${stats.totalRev.toLocaleString()}`} 
          trend="Lifetime" 
          isPositive={true} 
          icon={<TrendingUp className="text-green-500" />} 
        />
        <StatCard 
          title="Total Expenses" 
          value={`${profile?.currency || 'INR'} ${stats.totalExp.toLocaleString()}`} 
          trend="Lifetime" 
          isPositive={false} 
          icon={<Wallet className="text-red-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-card h-[450px]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-black text-xl italic">Cash Flow Performance</h3>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Inflow vs Outflow (Last 6 Months)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-primary uppercase">
                <div className="w-2 h-2 rounded-full bg-primary" /> Inflow
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted uppercase">
                <div className="w-2 h-2 rounded-full bg-white/20" /> Outflow
              </div>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '16px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FF4444" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expense" stroke="#333" strokeDasharray="5 5" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-black text-xl italic">Stock Alerts</h3>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Inventory requires attention</p>
            </div>
            <Package size={24} className="text-primary opacity-50" />
          </div>
          
          <div className="space-y-4 flex-1">
            {lowStockProducts.length > 0 ? lowStockProducts.map(product => {
              const stockPercentage = Math.min(100, (product.stockLevel / (product.minStockLevel || 1)) * 50);
              return (
                <div key={product.id} className="p-4 bg-white/5 rounded-3xl border border-white/5 space-y-3 group hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-bold truncate">{product.name}</p>
                      <p className="text-[10px] text-muted font-mono">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">{product.available} available</p>
                      <p className="text-[8px] font-bold text-muted uppercase">Min: {product.minStockLevel}</p>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${product.available <= product.minStockLevel ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, (product.available / (product.minStockLevel || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-12">
                <CheckCircle2 size={40} className="mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Inventory Healthy</p>
              </div>
            )}
          </div>
          
          <NavLink to="/products" className="mt-6 w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center transition-all">
            Manage Inventory
          </NavLink>
        </div>
      </div>

      {/* Recent Activity Mini-Table */}
      <div className="glass-card !p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black italic">Recent Transactions</h3>
          <NavLink to="/invoices" className="text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-2">
            View Register <ArrowUpRight size={14} />
          </NavLink>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-4 text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Reference</th>
                <th className="pb-4 text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Contact</th>
                <th className="pb-4 text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Status</th>
                <th className="pb-4 text-[10px] font-bold text-muted uppercase tracking-[0.2em] text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.slice(0, 5).map(inv => (
                <tr key={inv.id} className="group">
                  <td className="py-4">
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">#{inv.number}</p>
                    <p className="text-[10px] text-muted uppercase tracking-widest">{format(inv.date, 'MMM dd')}</p>
                  </td>
                  <td className="py-4">
                    <p className="text-sm font-medium">Customer {inv.customerId ? inv.customerId.slice(-4) : 'Walk-in'}</p>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                      inv.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                      inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <p className="text-sm font-black font-mono">${inv.total.toFixed(2)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, isPositive, icon }: any) => (
  <div className="glass-card hover:translate-y-[-4px] group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-primary/20 transition-all">
        {icon}
      </div>
      <div className={`text-[10px] font-black uppercase tracking-widest ${isPositive ? 'text-green-500' : 'text-primary'}`}>
        {trend}
      </div>
    </div>
    <div className="text-2xl font-black tracking-tight">{value}</div>
    <div className="text-[10px] text-muted font-bold mt-1 uppercase tracking-[0.2em]">{title}</div>
  </div>
);
