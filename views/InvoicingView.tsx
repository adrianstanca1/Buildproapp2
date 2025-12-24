import React, { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { Invoice } from '@/types';
import { Plus, Search, Filter, FileText, Calendar, DollarSign, Paperclip, MoreVertical, Zap, CheckCircle2, AlertCircle, Clock, Hash, Receipt } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Modal } from '@/components/Modal';

const InvoicingView: React.FC = () => {
    const { invoices, addInvoice, activeProject, costCodes } = useProjects();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | Invoice['status']>('All');
    const [showAddModal, setShowAddModal] = useState(false);

    const handleAddInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newInvoice: Invoice = {
            id: `inv-${Date.now()}`,
            projectId: activeProject?.id || 'p1', // Fallback
            companyId: 'c1',
            vendor: formData.get('vendor') as string,
            number: formData.get('number') as string,
            date: new Date().toISOString().split('T')[0],
            dueDate: formData.get('dueDate') as string,
            total: parseFloat(formData.get('total') as string),
            amount: parseFloat(formData.get('total') as string),
            tax: 0,
            status: 'Pending',
            attachments: [],
            lineItems: [],
            costCodeId: formData.get('costCodeId') as string
        };
        await addInvoice(newInvoice);
        addToast("Invoice created successfully", "success");
        setShowAddModal(false);
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: Invoice['status']) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-700';
            case 'Approved': return 'bg-blue-100 text-blue-700';
            case 'Pending': return 'bg-amber-100 text-amber-700';
            case 'Overdue': return 'bg-red-100 text-red-700';
            default: return 'bg-zinc-100 text-zinc-700';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search invoices by vendor or number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none shadow-sm transition-all hover:bg-slate-800 text-white placeholder-slate-500"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    {['All', 'Draft', 'Pending', 'Approved', 'Paid', 'Overdue'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${statusFilter === status
                                ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)] transform scale-105'
                                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-400 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Plus size={18} /> New Invoice
                </button>
            </div>

            {/* Invoices Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
                        <div key={invoice.id} className="group bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/80 hover:border-sky-500/30 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden backdrop-blur-sm">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-sky-500/5 rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-800 rounded-xl text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg group-hover:text-sky-400 transition-colors">{invoice.vendor}</h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">#{invoice.number}</span>
                                            <span className="flex items-center gap-1"><Calendar size={12} /> Due: {invoice.dueDate}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">£{invoice.total.toLocaleString()}</div>
                                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mt-2 border ${invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            invoice.status === 'Approved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                invoice.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    invoice.status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                        'bg-slate-800 text-slate-400 border-slate-700'
                                        }`}>
                                        {invoice.status === 'Paid' && <CheckCircle2 size={12} />}
                                        {invoice.status === 'Pending' && <Clock size={12} />}
                                        {invoice.status === 'Overdue' && <AlertCircle size={12} />}
                                        {invoice.status.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            {/* Actions / AI Insight */}
                            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Paperclip size={14} /> {invoice.attachments?.length || 0} Attachments
                                </div>
                                <button className="text-sky-400 text-sm font-bold hover:text-sky-300 flex items-center gap-1 transition-colors">
                                    View Details <MoreVertical size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-700">
                            <FileText className="text-slate-500" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No Invoices Found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-6">Create a new invoice or scan a document to get started.</p>
                        <button className="px-6 py-2 bg-slate-800 border border-slate-700 rounded-lg font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Record New Invoice">
                <form onSubmit={handleAddInvoice} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-1">Vendor Name</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input name="vendor" required placeholder="e.g. Acme Concrete Ltd" className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0f5c82] outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 mb-1">Invoice Number</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <input name="number" required placeholder="INV-2024-001" className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0f5c82] outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-zinc-700 mb-1">Due Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <input type="date" name="dueDate" required className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0f5c82] outline-none" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-1">Total Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">£</span>
                            <input type="number" step="0.01" name="total" required placeholder="0.00" className="w-full pl-8 pr-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0f5c82] outline-none font-mono" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-1">Cost Code (Optional)</label>
                        <select name="costCodeId" className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0f5c82] outline-none bg-white">
                            <option value="">No Cost Code</option>
                            {costCodes.map(cc => <option key={cc.id} value={cc.id}>{cc.code} - {cc.description}</option>)}
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-zinc-300 text-zinc-700 font-bold rounded-lg hover:bg-zinc-50">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 bg-[#0f5c82] text-white font-bold rounded-lg hover:bg-[#0c4a6e] shadow-lg">Save Invoice</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default InvoicingView;
