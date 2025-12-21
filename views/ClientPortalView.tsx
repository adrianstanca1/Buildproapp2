import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { Building, Calendar, FileText, DollarSign, Image as ImageIcon, MapPin, Clock, CheckCircle2 } from 'lucide-react';

const ClientPortalView: React.FC = () => {
    const { user } = useAuth();
    const { currentTenant } = useTenant();
    const { projects } = useProjects();
    const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'financials'>('overview');

    // In a real app, filtering would be stricter based on user ID assignment
    // For now, we show all projects as a demo or filter by a mock "client assigned" logic
    // const clientProjects = projects.filter(p => p.status === 'Active'); 

    // Mock single active project for the portal view
    const project = projects[0] || {
        name: 'Downtown Tower Phase 2',
        description: 'Luxury residential complex with 200 units and retail space.',
        progress: 65,
        startDate: '2025-01-15',
        endDate: '2026-06-30',
        image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80',
        location: '123 Business Dist, Metropolis'
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Client Header */}
            <div className="bg-white border-b border-zinc-200 sticky top-0 z-10 px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0f5c82] rounded-lg flex items-center justify-center text-white font-bold">
                        {currentTenant?.name?.[0] || 'C'}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-zinc-900">{currentTenant?.name || 'BuildPro'} Portal</h1>
                        <p className="text-xs text-zinc-500">Welcome back, {user?.name}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-[#0f5c82] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                    >
                        Project Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'documents' ? 'bg-[#0f5c82] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                    >
                        Documents
                    </button>
                    <button
                        onClick={() => setActiveTab('financials')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'financials' ? 'bg-[#0f5c82] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                    >
                        Financials
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-8">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {/* Project Hero */}
                        <div className="relative rounded-2xl overflow-hidden h-64 shadow-lg group">
                            <img src={project.image} alt={project.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                <h2 className="text-3xl font-bold text-white mb-2">{project.name}</h2>
                                <div className="flex items-center gap-4 text-white/80 text-sm">
                                    <span className="flex items-center gap-1"><MapPin size={16} /> {project.location || 'Metropolis'}</span>
                                    <span className="flex items-center gap-1"><Calendar size={16} /> Completion: {project.endDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Clock size={24} /></div>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">On Track</span>
                                </div>
                                <div className="text-4xl font-bold text-zinc-900 mb-1">{project.progress}%</div>
                                <div className="text-sm text-zinc-500 font-medium">Overall Completion</div>
                                <div className="w-full h-2 bg-zinc-100 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><CheckCircle2 size={24} /></div>
                                </div>
                                <div className="text-4xl font-bold text-zinc-900 mb-1">12</div>
                                <div className="text-sm text-zinc-500 font-medium">Milestones Completed</div>
                                <div className="text-xs text-purple-600 mt-4 font-bold cursor-pointer hover:underline">View Timeline →</div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><ImageIcon size={24} /></div>
                                </div>
                                <div className="text-4xl font-bold text-zinc-900 mb-1">45</div>
                                <div className="text-sm text-zinc-500 font-medium">Site Photos Uploaded</div>
                                <div className="text-xs text-amber-600 mt-4 font-bold cursor-pointer hover:underline">View Gallery →</div>
                            </div>
                        </div>

                        {/* Recent Updates */}
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 font-bold text-zinc-900">Recent Updates</div>
                            <div className="divide-y divide-zinc-100">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="p-6 hover:bg-zinc-50 transition-colors flex gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-zinc-200 flex-shrink-0" />
                                        <div>
                                            <div className="font-bold text-zinc-900 text-sm">Foundation Pour Completed</div>
                                            <p className="text-zinc-600 text-sm mt-1">The main foundation pour for Block A has been successfully completed and inspected.</p>
                                            <div className="text-xs text-zinc-400 mt-2">2 days ago • By Site Manager</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-12 text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">Project Documents</h3>
                        <p className="text-zinc-500 max-w-md mx-auto">Access approved plans, contracts, and safety reports. This section is currently being populated.</p>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-12 text-center">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <DollarSign size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">Financial Overview</h3>
                        <p className="text-zinc-500 max-w-md mx-auto">Track billing, invoices, and payment history. Access is currently restricted pending final setup.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClientPortalView;
