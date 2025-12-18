import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Truck, BarChart3, Plus, Search, Filter, Check, AlertCircle, Sparkles, CheckCircle2, Clock, MapPin, TrendingUp, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useProjects } from '@/contexts/ProjectContext';
import { PurchaseOrder, Vendor, Transaction } from '@/types';
import SupplyChainIntelligence from '@/components/SupplyChainIntelligence';
import { runRawPrompt, parseAIJSON } from '@/services/geminiService';

const ProcurementView: React.FC = () => {
  const { addToast } = useToast();
  const { inventory, transactions, addTransaction } = useProjects();
  const [activeTab, setActiveTab] = useState<'VENDORS' | 'ORDERS' | 'APPROVALS' | 'LOGISTICS'>('VENDORS');
  const [showSmartPO, setShowSmartPO] = useState(false);
  const [poGenerating, setPoGenerating] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const [isAnalyzingLogistics, setIsAnalyzingLogistics] = useState(false);
  const [logisticsRisks, setLogisticsRisks] = useState<Record<string, any>>({});
  const [approverComment, setApproverComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendedVendors, setRecommendedVendors] = useState<any[]>([]);
  const [isFindingVendors, setIsFindingVendors] = useState(false);

  const lowStockItems = inventory.filter(item => item.stock <= item.threshold);

  const VENDORS: Vendor[] = [
    { id: 'v1', name: 'Elite Steel Co.', category: 'Metal', contact: 'Mark Evans', email: 'mark@elitesteel.com', rating: 95, performance: 95, activeOrders: 3, spend: '£45,200', status: 'Preferred', reliabilityScore: 98, averageDeliveryDays: 3 },
    { id: 'v2', name: 'Global Concrete', category: 'Aggregates', contact: 'Sarah Chen', email: 'sarah@globalconcrete.com', rating: 92, performance: 92, activeOrders: 5, spend: '£32,100', status: 'Active', reliabilityScore: 94, averageDeliveryDays: 2 },
    { id: 'v3', name: 'BuildRight Supplies', category: 'General', contact: 'Tom Harris', email: 'tom@buildright.com', rating: 88, performance: 88, activeOrders: 2, spend: '£12,800', status: 'Review', reliabilityScore: 85, averageDeliveryDays: 5 },
    { id: 'v4', name: 'Premier Timber', category: 'Wood', contact: 'Lucy West', email: 'lucy@premiertimber.com', rating: 97, performance: 97, activeOrders: 1, spend: '£28,400', status: 'Preferred', reliabilityScore: 99, averageDeliveryDays: 4 }
  ];

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: 'po1',
      number: 'PO-2025-895',
      vendor: 'Premier Steel',
      date: '2025-12-02',
      amount: 45000,
      status: 'pending_approval',
      createdBy: 'John Anderson',
      items: [
        { description: 'Structural Steel Beams (Grade A)', quantity: 50, unitPrice: 800, total: 40000 },
        { description: 'Bolts & Fasteners Kit', quantity: 10, unitPrice: 500, total: 5000 }
      ],
      approvers: [
        { id: 'a1', name: 'Sarah Mitchell', role: 'Finance Manager', status: 'pending' },
        { id: 'a2', name: 'Mike Thompson', role: 'Project Manager', status: 'pending' }
      ],
      notes: 'Urgent: Required for Phase 2 foundation work'
    },
    {
      id: 'po2',
      number: 'PO-2025-894',
      vendor: 'City Lumber Supply',
      date: '2025-12-01',
      amount: 28500,
      status: 'approved',
      createdBy: 'Emma Wilson',
      items: [
        { description: 'Treated Lumber (2x4x8)', quantity: 200, unitPrice: 120, total: 24000 },
        { description: 'Plywood Sheets (3/4")', quantity: 50, unitPrice: 90, total: 4500 }
      ],
      approvers: [
        { id: 'a3', name: 'Sarah Mitchell', role: 'Finance Manager', status: 'approved', timestamp: '2025-12-01 10:30', comment: 'Approved. Budget allocated.' },
        { id: 'a4', name: 'Mike Thompson', role: 'Project Manager', status: 'approved', timestamp: '2025-12-01 11:00' }
      ],
      notes: 'Standard materials reorder'
    }
  ]);

  const analyzeLogisticsRisks = async () => {
    const activeOrders = purchaseOrders.filter(po => po.status === 'approved' || po.status === 'completed');
    if (activeOrders.length === 0) return;
    setIsAnalyzingLogistics(true);
    try {
      const data = activeOrders.map(po => ({ number: po.number, vendor: po.vendor, date: po.date }));
      const prompt = `Analyze these construction material shipments: ${JSON.stringify(data)}. Return JSON: { risks: { [poNumber]: { probability: number, reason: string } } }`;
      const res = await runRawPrompt(prompt, { model: 'gemini-1.5-flash', responseMimeType: 'application/json' });
      const result = parseAIJSON(res);
      setLogisticsRisks(result.risks || {});
    } catch (e) {
      console.error("Logistics analysis failed", e);
    } finally {
      setIsAnalyzingLogistics(false);
    }
  };

  const findRecommendedVendors = async (item: string) => {
    setIsFindingVendors(true);
    try {
      const prompt = `Recommend top 2 vendors for "${item}" from: ${JSON.stringify(VENDORS)}. Return JSON: { recommendations: [{name, reason, score}] }`;
      const res = await runRawPrompt(prompt, { model: 'gemini-1.5-flash', responseMimeType: 'application/json' });
      const data = parseAIJSON(res);
      setRecommendedVendors(data.recommendations || []);
    } catch (e) {
      setRecommendedVendors(VENDORS.slice(0, 2).map(v => ({ name: v.name, reason: "Historical preferred vendor", score: v.rating * 10 })));
    } finally {
      setIsFindingVendors(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'LOGISTICS') analyzeLogisticsRisks();
  }, [activeTab]);

  useEffect(() => {
    if (showSmartPO && lowStockItems.length > 0) findRecommendedVendors(lowStockItems[0].name);
  }, [showSmartPO]);

  const filteredOrders = purchaseOrders.filter(po =>
    po.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (po: PurchaseOrder, approverId: string) => {
    const updatedOrders = purchaseOrders.map(p => {
      if (p.id !== po.id) return p;
      const updatedApprovers = p.approvers.map(a =>
        a.id === approverId ? { ...a, status: 'approved' as const, timestamp: new Date().toLocaleString(), comment: approverComment } : a
      );
      const allApproved = updatedApprovers.every(a => a.status !== 'pending' && a.status !== 'rejected');
      const updatedPO = { ...p, approvers: updatedApprovers, status: (allApproved ? 'approved' : 'pending_approval') as any };

      if (allApproved) {
        addTransaction({
          id: `txn-${Date.now()}`,
          companyId: 'c1',
          projectId: po.projectId || 'p1',
          date: new Date().toISOString().split('T')[0],
          description: `PO ${po.number} Approval: ${po.vendor}`,
          amount: po.amount,
          type: 'expense',
          category: 'Procurement',
          status: 'pending',
          linkedPurchaseOrderId: po.id
        });
        addToast(`PO ${po.number} approved and transaction recorded.`, "success");
      }
      return updatedPO;
    });
    setPurchaseOrders(updatedOrders);
    setApproverComment('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="mb-8">
        <SupplyChainIntelligence />
      </div>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-1 flex items-center gap-3">
            <ShoppingCart className="text-[#0f5c82]" /> Intelligent Procurement
          </h1>
          <p className="text-zinc-500">Vendor management, smart reordering, and supply chain tracking.</p>
        </div>
        <button
          onClick={() => setShowSmartPO(true)}
          className="bg-[#0f5c82] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#0c4a6e] shadow-lg flex items-center gap-2 transition-all"
        >
          <Sparkles size={18} className="text-yellow-300" /> Smart Reorder
        </button>
      </div>

      <div className="flex gap-1 border-b border-zinc-200 mb-6">
        {['VENDORS', 'ORDERS', 'APPROVALS', 'LOGISTICS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab ? 'border-[#0f5c82] text-[#0f5c82]' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          >
            {tab === 'VENDORS' && <Truck size={16} />}
            {tab === 'ORDERS' && <Package size={16} />}
            {tab === 'APPROVALS' && <CheckCircle2 size={16} />}
            {tab === 'LOGISTICS' && <MapPin size={16} />}
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'VENDORS' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Vendor Name</th>
                <th className="px-6 py-4 font-medium">Performance</th>
                <th className="px-6 py-4 font-medium">Active Orders</th>
                <th className="px-6 py-4 font-medium">Total Spend</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {VENDORS.map((v, i) => (
                <tr key={i} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-zinc-800">{v.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full bg-green-500`} style={{ width: `${v.rating}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-zinc-500">{v.rating}/100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">{v.activeOrders}</td>
                  <td className="px-6 py-4 font-mono text-zinc-600">{v.spend}</td>
                  <td className="px-6 py-4 text-xs font-bold uppercase text-purple-700">{v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'ORDERS' && (
          <div className="p-6 space-y-4">
            {filteredOrders.map(po => (
              <div key={po.id} className="border border-zinc-200 rounded-lg p-4 hover:shadow-md cursor-pointer">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">{po.number} - {po.vendor}</h4>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">{po.status}</span>
                </div>
                <p className="text-sm font-mono mt-2 text-zinc-900">£{po.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'APPROVALS' && (
          <div className="p-6">
            {purchaseOrders.filter(p => p.status === 'pending_approval').map(po => (
              <div key={po.id} className="border border-amber-200 bg-amber-50 p-4 rounded-xl mb-4">
                <div className="flex justify-between mb-4">
                  <h4 className="font-bold">{po.number} - {po.vendor}</h4>
                  <span className="font-bold">£{po.amount.toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  {po.approvers.map(a => (
                    <div key={a.id} className="bg-white p-3 rounded-lg border border-amber-100 flex justify-between items-center">
                      <div><p className="font-bold">{a.name}</p><p className="text-xs text-zinc-500">{a.role}</p></div>
                      {a.status === 'pending' && <button onClick={() => handleApprove(po, a.id)} className="px-3 py-1 bg-green-600 text-white text-xs rounded">Approve</button>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'LOGISTICS' && (
          <div className="p-6 space-y-8 animate-in fade-in transition-all">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-zinc-900 rounded-2xl p-6 relative overflow-hidden min-h-[400px]">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80')] bg-cover"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-white font-bold flex items-center gap-2 mb-1"><MapPin className="text-blue-400" /> Supply Chain Map</h3>
                  <p className="text-zinc-500 text-xs mb-6">AI processing geo-transit and regional weather volatility.</p>
                  <div className="flex-1 bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center mb-6">
                    <Truck className="text-blue-400 animate-pulse mb-2" size={40} />
                    <span className="text-white font-mono text-xs">EN ROUTE: PO-2025-894</span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {VENDORS.slice(0, 3).map((v, i) => (
                      <div key={i} className="min-w-[150px] bg-white/5 border border-white/10 p-2 rounded-lg backdrop-blur-md">
                        <p className="text-[10px] text-white font-bold truncate">{v.name}</p>
                        <p className="text-[9px] text-zinc-400">ETA: {i + 3} Days</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold text-orange-900 uppercase flex items-center gap-2 mb-4"><AlertCircle size={16} /> AI Transit Risk</h4>
                  <div className="space-y-4">
                    {purchaseOrders.filter(p => p.status === 'approved' || p.status === 'completed').map(po => (
                      <div key={po.id} className="border-l-2 border-orange-200 pl-3">
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span className="text-zinc-400">{po.number}</span>
                          <span className="text-orange-600">{logisticsRisks[po.number]?.probability || 'Low'}% RISK</span>
                        </div>
                        <p className="text-sm font-bold">{po.vendor}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 italic">{logisticsRisks[po.number]?.reason || 'Standard transit detected.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showSmartPO && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><Sparkles className="text-[#0f5c82]" /> AI Smart Reorder</h3>
            {isFindingVendors ? <p className="animate-pulse">Finding best local matches...</p> : (
              <div className="space-y-4">
                {recommendedVendors.map((v, i) => (
                  <div key={i} className="p-3 border border-zinc-100 rounded-xl bg-zinc-50">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-zinc-900">{v.name}</p>
                      <span className="text-blue-600 font-bold text-xs">{v.score}% match</span>
                    </div>
                    <p className="text-xs text-zinc-500 italic">{v.reason}</p>
                  </div>
                ))}
                <button onClick={() => setShowSmartPO(false)} className="w-full py-3 bg-[#0f5c82] text-white rounded-xl font-bold mt-4">Generate Suggested PO</button>
              </div>
            )}
            <button onClick={() => setShowSmartPO(false)} className="w-full py-2 text-zinc-500 text-sm mt-2">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementView;
