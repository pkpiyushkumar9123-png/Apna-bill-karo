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
  FileText
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
import { format } from 'date-fns';

const data = [
  { name: 'Jan', revenue: 4000, expenses: 2400 },
  { name: 'Feb', revenue: 3000, expenses: 1398 },
  { name: 'Mar', revenue: 2000, expenses: 9800 },
  { name: 'Apr', revenue: 2780, expenses: 3908 },
  { name: 'May', revenue: 1890, expenses: 4800 },
  { name: 'Jun', revenue: 2390, expenses: 3800 },
  { name: 'Jul', revenue: 3490, expenses: 4300 },
];

export const Dashboard: React.FC = () => {
  const invoices = useStore((state) => state.invoices);
  const customers = useStore((state) => state.customers);
  
  const stats = useMemo(() => {
    const total = invoices.reduce((acc, inv) => acc + inv.total, 0);
    const pending = invoices.filter(i => i.status === 'pending').reduce((acc, inv) => acc + inv.total, 0);
    const paid = invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.total, 0);
    const overdue = invoices.filter(i => i.status === 'overdue').reduce((acc, inv) => acc + inv.total, 0);
    
    return {
      total,
      pending,
      paid,
      overdue,
      count: invoices.length,
      customerCount: customers.length
    };
  }, [invoices, customers]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Business Overview</h1>
          <p className="text-muted">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="flex items-center gap-3">
          <NavLink to="/invoices/new" className="btn-primary py-2.5 px-4 flex items-center gap-2 text-xs shadow-lg shadow-primary/30">
            <Plus size={16} />
            Quick Invoice
          </NavLink>
          <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm font-medium">
            <Calendar size={18} className="text-primary" />
            {format(new Date(), 'MMMM dd, yyyy')}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.total.toLocaleString()}`} 
          trend="+12.5%" 
          isPositive={true} 
          icon={<DollarSign className="text-primary" />} 
        />
        <StatCard 
          title="Pending Payments" 
          value={`$${stats.pending.toLocaleString()}`} 
          trend="-2.4%" 
          isPositive={false} 
          icon={<Clock className="text-yellow-500" />} 
        />
        <StatCard 
          title="Successfully Paid" 
          value={`$${stats.paid.toLocaleString()}`} 
          trend="+8.2%" 
          isPositive={true} 
          icon={<CheckCircle2 className="text-green-500" />} 
        />
        <StatCard 
          title="Overdue Balance" 
          value={`$${stats.overdue.toLocaleString()}`} 
          trend="+4.1%" 
          isPositive={false} 
          icon={<AlertCircle className="text-red-500" />} 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card h-[400px]">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-bold text-lg">Revenue Forecast</h3>
              <p className="text-xs text-muted">Monthly performance analytics</p>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-full transition-all">
              <MoreVertical size={18} />
            </button>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#8E9299" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#8E9299" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FF4444" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div className="mb-6">
            <h3 className="font-bold text-lg">Quick Insights</h3>
            <p className="text-xs text-muted">AI-powered business health</p>
          </div>
          <div className="space-y-6">
            <InsightItem 
              label="Collection Rate" 
              value="94%" 
              progress={94} 
              color="bg-primary" 
              desc="You're collecting 12% faster than last month."
            />
            <InsightItem 
              label="Customer Retention" 
              value="82%" 
              progress={82} 
              color="bg-green-500" 
              desc="4 new repeat customers added this week."
            />
            <InsightItem 
              label="Invoice Efficiency" 
              value="65%" 
              progress={65} 
              color="bg-blue-500" 
              desc="Average payment time: 4.2 days."
            />
            
            <div className="pt-6 border-t border-white/5">
              <button className="w-full btn-secondary font-bold text-xs uppercase tracking-widest py-4">
                View Detailed Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card !p-0 overflow-hidden border-none bg-transparent lg:glass-card lg:!p-6 lg:border lg:bg-white/5">
        <div className="flex justify-between items-center mb-8 px-6 lg:px-0 pt-6 lg:pt-0">
          <h3 className="font-bold text-lg">Recent Invoices</h3>
          <NavLink to="/invoices" className="text-primary text-sm font-bold hover:underline">View All</NavLink>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted">Invoice No.</th>
                <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted">Client</th>
                <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted">Status</th>
                <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted">Date</th>
                <th className="pb-4 text-xs font-bold uppercase tracking-widest text-muted">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.length > 0 ? invoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition-colors cursor-pointer group">
                  <td className="py-4 font-mono text-sm">#{inv.number}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                        {inv.customerId.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">Customer {inv.customerId.slice(-4)}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                      inv.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                      inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-muted">{format(inv.date, 'MMM dd, yyyy')}</td>
                  <td className="py-4 font-mono font-bold">${inv.total.toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted text-sm italic">
                    No recent activity. Start by creating an invoice!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4 px-6 pb-6">
          {invoices.length > 0 ? invoices.slice(0, 5).map((inv) => (
            <div key={inv.id} className="glass-card !p-4 flex flex-col gap-3">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold tracking-tight mb-1">#{inv.number}</p>
                    <p className="text-[10px] text-muted">{format(inv.date, 'MMM dd, yyyy')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                    inv.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                    inv.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {inv.status}
                  </span>
               </div>
               <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                        {inv.customerId.charAt(0)}
                    </div>
                    <span className="text-[10px] text-muted">Customer {inv.customerId.slice(-4)}</span>
                  </div>
                  <p className="text-sm font-black font-mono tracking-tighter">${inv.total.toFixed(2)}</p>
               </div>
            </div>
          )) : (
            <div className="py-8 text-center text-muted text-xs italic">
                No recent activity.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, isPositive, icon }: any) => (
  <div className="glass-card hover:translate-y-[-4px]">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {trend}
      </div>
    </div>
    <div className="text-2xl font-black tracking-tighter font-mono">{value}</div>
    <div className="text-xs text-muted font-medium mt-1 uppercase tracking-widest">{title}</div>
  </div>
);

const InsightItem = ({ label, value, progress, color, desc }: any) => (
  <div>
    <div className="flex justify-between items-end mb-2">
      <span className="text-xs font-bold uppercase tracking-widest text-muted">{label}</span>
      <span className="text-sm font-black font-mono">{value}</span>
    </div>
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
      <div className={`h-full ${color}`} style={{ width: `${progress}%` }} />
    </div>
    <p className="text-[10px] text-muted leading-relaxed font-medium">{desc}</p>
  </div>
);
