
import React, { useState, useMemo } from 'react';
import { PoundSterling, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Download, Filter, Calendar, FileText, DollarSign, AlertCircle, CheckCircle2, Eye, Plus, Zap, Loader2, ShieldAlert, Sparkles, Info } from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import { runRawPrompt, parseAIJSON } from '@/services/geminiService';
import { Transaction } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const FinancialsView: React.FC = () => {
  const { addToast } = useToast();
  const { transactions, projects, addTransaction } = useProjects();
  const { requireRole, currentTenant } = useTenant();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'CASHFLOW' | 'BUDGET' | 'TRANSACTIONS'>('CASHFLOW');
  const [filterMonth, setFilterMonth] = useState('2025-12');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // AI State
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastData, setForecastData] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [isAnalyzingInsights, setIsAnalyzingInsights] = useState(false);

  const stats = useMemo(() => {
    const totalRev = transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
    const totalCost = transactions.reduce((sum, t) => t.type === 'expense' ? sum + Math.abs(t.amount) : sum, 0);
    const netProfit = totalRev - totalCost;
    const margin = totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : 0;
    return { totalRev, totalCost, netProfit, margin };
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    return months.map((m, i) => {
      const monthPrefix = `${currentYear}-${(i + 1).toString().padStart(2, '0')}`;
      const monthTxns = transactions.filter(t => t.date.startsWith(monthPrefix));
      const revenue = monthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Calculate a "height" percentage for the chart (relative to a max, e.g. 100k)
      const maxVal = 100000;
      const revHeight = Math.min(95, Math.max(5, (revenue / maxVal) * 100)) || 5;
      const expHeight = Math.min(100, (expense / maxVal) * 100) || 5;

      return { month: m, revenue, expense, revHeight, expHeight };
    });
  }, [transactions]);

  const costCodes = useMemo(() => [
    { code: '03-3000', desc: 'Concrete', budget: 250000, spent: transactions.filter(t => t.category === 'Materials' && t.description.includes('Concrete')).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 210000, var: 16 },
    { code: '05-1200', desc: 'Structural Steel', budget: 400000, spent: 380000, var: 5 },
    { code: '09-2000', desc: 'Plaster & Gypsum', budget: 120000, spent: 45000, var: -62 },
    { code: '15-4000', desc: 'Plumbing', budget: 180000, spent: 175000, var: 3 },
    { code: '16-1000', desc: 'Electrical', budget: 220000, spent: 235000, var: 7 },
  ], [transactions]);

  const filteredTransactions = transactions.filter(t => t.date.startsWith(filterMonth));

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTxn: Transaction = {
      id: crypto.randomUUID(),
      companyId: '', // Added by context
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string) * (formData.get('type') === 'expense' ? -1 : 1),
      type: formData.get('type') as ('income' | 'expense'),
      category: formData.get('category') as string,
      status: 'completed',
      projectId: formData.get('projectId') as string,
    };
    await addTransaction(newTxn);
    setShowAddModal(false);
  };

  const runAIForecast = async () => {
    setIsForecasting(true);
    try {
      const history = monthlyData.map(m => ({ month: m.month, rev: m.revenue, exp: m.expense }));
      const prompt = `
            Analyze this construction financial history: ${JSON.stringify(history)}.
            Predict the next 3 months of Cash Flow. 
            Return JSON:
            {
                "forecast": [
                    { "month": "Jan", "rev": number, "exp": number },
                    { "month": "Feb", "rev": number, "exp": number },
                    { "month": "Mar", "rev": number, "exp": number }
                ],
                "confidenceScore": number,
                "reasoning": "Brief explanation"
            }
        `;
      const result = await runRawPrompt(prompt, {
        model: 'gemini-3-pro-preview',
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 1024 }
      });
      setForecastData(parseAIJSON(result));
    } catch (e) {
      addToast("Financial forecasting failed.", "error");
    } finally {
      setIsForecasting(false);
    }
  };

  const generateRiskInsights = async () => {
    setIsAnalyzingInsights(true);
    try {
      const codes = JSON.stringify(costCodes);
      const prompt = `
            Analyze these construction cost codes: ${codes}.
            Identify 3 high-priority financial risks (e.g. materials price hikes, labor overruns).
            Return JSON array:
            [
                { "title": "Risk Name", "severity": "High"|"Medium", "code": "03-3000", "mitigation": "Action plan", "impact": "£X amount" }
            ]
        `;
      const result = await runRawPrompt(prompt, {
        model: 'gemini-3-pro-preview',
        temperature: 0.4
      });
      setAiInsights(parseAIJSON(result));
    } catch (e) {
      console.error("AI Insight failure", e);
    } finally {
      setIsAnalyzingInsights(false);
    }
  };

  if (!requireRole(['company_admin', 'super_admin'])) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-8 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Access Restricted</h2>
        <p className="text-zinc-500 max-w-md mb-8">
          Financial Command is only available to Company Administrators.
          Please contact your system administrator if you believe this is an error.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 transition-all"
        >
          Return to Safety
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-1 flex items-center gap-3">
            <PoundSterling className="text-[#0f5c82]" /> Financial Command
          </h1>
          <p className="text-zinc-500">Real-time budget tracking and cost control.</p>
        </div>
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('CASHFLOW')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'CASHFLOW' ? 'bg-white text-[#0f5c82] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Cash Flow
          </button>
          <button
            onClick={() => setViewMode('BUDGET')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'BUDGET' ? 'bg-white text-[#0f5c82] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Budget Variance
          </button>
          <button
            onClick={() => setViewMode('TRANSACTIONS')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'TRANSACTIONS' ? 'bg-white text-[#0f5c82] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Transactions
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-zinc-500 text-xs font-bold uppercase">Total Revenue</div>
            <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded font-bold">+{(stats.totalRev / 10000).toFixed(0)}%</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900">£{(stats.totalRev / 1000000).toFixed(1)}M</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-zinc-500 text-xs font-bold uppercase">Total Costs</div>
            <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded font-bold">+{(stats.totalCost / 10000).toFixed(0)}%</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900">£{(stats.totalCost / 1000000).toFixed(1)}M</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-zinc-500 text-xs font-bold uppercase">Net Profit</div>
            <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded font-bold">+{(stats.netProfit / 10000).toFixed(0)}%</span>
          </div>
          <div className="text-3xl font-bold text-[#0f5c82]">£{(stats.netProfit / 1000000).toFixed(1)}M</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-zinc-500 text-xs font-bold uppercase">Margin</div>
          </div>
          <div className="text-3xl font-bold text-zinc-900">{stats.margin}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm min-h-[350px] flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-bold text-zinc-800 flex items-center gap-2">
              {viewMode === 'CASHFLOW' ? 'Cash Flow Analysis (YTD)' : 'Budget vs Actual by Phase'}
              {forecastData && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">AI Forecast Active</span>}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={runAIForecast}
                disabled={isForecasting}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
              >
                {isForecasting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                AI Forecast
              </button>
              <button className="text-zinc-400 hover:text-[#0f5c82] p-1.5 hover:bg-zinc-50 rounded-lg transition-colors"><Download size={18} /></button>
            </div>
          </div>

          <div className="flex-1 relative w-full flex items-end gap-3 px-4 border-b border-l border-zinc-100 mb-2 mt-8">
            {monthlyData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end h-full gap-1 group cursor-pointer relative">
                <div
                  className="w-full bg-[#0f5c82] rounded-t-sm opacity-90 group-hover:opacity-100 transition-all relative"
                  style={{ height: `${data.revHeight}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    Rev: £{(data.revenue / 1000).toFixed(0)}k
                  </div>
                </div>
                {viewMode === 'CASHFLOW' && (
                  <div
                    className="w-full bg-zinc-200 rounded-b-sm border-t border-white/20"
                    style={{ height: `${data.expHeight * 0.6}%` }}
                  ></div>
                )}
              </div>
            ))}

            {/* Forecast Overlay */}
            {forecastData && forecastData.forecast.map((f: any, i: number) => (
              <div key={`forecast-${i}`} className="flex-1 flex flex-col justify-end h-full gap-1 group cursor-pointer opacity-50 relative">
                <div className="absolute inset-0 bg-purple-500/5 -z-10 rounded-lg"></div>
                <div
                  className="w-full bg-purple-500 rounded-t-sm border-2 border-dashed border-purple-300 relative"
                  style={{ height: `${(f.rev / 100000) * 100 || 10}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-purple-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    Forecast Rev: £{(f.rev / 1000).toFixed(0)}k
                  </div>
                </div>
                <div
                  className="w-full bg-zinc-400 rounded-b-sm border-2 border-dashed border-zinc-300"
                  style={{ height: `${(f.exp / 100000) * 60 || 10}%` }}
                ></div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-purple-600 uppercase italic">Forecast</div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6 text-[10px] font-bold text-zinc-400 px-4 uppercase tracking-wider">
            {monthlyData.map(d => <span key={d.month}>{d.month}</span>)}
            {forecastData && forecastData.forecast.map((f: any) => <span key={f.month} className="text-purple-400">{f.month}*</span>)}
          </div>

          {forecastData && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100 flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Info size={16} /></div>
              <div className="text-xs text-purple-800 leading-tight">
                <span className="font-bold">AI Insight:</span> {forecastData.reasoning}
                <span className="ml-2 font-black text-purple-900">(Confidence: {forecastData.confidenceScore}%)</span>
              </div>
            </div>
          )}
        </div>

        {/* Cost Code Breakdown & AI Risks */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-zinc-800">Budget Breakdown</h3>
            <button
              onClick={generateRiskInsights}
              disabled={isAnalyzingInsights}
              className="text-[#0f5c82] hover:bg-blue-50 p-1.5 rounded-lg transition-all"
              title="AI Risk Analysis"
            >
              {isAnalyzingInsights ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
            {aiInsights.length > 0 && (
              <div className="space-y-3 mb-6 bg-red-50/50 p-4 rounded-xl border border-red-100 animate-in slide-in-from-top-4">
                <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={12} /> Priority Financial Risks
                </h4>
                {aiInsights.map((risk, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-zinc-900 pr-2 leading-tight">{risk.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${risk.severity === 'High' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>{risk.severity}</span>
                    </div>
                    <div className="text-[10px] text-zinc-600 italic">"Impact: {risk.impact}"</div>
                    <div className="mt-1 p-2 bg-zinc-50 rounded text-[9px] text-[#0f5c82] font-medium leading-snug">
                      <span className="font-bold mr-1 uppercase text-[8px]">Mitigation:</span> {risk.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {costCodes.map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex justify-between text-sm font-bold text-zinc-900 mb-1 leading-none">
                  <span>{item.desc}</span>
                  <span className="font-mono text-[10px] text-zinc-500 pr-4">£{(item.spent / 1000).toFixed(0)}k</span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-1 relative border border-zinc-50">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${item.var > 10 ? 'bg-red-500' : item.var > 0 ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, (item.spent / item.budget) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight">
                  <span className="text-zinc-400 font-mono">{item.code}</span>
                  <span className={item.var > 0 ? 'text-red-500' : 'text-green-500'}>
                    {item.var > 0 ? `+${item.var}% OVER` : `${Math.abs(item.var)}% UNDER`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-lg">
            Generate Comprehensive Audit
          </button>
        </div>
      </div>

      {/* Transactions View */}
      {viewMode === 'TRANSACTIONS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-zinc-900">Transaction History</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0f5c82] text-white rounded-lg text-sm font-medium hover:bg-[#0c4a6e] transition-colors"
              >
                <Plus size={16} /> Add Transaction
              </button>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0f5c82] outline-none"
              />
              <button className="text-zinc-400 hover:text-[#0f5c82]"><Download size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((txn) => (
                <div
                  key={txn.id}
                  onClick={() => setSelectedTransaction(txn)}
                  className="bg-white border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${txn.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {txn.type === 'income' ? (
                        <ArrowDownRight className="text-green-600" size={20} />
                      ) : (
                        <ArrowUpRight className="text-red-600" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900">{txn.description}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{txn.category}</span>
                        {txn.status === 'pending' ? (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded flex items-center gap-1">
                            <AlertCircle size={12} /> Pending
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.type === 'income' ? '+' : '-'}£{Math.abs(txn.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500">{txn.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-zinc-500">
                No transactions for {filterMonth}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-lg ${selectedTransaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={`${selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`} size={24} />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">{selectedTransaction.description}</h2>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-zinc-500 uppercase">Amount</p>
                <p className={`text-2xl font-bold ${selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'}£{Math.abs(selectedTransaction.amount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Date</p>
                <p className="font-medium text-zinc-900">{new Date(selectedTransaction.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase">Category</p>
                <p className="font-medium text-zinc-900">{selectedTransaction.category}</p>
              </div>
              {selectedTransaction.invoice && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase">Reference</p>
                  <p className="font-medium text-zinc-900">{selectedTransaction.invoice}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500 uppercase">Status</p>
                <div className="flex items-center gap-1 mt-1">
                  {selectedTransaction.status === 'pending' ? (
                    <>
                      <AlertCircle size={14} className="text-amber-600" />
                      <span className="text-sm text-amber-600 font-medium">Pending</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Completed</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTransaction(null)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialsView;
