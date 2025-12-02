
import React, { useState } from 'react';
import { ShoppingCart, Package, Truck, BarChart3, Plus, Search, Filter, Check, AlertCircle, Sparkles, CheckCircle2, Clock, User, Send, Trash2, Edit, X, FileText, DollarSign, TrendingUp } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  number: string;
  vendor: string;
  date: string;
  amount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'completed';
  items: OrderItem[];
  createdBy: string;
  approvers: Approver[];
  notes: string;
}

interface OrderItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Approver {
  id: string;
  name: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  comment?: string;
}

interface Vendor {
  name: string;
  rating: number;
  activeOrders: number;
  spend: string;
  status: 'Preferred' | 'Active' | 'Review';
}

const ProcurementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VENDORS' | 'ORDERS' | 'APPROVALS'>('VENDORS');
  const [showSmartPO, setShowSmartPO] = useState(false);
  const [poGenerating, setPoGenerating] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [approverComment, setApproverComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const vendors: Vendor[] = [
    { name: 'Premier Steel', rating: 92, activeOrders: 2, spend: '£205k', status: 'Preferred' },
    { name: 'Elite Equipment', rating: 88, activeOrders: 1, spend: '£315k', status: 'Active' },
    { name: 'Metro Concrete', rating: 74, activeOrders: 0, spend: '£85k', status: 'Review' },
    { name: 'City Lumber Supply', rating: 95, activeOrders: 4, spend: '£120k', status: 'Preferred' },
  ];

  const purchaseOrders: PurchaseOrder[] = [
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
    },
    {
      id: 'po3',
      number: 'PO-2025-893',
      vendor: 'Elite Equipment',
      date: '2025-11-30',
      amount: 95000,
      status: 'rejected',
      createdBy: 'David Chen',
      items: [
        { description: 'Heavy Excavator Rental (30 days)', quantity: 1, unitPrice: 95000, total: 95000 }
      ],
      approvers: [
        { id: 'a5', name: 'Sarah Mitchell', role: 'Finance Manager', status: 'rejected', timestamp: '2025-11-30 14:20', comment: 'Over budget. Please negotiate better rates.' },
        { id: 'a6', name: 'Mike Thompson', role: 'Project Manager', status: 'pending' }
      ],
      notes: 'Equipment rental for site preparation'
    },
    {
      id: 'po4',
      number: 'PO-2025-892',
      vendor: 'Metro Concrete',
      date: '2025-11-28',
      amount: 52000,
      status: 'completed',
      createdBy: 'John Anderson',
      items: [
        { description: 'Concrete Mix (Cubic Meters)', quantity: 100, unitPrice: 500, total: 50000 },
        { description: 'Delivery & Pump Service', quantity: 1, unitPrice: 2000, total: 2000 }
      ],
      approvers: [
        { id: 'a7', name: 'Sarah Mitchell', role: 'Finance Manager', status: 'approved', timestamp: '2025-11-28 08:00' },
        { id: 'a8', name: 'Mike Thompson', role: 'Project Manager', status: 'approved', timestamp: '2025-11-28 08:30' }
      ],
      notes: 'Foundation concrete pour'
    }
  ];

  const filteredOrders = purchaseOrders.filter(po =>
    po.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGeneratePO = () => {
    setPoGenerating(true);
    setTimeout(() => {
      setPoGenerating(false);
      setShowSmartPO(false);
      alert("Purchase Order #PO-2025-889 created and sent for approval.");
    }, 2000);
  };

  const handleApprove = (po: PurchaseOrder, approverId: string) => {
    const updatedApprovers = po.approvers.map(a =>
      a.id === approverId ? { ...a, status: 'approved' as const, timestamp: new Date().toLocaleString(), comment: approverComment } : a
    );
    const allApproved = updatedApprovers.every(a => a.status !== 'pending' && a.status !== 'rejected');
    setSelectedPO({
      ...po,
      approvers: updatedApprovers,
      status: allApproved ? 'approved' : 'pending_approval'
    });
    setApproverComment('');
  };

  const handleReject = (po: PurchaseOrder, approverId: string) => {
    const updatedApprovers = po.approvers.map(a =>
      a.id === approverId ? { ...a, status: 'rejected' as const, timestamp: new Date().toLocaleString(), comment: approverComment } : a
    );
    setSelectedPO({
      ...po,
      approvers: updatedApprovers,
      status: 'rejected'
    });
    setApproverComment('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 mb-6">
          {['VENDORS', 'ORDERS', 'APPROVALS'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab
                    ? 'border-[#0f5c82] text-[#0f5c82]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                  {tab === 'VENDORS' && <Truck size={16} />}
                  {tab === 'ORDERS' && <Package size={16} />}
                  {tab === 'APPROVALS' && <CheckCircle2 size={16} />}
                  {tab}
              </button>
          ))}
      </div>

      {/* Content */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-zinc-100 flex justify-between bg-zinc-50">
              <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-1 focus:ring-[#0f5c82] outline-none"
                  />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-lg bg-white text-zinc-600 text-sm hover:bg-zinc-50">
                  <Filter size={16} /> Filter
              </button>
          </div>

          {activeTab === 'VENDORS' && (
              <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
                      <tr>
                          <th className="px-6 py-4 font-medium">Vendor Name</th>
                          <th className="px-6 py-4 font-medium">Performance</th>
                          <th className="px-6 py-4 font-medium">Active Orders</th>
                          <th className="px-6 py-4 font-medium">Total Spend</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                      {vendors.map((v, i) => (
                          <tr key={i} className="hover:bg-zinc-50 transition-colors group">
                              <td className="px-6 py-4 font-bold text-zinc-800">{v.name}</td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                      <div className="w-16 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                          <div className={`h-full ${v.rating >= 90 ? 'bg-green-500' : v.rating >= 80 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{width: `${v.rating}%`}}></div>
                                      </div>
                                      <span className="text-xs font-medium text-zinc-500">{v.rating}/100</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-zinc-600">{v.activeOrders}</td>
                              <td className="px-6 py-4 font-mono text-zinc-600">{v.spend}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                      v.status === 'Preferred' ? 'bg-purple-100 text-purple-700' :
                                      v.status === 'Active' ? 'bg-green-100 text-green-700' :
                                      'bg-zinc-100 text-zinc-600'
                                  }`}>{v.status}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button className="text-[#0f5c82] hover:underline text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">View Profile</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          )}

          {activeTab === 'ORDERS' && (
             <div className="space-y-4 p-6">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(po => (
                  <div key={po.id} onClick={() => setSelectedPO(po)} className="border border-zinc-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-zinc-900">{po.number} - {po.vendor}</h4>
                        <p className="text-xs text-zinc-600">{po.notes}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                        po.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                        po.status === 'approved' ? 'bg-green-100 text-green-700' :
                        po.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {po.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-zinc-600">
                        <p className="font-mono font-semibold">£{po.amount.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        {po.approvers.map(a => (
                          <span key={a.id} className={`text-xs px-2 py-1 rounded ${
                            a.status === 'approved' ? 'bg-green-100 text-green-700' :
                            a.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-zinc-100 text-zinc-600'
                          }`}>
                            {a.status === 'approved' ? '✓' : a.status === 'rejected' ? '✗' : '○'} {a.name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-zinc-400">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No purchase orders found</p>
                </div>
              )}
             </div>
          )}

          {activeTab === 'APPROVALS' && (
            <div className="space-y-4 p-6">
              {purchaseOrders.filter(po => po.status === 'pending_approval').length > 0 ? (
                purchaseOrders.filter(po => po.status === 'pending_approval').map(po => (
                  <div key={po.id} className="border-2 border-amber-200 bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-zinc-900">{po.number} - {po.vendor}</h4>
                      <span className="text-sm font-mono text-zinc-600">£{po.amount.toLocaleString()}</span>
                    </div>
                    <div className="space-y-2">
                      {po.approvers.map(approver => (
                        <div key={approver.id} className={`p-3 rounded border ${
                          approver.status === 'pending' ? 'border-amber-200 bg-white' :
                          approver.status === 'approved' ? 'border-green-200 bg-green-50' :
                          'border-red-200 bg-red-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {approver.status === 'approved' && <CheckCircle2 size={16} className="text-green-600" />}
                              {approver.status === 'rejected' && <AlertCircle size={16} className="text-red-600" />}
                              {approver.status === 'pending' && <Clock size={16} className="text-amber-600" />}
                              <div>
                                <p className="font-medium text-zinc-900">{approver.name}</p>
                                <p className="text-xs text-zinc-600">{approver.role}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {approver.timestamp && <p className="text-xs text-zinc-500">{approver.timestamp}</p>}
                              {approver.status === 'pending' && (
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() => { handleApprove(po, approver.id); }}
                                    className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => { handleReject(po, approver.id); }}
                                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {approver.comment && (
                            <p className="text-xs text-zinc-600 mt-2 italic">Comment: {approver.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-zinc-400">
                  <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No pending approvals</p>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Smart PO Modal */}
      {showSmartPO && (
          <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="bg-[#0f5c82] p-6 text-white">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles size={20} /> AI Smart Reorder</h3>
                      <p className="text-blue-100 text-sm mt-1">Based on current consumption rates and project schedule.</p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <div className="text-xs font-bold text-blue-800 uppercase mb-2">Recommendation</div>
                          <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-zinc-900">Portland Cement Type I</span>
                              <span className="font-bold text-zinc-900">400 Bags</span>
                          </div>
                          <p className="text-xs text-zinc-500">Inventory projected to deplete in 3 days. Vendor 'Premier Steel' has best lead time (2 days).</p>
                      </div>

                      <div className="border border-zinc-200 rounded-xl p-4">
                          <div className="flex justify-between text-sm mb-2">
                              <span className="text-zinc-500">Unit Price</span>
                              <span className="font-mono text-zinc-900">£12.50</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                              <span className="text-zinc-500">Subtotal</span>
                              <span className="font-mono text-zinc-900">£5,000.00</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold pt-2 border-t border-zinc-100">
                              <span className="text-zinc-800">Total Estimate</span>
                              <span className="font-mono text-[#0f5c82]">£5,000.00</span>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex gap-3">
                      <button 
                        onClick={() => setShowSmartPO(false)}
                        className="flex-1 py-3 border border-zinc-200 rounded-xl text-zinc-600 font-medium hover:bg-white transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleGeneratePO}
                        disabled={poGenerating}
                        className="flex-1 py-3 bg-[#0f5c82] text-white rounded-xl font-bold hover:bg-[#0c4a6e] transition-colors flex justify-center items-center gap-2"
                      >
                          {poGenerating ? 'Processing...' : 'Generate PO'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProcurementView;
