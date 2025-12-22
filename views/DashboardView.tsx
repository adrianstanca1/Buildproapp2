
import React, { useMemo, useState, useEffect } from 'react';
import {
    ArrowRight, AlertCircle, Sparkles, MapPin, Clock,
    TrendingUp, CheckCircle2, Calendar, Activity,
    MoreHorizontal, Shield, DollarSign, Users, Briefcase, HardHat, CheckSquare, Map as MapIcon,
    FileText, PlusSquare, UserCheck, GitPullRequest, MessageSquare, FileBarChart, Settings, RotateCcw,
    Clipboard, Camera, Pin, Search, List, BookOpen, Plus, Video, Aperture, Link,
    Server, Database, Globe, Lock, Unlock, Megaphone, Power, RefreshCw, Key, Loader2, ChevronRight, PieChart,
    AlertTriangle, Wrench, BrainCircuit
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useTenant } from '@/contexts/TenantContext'; // Added TenantContext
import { UserRole, Task, Page, Tenant } from '@/types'; // Switched Company to Tenant
import { runRawPrompt, parseAIJSON } from '@/services/geminiService';
import { useToast } from '@/contexts/ToastContext';
import { TenantUsageWidget } from '@/components/TenantUsageWidget';
import { db } from '@/services/db';
import { AddTenantModal } from '@/components/AddTenantModal';

interface DashboardViewProps {
    setPage: (page: Page) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ setPage }) => {
    const { user } = useAuth();

    if (!user) return null;

    switch (user.role) {
        case UserRole.SUPER_ADMIN:
            return <SuperAdminDashboard setPage={setPage} />;
        case UserRole.COMPANY_ADMIN:
            return <CompanyAdminDashboard setPage={setPage} />;
        case UserRole.SUPERVISOR:
            return <SupervisorDashboard setPage={setPage} />;
        case UserRole.OPERATIVE:
            return <OperativeDashboard setPage={setPage} />;
        default:
            return <OperativeDashboard setPage={setPage} />;
    }
};

// --- AI Daily Briefing Component ---

