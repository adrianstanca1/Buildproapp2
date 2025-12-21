import React, { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { ExpenseClaim } from '@/types';
import { Plus, Search, Filter, Receipt, Calendar, User, CheckCircle2, XCircle, Clock, Camera } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

const ExpensesView: React.FC = () => {
    const { expenseClaims, addExpenseClaim } = useProjects();
    const { addToast } = useToast();
    const [filter, setFilter] = useState<'All' | 'My Claims' | 'Pending Approval'>('All');

    // Mock current user ID for demo
    const currentUserId = 'u1';

    const filteredClaims = expenseClaims.filter(claim => {
        if (filter === 'My Claims') return claim.userId === currentUserId;
        if (filter === 'Pending Approval') return claim.status === 'Pending';
        return true;
    });

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Travel': return '✈️';
            case 'Food': return '🍔';
            case 'Materials': return '🏗️';
            case 'Accommodation': return '🏨';
            default: return '📦';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-indigo-100 text-sm font-medium mb-1">Pending Approval</div>
                        <div className="text-3xl font-black">£{expenseClaims.filter(c => c.status === 'Pending').reduce((sum, c) => sum + c.amount, 0).toLocaleString()}</div>
                        <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                            <Clock size={12} /> {expenseClaims.filter(c => c.status === 'Pending').length} Claims waiting
                        </div>
                    </div>
                    <Receipt className="absolute -bottom-4 -right-4 text-white/10 w-32 h-32 rotate-12" />
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                    <div className="text-zinc-500 text-xs font-bold uppercase mb-2">My Spending (YTD)</div>
                    <div className="text-2xl font-bold text-zinc-900">£1,240.50</div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-green-500 h-full w-[45%] rounded-full"></div>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">45% of annual allowance</div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-center justify-center cursor-pointer hover:bg-zinc-50 transition-colors border-dashed border-zinc-300 hover:border-zinc-400 group">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <Camera size={24} />
                        </div>
                        <h3 className="font-bold text-zinc-800">Snap Receipt</h3>
                        <p className="text-xs text-zinc-500">Auto-scan with AI</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <div className="flex gap-2">
                        {['All', 'My Claims', 'Pending Approval'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600"><Filter size={18} /></button>
                    </div>
                </div>

                <div className="divide-y divide-zinc-100">
                    {filteredClaims.length > 0 ? (
                        filteredClaims.map((claim) => (
                            <div key={claim.id} className="p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-xl shadow-inner">
                                        {getCategoryIcon(claim.category)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-zinc-900">{claim.description}</div>
                                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                            <span className="flex items-center gap-1"><User size={12} /> {claim.userName}</span>
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {claim.date}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="font-bold text-zinc-900">£{claim.amount.toFixed(2)}</div>
                                        <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1 
                                            ${claim.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                claim.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {claim.status}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        {claim.status === 'Pending' && (
                                            <>
                                                <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Approve"><CheckCircle2 size={18} /></button>
                                                <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Reject"><XCircle size={18} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-zinc-400">
                            <Receipt className="mx-auto mb-3 opacity-20" size={48} />
                            No expense claims found matching this filter.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpensesView;
