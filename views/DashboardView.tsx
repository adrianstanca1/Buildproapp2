import React, { useMemo, useState, useEffect } from 'react';
import {
    ArrowRight, AlertCircle, Sparkles, MapPin, Clock,
    TrendingUp, CheckCircle2, Calendar, Activity,
    MoreHorizontal, Shield, DollarSign, Users, Briefcase, HardHat, CheckSquare, Map as MapIcon,
    FileText, PlusSquare, UserCheck, GitPullRequest, MessageSquare, FileBarChart, Settings, RotateCcw,
    Clipboard, Camera, Pin, Search, List, BookOpen, Plus, Video, Aperture, Link,
    ChevronRight, PieChart, AlertTriangle, Wrench, Loader2
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

            const userName = user?.name || 'User';
            const userRole = role || 'Admin';
            const contextStr = JSON.stringify(context);
            const prompt = "Act as a Chief of Staff AI for a Construction Executive.\n" +
                "Generate a personalized 'Daily Briefing' for " + userName + " in the role of " + userRole + ".\n\n" +
                "Data context: " + contextStr + "\n\n" +
                "Return JSON:\n" +
                "{\n" +
                '  "greeting": "Personalized morning greeting",\n' +
                '  "agenda": ["Item 1", "Item 2", "Item 3"],\n' +
                '  "risks": ["Risk 1", "Risk 2"],\n' +
                '  "wins": ["Recent win or positive trend"],\n' +
                '  "quote": "Motivational construction/leadership quote"\n' +
                "}";


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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <QuickActionsGrid setPage={setPage} />
                </div>
                <div className="lg:col-span-1 border-l border-zinc-100 pl-4 space-y-6">
                    {projects.length > 0 && (
                        <PredictiveInsights projectId={projects[0].id} />
                    )}
                    <TenantUsageWidget />
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
                            <div className={"text-3xl font-bold " + (healthPercentage >= 70 ? 'text-green-600' : 'text-orange-600')}>{healthPercentage}%</div>
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
                                        <div className={"h-full rounded-full " + ((p.health || '').toLowerCase() === 'good' ? 'bg-green-500' : 'bg-orange-500')} style={{ width: p.progress + '%' }}></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={"px-2 py-1 rounded text-xs font-bold " + ((p.health || '').toLowerCase() === 'good' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>{p.health || 'Neutral'}</span>
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
    const { projects } = useProjects();


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

            {/* Predictive Intelligence (Phase 14) */}
            {projects.length > 0 && (
                <div className="w-full">
                    <PredictiveInsights projectId={projects[0].id} />
                </div>
            )}

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
                if (user.role === UserRole.SUPERADMIN && t.assigneeName === 'Operative') return true;
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
                                    <span className={"px-2 py-0.5 rounded text-[10px] font-bold uppercase " + (
                                        task.status === 'Blocked' ? 'bg-red-100 text-red-600' :
                                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                                                task.status === 'Done' ? 'bg-green-100 text-green-600' :
                                                    'bg-zinc-100 text-zinc-500'
                                    )}>
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
            <div className={"p-2 rounded-lg bg-" + color + "-50 text-" + color + "-600"}>
                <Icon size={20} />
            </div>
        </div>
        <div className="text-2xl font-bold text-zinc-900 mb-1">{value}</div>
        <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500">{label}</div>
            <div className={"text-[10px] font-bold bg-" + color + "-50 text-" + color + "-700 px-2 py-0.5 rounded"}>{trend}</div>
        </div>
    </div>
);

export default DashboardView;
