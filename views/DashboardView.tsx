import React, { useMemo, useState, useEffect } from 'react';
import {
    ArrowRight, AlertCircle, Sparkles, MapPin, Clock,
    TrendingUp, CheckCircle2, Calendar, Activity,
    MoreHorizontal, Shield, DollarSign, Users, Briefcase, HardHat, CheckSquare, Map as MapIcon,
    FileText, PlusSquare, UserCheck, GitPullRequest, MessageSquare, FileBarChart, Settings, RotateCcw,
    Clipboard, Camera, Pin, Search, List, BookOpen, Plus, Video, Aperture, Link,
    ChevronRight, PieChart, AlertTriangle, Wrench, Loader2, CheckIcon, Terminal, Lock, Navigation, Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useTenant } from '@/contexts/TenantContext'; // Added TenantContext
import { UserRole, Task, Page, Tenant } from '@/types'; // Switched Company to Tenant
import { runRawPrompt, parseAIJSON } from '@/services/geminiService';
import { useToast } from '@/contexts/ToastContext';
import { TenantUsageWidget } from '@/components/TenantUsageWidget';
import PredictiveInsights from '@/components/PredictiveInsights';

interface DashboardViewProps {
    setPage: (page: Page) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ setPage }) => {
    const { user } = useAuth();

    if (!user) return null;

    switch (user.role) {
        case UserRole.SUPERADMIN:
            // Superadmins should be routed to PlatformDashboardView by App.tsx
            // If they end up here, just redirect or show nothing.
            return null;
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
            const openHazards = safetyHazards;
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

            const userName = user?.name || 'User';
            const userRole = role || 'Admin';
            const contextStr = JSON.stringify(context);
            const prompt = `Act as a Chief of Staff AI for a Construction Executive.
Generate a personalized 'Daily Briefing' for ${userName} in the role of ${userRole}.

Data context: ${contextStr}

Return JSON:
{
  "greeting": "Personalized morning greeting",
  "agenda": ["Item 1", "Item 2", "Item 3"],
  "risks": ["Risk 1", "Risk 2"],
  "wins": ["Recent win or positive trend"],
  "quote": "Motivational construction/leadership quote"
}`;


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
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 animate-pulse flex items-center justify-center gap-4 min-h-[220px]">
            <Loader2 className="animate-spin text-sky-400" />
            <span className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Assembling Intelligent Briefing...</span>
        </div>
    );

    if (!briefing) return null;

    return (
        <div className="relative group overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] -z-10 group-hover:bg-sky-400/20 transition-all duration-700"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -z-10 group-hover:bg-indigo-400/20 transition-all duration-700"></div>

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-white/20">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <Sparkles size={160} className="text-white" />
                </div>

                <div className="flex flex-col md:flex-row gap-12 items-start relative z-10">
                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-xl shadow-lg shadow-sky-500/20">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <h3 className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em]">AI Intelligence Briefing</h3>
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tight leading-[1.1]">{briefing.greeting}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-5">
                                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={14} className="text-sky-400" /> Strategic Priorities
                                </h4>
                                <ul className="space-y-4">
                                    {briefing.agenda?.map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-4 transition-transform hover:translate-x-1 duration-300">
                                            <div className="mt-1.5 w-1.5 h-1.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                                            <span className="text-sm font-semibold text-zinc-300 leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-5">
                                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle size={14} className="text-rose-500" /> Critical Risk Vectors
                                </h4>
                                <ul className="space-y-4">
                                    {briefing.risks?.map((risk: string, i: number) => (
                                        <li key={i} className="flex items-start gap-4 transition-transform hover:translate-x-1 duration-300">
                                            <div className="mt-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                                            <span className="text-sm font-semibold text-zinc-300 leading-relaxed">{risk}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-72 space-y-6">
                        <div className="p-6 bg-gradient-to-br from-zinc-900/80 to-zinc-900 rounded-[2rem] border border-white/5 shadow-2xl">
                            <TrendingUp size={28} className="text-emerald-400 mb-4" />
                            <p className="text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest">Global Traction</p>
                            <p className="text-sm font-bold text-white leading-snug italic tracking-tight">&quot;{briefing.wins?.[0]}&quot;</p>
                        </div>
                        <div className="px-6 py-4 border-l-2 border-sky-500/30 bg-white/5 rounded-r-2xl transform transition-transform hover:scale-[1.02]">
                            <p className="text-[10px] text-sky-400 font-black mb-2 uppercase tracking-widest">Leadership Insight</p>
                            <p className="text-xs text-zinc-400 font-medium italic leading-relaxed">&quot;{briefing.quote}&quot;</p>
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
        <div className={"p-3 rounded-lg bg-zinc-50 group-hover:bg-blue-50 transition-colors mb-3 " + color}>
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



// --- 2. COMPANY ADMIN DASHBOARD ---
const CompanyAdminDashboard: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const { projects, safetyHazards, equipment } = useProjects();
    const { canAddResource, currentTenant } = useTenant();

    const totalRevenue = useMemo(() => projects.reduce((sum, p) => sum + (p.budget || 0), 0), [projects]);
    const activeProjectsCount = projects.length;
    const healthyProjects = projects.filter(p => (p.health || '').toLowerCase() === 'good').length;
    const healthPercentage = activeProjectsCount > 0 ? Math.round((healthyProjects / activeProjectsCount) * 100) : 100;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 min-h-screen bg-zinc-950 text-white">
            <header className="flex justify-between items-end">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_10px_#38bdf8]" />
                        <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.4em]">Strategic Control Center</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter">Portfolio Engine</h1>
                    <p className="text-zinc-400 font-medium text-lg max-w-2xl">High-fidelity strategic visibility into mission-critical project trajectories.</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="p-2 bg-white/5 backdrop-blur-xl text-sky-400 rounded-2xl border border-white/10 font-black text-[10px] uppercase px-6 py-3 tracking-widest shadow-2xl">
                        Corporate Admin Mode
                    </div>
                </div>
            </header>

            {!canAddResource('projects') && (
                <div className="bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 p-6 rounded-[2rem] flex items-center gap-5 text-rose-200 shadow-2xl">
                    <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/30">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-lg font-black tracking-tight">System Constraint: Project Limit Reached</p>
                        <p className="text-zinc-400 font-medium">Your current {currentTenant?.plan} allocation allows for {currentTenant?.maxProjects || 5} active nodes. Contact infrastructure for Enterprise scaling.</p>
                    </div>
                </div>
            )}

            <AIDailyBriefing role={UserRole.COMPANY_ADMIN} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    <QuickActionsGrid setPage={setPage} />
                </div>
                <div className="lg:col-span-1 space-y-8">
                    {projects.length > 0 && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4">
                            <PredictiveInsights projectId={projects[0].id} />
                        </div>
                    )}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 invisible md:visible">
                        <TenantUsageWidget />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Core Financial Metric */}
                <div className="bg-gradient-to-br from-sky-500 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4 opacity-70">
                                <DollarSign size={16} />
                                <h3 className="font-black text-[10px] uppercase tracking-widest">Total Capital Portfolio (YTD)</h3>
                            </div>
                            <div className="text-5xl font-black mb-6 tracking-tighter">£{(totalRevenue / 1000000).toFixed(1)}M</div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10 flex-1">
                                <div className="text-[10px] font-black text-sky-200 uppercase mb-1">Active Nodes</div>
                                <div className="font-black text-2xl tracking-tighter">{activeProjectsCount}</div>
                            </div>
                            <div className="bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10 flex-1">
                                <div className="text-[10px] font-black text-sky-200 uppercase mb-1">Win Velocity</div>
                                <div className="font-black text-2xl tracking-tighter">64%</div>
                            </div>
                        </div>
                    </div>
                    <Sparkles className="absolute top-0 right-0 text-white/5 w-80 h-80 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                </div>

                {/* Health Gauge */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-zinc-500 mb-6 flex items-center justify-between">
                        Pulse Integrity
                        <Activity size={16} className="text-emerald-400 animate-pulse" />
                    </h3>
                    <div className="flex items-center justify-center h-48 relative">
                        <div className="text-center z-10">
                            <div className={`text-4xl font-black tracking-tighter ${healthPercentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {healthPercentage}%
                            </div>
                            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">On Path</div>
                        </div>
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke={healthPercentage >= 70 ? "#10b981" : "#f59e0b"}
                                strokeWidth="6"
                                strokeDasharray="264"
                                strokeDashoffset={264 - (264 * healthPercentage) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                style={{
                                    filter: `drop-shadow(0 0 8px ${healthPercentage >= 70 ? '#10b98166' : '#f59e0b66'})`
                                }}
                            />
                        </svg>
                    </div>
                </div>

                {/* Risk Distribution */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between group">
                    <div>
                        <h3 className="font-black text-[10px] uppercase tracking-widest text-zinc-500 mb-8 flex items-center justify-between">
                            Risk Vector Analysis
                            <Shield size={16} className="text-rose-400" />
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-xl">
                                        <AlertTriangle size={14} className="text-amber-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hazards</span>
                                </div>
                                <span className="text-lg font-black text-white tracking-tighter">{safetyHazards.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sky-500/10 rounded-xl">
                                        <Wrench size={14} className="text-sky-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Maintenance</span>
                                </div>
                                <span className="text-lg font-black text-white tracking-tighter">{equipment.filter(e => e.nextService && new Date(e.nextService) < new Date()).length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/5">
                        <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">
                            <span>System Exposure</span>
                            <span className="text-amber-400 font-black">Moderate</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 w-1/3 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* High-Fidelity Project Table */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <Briefcase size={20} className="text-sky-400" />
                        <h3 className="font-black text-lg tracking-tight">Active Nodes</h3>
                    </div>
                    <button
                        onClick={() => setPage(Page.PROJECTS)}
                        className="text-[10px] font-black text-sky-400 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Access Archive
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.03] text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Node Identity</th>
                                <th className="px-8 py-4 text-right">Capital Value</th>
                                <th className="px-8 py-4">Velocity</th>
                                <th className="px-8 py-4">Integrity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {projects.length > 0 ? projects.map((p, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                    <td className="px-8 py-6">
                                        <div className="font-black text-white text-base tracking-tight group-hover:text-sky-400 transition-colors">{p.name}</div>
                                        <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Regional: London HQ</div>
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-zinc-300 tracking-tighter text-lg">
                                        £{(p.budget / 1000000).toFixed(1)}M
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${(p.health || '').toLowerCase() === 'good'
                                                        ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                                                        : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                                                        }`}
                                                    style={{ width: p.progress + '%' }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-zinc-400">{p.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${(p.health || '').toLowerCase() === 'good'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                            <div className={`w-1 h-1 rounded-full animate-pulse ${(p.health || '').toLowerCase() === 'good' ? 'bg-emerald-400' : 'bg-amber-400'
                                                }`} />
                                            {p.health || 'Neutral'}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="text-zinc-500 font-black uppercase text-xs tracking-[0.3em]">No Active Nodes Found</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const FieldCard = ({ title, icon: Icon, onClick, addAction }: any) => (
    <div
        onClick={onClick}
        className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg hover:shadow-sky-500/10 hover:border-sky-400/30 transition-all cursor-pointer group relative flex flex-col justify-between min-h-[140px] overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400/0 to-sky-400/0 group-hover:from-sky-400/5 group-hover:to-transparent transition-all duration-500" />
        <div className="flex justify-between items-start relative z-10">
            <div className="p-3 bg-white/5 rounded-xl group-hover:bg-sky-400 group-hover:text-white transition-all duration-300 text-sky-400 shadow-inner">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            {addAction && (
                <button
                    onClick={(e) => { e.stopPropagation(); addAction(); }}
                    className="p-1.5 bg-white/5 hover:bg-sky-400 hover:text-white rounded-lg text-zinc-500 transition-all border border-white/5"
                >
                    <Plus size={16} />
                </button>
            )}
        </div>
        <div className="relative z-10">
            <h3 className="font-black text-white text-sm mb-1 tracking-tight group-hover:text-sky-400 transition-colors">{title}</h3>
            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em] group-hover:text-sky-300/50 transition-colors">Initialize Module</p>
        </div>
    </div>
);

// --- 3. SUPERVISOR DASHBOARD (FIELD VIEW) ---
const SupervisorDashboard: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const { user } = useAuth();
    const { projects } = useProjects();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 bg-zinc-950 text-white min-h-screen">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-sky-400 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white font-black text-xl border border-white/20 shadow-2xl relative z-10 transform transition-transform group-hover:scale-105">
                            {user?.avatarInitials}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-sky-400 font-black uppercase tracking-[0.3em] mb-1">Site Command</div>
                        <div className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                            Active Operations <Navigation size={18} className="text-sky-500 animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="p-4 bg-white/5 backdrop-blur-xl hover:bg-white/10 rounded-2xl text-white border border-white/10 transition-all">
                        <Search size={20} />
                    </button>
                </div>
            </header>

            <AIDailyBriefing role={UserRole.SUPERVISOR} />

            {projects.length > 0 && (
                <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4">
                    <PredictiveInsights projectId={projects[0].id} />
                </div>
            )}

            {/* HERO: LIVE FIELD MODE */}
            <div
                onClick={() => setPage(Page.LIVE)}
                className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden cursor-pointer group shadow-2xl transition-all border border-white/5 hover:border-sky-400/30"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute right-0 bottom-0 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-rose-400">Tactical Live Stream</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter">Spatial Field Assistant</h2>
                        <p className="text-zinc-400 font-medium max-w-md leading-relaxed">
                            Neural-link video session with real-time site analysis. Instant AI-driven defect detection and progress tracking.
                        </p>
                    </div>
                    <div className="flex gap-5">
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center group-hover:bg-sky-400 group-hover:text-white transition-all duration-500 backdrop-blur-xl border border-white/10 shadow-2xl">
                            <Video size={36} strokeWidth={1.5} />
                        </div>
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center group-hover:bg-white/10 text-white transition-all duration-500 backdrop-blur-xl border border-white/5">
                            <Aperture size={32} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <FieldCard title="Digital Safety" icon={Shield} onClick={() => setPage(Page.SAFETY)} addAction={() => { }} />
                <FieldCard title="Spatial Map" icon={MapIcon} onClick={() => setPage(Page.LIVE_PROJECT_MAP)} />
                <FieldCard title="Observations" icon={BookOpen} onClick={() => setPage(Page.SAFETY)} addAction={() => { }} />
                <FieldCard title="Capture" icon={Camera} onClick={() => setPage(Page.PROJECT_DETAILS)} addAction={() => { }} />
                <FieldCard title="Vector Ledger" icon={Pin} onClick={() => setPage(Page.TASKS)} addAction={() => { }} />
                <FieldCard title="Query (RFI)" icon={AlertCircle} onClick={() => setPage(Page.PROJECT_DETAILS)} addAction={() => { }} />
                <FieldCard title="Timeline" icon={Calendar} onClick={() => setPage(Page.SCHEDULE)} />
                <FieldCard title="Knowledge" icon={FileText} onClick={() => setPage(Page.DOCUMENTS)} />
                <FieldCard title="Tasks" icon={CheckSquare} onClick={() => setPage(Page.TASKS)} addAction={() => { }} />
                <FieldCard title="Workforce" icon={Users} onClick={() => setPage(Page.TEAM)} />
            </div>

            <div className="fixed bottom-10 right-10">
                <button
                    onClick={() => setPage(Page.TASKS)}
                    className="w-16 h-16 bg-gradient-to-br from-sky-400 to-indigo-600 hover:from-sky-300 hover:to-indigo-500 text-white rounded-[2rem] shadow-[0_0_30px_rgba(56,189,248,0.3)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/20"
                >
                    <Plus size={32} />
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
            if (t.assigneeType === 'role') {
                if (user.role === UserRole.SUPERADMIN && t.assigneeName === 'Operative') return true;
                if (user.role === UserRole.OPERATIVE && t.assigneeName === 'Operative') return true;
            }
            if (t.assigneeType === 'user' && t.assigneeName === user.name) return true;
            return false;
        });
    }, [tasks, user]);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 bg-zinc-950 text-white min-h-screen">
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Field Operative Node</span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter">Worker Portal</h1>
                <p className="text-zinc-500 font-medium text-lg mt-1 tracking-tight">Active protocols for {user?.name.split(' ')[0]}.</p>
            </header>

            <AIDailyBriefing role={UserRole.OPERATIVE} />

            {/* Time Clock Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-30" />
                <div className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Pulse Integrity</div>
                <div className="text-5xl font-black text-emerald-400 mb-2 tracking-tighter">Clocked In</div>
                <div className="text-zinc-400 font-bold text-sm mb-10 tracking-tight">Active since 07:30 AM (GMT)</div>

                <div className="flex gap-6 w-full max-w-md">
                    <button className="flex-1 bg-rose-500/10 text-rose-400 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 text-xs shadow-lg">
                        Clock Out
                    </button>
                    <button className="flex-1 bg-white/5 text-zinc-400 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 text-xs">
                        Interval / Break
                    </button>
                </div>
            </div>

            {/* Assigned Tasks */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckSquare size={20} className="text-sky-400" />
                        <h3 className="font-black text-lg text-white tracking-tight">Assigned Protocols ({myTasks.length})</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {myTasks.length > 0 ? myTasks.map((task) => (
                        <div key={task.id} className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 hover:border-sky-400/30 transition-all group shadow-xl">
                            <div className="flex items-center gap-5">
                                <button className="w-8 h-8 rounded-xl border-2 border-white/10 group-hover:border-sky-400 flex items-center justify-center text-transparent group-hover:text-sky-400 transition-all bg-white/5 shadow-inner">
                                    <CheckCircle2 size={16} />
                                </button>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className="font-black text-white text-lg tracking-tight group-hover:text-sky-400 transition-colors">{task.title}</div>
                                        {task.assigneeType === 'role' && (
                                            <span className="text-[9px] bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-sky-500/10">
                                                {task.assigneeName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                                                <Clock size={14} className="text-sky-400" /> Due {task.dueDate}
                                            </div>
                                            {task.dependencies && task.dependencies.length > 0 && (
                                                <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                                    <Link size={12} className="text-indigo-400" />
                                                    {task.dependencies.length} Chains
                                                </div>
                                            )}
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${task.status === 'Blocked' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            task.status === 'In Progress' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                                                'bg-zinc-800/50 text-zinc-500 border-white/5'
                                            }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 shadow-inner">
                            <Zap size={48} className="mx-auto mb-4 text-zinc-700" />
                            <p className="font-black text-zinc-500 uppercase tracking-[0.3em] text-[10px]">No Assigned Vectors</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-6 pb-10">
                <button onClick={() => setPage(Page.SAFETY)} className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] hover:bg-rose-500/10 hover:border-rose-500/30 group transition-all text-left shadow-2xl">
                    <div className="p-3 bg-rose-500 rounded-2xl w-fit mb-6 shadow-lg shadow-rose-500/20 transition-transform group-hover:scale-110">
                        <AlertCircle className="text-white" size={24} />
                    </div>
                    <div className="font-black text-white text-lg tracking-tight mb-1">Signal Hazard</div>
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Immediate Safety Protocol</div>
                </button>
                <button onClick={() => setPage(Page.LIVE_PROJECT_MAP)} className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] hover:bg-sky-500/10 hover:border-sky-500/30 group transition-all text-left shadow-2xl">
                    <div className="p-3 bg-sky-500 rounded-2xl w-fit mb-6 shadow-lg shadow-sky-500/20 transition-transform group-hover:scale-110">
                        <MapIcon className="text-white" size={24} />
                    </div>
                    <div className="font-black text-white text-lg tracking-tight mb-1">Grid Map</div>
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Tactical Site Orientation</div>
                </button>
            </div>
        </div>
    );
};

// Helper Component
const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-xl group hover:border-sky-400/30 transition-all">
        <div className="flex items-start justify-between mb-6">
            <div className={`p-3 rounded-2xl bg-white/5 text-sky-400 shadow-inner group-hover:bg-sky-400 group-hover:text-white transition-all`}>
                <Icon size={20} />
            </div>
            <div className={`text-[10px] font-black bg-white/5 text-zinc-400 px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest`}>
                {trend}
            </div>
        </div>
        <div className="text-3xl font-black text-white mb-1 tracking-tighter">{value}</div>
        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">{label}</div>
    </div>
);

export default DashboardView;
