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
    <div className="space-y-8 pb-12 lg:space-y-12 max-w-[1600px] mx-auto">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-8">
        <div className="lg:space-y-1">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-1 italic">Business Pulse</h1>
          <p className="text-muted text-sm font-bold uppercase tracking-widest lg:tracking-[0.3em]">Real-time local metrics from your workspace</p>
        </div>
        <div className="flex items-center gap-3 lg:gap-5">
          <NavLink to="/invoices/new" className="btn-primary py-3 px-6 lg:py-4 lg:px-8 flex items-center gap-2 text-xs lg:text-sm shadow-xl shadow-primary/30 rounded-2xl bg-primary text-white hover:scale-105 transition-transform">
            <Plus size={18} className="lg:w-5 lg:h-5" />
            Create Invoice
          </NavLink>
          <div className="flex items-center gap-2 glass px-4 py-3 lg:px-6 lg:py-4 rounded-2xl text-sm font-bold border border-white/5 bg-white/5 shadow-inner">
            <Calendar size={18} className="text-primary lg:w-5 lg:h-5" />
            {format(new Date(), 'MMMM dd, yyyy')}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 overflow-visible">
        <StatCard 
          title="Total Profit" 
          value={`${profile?.currency || 'INR'} ${stats.profit.toLocaleString()}`} 
          trend={`${stats.monthProfit >= 0 ? '+' : ''}${stats.monthProfit.toLocaleString()} this month`} 
          isPositive={stats.monthProfit >= 0} 
          icon={<Zap size={22} className="text-primary fill-primary" />} 
        />
        <StatCard 
          title="Accounts Receivable" 
          value={`${profile?.currency || 'INR'} ${stats.receivables.toLocaleString()}`} 
          trend="Pending Collection" 
          isPositive={true} 
          icon={<Clock size={22} className="text-yellow-500" />} 
        />
        <StatCard 
          title="Total Revenue" 
          value={`${profile?.currency || 'INR'} ${stats.totalRev.toLocaleString()}`} 
          trend="Lifetime" 
          isPositive={true} 
          icon={<TrendingUp size={22} className="text-green-500" />} 
        />
        <StatCard 
          title="Total Expenses" 
          value={`${profile?.currency || 'INR'} ${stats.totalExp.toLocaleString()}`} 
          trend="Lifetime" 
          isPositive={false} 
          icon={<Wallet size={22} className="text-red-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Performance Chart */}
        <div className="lg:col-span-8 glass-card !p-8 lg:!p-10 h-[450px] lg:h-[500px]">
          <div className="flex justify-between items-start mb-8 lg:mb-12">
            <div>
              <h3 className="font-black text-xl lg:text-2xl italic tracking-tight">Cash Flow Performance</h3>
              <p className="text-[10px] lg:text-xs font-bold text-muted uppercase tracking-widest lg:tracking-[0.2em] mt-1">Inflow vs Outflow (Last 6 Months)</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-3 text-[10px] lg:text-xs font-black tracking-widest text-primary uppercase">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(255,68,68,0.5)]" /> Inflow
              </div>
              <div className="flex items-center gap-3 text-[10px] lg:text-xs font-black tracking-widest text-muted uppercase">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" /> Outflow
              </div>
            </div>
          </div>
          <div className="h-[300px] lg:h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#8E9299" 
                  fontSize={11} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false} 
                  dy={15} 
                />
                <YAxis 
                  stroke="#8E9299" 
                  fontSize={11} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} 
                />
                <Tooltip 
                  cursor={{ stroke: '#FF444433', strokeWidth: 2 }}
                  contentStyle={{ 
                    backgroundColor: '#141414', 
                    border: '1px solid #ffffff10', 
                    borderRadius: '20px', 
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FF4444" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#ffffff20" 
                  strokeWidth={2}
                  strokeDasharray="8 8" 
                  fill="transparent" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 glass-card flex flex-col !p-8 lg:!p-10">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h3 className="font-black text-xl lg:text-2xl italic tracking-tight">Stock Alerts</h3>
              <p className="text-[10px] lg:text-xs font-bold text-muted uppercase tracking-widest lg:tracking-[0.2em] mt-1">Inventory status</p>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Package size={24} />
            </div>
          </div>
          
          <div className="space-y-5 flex-1">
            {lowStockProducts.length > 0 ? lowStockProducts.map(product => {
              return (
                <div key={product.id} className="p-5 bg-white/[0.03] rounded-3xl border border-white/5 space-y-4 group hover:bg-white/[0.05] hover:border-primary/30 transition-all cursor-default">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{product.name}</p>
                      <p className="text-[11px] text-muted font-mono tracking-tighter uppercase mt-0.5">{product.sku}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-base font-black text-primary leading-none">{product.available}</p>
                      <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">Units</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-1000 ${product.available <= product.minStockLevel ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}
                      style={{ width: `${Math.min(100, (product.available / (product.minStockLevel || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-12">
                <CheckCircle2 size={48} className="mb-6 text-green-500" />
                <p className="text-xs font-bold uppercase tracking-widest tracking-[0.3em]">Inventory Healthy</p>
              </div>
            )}
          </div>
          
          <NavLink to="/products" className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-center transition-all hover:scale-[1.02] active:scale-[0.98]">
            Manage Inventory
          </NavLink>
        </div>
      </div>

      {/* Recent Activity Mini-Table */}
      <div className="glass-card !p-8 lg:!p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="flex justify-between items-center mb-10 relative">
          <div>
            <h3 className="text-xl lg:text-2xl font-black italic tracking-tight">Recent Transactions</h3>
            <p className="text-[10px] lg:text-xs font-bold text-muted uppercase tracking-widest mt-1">Latest ledger entries</p>
          </div>
          <NavLink to="/invoices" className="btn-secondary py-3 px-6 lg:px-8 rounded-2xl flex items-center gap-3 group">
            <span className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em]">View All Register</span>
            <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </NavLink>
        </div>
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="pb-4 px-4 text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-50">Reference</th>
                <th className="pb-4 px-4 text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-50">Contact</th>
                <th className="pb-4 px-4 text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-50 text-center">Status</th>
                <th className="pb-4 px-4 text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-50 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 6).map(inv => (
                <tr key={inv.id} className="group cursor-pointer">
                  <td className="py-5 px-4 bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors rounded-l-3xl">
                    <p className="text-sm font-black group-hover:text-primary transition-colors tracking-tight">#{inv.number}</p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">{format(inv.date, 'MMM dd, yyyy')}</p>
                  </td>
                  <td className="py-5 px-4 bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors">
                    <p className="text-sm font-bold text-white/90">{inv.customerId ? inv.customerId.slice(-4) : 'Walk-in'}</p>
                    <p className="text-[10px] text-muted font-medium">{inv.items.length} items included</p>
                  </td>
                  <td className="py-5 px-4 bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      inv.status === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-5 px-4 bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors text-right rounded-r-3xl">
                    <p className="text-base font-black font-mono text-white/90">{profile?.currency || 'INR'} {inv.total.toLocaleString()}</p>
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
