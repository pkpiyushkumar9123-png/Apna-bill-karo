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
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Executive Overview</h1>
          <p className="text-muted text-xs font-medium tracking-wide mt-1">Real-time enterprise metrics & cash ledger synced with your workspaces</p>
        </div>
        <div className="flex items-center gap-2.5">
          <NavLink to="/invoices/new" className="px-3.5 py-2 bg-[#FF4D57] hover:bg-[#ff3c47] text-white font-semibold rounded text-xs transition-all flex items-center gap-1.5 shadow-sm">
            <Plus size={14} />
            New Invoice
          </NavLink>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#111214] border border-white/5 rounded text-xs font-semibold text-[#A1A1AA]">
            <Calendar size={14} className="text-[#FF4D57]" />
            {format(new Date(), 'MMM dd, yyyy')}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Profit" 
          value={`${profile?.currency || 'INR'} ${stats.profit.toLocaleString()}`} 
          trend={`${stats.monthProfit >= 0 ? '+' : ''}${stats.monthProfit.toLocaleString()} this month`} 
          isPositive={stats.monthProfit >= 0} 
          icon={<Zap size={16} className="text-[#FF4D57]" />} 
        />
        <StatCard 
          title="Receivables Ledger" 
          value={`${profile?.currency || 'INR'} ${stats.receivables.toLocaleString()}`} 
          trend="Outstanding Receivables" 
          isPositive={true} 
          icon={<Clock size={16} className="text-amber-500" />} 
        />
        <StatCard 
          title="Total Revenue" 
          value={`${profile?.currency || 'INR'} ${stats.totalRev.toLocaleString()}`} 
          trend="All-Time Performance" 
          isPositive={true} 
          icon={<TrendingUp size={16} className="text-emerald-500" />} 
        />
        <StatCard 
          title="Total Expenses" 
          value={`${profile?.currency || 'INR'} ${stats.totalExp.toLocaleString()}`} 
          trend="All-Time Performance" 
          isPositive={false} 
          icon={<Wallet size={16} className="text-red-400" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Performance Chart */}
        <div className="lg:col-span-8 bg-[#111214] border border-white/5 rounded-xl p-5 md:p-6 h-[400px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-sm text-white tracking-tight">Cash Flow Analytics</h3>
              <p className="text-[10px] text-muted font-medium mt-0.5">Cash Inflow vs Expense Outflow (6-Month Historical)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white tracking-wider uppercase">
                <div className="w-2 h-2 rounded-full bg-[#FF4D57]" /> Inflow
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#A1A1AA] tracking-wider uppercase">
                <div className="w-2 h-2 rounded-full bg-white/10" /> Outflow
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4D57" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FF4D57" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#52525B" 
                  fontSize={10} 
                  fontWeight={500}
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                />
                <YAxis 
                  stroke="#52525B" 
                  fontSize={10} 
                  fontWeight={500}
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} 
                />
                <Tooltip 
                  cursor={{ stroke: '#FF4D571a', strokeWidth: 1 }}
                  contentStyle={{ 
                    backgroundColor: '#15171A', 
                    border: '1px solid rgba(255,255,255,0.06)', 
                    borderRadius: '8px', 
                    padding: '8px 12px'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: '500', color: '#F5F5F5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FF4D57" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={1000}
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="rgba(255,255,255,0.15)" 
                  strokeWidth={1.5}
                  strokeDasharray="4 4" 
                  fill="transparent" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 bg-[#111214] border border-white/5 rounded-xl flex flex-col p-5 md:p-6">
          <div className="mb-5 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-sm text-white tracking-tight">Inventory Monitoring</h3>
              <p className="text-[10px] text-muted font-medium mt-0.5">Critical thresholds alerts</p>
            </div>
            <div className="p-2 rounded bg-white/5 text-[#A1A1AA]">
              <Package size={16} />
            </div>
          </div>
          
          <div className="space-y-3 flex-1">
            {lowStockProducts.length > 0 ? lowStockProducts.map(product => {
              return (
                <div key={product.id} className="p-3 bg-white/[0.01] rounded-lg border border-white/5 space-y-2.5 transition-all hover:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">{product.name}</p>
                      <p className="text-[9px] text-[#A1A1AA] font-mono leading-none mt-1">{product.sku}</p>
                    </div>
                    <div className="text-right ml-4 leading-none">
                      <p className="text-sm font-bold text-[#FF4D57]">{product.available}</p>
                      <p className="text-[8px] text-[#A1A1AA] font-semibold uppercase tracking-wider mt-0.5">Units</p>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${product.available <= product.minStockLevel ? 'bg-red-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (product.available / (product.minStockLevel || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                <CheckCircle2 size={32} className="mb-4 text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-widest">Inventory Healthy</p>
              </div>
            )}
          </div>
          
          <NavLink to="/products" className="mt-5 w-full py-2 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded text-[10px] font-semibold uppercase tracking-wider text-center text-white transition-all">
            Manage Inventory
          </NavLink>
        </div>
      </div>

      {/* Recent Activity Mini-Table */}
      <div className="bg-[#111214] border border-white/5 rounded-xl p-5 md:p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Transaction Ledger</h3>
            <p className="text-[10px] text-muted font-medium mt-0.5">Latest account movements</p>
          </div>
          <NavLink to="/invoices" className="px-3 py-1.5 bg-[#15171A] hover:bg-[#1d2024] text-white border border-white/5 rounded font-semibold text-[10px] tracking-wide flex items-center gap-1.5 transition-all">
            <span>Open Ledger</span>
            <ArrowUpRight size={12} />
          </NavLink>
        </div>
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-3 text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Reference</th>
                <th className="pb-3 text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Client Connection</th>
                <th className="pb-3 text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider text-center">Status</th>
                <th className="pb-3 text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider text-right">Settlement</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map(inv => {
                const customer = customers.find(c => c.id === inv.customerId);
                const clientName = customer ? (customer.companyName || customer.name) : 'Private Client';
                return (
                  <tr key={inv.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-0">
                      <p className="text-xs font-bold text-white">#{inv.number}</p>
                      <p className="text-[9px] text-[#A1A1AA] mt-1">{format(inv.date, 'MMM dd, yyyy')}</p>
                    </td>
                    <td className="py-3 px-0">
                      <p className="text-xs font-medium text-white/90">{clientName}</p>
                      <p className="text-[9px] text-[#A1A1AA] mt-0.5">{inv.items.length} positions</p>
                    </td>
                    <td className="py-3 px-0 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider border ${
                        inv.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/10' : 
                        inv.status === 'pending' ? 'bg-amber-500/15 text-amber-500 border-amber-500/10' : 
                        'bg-red-500/15 text-red-400 border-red-500/10'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-0 text-right">
                      <p className="text-xs font-bold font-mono text-[#F5F5F5]">{profile?.currency || 'INR'} {inv.total.toLocaleString()}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, isPositive, icon }: any) => (
  <div className="bg-[#111214] border border-white/5 rounded-xl p-4.5 transition-all hover:bg-[#15171A]">
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 bg-white/5 rounded border border-white/5 text-[#A1A1AA]">
        {icon}
      </div>
      <div className={`text-[9px] font-semibold tracking-wider uppercase ${isPositive ? 'text-emerald-400' : 'text-[#FF4D57]'}`}>
        {trend}
      </div>
    </div>
    <div className="text-xl font-bold tracking-tight text-white leading-none">{value}</div>
    <div className="text-[9px] text-[#A1A1AA] font-semibold mt-2 uppercase tracking-widest">{title}</div>
  </div>
);
