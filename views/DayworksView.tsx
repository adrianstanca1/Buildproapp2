import React, { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { Daywork } from '@/types';
import { Plus, Clock, Hammer, Truck, FileText, ChevronRight, Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

const DayworksView: React.FC = () => {
    const { dayworks, addDaywork } = useProjects();
    const { addToast } = useToast();

    // Calculate total pending costs
    const pendingTotal = dayworks
        .filter(d => d.status === 'Pending')
        .reduce((sum, d) => sum + (d.grandTotal || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Context Header */}
            <div className="bg-orange-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                        <Hammer className="text-orange-200" /> Daywork Control
                    </h2>
                    <p className="text-orange-100 text-sm max-w-lg">
                        Track Time & Materials (T&M) for out-of-scope work. Ensure all sheets are signed off by the client before billing.
                    </p>
                </div>
                <div className="text-right relative z-10">
                    <div className="text-xs font-bold text-orange-200 uppercase tracking-wider">Unbilled Pending</div>
                    <div className="text-4xl font-black">£{pendingTotal.toLocaleString()}</div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>

            {/* List & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Main List */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-zinc-900">Recent Sheets</h3>
                        <button className="text-[#0f5c82] hover:underline text-sm font-bold">View All Archive</button>
                    </div>

                    {dayworks.length > 0 ? (
                        dayworks.map(sheet => (
                            <div key={sheet.id} className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-orange-200 hover:shadow-lg transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-bold">
                                            DW
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                                                {sheet.description}
                                            </h4>
                                            <div className="text-xs text-zinc-500 flex items-center gap-2">
                                                <Clock size={12} /> {sheet.date}
                                                <span className="text-zinc-300">|</span>
                                                <span className="font-mono">ID: {sheet.id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${sheet.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            sheet.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {sheet.status}
                                    </div>
                                </div>

                                {/* Resource Breakdown Mini-table */}
                                <div className="bg-zinc-50 rounded-lg p-3 grid grid-cols-3 gap-4 mb-3 border border-zinc-100">
                                    <div className="text-center">
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase">Labor Hrs</div>
                                        <div className="font-bold text-zinc-700">{sheet.totalLaborCost ? `${(sheet.totalLaborCost / 50).toFixed(1)}h` : '-'}</div>
                                    </div>
                                    <div className="text-center border-l border-zinc-200">
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase">Material</div>
                                        <div className="font-bold text-zinc-700">£{sheet.totalMaterialCost?.toFixed(0) || 0}</div>
                                    </div>
                                    <div className="text-center border-l border-zinc-200">
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase">Total</div>
                                        <div className="font-black text-zinc-900">£{sheet.grandTotal?.toFixed(2) || 0}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex -space-x-2">
                                        {/* Avatar Placeholders for assigned crew */}
                                        <div className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white"></div>
                                        <div className="w-6 h-6 rounded-full bg-zinc-300 border-2 border-white"></div>
                                    </div>
                                    <div className="text-xs text-orange-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        Review Sheet <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border md:border-dashed border-zinc-200 rounded-xl p-10 text-center">
                            <Truck className="mx-auto text-zinc-300 mb-4" size={48} />
                            <h3 className="font-bold text-zinc-900">No Daywork Sheets</h3>
                            <p className="text-zinc-500 text-sm">Create a new sheet to record extra works.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar / Tools */}
                <div className="space-y-4">
                    <button className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg flex items-center justify-center gap-2">
                        <Plus size={18} /> New Daywork Sheet
                    </button>

                    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-zinc-800 font-bold">
                            <Calculator size={18} /> Quick Estimator
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 block mb-1">Labor Hours</label>
                                <input type="number" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm" placeholder="e.g. 8" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 block mb-1">Crew Size</label>
                                <input type="number" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm" placeholder="e.g. 3" />
                            </div>
                            <div className="pt-2 border-t border-zinc-100 flex justify-between items-center">
                                <span className="text-xs font-bold">Est. Cost:</span>
                                <span className="font-black text-green-600">£0.00</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <h4 className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                            <AlertTriangle size={14} /> Approval Policy
                        </h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Daywork sheets exceeding £1,000 require Client Representative signature before billing.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayworksView;
