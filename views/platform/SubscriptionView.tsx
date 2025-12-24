import React, { useState, useEffect } from 'react';
import {
    CreditCard, DollarSign, TrendingUp, Users,
    ArrowUpRight, ArrowDownRight, Search, Filter,
    Download, MoreHorizontal, CheckCircle2, AlertCircle,
    Clock, Building2
} from 'lucide-react';
import { db } from '@/services/db';
import { Modal } from '@/components/Modal';

/**
 * SubscriptionView
 * Superadmin-only dashboard for platform billing and MRR tracking
 */
const SubscriptionView: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlan, setFilterPlan] = useState('ALL');
    const [selectedSub, setSelectedSub] = useState<any>(null);

    useEffect(() => {
        const loadBillingData = async () => {
            try {
                const [subsData, invsData] = await Promise.all([
                    db.getSubscriptions(),
                    db.getInvoices()
                ]);
                setSubscriptions(subsData);
                setInvoices(invsData);
            } catch (error) {
                console.error("Failed to load billing data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadBillingData();
    }, []);

    const filteredSubs = subscriptions.filter(sub => {
        const matchesSearch = sub.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlan = filterPlan === 'ALL' || sub.plan.toUpperCase() === filterPlan.toUpperCase();
        return matchesSearch && matchesPlan;
    });

    const mrr = subscriptions.reduce((sum, s) => sum + (s.mrr || 0), 0);
    const activeSubs = subscriptions.filter(s => s.status === 'active').length;
    const pendingInvoices = invoices.filter(i => i.status === 'Pending').length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        Billing & Subscriptions
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Track platform revenue, subscriptions, and invoicing
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                    <Download className="w-5 h-5" />
                    Download Revenue Report
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-zinc-500">Monthly Recurring Revenue</p>
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">${mrr.toLocaleString()}</p>
                        <span className="text-xs font-medium text-emerald-600 flex items-center">
                            <ArrowUpRight className="w-3 h-3" /> 12.5%
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-zinc-500">Active Subscriptions</p>
                        <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{activeSubs}</p>
                        <span className="text-xs font-medium text-emerald-600 flex items-center">
                            <ArrowUpRight className="w-3 h-3" /> 4.2%
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-zinc-500">Avg. Revenue Per User</p>
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">$42.30</p>
                        <span className="text-xs font-medium text-zinc-400">Stable</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-zinc-500">Pending Invoices</p>
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{pendingInvoices}</p>
                        <p className="text-xs text-zinc-500">Requires attention</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Subscriptions Table */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                        <h2 className="font-bold text-zinc-900 dark:text-white">Active Subscriptions</h2>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Search companies..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">Company</th>
                                    <th className="px-4 py-3 text-left">Plan</th>
                                    <th className="px-4 py-3 text-left">MRR</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                                {filteredSubs.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    {sub.companyName.charAt(0)}
                                                </div>
                                                <span className="font-medium text-zinc-900 dark:text-white">{sub.companyName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold uppercase">
                                                {sub.plan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                                            ${sub.mrr.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {sub.status === 'active' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setSelectedSub(sub)}
                                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Invoices Sidebar */}
                <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <h2 className="font-bold text-zinc-900 dark:text-white">Recent Invoices</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-700">
                        {invoices.map((inv) => (
                            <div key={inv.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{inv.invoiceNumber}</p>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${inv.status === 'Paid' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'
                                        }`}>
                                        {inv.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <p className="text-zinc-500">{inv.companyName}</p>
                                    <p className="font-bold text-zinc-900 dark:text-white">${inv.amount.toLocaleString()}</p>
                                </div>
                                <div className="mt-2 text-[10px] text-zinc-400 flex items-center gap-1">
                                    <Clock size={10} /> {new Date(inv.date).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="p-3 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-zinc-100 dark:border-zinc-700 transition-colors">
                        View Full History
                    </button>
                </div>
            </div>

            {/* Sub Detail Modal */}
            {selectedSub && (
                <Modal
                    isOpen={!!selectedSub}
                    onClose={() => setSelectedSub(null)}
                    title={`Subscription Detail: ${selectedSub.companyName}`}
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center">
                                <p className="text-[10px] uppercase font-black text-zinc-400 mb-1">Current Plan</p>
                                <p className="text-lg font-bold text-blue-600 capitalize">{selectedSub.plan}</p>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center">
                                <p className="text-[10px] uppercase font-black text-zinc-400 mb-1">Next Billing</p>
                                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                    {new Date(selectedSub.nextBillingDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Subscription Actions</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button className="flex items-center justify-center gap-2 p-3 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all">
                                    <CreditCard size={16} /> Upgrade Plan
                                </button>
                                <button className="flex items-center justify-center gap-2 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                                    <Building2 size={16} /> Manage Billing
                                </button>
                                <button className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-all col-span-2">
                                    <AlertCircle size={16} /> Cancel Subscription
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                <strong>Note:</strong> Changes to plans will be applied immediately and prorated in the next billing cycle according to the platform's fair billing policy.
                            </p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default SubscriptionView;