const AIDailyBriefing: React.FC<{ role: UserRole }> = ({ role }) => {
    const { projects, safetyHazards, equipment } = useProjects();
    const { user } = useAuth();
    const [briefing, setBriefing] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const generateBriefing = async () => {
        setLoading(true);
        try {
            // SafetyHazard has no status, assume all in list are "active" hazards or filter by severity/risk
            const openHazards = safetyHazards; // .filter(h => h.status === 'Open');
            const maintenanceDone = equipment.filter(e => e.status === 'Maintenance').length;
            const overdueService = equipment.filter(e => {
                if (!e.nextService) return false;
                return new Date(e.nextService) < new Date();
            }).length;

            const context = {
                role,
                userName: user?.name,
                projectCount: projects.length,
                topProjects: projects.slice(0, 3).map(p => ({ name: p.name, health: p.health, progress: p.progress })),
                safety: {
                    openHazards: openHazards.length,
                    criticalHazards: openHazards.filter(h => h.severity === 'High').length
                },
                fleet: {
                    inMaintenance: maintenanceDone,
                    overdueService: overdueService
                },
                date: new Date().toLocaleDateString()
            };

            const prompt = `
                Act as a Chief of Staff AI for a Construction Executive. 
                Generate a personalized "Daily Briefing" for ${user?.name} in the role of ${role}.
                
                Data context: ${JSON.stringify(context)}
                
                Return JSON:
                {
                    "greeting": "Personalized morning greeting",
                    "agenda": ["Item 1", "Item 2", "Item 3"],
                    "risks": ["Risk 1", "Risk 2"],
                    "wins": ["Recent win or positive trend"],
                    "quote": "Motivational construction/leadership quote"
                }
            `;

            const res = await runRawPrompt(prompt, {
                model: 'gemini-3-pro-preview',
                temperature: 0.7,
                responseMimeType: 'application/json'
            });
            setBriefing(parseAIJSON(res));
        } catch (e) {
            console.error("Briefing failed", e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        generateBriefing();
    }, [role]);

    if (loading) return (
        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-[2rem] p-8 animate-pulse flex items-center justify-center gap-4 min-h-[160px]">
            <Loader2 className="animate-spin text-[#0f5c82]" />
            <span className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Assembling your daily briefing...</span>
        </div>
    );

    if (!briefing) return null;

    return (
        <div className="relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f5c82]/10 to-blue-400/5 rounded-[2.5rem] -z-10 blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 shadow-2xl shadow-[#0f5c82]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={120} />
                </div>

                <div className="flex flex-col md:flex-row gap-10 items-start">
                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-[#0f5c82] text-white rounded-xl shadow-lg shadow-[#0f5c82]/20">
                                    <Sparkles size={18} />
                                </div>
                                <h3 className="text-sm font-black text-[#0f5c82] uppercase tracking-[0.2em]">AI Intelligence Briefing</h3>
                            </div>
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{briefing.greeting}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12} className="text-blue-500" /> Focus for Today
                                </h4>
                                <ul className="space-y-2">
                                    {briefing.agenda?.map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-bold text-zinc-700">
                                            <div className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle size={12} className="text-orange-500" /> Critical Risks
                                </h4>
                                <ul className="space-y-2">
                                    {briefing.risks?.map((risk: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-bold text-zinc-700">
                                            <div className="mt-1 w-1.5 h-1.5 bg-orange-400 rounded-full" />
                                            {risk}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-64 space-y-6">
                        <div className="p-6 bg-zinc-900 rounded-3xl text-white shadow-xl shadow-zinc-900/10">
                            <TrendingUp size={24} className="text-green-400 mb-4" />
                            <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Key Win</p>
                            <p className="text-sm font-bold italic">&quot;{briefing.wins?.[0]}&quot;</p>
                        </div>
                        <div className="px-6 border-l-4 border-[#0f5c82]/20 py-2">
                            <p className="text-[10px] text-zinc-400 font-bold mb-1 uppercase tracking-tighter">Daily Wisdom</p>
                            <p className="text-xs text-zinc-500 font-medium italic">&quot;{briefing.quote}&quot;</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Quick Actions Components ---

interface QuickActionProps {
    icon: React.ElementType;
    title: string;
    desc: string;
    onClick: () => void;
    color?: string;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ icon: Icon, title, desc, onClick, color = "text-[#0f5c82]" }) => (
    <button
        onClick={onClick}
        className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-[#0f5c82] transition-all cursor-pointer flex flex-col items-center text-center group w-full h-full"
    >
        <div className={`p-3 rounded-lg bg-zinc-50 group-hover:bg-blue-50 transition-colors mb-3 ${color}`}>
            <Icon size={28} strokeWidth={1.5} />
        </div>
        <h3 className="font-bold text-zinc-900 text-sm mb-1 group-hover:text-[#0f5c82] transition-colors">{title}</h3>
        <p className="text-xs text-zinc-500">{desc}</p>
    </button>
);

const QuickActionsGrid: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const { checkFeature } = useTenant();

    const actions = [
        { icon: FileText, title: "Invoicing", desc: "Financial billing", page: Page.FINANCIALS, feature: 'FINANCIALS' },
        { icon: PlusSquare, title: "Estimates", desc: "Project bidding", page: Page.PROJECT_LAUNCHPAD, feature: 'PROJECTS' },
        { icon: Users, title: "Team", desc: "Resource planning", page: Page.TEAM, feature: 'TEAM', color: "text-purple-600" },
        { icon: Calendar, title: "Schedule", desc: "View timeline", page: Page.SCHEDULE, feature: 'SCHEDULE', color: "text-orange-600" },
        { icon: Briefcase, title: "CRM", desc: "Client Relations", page: Page.CLIENTS, feature: 'CLIENTS' },
        { icon: Sparkles, title: "AI Tools", desc: "Deep Analysis", page: Page.AI_TOOLS, feature: 'AI_TOOLS', color: "text-blue-600" },
        { icon: FileBarChart, title: "Reports", desc: "Business Intelligence", page: Page.REPORTS, feature: 'REPORTS', color: "text-teal-600" },
        { icon: RotateCcw, title: "Variations", desc: "Track changes", page: Page.PROJECTS, feature: 'PROJECTS', color: "text-red-500" },
        { icon: MessageSquare, title: "AI Advisor", desc: "Ask BuildPro", page: Page.CHAT, feature: 'CHAT', color: "text-indigo-600" }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-700 font-semibold">
                <Settings size={18} className="text-[#0f5c82]" />
                <span>Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {actions.filter(a => !a.feature || checkFeature(a.feature)).map((action, i) => (
                    <QuickActionCard
                        key={i}
                        icon={action.icon}
                        title={action.title}
                        desc={action.desc}
                        onClick={() => setPage(action.page)}
                        color={action.color}
                    />
                ))}
            </div>
        </div>
    );
};

// --- 1. SUPER ADMIN DASHBOARD (ENHANCED) ---
const SuperAdminDashboard: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const { tenants, addTenant, updateTenant, impersonateTenant, isImpersonating, stopImpersonating, currentTenant, accessLogs, systemSettings, updateSystemSettings, broadcastMessage, setBroadcastMessage } = useTenant();
    const { addToast } = useToast();
    const [localBroadcastMsg, setLocalBroadcastMsg] = useState('');
    const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);

    // Handler for adding a new tenant - Now handled by Modal
    const handleAddTenant = () => {
        setIsAddTenantModalOpen(true);
    };

    const handleSuspend = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
        if (confirm(`Are you sure you want to ${newStatus === 'Suspended' ? 'suspend' : 'activate'} this tenant?`)) {
            await updateTenant(id, { status: newStatus });
            addToast(`Tenant status updated to ${newStatus}`, 'info');
        }
    };

    const toggleSetting = (key: keyof typeof systemSettings) => {
        const newState = !systemSettings[key];
        updateSystemSettings({ [key]: newState });
        addToast(`${key.replace(/([A-Z])/g, ' $1').trim()} ${newState ? 'Enabled' : 'Disabled'}`, 'success');
    };

    const handleBroadcast = () => {
        if (!localBroadcastMsg.trim()) return;
        setBroadcastMessage(localBroadcastMsg);
        setLocalBroadcastMsg('');
        addToast('Broadcast sent to all active sessions', 'success');
    };

    const handleFlushCache = () => {
        addToast('System cache flushed successfully', 'success');
    };

    const handleRestartServices = () => {
        if (confirm('Are you sure you want to restart core services? This may cause temporary downtime.')) {
            addToast('Initiating service restart sequence...', 'warning');
            setTimeout(() => addToast('Services restarted successfully', 'success'), 2000);
        }
    };

    // Calculate Dynamic Metrics
    const totalMRR = useMemo(() => {
        return tenants.reduce((acc, t) => {
            const planRate = t.plan === 'Enterprise' ? 2499 : t.plan === 'Business' ? 499 : 0;
            return acc + planRate;
        }, 0);
    }, [tenants]);

    const totalStorage = useMemo(() => {
        // limit 100 + random variance for demo
        return (tenants.length * 0.45).toFixed(2);
    }, [tenants]);

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
                        <Shield size={32} className="text-[#0f5c82]" /> Global Command Center
                    </h1>
                    <p className="text-zinc-500 mt-1">Multi-tenant administration and system health monitoring.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white border border-zinc-200 px-4 py-2 rounded-full shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-sm font-bold text-zinc-700">System Operational</span>
                        </div>
                        <span className="text-xs text-zinc-400 border-l border-zinc-200 pl-3">Lat: 24ms</span>
                        <span className="text-xs text-zinc-400 border-l border-zinc-200 pl-3">Uptime: 99.99%</span>
                    </div>
                </div>
            </div>

            {isImpersonating && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex justify-between items-center shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 text-amber-800">
                        <UserCheck size={20} />
                        <div>
                            <p className="text-sm font-bold">Impersonation Mode Active</p>
                            <p className="text-xs">You are currently viewing BuildPro as <strong>{currentTenant?.name}</strong>.</p>
                        </div>
                    </div>
                    <button
                        onClick={stopImpersonating}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                    >
                        Stop Impersonating
                    </button>
                </div>
            )}

            <AIDailyBriefing role={UserRole.SUPER_ADMIN} />

            {/* Infrastructure Health */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-zinc-900 rounded-xl p-6 text-white relative overflow-hidden shadow-lg group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={80} /></div>
                    <div className="relative z-10">
                        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Global Revenue (MRR)</h3>
                        <div className="text-4xl font-bold mb-1">£{totalMRR.toLocaleString()}</div>
                        <div className="text-green-400 text-xs font-medium flex items-center gap-1"><TrendingUp size={12} /> +{Math.floor(Math.random() * 15) + 5}% this month</div>
                    </div>
                    {/* Simulated Graph Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 flex items-end opacity-30">
                        {[...Array(20)].map((_, i) => <div key={i} className="flex-1 bg-white mx-[1px]" style={{ height: `${Math.random() * 100}%` }} />)}
                    </div>
                </div>
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={24} /></div>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="text-3xl font-bold text-zinc-900">{tenants.length}</div>
                    <p className="text-sm text-zinc-500 font-medium">Tenant Organizations</p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Users size={24} /></div>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Total</span>
                    </div>
                    <div className="text-3xl font-bold text-zinc-900">{tenants.reduce((acc, c) => acc + (c.users || 0), 0)}</div>
                    <p className="text-sm text-zinc-500 font-medium">Registered Users</p>
                </div>
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Database size={24} /></div>
                        <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">Usage</span>
                    </div>
                    <div className="text-3xl font-bold text-zinc-900">{totalStorage} TB</div>
                    <p className="text-sm text-zinc-500 font-medium">Cloud Storage Used</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tenant Management Table */}
                <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                        <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                            <Globe size={18} className="text-blue-500" /> Tenant Management
                        </h3>
                        <div className="flex gap-2">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#0f5c82]" size={14} />
                                <input type="text" placeholder="Search companies..." className="pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0f5c82] focus:border-transparent outline-none transition-all w-64" />
                            </div>
                            <button
                                onClick={handleAddTenant}
                                className="px-4 py-2 bg-[#0f5c82] text-white rounded-lg text-sm font-bold hover:bg-[#0c4a6e] transition-colors shadow-sm flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Tenant
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs font-bold sticky top-0 z-10 border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-4 bg-zinc-50">Company Name</th>
                                    <th className="px-6 py-4 bg-zinc-50">Plan</th>
                                    <th className="px-6 py-4 text-center bg-zinc-50">Users</th>
                                    <th className="px-6 py-4 text-center bg-zinc-50">Projects</th>
                                    <th className="px-6 py-4 bg-zinc-50">Status</th>
                                    <th className="px-6 py-4 text-right bg-zinc-50">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {tenants.map(company => (
                                    <tr key={company.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-zinc-900">{company.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${company.plan === 'Enterprise' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                company.plan === 'Business' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-zinc-100 text-zinc-600 border-zinc-200'
                                                }`}>{company.plan}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1.5 w-24 mx-auto">
                                                <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                                                    <span>{company.users}</span>
                                                    <span className="text-zinc-400">/ {company.maxUsers || 10}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${((company.users || 0) / (company.maxUsers || 10)) > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${Math.min(100, ((company.users || 0) / (company.maxUsers || 10)) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1.5 w-24 mx-auto">
                                                <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                                                    <span>{company.projects}</span>
                                                    <span className="text-zinc-400">/ {company.maxProjects || 5}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${((company.projects || 0) / (company.maxProjects || 5)) > 0.9 ? 'bg-red-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(100, ((company.projects || 0) / (company.maxProjects || 5)) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 text-xs font-bold ${company.status === 'Active' ? 'text-green-600' :
                                                company.status === 'Suspended' ? 'text-red-600' :
                                                    'text-orange-600'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${company.status === 'Active' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]' :
                                                    company.status === 'Suspended' ? 'bg-red-500' :
                                                        'bg-orange-500'
                                                    }`}></span>
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-700 transition-colors" title="Settings"><Settings size={16} /></button>
                                                <button
                                                    onClick={() => impersonateTenant(company.id)}
                                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                                    title="Login As"
                                                >
                                                    <UserCheck size={16} />
                                                </button>
                                                {company.status !== 'Suspended' && <button onClick={() => handleSuspend(company.id, company.status)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-200" title="Suspend"><Lock size={16} /></button>}
                                                {company.status === 'Suspended' && <button onClick={() => handleSuspend(company.id, company.status)} className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors border border-transparent hover:border-green-200" title="Activate"><Unlock size={16} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Control & Broadcast */}
                <div className="space-y-6">
                    {/* Control Panel */}
                    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-5"><Settings size={80} /></div>
                        <h3 className="font-bold text-zinc-800 mb-6 flex items-center gap-2 relative z-10">
                            <Server size={18} className="text-purple-600" /> System Control
                        </h3>
                        <div className="space-y-4 relative z-10">
                            {/* Control Toggles */}
                            {[
                                { key: 'maintenance', label: 'Maintenance Mode', icon: Power, onColor: 'bg-red-500', offColor: 'bg-zinc-300', iconColor: 'text-red-600', iconBg: 'bg-red-100' },
                                { key: 'betaFeatures', label: 'Global Beta Access', icon: Sparkles, onColor: 'bg-emerald-500', offColor: 'bg-zinc-300', iconColor: 'text-purple-600', iconBg: 'bg-purple-100' },
                                { key: 'registrations', label: 'New Registrations', icon: UserCheck, onColor: 'bg-emerald-500', offColor: 'bg-zinc-300', iconColor: 'text-blue-600', iconBg: 'bg-blue-100' },
                                { key: 'aiEngine', label: 'AI Inference Engine', icon: BrainCircuit, onColor: 'bg-indigo-500', offColor: 'bg-zinc-300', iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100' },
                            ].map((ctrl) => (
                                <div key={ctrl.key} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${ctrl.iconBg}`}>
                                            <ctrl.icon size={16} className={ctrl.iconColor} />
                                        </div>
                                        <div className="text-sm font-medium text-zinc-700">{ctrl.label}</div>
                                    </div>
                                    <button
                                        onClick={() => toggleSetting(ctrl.key as keyof typeof systemSettings)}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${systemSettings[ctrl.key as keyof typeof systemSettings] ? ctrl.onColor : ctrl.offColor}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${systemSettings[ctrl.key as keyof typeof systemSettings] ? 'left-6' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex gap-3 relative z-10">
                            <button
                                onClick={handleFlushCache}
                                className="flex-1 py-2.5 text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors flex items-center justify-center gap-2 border border-zinc-200"
                            >
                                <RefreshCw size={14} /> Flush Cache
                            </button>
                            <button
                                onClick={handleRestartServices}
                                className="flex-1 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-100"
                            >
                                <RotateCcw size={14} /> Restart
                            </button>
                        </div>
                    </div>

                    {/* Enhanced Broadcast Widget */}
                    <div className="bg-gradient-to-br from-[#0f5c82] to-[#0c4a6e] rounded-xl shadow-lg p-6 text-white relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="font-bold mb-3 flex items-center gap-2 relative z-10">
                            <Megaphone size={18} className="text-yellow-400" /> Global Broadcast
                        </h3>
                        <div className="relative z-10">
                            <textarea
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-white/30 resize-none h-24 mb-3"
                                placeholder="Type system-wide announcement..."
                                value={localBroadcastMsg}
                                onChange={e => setLocalBroadcastMsg(e.target.value)}
                            />
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-xs text-blue-200 cursor-pointer hover:text-white transition-colors">
                                    <input type="checkbox" className="rounded text-blue-500 focus:ring-0 bg-white/10 border-white/20" />
                                    Urgent Alert
                                </label>
                                <button
                                    disabled={!localBroadcastMsg.trim()}
                                    onClick={handleBroadcast}
                                    className="bg-white text-[#0f5c82] px-5 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    Send Broadcast
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Access Logs Section - Dynamic */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                    <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                        <Key size={18} className="text-amber-500" /> Security Access Logs
                    </h3>
                    <div className="flex gap-4">
                        <span className="text-xs font-mono text-zinc-400 self-center">Live Feed • <span className="text-emerald-500">Connected</span></span>
                        <button className="text-sm text-[#0f5c82] font-medium hover:underline flex items-center gap-1">View Full Log <ArrowRight size={14} /></button>
                    </div>
                </div>
                <div className="p-0">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-zinc-100 text-zinc-500 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Event</th>
                                <th className="px-6 py-3">IP Address</th>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {accessLogs.slice(0, 5).map((log, i) => ( // Use first 5 logs from context
                                <tr key={log.id} className="hover:bg-zinc-50 transition-colors animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                                    <td className="px-6 py-4 font-medium text-zinc-900 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                            {log.user.charAt(0)}
                                        </div>
                                        {log.user}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600">{log.event}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-zinc-500">{log.ip}</td>
                                    <td className="px-6 py-4 text-zinc-500">{log.time}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${log.status === 'success' ? 'bg-green-100 text-green-700' :
                                            log.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <AddTenantModal
                isOpen={isAddTenantModalOpen}
                onClose={() => setIsAddTenantModalOpen(false)}
            />
        </div>
    );
};

// --- 2. COMPANY ADMIN DASHBOARD ---
const CompanyAdminDashboard: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const { projects, safetyHazards, equipment } = useProjects();
    const { canAddResource, currentTenant, checkFeature } = useTenant();

    const totalRevenue = useMemo(() => projects.reduce((sum, p) => sum + (p.budget || 0), 0), [projects]);
    const activeProjectsCount = projects.length;
    const healthyProjects = projects.filter(p => (p.health || '').toLowerCase() === 'good').length;
    const healthPercentage = activeProjectsCount > 0 ? Math.round((healthyProjects / activeProjectsCount) * 100) : 100;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Portfolio Engine</h1>
                    <p className="text-zinc-500 font-medium text-lg">Strategic financial visibility and high-level project trajectory.</p>
                </div>
                <div className="p-2 bg-blue-50 text-[#0f5c82] rounded-2xl border border-blue-100 font-black text-[10px] uppercase px-4 tracking-widest">
                    Corporate Admin
                </div>
            </div>

            {!canAddResource('projects') && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-800 shadow-sm animate-pulse">
                    <AlertCircle size={20} />
                    <div>
                        <p className="text-sm font-bold">Project Limit Reached</p>
                        <p className="text-xs">Your current plan ({currentTenant?.plan}) allows max {currentTenant?.maxProjects || 5} projects. Upgrade to Enterprise for unlimited.</p>
                    </div>
                </div>
            )}

            <AIDailyBriefing role={UserRole.COMPANY_ADMIN} />

            {/* Quick Actions - Enhanced */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <QuickActionsGrid setPage={setPage} />
                </div>
                <div className="lg:col-span-1">
                    <TenantUsageWidget />
                    <button
                        onClick={() => setPage(Page.TENANT_ANALYTICS)}
                        className="w-full mt-4 p-4 bg-white border border-dashed border-blue-300 rounded-xl text-blue-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                    >
                        <PieChart size={18} />
                        View Full Tenant Intelligence
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#0f5c82] to-[#0c4a6e] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-blue-200 font-medium text-sm uppercase tracking-wider mb-1">Total Budget (YTD)</h3>
                        <div className="text-4xl font-bold mb-4">£{(totalRevenue / 1000000).toFixed(1)} Million</div>
                        <div className="flex gap-4">
                            <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                                <div className="text-xs text-blue-200">Active Projects</div>
                                <div className="font-bold text-xl">{activeProjectsCount}</div>
                            </div>
                            <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                                <div className="text-xs text-blue-200">Win Rate</div>
                                <div className="font-bold text-xl">64%</div>
                            </div>
                        </div>
                    </div>
                    <Sparkles className="absolute top-0 right-0 text-white/10 w-64 h-64 -mr-10 -mt-10" />
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                    <h3 className="font-bold text-zinc-900 mb-4 flex items-center justify-between">
                        Project Health
                        <Activity size={16} className="text-zinc-400" />
                    </h3>
                    <div className="flex items-center justify-center h-40 relative">
                        <div className="text-center">
                            <div className={`text-3xl font-bold ${healthPercentage >= 70 ? 'text-green-600' : 'text-orange-600'}`}>{healthPercentage}%</div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">On Track</div>
                        </div>
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#f4f4f5" strokeWidth="8" />
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={healthPercentage >= 70 ? "#10b981" : "#f97316"}
                                strokeWidth="8"
                                strokeDasharray="251"
                                strokeDashoffset={251 - (251 * healthPercentage) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center justify-between">
                            Operational Health
                            <Shield size={16} className="text-zinc-400" />
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-amber-500" />
                                    <span className="text-xs font-bold text-zinc-600">Active Hazards</span>
                                </div>
                                <span className="text-sm font-black text-zinc-900">{safetyHazards.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wrench size={14} className="text-blue-500" />
                                    <span className="text-xs font-bold text-zinc-600">Maint. Overdue</span>
                                </div>
                                <span className="text-sm font-black text-zinc-900">{equipment.filter(e => e.nextService && new Date(e.nextService) < new Date()).length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-50">
                        <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                            <span>Risk Exposure</span>
                            <span className="text-red-500">Medium</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-1/3" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                    <h3 className="font-bold text-zinc-900">Active Projects</h3>
                    <button onClick={() => setPage(Page.PROJECTS)} className="text-sm text-[#0f5c82] font-medium hover:underline">View All</button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Project Name</th>
                            <th className="px-6 py-3">Budget</th>
                            <th className="px-6 py-3">Progress</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {projects.length > 0 ? projects.map((p, i) => (
                            <tr key={i} className="hover:bg-zinc-50">
                                <td className="px-6 py-4 font-medium text-zinc-900">{p.name}</td>
                                <td className="px-6 py-4 text-zinc-600">£{(p.budget / 1000000).toFixed(1)}M</td>
                                <td className="px-6 py-4">
                                    <div className="w-24 bg-zinc-200 h-1.5 rounded-full">
                                        <div className={`h-full rounded-full ${(p.health || '').toLowerCase() === 'good' ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${p.progress}%` }}></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${(p.health || '').toLowerCase() === 'good' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{p.health || 'Neutral'}</span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-zinc-500">No active projects found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FieldCard = ({ title, icon: Icon, onClick, addAction }: any) => (
    <div onClick={onClick} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between min-h-[140px]">
        <div className="flex justify-between items-start">
            <div className="p-2.5 bg-zinc-50 rounded-xl group-hover:bg-blue-50 group-hover:text-[#0f5c82] transition-colors text-zinc-600">
                <Icon size={24} />
            </div>
            {addAction && (
                <button onClick={(e) => { e.stopPropagation(); addAction(); }} className="p-1.5 bg-zinc-100 hover:bg-[#0f5c82] hover:text-white rounded-lg text-zinc-400 transition-colors">
                    <Plus size={16} />
                </button>
            )}
        </div>
        <div>
            <h3 className="font-bold text-zinc-900 text-sm mb-1">{title}</h3>
            <p className="text-[10px] text-zinc-400 uppercase font-medium tracking-wide group-hover:text-[#0f5c82] transition-colors">View All</p>
        </div>
    </div>
);

// --- 3. SUPERVISOR DASHBOARD (FIELD VIEW) ---
const SupervisorDashboard: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const { user } = useAuth();


    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0f5c82] to-[#1f7d98] flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-md">
                        {user?.avatarInitials}
                    </div>
                    <div>
                        <div className="text-xs text-zinc-500 font-medium uppercase">Marksman Roofing and Cladding Ltd.</div>
                        <div className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            St Georges Hospital <RotateCcw size={14} className="text-zinc-400" />
                        </div>
                    </div>
                </div>
                <button className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-600">
                    <Search size={20} />
                </button>
            </div>

            <AIDailyBriefing role={UserRole.SUPERVISOR} />

            {/* HERO: LIVE FIELD MODE */}
            <div
                onClick={() => setPage(Page.LIVE)}
                className="bg-zinc-900 rounded-3xl p-6 text-white relative overflow-hidden cursor-pointer group shadow-xl transition-transform hover:scale-[1.01]"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-[#0f5c82] rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity" />

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold tracking-widest uppercase text-red-400">Live Mode</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-1">Launch Field Assistant</h2>
                        <p className="text-zinc-400 text-sm max-w-md">
                            Multimodal video session with snapshot analysis. Point your camera at site issues for instant AI inspection.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all backdrop-blur-sm">
                            <Video size={28} />
                        </div>
                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/20 text-white transition-all backdrop-blur-sm border border-white/10">
                            <Aperture size={24} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <FieldCard title="Inspections" icon={Clipboard} onClick={() => setPage(Page.SAFETY)} addAction={() => { }} />
                <FieldCard title="Locations" icon={MapPin} onClick={() => setPage(Page.LIVE_PROJECT_MAP)} />
                <FieldCard title="Observations" icon={BookOpen} onClick={() => setPage(Page.SAFETY)} addAction={() => { }} />
                <FieldCard title="Photos" icon={Camera} onClick={() => setPage(Page.PROJECT_DETAILS)} addAction={() => { }} />
                <FieldCard title="Snag List" icon={Pin} onClick={() => setPage(Page.TASKS)} addAction={() => { }} />
                <FieldCard title="RFIs" icon={AlertCircle} onClick={() => setPage(Page.PROJECT_DETAILS)} addAction={() => { }} />
                <FieldCard title="Programme" icon={Calendar} onClick={() => setPage(Page.SCHEDULE)} />
                <FieldCard title="Specifications" icon={FileText} onClick={() => setPage(Page.DOCUMENTS)} />
                <FieldCard title="Tasks" icon={CheckSquare} onClick={() => setPage(Page.TASKS)} addAction={() => { }} />
            </div>

            {/* Floating Action Button for easy mobile access */}
            <div className="fixed bottom-8 right-8">
                <button
                    onClick={() => setPage(Page.TASKS)}
                    className="w-14 h-14 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-2xl shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                >
                    <Plus size={28} />
                </button>
            </div>
        </div>
    );
};

// --- 4. OPERATIVE DASHBOARD ---
const OperativeDashboard: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const { tasks } = useProjects();
    const { user } = useAuth();

    const myTasks = useMemo(() => {
        if (!user) return [];
        return tasks.filter(t => {
            if (t.status === 'Done') return false;

            // Role check
            if (t.assigneeType === 'role') {
                if (user.role === UserRole.OPERATIVE && t.assigneeName === 'Operative') return true;
            }
            // User check
            if (t.assigneeType === 'user' && t.assigneeName === user.name) return true;
            return false;
        });
    }, [tasks, user]);

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-zinc-900">My Work Portal</h1>
                <p className="text-zinc-500">Welcome back, {user?.name.split(' ')[0]}.</p>
            </div>

            <AIDailyBriefing role={UserRole.OPERATIVE} />

            {/* Time Clock Card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Current Status</div>
                <div className="text-3xl font-bold text-green-600 mb-1">Clocked In</div>
                <div className="text-zinc-500 mb-6">Since 07:30 AM</div>

                <div className="flex gap-4 w-full max-w-xs">
                    <button className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100">
                        Clock Out
                    </button>
                    <button className="flex-1 bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                        Take Break
                    </button>
                </div>
            </div>

            {/* Assigned Tasks */}
            <div>
                <h3 className="font-bold text-zinc-900 mb-4">My Tasks for Today ({myTasks.length})</h3>
                <div className="space-y-3">
                    {myTasks.length > 0 ? myTasks.map((task) => (
                        <div key={task.id} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-start gap-3 group hover:border-[#0f5c82] transition-colors">
                            <button className="mt-1 w-5 h-5 rounded border-2 border-zinc-300 hover:border-[#0f5c82] flex items-center justify-center text-transparent hover:text-[#0f5c82] transition-all">
                                <CheckCircle2 size={12} />
                            </button>
                            <div className="flex-1">
                                <div className="font-medium text-zinc-900 flex justify-between">
                                    <span>{task.title}</span>
                                    {task.assigneeType === 'role' && (
                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase">
                                            {task.assigneeName}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-zinc-500 mt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1"><Clock size={12} /> Due {task.dueDate}</span>
                                        {task.dependencies && task.dependencies.length > 0 && (
                                            <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 bg-zinc-50 px-1.5 rounded border border-zinc-100">
                                                <Link size={10} /> {task.dependencies.length}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.status === 'Blocked' ? 'bg-red-100 text-red-600' :
                                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                                            task.status === 'Done' ? 'bg-green-100 text-green-600' :
                                                'bg-zinc-100 text-zinc-500'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                            <CheckSquare size={32} className="mx-auto mb-2 opacity-20" />
                            <p>No tasks assigned to you or your role.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setPage(Page.SAFETY)} className="p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 text-left transition-colors">
                    <AlertCircle className="text-red-500 mb-2" size={24} />
                    <div className="font-bold text-zinc-900">Report Safety Issue</div>
                </button>
                <button onClick={() => setPage(Page.LIVE_PROJECT_MAP)} className="p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 text-left transition-colors">
                    <MapIcon className="text-[#0f5c82] mb-2" size={24} />
                    <div className="font-bold text-zinc-900">View Site Map</div>
                </button>
            </div>
        </div>
    );
};

// Helper Component
const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
                <Icon size={20} />
            </div>
        </div>
        <div className="text-2xl font-bold text-zinc-900 mb-1">{value}</div>
        <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500">{label}</div>
            <div className={`text-[10px] font-bold bg-${color}-50 text-${color}-700 px-2 py-0.5 rounded`}>{trend}</div>
        </div>
    </div>
);

export default DashboardView;
