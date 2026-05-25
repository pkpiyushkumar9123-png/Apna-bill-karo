import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieIcon, 
  Activity, 
  Calendar,
  Filter
} from 'lucide-react';

const revenueData = [
  { month: 'Jan', revenue: 45000, profit: 32000, growth: 12 },
  { month: 'Feb', revenue: 52000, profit: 38000, growth: 15 },
  { month: 'Mar', revenue: 48000, profit: 35000, growth: -7 },
  { month: 'Apr', revenue: 61000, profit: 45000, growth: 27 },
  { month: 'May', revenue: 55000, profit: 41000, growth: -9 },
  { month: 'Jun', revenue: 67000, profit: 52000, growth: 21 },
  { month: 'Jul', revenue: 72000, profit: 58000, growth: 18 },
];

const customerData = [
  { name: 'Retained', value: 400 },
  { name: 'New', value: 300 },
  { name: 'Churned', value: 50 },
];

const COLORS = ['#FF4444', '#3B82F6', '#10B981', '#F59E0B'];

export const Analytics: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 font-medium">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Deep Analytics</h1>
          <p className="text-muted text-sm">Advanced insights into your financial health and growth trajectories.</p>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button className="glass px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 text-muted hover:text-white transition-all shrink-0">
            <Calendar size={16} />
            Last 6 Months
          </button>
          <button className="glass px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 text-muted hover:text-white transition-all shrink-0">
            <Filter size={16} />
            Filter By Service
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Average Deal Size" value="$4,250.00" trend="+18%" isPositive={true} />
        <MetricCard label="CLV (Cust. Lifetime Value)" value="$12,840.00" trend="+5.4%" isPositive={true} />
        <MetricCard label="Churn Rate" value="1.2%" trend="-0.4%" isPositive={true} />
        <MetricCard label="Profit Margin" value="68.4%" trend="-2.1%" isPositive={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Chart */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2 italic">
               <Activity size={18} className="text-primary" />
               Revenue vs Profit Growth
            </h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Revenue
               </div>
               <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  Profit
               </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={revenueData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                 <XAxis dataKey="month" stroke="#8E9299" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                 <YAxis stroke="#8E9299" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                 <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                 <Bar dataKey="revenue" fill="#FF4444" radius={[4, 4, 0, 0]} barSize={24} />
                 <Bar dataKey="profit" fill="#ffffff10" radius={[4, 4, 0, 0]} barSize={24} />
               </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Segments */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2 italic">
               <PieIcon size={18} className="text-primary" />
               Customer Segmentation
            </h3>
            <button className="text-[10px] uppercase font-bold text-primary hover:underline">Download Data</button>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-[240px] w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {customerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-4 w-full">
               {customerData.map((entry, index) => (
                 <div key={`${entry.name}-${index}`} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                       <span className="text-sm font-medium">{entry.name}</span>
                    </div>
                    <span className="font-mono font-bold">{entry.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Line Chart for Growth Rate */}
        <div className="lg:col-span-2 glass-card">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="font-bold text-lg">Growth Trajectory</h3>
                 <p className="text-xs text-muted">Percentage increase month-over-month</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                 <TrendingUp size={24} />
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={revenueData}>
                    <defs>
                      <filter id="shadow" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="0" dy="4" result="offsetblur" />
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.5" />
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <XAxis dataKey="month" stroke="#8E9299" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#8E9299" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="growth" 
                      stroke="#FF4444" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#FF4444', strokeWidth: 2, stroke: '#050505' }} 
                      activeDot={{ r: 8 }}
                      filter="url(#shadow)"
                    />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, trend, isPositive }: any) => (
  <div className="glass-card">
    <div className="text-[10px] text-muted uppercase font-black tracking-widest mb-2">{label}</div>
    <div className="flex items-end justify-between">
       <span className="text-2xl font-black font-mono tracking-tighter italic">{value}</span>
       <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded bg-white/5 border border-white/5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
       </div>
    </div>
  </div>
);
