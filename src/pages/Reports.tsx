import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Target,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Coins,
  Clock,
  HelpCircle,
  HelpCircle as InfoIcon
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths } from 'date-fns';
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
  Pie,
  Legend
} from 'recharts';

export const Reports: React.FC = () => {
  const { invoices, expenses, profile } = useStore();
  const settings = useStore((s: any) => s.settings) || { currencyDefault: 'INR' };
  const [activeTab, setActiveTab] = useState<'actuals' | 'sandbox' | 'tax_estimator'>('actuals');

  const [taxYear, setTaxYear] = useState<'2025-26' | '2024-25'>('2025-26');
  const [taxInterval, setTaxInterval] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual'>('annual');

  // Dynamic Tax Filing Estimator Sheet Calculations
  const taxEstimates = useMemo(() => {
    const baseYear = taxYear === '2025-26' ? 2025 : 2024;
    let startDate = new Date(baseYear, 3, 1).getTime(); // April 1st
    let endDate = new Date(baseYear + 1, 2, 31, 23, 59, 59).getTime(); // March 31st

    if (taxInterval === 'Q1') {
      startDate = new Date(baseYear, 3, 1).getTime(); // April 1
      endDate = new Date(baseYear, 5, 30, 23, 59, 59).getTime(); // June 30
    } else if (taxInterval === 'Q2') {
      startDate = new Date(baseYear, 6, 1).getTime(); // July 1
      endDate = new Date(baseYear, 8, 30, 23, 59, 59).getTime(); // Sep 30
    } else if (taxInterval === 'Q3') {
      startDate = new Date(baseYear, 9, 1).getTime(); // Oct 1
      endDate = new Date(baseYear, 11, 31, 23, 59, 59).getTime(); // Dec 31
    } else if (taxInterval === 'Q4') {
      startDate = new Date(baseYear + 1, 0, 1).getTime(); // Jan 1
      endDate = new Date(baseYear + 1, 2, 31, 23, 59, 59).getTime(); // March 31
    }

    const filteredInvoices = invoices.filter(i => i.date >= startDate && i.date <= endDate);
    const filteredExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);

    let grossSalesTaxable = 0;
    let taxOutputGSTCollected = 0;
    let taxOutputCGSTCollected = 0;
    let taxOutputSGSTCollected = 0;
    let taxOutputIGSTCollected = 0;
    let reverseChargeSalesCollected = 0;

    filteredInvoices.forEach(i => {
      const rate = i.exchangeRate || 1.0;
      const subtotalConverted = (i.subtotal || 0) * rate;
      const taxConverted = (i.taxTotal || 0) * rate;

      grossSalesTaxable += subtotalConverted;
      
      // Only append tax totals if reverse charge was not selected
      const isReverse = i.taxPreset === 'eu_vat' && i.isReverseCharge;
      if (!isReverse) {
         taxOutputGSTCollected += taxConverted;
      }

      if (i.taxPreset === 'india_gst') {
        if (i.gstType === 'cgst_sgst') {
          taxOutputCGSTCollected += taxConverted / 2;
          taxOutputSGSTCollected += taxConverted / 2;
        } else {
          taxOutputIGSTCollected += taxConverted;
        }
      } else if (isReverse) {
        reverseChargeSalesCollected += subtotalConverted;
      }
    });

    let grossExpensesDeductible = 0;
    let expTaxITCClaimable = 0;

    filteredExpenses.forEach(e => {
      grossExpensesDeductible += e.amount;
      // GST estimation on services is standard 18% inclusive
      const estTax = e.amount * (0.18 / 1.18); 
      expTaxITCClaimable += estTax;
    });

    const netSalesSurplus = grossSalesTaxable - grossExpensesDeductible;
    const netGstPayableLiability = Math.max(0, taxOutputGSTCollected - expTaxITCClaimable);

    const baseIncomeTaxRate = 0.25; 
    const baseEstimatedIncomeTax = netSalesSurplus > 0 ? netSalesSurplus * baseIncomeTaxRate : 0;
    const totalFilingLiability = netGstPayableLiability + baseEstimatedIncomeTax;

    return {
      grossSalesTaxable,
      taxOutputGSTCollected,
      taxOutputCGSTCollected,
      taxOutputSGSTCollected,
      taxOutputIGSTCollected,
      reverseChargeSalesCollected,
      grossExpensesDeductible,
      expTaxITCClaimable,
      netSalesSurplus,
      netGstPayableLiability,
      baseEstimatedIncomeTax,
      totalFilingLiability,
      invoicesCount: filteredInvoices.length,
      expensesCount: filteredExpenses.length
    };
  }, [invoices, expenses, taxYear, taxInterval]);

  const downloadTaxCSV = () => {
    const data = taxEstimates;
    const currency = settings?.currencyDefault || profile?.currency || 'INR';

    const csvRows = [
      ["NovaBill Compliance Accounts Engine — Dynamic Tax Summary Sheet"],
      ["Report Parameters"],
      ["Tax Assessment Year", taxYear],
      ["Reporting Interval", taxInterval],
      ["Default Settlement Base Currency", currency],
      [""],
      ["I. OUTWARD SUPPLIES & TAX COLLECTED (SALES)"],
      ["Line Item Category", "Metric Amount", "Description"],
      ["Total Gross Invoiced Revenue (Taxable Sales)", data.grossSalesTaxable.toFixed(2), "Converted aggregate business output sales"],
      ["Total Output Gst/Vat Collected", data.taxOutputGSTCollected.toFixed(2), "Sum of all tax collected, reverse charge excluded"],
      ["Central GST Amount (CGST - splitting)", data.taxOutputCGSTCollected.toFixed(2), "50% split for domestic intrastate transactions"],
      ["State GST Amount (SGST - splitting)", data.taxOutputSGSTCollected.toFixed(2), "50% split for domestic intrastate transactions"],
      ["Integrated GST Amount (IGST Consolidated)", data.taxOutputIGSTCollected.toFixed(2), "Consolidated IGST on interstate out-of-region sales (100%)"],
      ["Reverse-Charge EU VAT Trade Volume", data.reverseChargeSalesCollected.toFixed(2), "Zeroed transactions for foreign B2B clients (reverse charge applied)"],
      ["Total Invoice Count Represented", data.invoicesCount, "Num outward trades"],
      [""],
      ["II. DEDUCTIBLE OPERATIONAL COSTS & CREDIT (EXPENSES)"],
      ["Line Item Category", "Metric Amount", "Description"],
      ["Gross Operational Costs (Expenses Written)", data.grossExpensesDeductible.toFixed(2), "Total operational bills registered in corporate workspace"],
      ["Estimated Input Tax Credits (ITC Claimable)", data.expTaxITCClaimable.toFixed(2), "Estimated 18% standard compliance ITC off eligible workspace costs"],
      ["Total Expense Slips Tracked", data.expensesCount, "Num inward expenses"],
      [""],
      ["III. SUMMARY TAX ASSESSMENT ANALYSIS"],
      ["Metric Description", "Metric Value", "Accrued Notes"],
      ["Corporate EBITDA (Net Sales Surplus)", data.netSalesSurplus.toFixed(2), "Gross Taxable Profits (Gross Sales - Deductible Costs)"],
      ["Net GST/VAT Settlement Liability", data.netGstPayableLiability.toFixed(2), "Net Indirect Taxes Payable (Output GST Collected - Expenses ITC Credits)"],
      ["Estimated Corporate Income Tax (25% rate)", data.baseEstimatedIncomeTax.toFixed(2), "Evaluated corporate assessment income tax projections"],
      ["TOTAL ACCRUED PROVISION LIABILITIES PAYABLE", data.totalFilingLiability.toFixed(2), "Consolidated indirect indirect + direct accounting provision payable"],
      [""],
      ["DISCLAIMER: NovaBill compiled reports are provisions for informational purposes. Deliver directly to your professional accountant for validation."]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tax-sheet-summary-fy${taxYear}-${taxInterval}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Slider State for Idea 3: Strategic Forecast Scenario Sandbox
  const [forecastHorizon, setForecastHorizon] = useState<number>(6); // Months
  const [revenueMultiplier, setRevenueMultiplier] = useState<number>(20); // % Growth
  const [expenseMultiplier, setExpenseMultiplier] = useState<number>(10); // % Growth
  const [collectionDelay, setCollectionDelay] = useState<number>(30); // Days average

  const COLORS = ['#FF4D57', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'];

  // Current Actual Accounting Metrics
  const accountingData = useMemo(() => {
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

    // Top Expense Categories
    const categoriesMap: { [key: string]: number } = {};
    expenses.forEach(e => {
      categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
    });
    const categoryWeights = Object.entries(categoriesMap).map(([name, val]) => ({
      name,
      value: val
    })).sort((a, b) => b.value - a.value);

    return { totalRev, totalExp, profit, margin, monthlyTrends, categoryWeights };
  }, [invoices, expenses]);

  // Forecast Simulation Model (Idea 3)
  const forecastData = useMemo(() => {
    // 1. Calculate Average historical baseline metrics
    const historicalMonthsCount = Math.max(1, accountingData.monthlyTrends.length);
    const avgHistoricalRev = accountingData.totalRev > 0 
      ? accountingData.totalRev / historicalMonthsCount 
      : 60000; // default baseline helper
    const avgHistoricalExp = accountingData.totalExp > 0 
      ? accountingData.totalExp / historicalMonthsCount 
      : 25000; // default baseline helper

    // 2. Compute forecasting schedule month by month starting from next month
    const list = [];
    let cumulativeCash = Math.max(25000, accountingData.profit); // baseline reserve

    for (let i = 1; i <= forecastHorizon; i++) {
      const targetDate = addMonths(new Date(), i);
      const monthLabel = format(targetDate, "MMM yy");

      // Apply sales growth slider
      const baseProjectedRev = avgHistoricalRev * (1 + revenueMultiplier / 100);
      
      // Apply collection delay factor
      // Payment delays (days) dynamically shift incoming reserves, simulating lag
      const collectionsEfficiency = Math.max(0.3, 1 - (collectionDelay / 90));
      const effectiveRevenue = baseProjectedRev * collectionsEfficiency + (avgHistoricalRev * (1 - collectionsEfficiency));

      // Apply operational expense inflation slider
      const projectedExpense = avgHistoricalExp * (1 + expenseMultiplier / 100);
      
      const monthlyProfit = effectiveRevenue - projectedExpense;
      cumulativeCash += monthlyProfit;

      list.push({
        name: monthLabel,
        "Projected Revenue": Math.round(effectiveRevenue),
        "Projected Expense": Math.round(projectedExpense),
        "Projected Net Cashflow": Math.round(monthlyProfit),
        "Estimated Cash Reserve": Math.round(cumulativeCash),
        isGrowthTrend: monthlyProfit > 0
      });
    }

    const runwayMonths = avgHistoricalExp > 0 
      ? Math.round(Math.max(0, cumulativeCash) / avgHistoricalExp) 
      : 12;

    const totalScenarioRevenue = list.reduce((acc, current) => acc + current["Projected Revenue"], 0);
    const totalScenarioExpense = list.reduce((acc, current) => acc + current["Projected Expense"], 0);
    
    return { list, runwayMonths, totalScenarioRevenue, totalScenarioExpense, endingCashReserve: cumulativeCash };
  }, [
    accountingData, 
    forecastHorizon, 
    revenueMultiplier, 
    expenseMultiplier, 
    collectionDelay
  ]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 w-full overflow-hidden">
      
      {/* Page Title & Tab Navs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="text-[#FF4D57]" size={24} />
            <span>Executive Business Analytics Center</span>
          </h1>
          <p className="text-muted text-xs font-medium tracking-wide mt-1">
            Plunge into detailed ledger P&L analytics, tax estimations, and dynamic scenario forecasting.
          </p>
        </div>
        
        {/* Double Toggle Tabs */}
        <div className="flex flex-wrap bg-[#111214] p-1 rounded-xl border border-white/5 font-semibold text-xs shrink-0 self-stretch sm:self-auto justify-center gap-1">
          <button 
            type="button"
            onClick={() => setActiveTab('actuals')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'actuals' ? 'bg-[#FF4D57] text-white shadow-lg shadow-red-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PieChart size={14} />
            <span>Historical Actuals</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sandbox' ? 'bg-gradient-to-r from-[#FF4D57] to-pink-500 text-white shadow-lg shadow-pink-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'sandbox' ? 'animate-pulse' : ''} />
            <span>Scenario Projections Sandbox</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('tax_estimator')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tax_estimator' ? 'bg-[#FF4D57] text-white shadow-lg shadow-red-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>Tax Estimator Sheets</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'actuals' ? (
          <motion.div
            key="actuals"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Standard Stats Grid */}
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

            {/* Main Visuals actuals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full min-w-0">
              
              {/* Profit & Loss statement */}
              <div className="lg:col-span-2 bg-[#111214] border border-white/5 rounded-2xl p-5 md:p-6 space-y-6 overflow-hidden min-w-0 w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                    <LineChart size={16} className="text-[#FF4D57]" />
                    <span>Profit & Loss Statement (6-mo back)</span>
                  </h3>
                  <div className="flex gap-4 text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF4D57]" /> Revenue</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/15" /> Costs</div>
                  </div>
                </div>
                <div className="h-[280px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accountingData.monthlyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525B', fontSize: 10}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525B', fontSize: 10}} />
                      <Tooltip 
                        cursor={{fill: '#ffffff01'}}
                        contentStyle={{ backgroundColor: '#15171A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '11px', color: '#F5F5F5' }}
                      />
                      <Bar dataKey="revenue" fill="#FF4D57" radius={[4, 4, 0, 0]} barSize={16} />
                      <Bar dataKey="expense" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense category weight */}
              <div className="bg-[#111214] border border-white/5 rounded-2xl p-5 md:p-6 space-y-6 overflow-hidden min-w-0 w-full flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                    <PieChart size={16} className="text-[#FF4D57]" />
                    <span>Expense Category Weight</span>
                  </h3>
                  {accountingData.categoryWeights.length > 0 ? (
                    <div className="h-[180px] w-full flex items-center justify-center min-w-0 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={accountingData.categoryWeights}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {accountingData.categoryWeights.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#15171A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-xs text-muted text-center leading-normal">
                      No expense data filed in this workspace yet. Write expenses to see interactive charting weights.
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar mt-4 border-t border-white/5 pt-3">
                  {accountingData.categoryWeights.slice(0, 4).map((entry, i) => (
                    <div key={`${entry.name}-${i}`} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-[#A1A1AA] font-semibold truncate max-w-[120px]">{entry.name}</span>
                      </div>
                      <span className="font-mono font-bold text-white">{profile?.currency || 'INR'} {entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom auxiliary actuals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="bg-[#111214] border border-white/5 p-5 rounded-2xl space-y-3 relative group overflow-hidden">
                <div className="absolute top-4 right-4 text-[#A1A1AA]/10 group-hover:text-white/5 transition-colors">
                  <FileSpreadsheet size={48} />
                </div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Asset Inventory Valuation</h4>
                <p className="text-xs text-[#A1A1AA] max-w-sm leading-normal">Aggregated monetary estimation of stocks, components, and inventory assets checked into workspaces.</p>
                <div className="pt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white">{profile?.currency || 'INR'} 42,900</span>
                  <span className="text-[10px] font-semibold text-[#FF4D57] uppercase tracking-widest leading-none">Audited Asset</span>
                </div>
              </div>

              <div className="bg-[#111214] border border-white/5 p-5 rounded-2xl space-y-3 relative group overflow-hidden">
                <div className="absolute top-4 right-4 text-[#A1A1AA]/10 group-hover:text-white/5 transition-colors">
                  <FileText size={48} />
                </div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Quarterly Tax Provision Estimate</h4>
                <p className="text-xs text-[#A1A1AA] max-w-sm leading-normal">Evaluated sales taxes (GST/VAT) computed safely based on issued receivables and cost write-offs.</p>
                <div className="pt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white">{profile?.currency || 'INR'} 3,240</span>
                  <span className="text-[10px] font-semibold text-yellow-400 uppercase tracking-widest flex items-center gap-1 leading-none">Provisional</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'sandbox' ? (
          <motion.div
            key="sandbox"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header banner */}
            <div className="p-4 bg-gradient-to-r from-[#FF4D57]/10 to-transparent border border-[#FF4D57]/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF4D57]/20 border border-[#FF4D57]/30 flex items-center justify-center text-[#FF4D57] animate-pulse">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Strategic Scenario Projection Sandbox</h3>
                  <p className="text-xs text-[#A1A1AA] max-w-xl mt-0.5 leading-normal">
                    Play what-if modeling simulation rules based on payment receipts collections latency, future client growth scenarios, and operational expense inflation bounds.
                  </p>
                </div>
              </div>
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-widest bg-emerald-400/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                <Activity size={12} /> Predictive Engine Operational
              </div>
            </div>

            {/* Forecasting Split Grids */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Left Slider Control Panel (5 Cols) */}
              <div className="xl:col-span-5 space-y-4">
                
                {/* Control Center Container */}
                <div className="bg-[#111214] border border-white/5 rounded-2xl p-5 md:p-6 space-y-6">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <Cpu size={14} className="text-[#FF4D57]" />
                    <span>Projection Sandbox Scenarios</span>
                  </h3>

                  {/* Slider 1: Forecast Horizon */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#A1A1AA] font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <Calendar size={12} className="text-purple-400" />
                        A. Projection Horizon
                      </span>
                      <span className="font-mono font-black text-purple-400 bg-purple-400/10 px-2 py-0.5 border border-purple-400/10 rounded">
                        {forecastHorizon} Months
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="3" 
                      max="18" 
                      value={forecastHorizon} 
                      onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
                      className="w-full accent-purple-400 h-1.5 bg-white/5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-zinc-600 uppercase">
                      <span>3 Months (Short)</span>
                      <span>18 Months (Long-range)</span>
                    </div>
                  </div>

                  {/* Slider 2: Potential Sales growth */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#A1A1AA] font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-emerald-400" />
                        B. Future Invoice growth Rate
                      </span>
                      <span className="font-mono font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 border border-emerald-400/10 rounded">
                        {revenueMultiplier >= 0 ? `+${revenueMultiplier}` : revenueMultiplier}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="-50" 
                      max="200" 
                      value={revenueMultiplier} 
                      onChange={(e) => setRevenueMultiplier(parseInt(e.target.value))}
                      className="w-full accent-emerald-400 h-1.5 bg-white/5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-zinc-600 uppercase">
                      <span>-50% (Contraction)</span>
                      <span>+200% (Hyper Growth)</span>
                    </div>
                  </div>

                  {/* Slider 3: Cost Inflation */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#A1A1AA] font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <TrendingDown size={12} className="text-rose-400" />
                        C. Cost Inflation multiplier
                      </span>
                      <span className="font-mono font-black text-rose-400 bg-rose-400/10 px-2 py-0.5 border border-rose-400/10 rounded">
                        {expenseMultiplier >= 0 ? `+${expenseMultiplier}` : expenseMultiplier}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="-30" 
                      max="100" 
                      value={expenseMultiplier} 
                      onChange={(e) => setExpenseMultiplier(parseInt(e.target.value))}
                      className="w-full accent-rose-400 h-1.5 bg-white/5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-zinc-600 uppercase">
                      <span>-30% (Budget Cuts)</span>
                      <span>+100% (High Spend)</span>
                    </div>
                  </div>

                  {/* Slider 4: Collection delay */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#A1A1AA] font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <Clock size={12} className="text-yellow-400" />
                        D. Client Settlement Cycle Lag
                      </span>
                      <span className="font-mono font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 border border-yellow-400/10 rounded">
                        Net-{collectionDelay} Days
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="90" 
                      value={collectionDelay} 
                      onChange={(e) => setCollectionDelay(parseInt(e.target.value))}
                      className="w-full accent-yellow-400 h-1.5 bg-white/5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-zinc-600 uppercase">
                      <span>Instant Transfer</span>
                      <span>Net-90 (Standard Lag)</span>
                    </div>
                  </div>

                </div>

                {/* Simulated Business Metrics Outputs Card */}
                <div className="p-5 rounded-2xl bg-[#111214] border border-white/5 grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl text-left space-y-1">
                    <p className="text-[9px] font-semibold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1 text-purple-400">
                      <Zap size={10} /> Simulated runway
                    </p>
                    <p className="text-xl font-bold text-white">{forecastData.runwayMonths} Months</p>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Operation Lifespan</p>
                  </div>
                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl text-left space-y-1">
                    <p className="text-[9px] font-semibold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1 text-[#FF4D57]">
                      <Coins size={10} /> Ending Cash Reserve
                    </p>
                    <p className="text-xl font-bold text-white">
                      {profile?.currency || 'INR'} {Math.max(0, forecastData.endingCashReserve).toLocaleString()}
                    </p>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Liquid Cash Balance</p>
                  </div>
                </div>

              </div>

              {/* Right Chart Visualization Sandbox area (7 Cols) */}
              <div className="xl:col-span-7 bg-[#111214] border border-white/5 rounded-2xl p-5 md:p-6 space-y-6">
                
                {/* Chart Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                    <LineChart size={16} className="text-[#FF4D57]" />
                    <span>Projected Liquidity Allocation Strategy</span>
                  </h3>
                  <div className="flex gap-4 text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      Reserve Projection
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Inflow Scenario
                    </div>
                  </div>
                </div>

                {/* Recharts Area Projection */}
                <div className="h-[280px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData.list} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525B', fontSize: 10}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525B', fontSize: 10}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#15171A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '11px', color: '#F5F5F5' }}
                      />
                      <Area type="monotone" dataKey="Estimated Cash Reserve" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCash)" />
                      <Area type="monotone" dataKey="Projected Revenue" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Forecast Timeline Bar Ledger List */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none">Scenario Spreadsheet Projections Schedule</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[140px] overflow-y-auto custom-scrollbar pt-1.5">
                    {forecastData.list.map((mForecast, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between text-left space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white">{mForecast.name}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${mForecast.isGrowthTrend ? 'bg-emerald-500' : 'bg-[#FF4D57]'}`} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wide leading-none">Net Reserve</p>
                          <p className="font-mono text-xs font-bold text-[#A1A1AA]">{profile?.currency || 'INR'} {mForecast["Estimated Cash Reserve"].toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* AI Advisor Scenario Insights Panel */}
            <div className="p-6 rounded-3xl bg-[#111214] border border-white/5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Cpu size={14} className="text-yellow-400 animate-spin-slow" />
                <span>Smart Optimization Strategy Advisor Reports</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp size={14} />
                    <h4 className="text-xs font-bold text-white uppercase">Collections Delay Impact Mitigation</h4>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-normal">
                    {collectionDelay > 45 ? (
                      `Warning: Your custom selected settlement cycle lag of Net-${collectionDelay} days significantly drags down liquid reserve velocity. Under severe cost inflation, we recommend moving clients to structured milestones (e.g. 50% upfront, 50% Net-15) to shore up cash balance buffer.`
                    ) : (
                      `Outstanding choice! Operating with a tight settlement cycle latency of Net-${collectionDelay} days secures supreme liquidity. This safeguards your corporate accounts against operational overhead scaling inflation.`
                    )}
                  </p>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1 text-purple-400">
                    <Activity size={14} />
                    <h4 className="text-xs font-bold text-white uppercase">Operational Costs Buffer Strategy</h4>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-normal">
                    {expenseMultiplier > 40 ? (
                      `Caution: High projected operational cost expansion (+${expenseMultiplier}%) eats away your net margins. Adjust product rates or line item fees dynamically by modifying matching invoice inventories in the inventory manager.`
                    ) : (
                      `Secure margin levels: Maintain constant optimization guidelines in business settings. By limiting operational expense inflation bounds, your cumulative liquid reserve safely builds over the forecast timeline.`
                    )}
                  </p>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1 text-pink-500">
                    <Zap size={14} />
                    <h4 className="text-xs font-bold text-white uppercase">Strategic Capital allocation</h4>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-normal">
                    {forecastData.runwayMonths < 4 ? (
                      `Risk detected: Your runway profile of ${forecastData.runwayMonths} months falls below safe levels (6 mo recommended). We mandate prioritizing direct payment links or client cash deposits to protect operations.`
                    ) : (
                      `Flawless runway index: Your strategic cash projection models a highly robust ${forecastData.runwayMonths} months runway. You possess surplus funding suitable to reinvest into inventory scaling or client campaigns.`
                    )}
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        ) : (
          <motion.div
            key="tax_estimator"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header parameters selector */}
            <div className="p-5 bg-gradient-to-r from-red-500/10 via-pink-500/5 to-transparent border border-white/5 rounded-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500/10 to-pink-500/10 border border-white/10 flex items-center justify-center text-primary" style={{ color: '#FF4D57' }}>
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Dynamic Tax Filing Estimator Sheet</h3>
                  <p className="text-xs text-[#A1A1AA] max-w-xl mt-0.5 leading-normal">
                    Aggregate raw multi-currency sales, local domestic splits, reverse-charges, and cost deductions into compliant quarterly or annual filing provisions.
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex bg-[#111214] p-1 rounded-xl border border-white/5 font-semibold text-[11px]">
                  {(['2025-26', '2024-25'] as const).map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setTaxYear(y)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        taxYear === y ? 'bg-[#FF4D57] text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      FY {y}
                    </button>
                  ))}
                </div>

                <div className="flex bg-[#111214] p-1 rounded-xl border border-white/5 font-semibold text-[11px]">
                  {(['annual', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setTaxInterval(q)}
                      className={`px-3 py-1.5 rounded-lg transition-all uppercase ${
                        taxInterval === q ? 'bg-[#FF4D57] text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {q === 'annual' ? 'Full Year' : q}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={downloadTaxCSV}
                  className="bg-white hover:bg-zinc-100 text-black px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Export Accountant Sheet</span>
                </button>
              </div>
            </div>

            {/* Financial Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
               <StatsCard
                 label="Aggregate Gross Taxable Sales"
                 value={`${settings?.currencyDefault || profile?.currency || 'INR'} ${taxEstimates.grossSalesTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                 trend={`${taxEstimates.invoicesCount} Invoices represented`}
                 positive={true}
                 icon={<Coins size={16} />}
               />
               <StatsCard
                 label="Total Deductible Expenses"
                 value={`${settings?.currencyDefault || profile?.currency || 'INR'} ${taxEstimates.grossExpensesDeductible.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                 trend={`${taxEstimates.expensesCount} Operational Cost Slips`}
                 positive={false}
                 icon={<TrendingDown size={16} />}
               />
               <StatsCard
                 label="Net Taxable EBITDA Surplus"
                 value={`${settings?.currencyDefault || profile?.currency || 'INR'} ${taxEstimates.netSalesSurplus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                 trend="Subject to Corporate Assessments"
                 positive={taxEstimates.netSalesSurplus >= 0}
                 icon={<BarChart3 size={16} />}
               />
               <StatsCard
                 label="EST. TOTAL PROVISIONAL PAYABLE"
                 value={`${settings?.currencyDefault || profile?.currency || 'INR'} ${taxEstimates.totalFilingLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                 trend="Indirect + Direct Tax Provision"
                 positive={false}
                 icon={<Target size={16} />}
               />
            </div>

            {/* Structured Accounting Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
              
              {/* Outward Trading Revenue Liabilities Ledger (Sales) */}
              <div className="bg-[#111214] border border-white/5 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
                <div>
                   <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
                      <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                         <Coins className="text-[#10B981]" size={16} />
                         <span>I. Outward Output Supplies Accounts (Sales)</span>
                      </h4>
                      <span className="text-[10px] bg-emerald-400/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                         {taxEstimates.invoicesCount} Trades File
                      </span>
                   </div>

                   <p className="text-zinc-400 text-xs mt-3 leading-normal">
                      Summary list of sales receivables, output GST collected, CGST/SGST intrastate splits, and reverse charge tax exemption volumes converted into settlement currency.
                   </p>

                   <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                         <span className="text-zinc-500">Gross Taxable Outward Sales Volume</span>
                         <span className="font-mono font-bold text-white">
                            {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.grossSalesTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-white/5 pl-4 border-l-2 border-emerald-500/20">
                         <span className="text-zinc-500">Output GST / VAT Collected (Aggregate)</span>
                         <span className="font-mono font-bold text-white">
                            {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.taxOutputGSTCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-white/5 pl-8 border-l-2 border-emerald-500/10">
                         <span className="text-zinc-500">Domestic CGST Central Split (50%)</span>
                         <span className="font-mono font-bold text-zinc-400">
                            {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.taxOutputCGSTCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-white/5 pl-8 border-l-2 border-emerald-500/10">
                         <span className="text-zinc-500">Domestic SGST State Split (50%)</span>
                         <span className="font-mono font-bold text-zinc-400">
                            {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.taxOutputSGSTCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-white/5 pl-8 border-l-2 border-emerald-500/10">
                         <span className="text-zinc-500">Consolidated Domestic IGST (100%)</span>
                         <span className="font-mono font-bold text-zinc-400">
                            {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.taxOutputIGSTCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-white/5 pl-4 border-l-2 border-green-500/20">
                         <span className="text-zinc-500">Reverse-Charge EU VAT Exclusions</span>
                         <span className="font-mono font-bold text-green-400">
                            {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.reverseChargeSalesCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 text-[10px] text-[#A1A1AA] flex items-center gap-2 bg-emerald-950/20 -mx-6 -mb-6 p-4 rounded-b-3xl mt-6">
                   <HelpCircle className="text-emerald-400" size={14} />
                   <span>Reverse charges and multi-currency exchange adjustments are automatically incorporated according to international accounting parameters.</span>
                </div>
              </div>

              {/* Deductible Operational Costs Ledger (Inward Expenses) */}
              <div className="bg-[#111214] border border-white/5 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
                <div>
                   <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
                      <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                         <TrendingDown className="text-rose-400" size={16} />
                         <span>II. Deductible Operating Costs Ledger (Expenses)</span>
                      </h4>
                      <span className="text-[10px] bg-rose-400/10 border border-rose-500/20 text-rose-400 font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                         {taxEstimates.expensesCount} Slips
                      </span>
                   </div>

                   <p className="text-zinc-400 text-xs mt-3 leading-normal">
                      Aggregate operational bills and estimated claimable Input Tax Credits (ITC, standard 18% inclusive approximation) serving as offsets against outstanding output tax liabilities.
                   </p>

                   <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                         <span className="text-zinc-500">Gross Deductible Operating Expenses</span>
                         <span className="font-mono font-bold text-white">
                            {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.grossExpensesDeductible.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-white/5 pl-4 border-l-2 border-rose-500/20">
                         <span className="text-zinc-500">Estimated Input Tax Credits (ITC Claimable)</span>
                         <span className="font-mono font-bold text-rose-400">
                            {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.expTaxITCClaimable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-white/5 pl-4 border-l-2 border-yellow-500/20">
                         <span className="text-zinc-500">Average Standard Indirect Cost Offset Ratio</span>
                         <span className="font-mono font-bold text-yellow-400">
                            18% Consolidated
                         </span>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 text-[10px] text-[#A1A1AA] flex items-center gap-2 bg-rose-950/20 -mx-6 -mb-6 p-4 rounded-b-3xl mt-6">
                   <HelpCircle className="text-rose-400" size={14} />
                   <span>Registering operational invoices inside expenses is necessary to dynamically offset taxable outward supplies and lower net annual corporate payouts.</span>
                </div>
              </div>

            </div>

            {/* Consolidated Taxes Settlement Breakdown Summary Section */}
            <div className="p-6 rounded-3xl bg-[#111214] border border-white/5 space-y-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Target size={14} className="text-red-400" />
                <span>III. Consolidated Regulatory Tax Settlement Summary Estimate</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                   <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">A. Net Indirect Settlement Liability</h4>
                   <p className="text-sm text-[#A1A1AA] leading-normal text-left">
                      Outstanding output GST/VAT collected from global billing minus operational input tax credit (ITC) offsets:
                   </p>
                   <p className="pt-2 text-lg font-bold text-white font-mono leading-none">
                      {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.netGstPayableLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                   <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">B. Estimated Corporate Income Tax</h4>
                   <p className="text-sm text-[#A1A1AA] leading-normal text-left">
                      Provision assessed for income tax computed at standard 25% corporate bracket on net operational profit margin (EBITDA surplus):
                   </p>
                   <p className="pt-2 text-lg font-bold text-white font-mono leading-none">
                      {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.baseEstimatedIncomeTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                   <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-sans">C. Consolidated Provisioning Balance Due</h4>
                   <p className="text-sm text-[#A1A1AA] leading-normal text-left">
                      Final unified provision representing both local indirect VAT obligations and estimated direct income taxes accrued for fiscal accountants:
                   </p>
                   <p className="pt-2 text-lg font-bold text-primary font-mono leading-none" style={{ color: '#FF4D57' }}>
                      {settings?.currencyDefault || profile?.currency || 'INR'} {taxEstimates.totalFilingLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      <p className="text-[9px] font-semibold text-[#A1A1AA] uppercase tracking-wider text-left">{label}</p>
      <p className="text-lg font-bold text-white mt-0.5 leading-none text-left">{value}</p>
    </div>
  </div>
);
