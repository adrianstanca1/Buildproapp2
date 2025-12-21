import React, { useState } from 'react';
import { Page } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useTenant } from '@/contexts/TenantContext'; // Import useTenant
import {
    Building2, Calendar, FileText, CheckCircle2, Clock,
    ArrowRight, Download, MessageSquare, AlertCircle, Menu, X, Bell
} from 'lucide-react';

interface ClientPortalViewProps {
    setPage: (page: Page) => void;
}

const ClientPortalView: React.FC<ClientPortalViewProps> = ({ setPage }) => {
    const { user, logout } = useAuth(); // Destructure logout
    const { projects } = useProjects();
    const { currentTenant } = useTenant(); // Get Tenant Info
    const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'financials'>('overview');

    // Mock: Select the first project for demo purposes since clients are "assigned" to projects
    // In a real app, strict filtering would happen here based on user.id
    const assignedProject = projects[0];

    if (!assignedProject) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-50">
                <Building2 size={64} className="text-zinc-300 mb-4" />
                <h2 className="text-2xl font-bold text-zinc-800">No Projects Assigned</h2>
                <p className="text-zinc-500 mt-2">Please contact your project manager to get access.</p>
                <button onClick={logout} className="mt-6 px-6 py-2 bg-zinc-200 hover:bg-zinc-300 rounded-lg text-sm text-zinc-700 font-medium">
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-zinc-50 h-full overflow-y-auto flex flex-col">
            {/* Client Header */}
            <header className="bg-white border-b border-zinc-200 px-6 lg:px-8 py-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#0f5c82] rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
                        {currentTenant?.name?.[0] || 'B'}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-zinc-900 leading-tight">{assignedProject.name}</h1>
                        <p className="text-zinc-500 text-xs flex items-center gap-1">
                            <Building2 size={10} /> {assignedProject.location}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-zinc-400 hover:text-[#0f5c82] hover:bg-blue-50 rounded-full transition-all relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </button>
                    <div className="h-8 w-px bg-zinc-100 hidden sm:block" />
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-zinc-900">{user?.name}</div>
                            <div className="text-xs text-zinc-400">Client Account</div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Sign Out"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto w-full p-6 lg:p-8 space-y-8 flex-1">

                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-[#0f5c82] to-[#0c4a6e] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform origin-bottom-left group-hover:translate-x-4 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Project Overview</h2>
                            <p className="text-blue-100 max-w-lg">
                                Welcome to your dedicated client portal. Track real-time progress, review documents, and stay connected with the project team.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button className="bg-white text-[#0f5c82] hover:bg-blue-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg">
                                View Latest Report
                            </button>
                            <button className="bg-[#0f5c82] border border-white/30 hover:bg-[#0c4a6e] px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                                <MessageSquare size={16} /> Contact Manager
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Completion</div>
                        <div className="text-3xl font-black text-zinc-900">{assignedProject.progress}%</div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${assignedProject.progress}%` }} />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Active Tasks</div>
                        <div className="text-3xl font-black text-[#0f5c82]">12</div>
                        <div className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                            <CheckCircle2 size={12} /> 4 completed this week
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Pending RFI</div>
                        <div className="text-3xl font-black text-orange-500">2</div>
                        <div className="text-xs text-zinc-400 font-bold mt-2">Requires attention</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Project Health</div>
                        <div className="text-3xl font-black text-green-600">Good</div>
                        <div className="text-xs text-zinc-400 font-bold mt-2">On Schedule, On Budget</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Visual Timeline */}
                        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                            <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                <Calendar size={20} className="text-[#0f5c82]" /> Phase Progress
                            </h3>
                            <div className="space-y-6">
                                <div className="relative pl-8 border-l-2 border-green-500 pb-6">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-zinc-900">Foundation & Structure</span>
                                        <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">COMPLETED</span>
                                    </div>
                                    <p className="text-sm text-zinc-500">All concrete pouring and curing completed. Structural integrity inspection passed.</p>
                                </div>
                                <div className="relative pl-8 border-l-2 border-[#0f5c82] pb-6">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0f5c82] border-2 border-white shadow-sm animate-pulse" />
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-zinc-900">MEP Rough-in</span>
                                        <span className="text-[#0f5c82] text-xs font-bold bg-blue-50 px-2 py-1 rounded-full">IN PROGRESS (85%)</span>
                                    </div>
                                    <p className="text-sm text-zinc-500">HVAC ductwork 90% complete. Electrical wiring ongoing in Sector B.</p>
                                </div>
                                <div className="relative pl-8 border-l-2 border-zinc-200">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-200 border-2 border-white" />
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-zinc-400">Interior Finishes</span>
                                        <span className="text-zinc-400 text-xs font-bold bg-zinc-50 px-2 py-1 rounded-full">UPCOMING</span>
                                    </div>
                                    <p className="text-sm text-zinc-400">Expected start date: Oct 15th, 2025.</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Updates */}
                        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-[#0f5c82]" /> Site Feed
                                </h3>
                                <button className="text-xs font-bold text-[#0f5c82] hover:underline">View All</button>
                            </div>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-4 p-4 hover:bg-zinc-50 rounded-xl transition-colors border border-zinc-100 hover:border-zinc-200 group cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-[#0f5c82] group-hover:scale-105 transition-transform">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="font-bold text-zinc-900 text-sm">Daily Log Report #{20240900 + i}</span>
                                                <span className="text-xs text-zinc-400">• 2h ago</span>
                                            </div>
                                            <p className="text-sm text-zinc-600 line-clamp-2 mb-2">
                                                Structure completed for level 3. HVAC rough-in ongoing in sector B. No safety incidents reported.
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase rounded">Daily Log</span>
                                                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold uppercase rounded">Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar Widgets */}
                    <div className="space-y-6">

                        {/* Documents */}
                        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                            <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                                <Download size={18} className="text-zinc-400" /> Shared Documents
                            </h3>
                            <div className="space-y-3">
                                {['Contract_v2_Signed.pdf', 'Floor_Plans_May2024.pdf', 'Insurance_Cert.pdf', 'Change_Order_004.pdf'].map((doc) => (
                                    <div key={doc} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg text-sm group cursor-pointer hover:bg-zinc-100 hover:shadow-sm border border-transparent hover:border-zinc-200 transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-1.5 bg-white rounded border border-zinc-200 text-red-500">
                                                <FileText size={12} />
                                            </div>
                                            <span className="truncate text-zinc-700 group-hover:text-zinc-900 font-medium">{doc}</span>
                                        </div>
                                        <Download size={14} className="text-zinc-300 group-hover:text-[#0f5c82]" />
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-4 py-2.5 text-xs font-bold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                                View All Documents
                            </button>
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                            <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                                <Clock size={18} className="text-zinc-400" /> Financial Snapshot
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-xs text-green-600 font-bold uppercase">Total Paid</div>
                                        <CheckCircle2 size={12} className="text-green-600" />
                                    </div>
                                    <div className="text-2xl font-black text-green-700">£1.2M</div>
                                </div>
                                <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-xs text-orange-600 font-bold uppercase">Pending Invoices</div>
                                        <Clock size={12} className="text-orange-500" />
                                    </div>
                                    <div className="text-2xl font-black text-orange-700">£45k</div>
                                    <div className="mt-2 text-[10px] font-medium text-orange-600 bg-white/50 px-2 py-1 rounded inline-block">
                                        Due in 5 days
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClientPortalView;
