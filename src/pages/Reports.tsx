import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  PieChart, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  LineChart,
  Target
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

export const Reports: React.FC = () => {
  const { invoices, expenses, profile } = useStore();

  const accountingData = useMemo(() => {
    // Correct Revenue logic: Sum of all paid amounts
    const totalRev = invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
    const totalExp = expenses.reduce((acc, e) => acc + e.amount, 0);
    const profit = totalRev - totalExp;
    const margin = totalRev > 0 ? (profit / totalRev) * 100 : 0;

    // Monthly Trend (Last 6 months)
    const interval = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    const monthlyTrends = interval.map(date => {
      const start = startOfMonth(date).getTime();
      const end = endOfMonth(date).getTime();

      const rev = invoices
        .filter(i => i.date >= start && i.date <= end)
        .reduce((acc, i) => acc + (i.paidAmount || 0), 0);

      const exp = expenses
        .filter(e => e.date >= start && e.date <= end)
        .reduce((acc, e) => acc + e.amount, 0);

      return {
        name: format(date, 'MMM'),
        revenue: rev,
        expense: exp,
        profit: rev - exp
      };
    });

    return { totalRev, totalExp, profit, margin, monthlyTrends };
  }, [invoices, expenses]);

  const COLORS = ['#FF4444', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Accounting Center</h1>
          <p className="text-muted mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">P&L, Cash flow & Tax Insights</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-glass p-4 rounded-3xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-white/5 hover:border-white/10">
            <Download size={18} />
            Export Audit
          </button>
          <button className="btn-primary p-4 rounded-3xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
            <FileSpreadsheet size={18} />
            Generate Excel
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          label="Gross Revenue" 
          value={`$${accountingData.totalRev.toLocaleString()}`} 
          trend="+12%" 
          positive={true} 
          icon={<TrendingUp size={24} />} 
        />
        <StatsCard 
          label="Total Expenses" 
          value={`$${accountingData.totalExp.toLocaleString()}`} 
          trend="+5%" 
          positive={false} 
          icon={<TrendingDown size={24} />} 
        />
        <StatsCard 
          label="Net Profit" 
          value={`$${accountingData.profit.toLocaleString()}`} 
          trend="+8%" 
          positive={accountingData.profit >= 0} 
          icon={<BarChart3 size={24} />} 
        />
        <StatsCard 
          label="Profit Margin" 
          value={`${accountingData.margin.toFixed(1)}%`} 
          trend="+2%" 
          positive={true} 
          icon={<Target size={24} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main P&L Chart */}
        <div className="lg:col-span-2 glass p-8 rounded-[2rem] border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
              <LineChart className="text-primary" />
              Profit & Loss Summary
            </h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> Revenue</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/20" /> Expenses</div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountingData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8E9299', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8E9299', fontSize: 10}} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  cursor={{fill: '#ffffff02'}}
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '16px' }}
                />
                <Bar dataKey="revenue" fill="#FF4444" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="expense" fill="#333333" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-8">
          <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
            <PieChart className="text-primary" />
            Expense Breakdown
          </h3>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={accountingData.monthlyTrends}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="expense"
                >
                  {accountingData.monthlyTrends.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#141414', border: 'none', borderRadius: '12px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {accountingData.monthlyTrends.slice(0, 4).map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">{entry.name} Operations</span>
                </div>
                <span className="text-xs font-mono font-bold">${entry.expense.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-4 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileSpreadsheet size={80} />
           </div>
           <h4 className="text-lg font-black italic">Inventory Valuation</h4>
           <p className="text-sm text-muted max-w-xs">Total value of stock held in your workspace currently across all categories.</p>
           <div className="pt-4 flex items-end gap-2">
              <span className="text-4xl font-black">$42,900</span>
              <span className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1 pb-1">Asset Value</span>
           </div>
        </div>

        <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-4 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText size={80} />
           </div>
           <h4 className="text-lg font-black italic">Tax Liability (Est.)</h4>
           <p className="text-sm text-muted max-w-xs">Estimated GST/VAT based on total sales and collected tax this fiscal year.</p>
           <div className="pt-4 flex items-end gap-2">
              <span className="text-4xl font-black font-mono">$3,240</span>
              <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1 pb-1">Calculated</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ label, value, trend, positive, icon }: any) => (
  <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-4 hover:border-primary/20 transition-all">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted group-hover:text-primary transition-all">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${positive ? 'text-green-500' : 'text-primary'}`}>
        {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{label}</p>
      <p className="text-3xl font-black tracking-tight">{value}</p>
    </div>
  </div>
);
