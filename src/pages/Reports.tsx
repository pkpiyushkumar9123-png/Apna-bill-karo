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

  const COLORS = ['#FF4D57', '#3B82F6', '#F59E0B', '#10B981', '#6366F1'];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 w-full overflow-hidden">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics Center</h1>
          <p className="text-muted text-xs font-medium tracking-wide mt-1">P&L reporting, margin insights, and operational spending</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-[#15171A] hover:bg-[#1d2024] text-white border border-white/5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all">
            <Download size={14} />
            <span>Export Audit</span>
          </button>
          <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-all">
            <FileSpreadsheet size={14} />
            <span>Generate Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <StatsCard 
          label="Gross Revenue Ledger" 
          value={`${profile?.currency || 'INR'} ${accountingData.totalRev.toLocaleString()}`} 
          trend="+12%" 
          positive={true} 
          icon={<TrendingUp size={16} />} 
        />
        <StatsCard 
          label="Operational Expenses" 
          value={`${profile?.currency || 'INR'} ${accountingData.totalExp.toLocaleString()}`} 
          trend="+5%" 
          positive={false} 
          icon={<TrendingDown size={16} />} 
        />
        <StatsCard 
          label="Net Profit Margin" 
          value={`${profile?.currency || 'INR'} ${accountingData.profit.toLocaleString()}`} 
          trend="+8%" 
          positive={accountingData.profit >= 0} 
          icon={<BarChart3 size={16} />} 
        />
        <StatsCard 
          label="Gross Yield Margin" 
          value={`${accountingData.margin.toFixed(1)}%`} 
          trend="+2%" 
          positive={true} 
          icon={<Target size={16} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full min-w-0">
        {/* Main P&L Chart */}
        <div className="lg:col-span-2 bg-[#111214] border border-white/5 rounded-xl p-5 md:p-6 space-y-6 overflow-hidden min-w-0 w-full">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <LineChart size={16} className="text-[#FF4D57]" />
              <span>Profit & Loss Statement</span>
            </h3>
            <div className="flex gap-4 text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF4D57]" /> Profit Ledger</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/15" /> Cost Base</div>
            </div>
          </div>
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountingData.monthlyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525B', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525B', fontSize: 10}} tickFormatter={(v) => `${v}`} />
                <Tooltip 
                  cursor={{fill: '#ffffff01'}}
                  contentStyle={{ backgroundColor: '#15171A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '11px', color: '#F5F5F5' }}
                />
                <Bar dataKey="revenue" fill="#FF4D57" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="expense" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-[#111214] border border-white/5 rounded-xl p-5 md:p-6 space-y-6 overflow-hidden min-w-0 w-full">
          <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <PieChart size={16} className="text-[#FF4D57]" />
            <span>Expense Category Weight</span>
          </h3>
          <div className="h-[180px] w-full flex items-center justify-center min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={accountingData.monthlyTrends}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="expense"
                >
                  {accountingData.monthlyTrends.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#15171A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
            {accountingData.monthlyTrends.slice(0, 4).map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-[#A1A1AA] font-medium">{entry.name} Operations</span>
                </div>
                <span className="font-mono font-semibold text-white">{profile?.currency || 'INR'} {entry.expense.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <div className="bg-[#111214] border border-white/5 p-5 rounded-xl space-y-3 relative group overflow-hidden">
           <div className="absolute top-4 right-4 text-[#A1A1AA]/10 group-hover:text-white/5 transition-colors">
              <FileSpreadsheet size={48} />
           </div>
           <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Asset Inventory Valuation</h4>
           <p className="text-xs text-[#A1A1AA] max-w-sm">Aggregated monetary estimation of stocks, components, and inventory assets checked into workspaces.</p>
           <div className="pt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">{profile?.currency || 'INR'} 42,900</span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">Audited Asset</span>
           </div>
        </div>

        <div className="bg-[#111214] border border-white/5 p-5 rounded-xl space-y-3 relative group overflow-hidden">
           <div className="absolute top-4 right-4 text-[#A1A1AA]/10 group-hover:text-white/5 transition-colors">
              <FileText size={48} />
           </div>
           <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Quarterly Tax Provision Estimate</h4>
           <p className="text-xs text-[#A1A1AA] max-w-sm">Evaluated sales taxes (GST/VAT) computed safely based on issued receivables and cost write-offs.</p>
           <div className="pt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">{profile?.currency || 'INR'} 3,240</span>
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest flex items-center gap-1">Provisional</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ label, value, trend, positive, icon }: any) => (
  <div className="bg-[#111214] border border-white/5 p-4 rounded-xl space-y-3 hover:bg-[#15171A] transition-all min-w-0 w-full flex flex-col justify-between">
    <div className="flex justify-between items-start w-full">
      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[#A1A1AA]">
        {icon}
      </div>
      <div className={`flex items-center gap-0.5 text-[9px] font-bold tracking-wider uppercase ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trend}
      </div>
    </div>
    <div className="pt-2">
      <p className="text-[9px] font-semibold text-[#A1A1AA] uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-white mt-0.5 leading-none">{value}</p>
    </div>
  </div>
);
