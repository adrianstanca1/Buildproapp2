import React, { useState, useEffect } from 'react';
import {
    Terminal, Database, Server, Shield,
    AlertTriangle, Play, RefreshCw,
    Activity, HardDrive, Cpu, Command,
    Power, Sparkles, UserCheck, BrainCircuit,
    Megaphone, Filter, X, Calendar, Settings
} from 'lucide-react';
import { db } from '@/services/db';
import { useToast } from '@/contexts/ToastContext';
import { useTenant } from '@/contexts/TenantContext';
import { SystemHealth, SystemSettings } from '@/types';

const SuperAdminCommandCenter: React.FC = () => {
    const { addToast } = useToast();
    const { systemSettings, updateSystemSettings, setBroadcastMessage } = useTenant();
    const [activeTab, setActiveTab] = useState<'sql' | 'health' | 'controls'>('sql');

    // SQL State
    const [sqlQuery, setSqlQuery] = useState('');
    const [sqlResult, setSqlResult] = useState<any>(null);
    const [sqlError, setSqlError] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);

    // System State
    const [healthData, setHealthData] = useState<SystemHealth | null>(null);
    const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
    const [maintenanceSchedule, setMaintenanceSchedule] = useState({ startTime: '', duration: 60 });
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

    // Broadcast State
    const [localBroadcastMsg, setLocalBroadcastMsg] = useState('');
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastTarget, setBroadcastTarget] = useState({ role: 'all', plan: 'all' });

    useEffect(() => {
        loadSystemData();
        const interval = setInterval(loadSystemData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadSystemData = async () => {
        try {
            const [health, perf] = await Promise.all([
                db.getSystemHealth(),
                db.getSystemPerformanceHistory()
            ]);
            setHealthData(health);
            setPerformanceHistory(perf);
        } catch (e) {
            console.error("Failed to load system data", e);
        }
    };

    const handleExecuteSql = async () => {
        if (!sqlQuery.trim()) return;

        if ((sqlQuery.toLowerCase().includes('drop') || sqlQuery.toLowerCase().includes('delete')) &&
            !confirm('WARNING: You are about to execute a DESTRUCTIVE command. This cannot be undone. Are you sure?')) {
            return;
        }

        setIsExecuting(true);
        setSqlError('');
        setSqlResult(null);

        try {
            const res = await db.executeSql(sqlQuery);
            if (res.result) {
                setSqlResult(res.result);
                addToast('Query executed successfully', 'success');
            } else {
                setSqlResult(res);
            }
        } catch (e: any) {
            setSqlError(e.message || 'Query execution failed');
            addToast('Query execution failed', 'error');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleToggleSetting = (key: keyof SystemSettings) => {
        const newState = !systemSettings[key];
        updateSystemSettings({ [key]: newState });
        addToast(`${key.replace(/([A-Z])/g, ' $1').trim()} ${newState ? 'Enabled' : 'Disabled'}`, 'success');
    };

    const handleBroadcast = async () => {
        if (!localBroadcastMsg.trim()) return;
        try {
            if (broadcastTarget.role === 'all' && broadcastTarget.plan === 'all') {
                setBroadcastMessage(localBroadcastMsg);
                addToast('Global broadcast sent', 'success');
            } else {
                await db.sendTargetedBroadcast(broadcastTarget, localBroadcastMsg);
                addToast('Targeted broadcast sent', 'success');
            }
            setLocalBroadcastMsg('');
            setShowBroadcastModal(false);
        } catch (error) {
            addToast('Failed to send broadcast', 'error');
        }
    };

    const renderSqlResult = () => {
        if (!sqlResult) return null;
        if (Array.isArray(sqlResult) && sqlResult.length > 0) {
            const keys = Object.keys(sqlResult[0]);
            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300 font-mono">
                        <thead className="bg-zinc-800 text-zinc-400">
                            <tr>{keys.map(k => <th key={k} className="p-2 border-b border-zinc-700">{k}</th>)}</tr>
                        </thead>
                        <tbody>
                            {sqlResult.map((row, idx) => (
                                <tr key={idx} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                    {keys.map(k => (
                                        <td key={k} className="p-2 truncate max-w-[200px]" title={String(row[k])}>
                                            {typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        return <pre className="text-emerald-400 font-mono text-sm p-4">{JSON.stringify(sqlResult, null, 2)}</pre>;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                        <Command className="w-8 h-8 text-red-600" />
                        Command Center
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Advanced system diagnostics and direct controls
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs font-bold rounded-full border border-red-200 dark:border-red-800 flex items-center gap-2">
                        <Shield size={12} /> RESTRICTED ACCESS
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    <button onClick={() => setActiveTab('sql')} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'sql' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}>
                        <Database size={20} className={activeTab === 'sql' ? 'text-emerald-400' : ''} />
                        <div className="text-left"><p className="font-bold">SQL Runner</p><p className="text-xs opacity-70">Direct DB Execution</p></div>
                    </button>
                    <button onClick={() => setActiveTab('health')} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'health' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}>
                        <Activity size={20} className={activeTab === 'health' ? 'text-blue-400' : ''} />
                        <div className="text-left"><p className="font-bold">System Health</p><p className="text-xs opacity-70">Metrics & Performance</p></div>
                    </button>
                    <button onClick={() => setActiveTab('controls')} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'controls' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}>
                        <Settings size={20} className={activeTab === 'controls' ? 'text-purple-400' : ''} />
                        <div className="text-left"><p className="font-bold">System Controls</p><p className="text-xs opacity-70">Maintenance & Utils</p></div>
                    </button>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {/* SQL Tab */}
                    {activeTab === 'sql' && (
                        <div className="bg-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden border border-zinc-700 flex flex-col min-h-[600px]">
                            <div className="flex items-center justify-between p-3 bg-[#252526] border-b border-zinc-700">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5 ml-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <span className="text-xs text-zinc-400 font-mono ml-3">postgres@buildpro-db:5432</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setSqlQuery('')} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"><RefreshCw size={14} /></button>
                                    <button onClick={handleExecuteSql} disabled={isExecuting || !sqlQuery.trim()} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"><Play size={12} fill="currentColor" /> Run Query</button>
                                </div>
                            </div>
                            <div className="relative flex-1 bg-[#1e1e1e]">
                                <textarea value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)} className="w-full h-full bg-transparent text-zinc-300 font-mono text-sm p-4 outline-none resize-none" placeholder="SELECT * FROM users LIMIT 10;" spellCheck={false} />
                            </div>
                            <div className="h-[350px] bg-[#000000] border-t border-zinc-700 flex flex-col">
                                <div className="px-4 py-2 bg-[#2d2d2d] border-b border-zinc-700 flex justify-between items-center">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Query Results</span>
                                    {sqlResult && Array.isArray(sqlResult) && <span className="text-xs text-emerald-400 font-mono">{sqlResult.length} rows affected</span>}
                                </div>
                                <div className="flex-1 overflow-auto">
                                    {isExecuting ? (
                                        <div className="flex items-center justify-center h-full gap-2 text-zinc-400 animate-pulse"><RefreshCw size={20} className="animate-spin" /> Executing...</div>
                                    ) : sqlError ? (
                                        <div className="p-4 flex items-start gap-3 text-red-400 bg-red-900/10"><AlertTriangle size={20} className="flex-shrink-0 mt-0.5" /><pre className="whitespace-pre-wrap font-mono text-sm">{sqlError}</pre></div>
                                    ) : sqlResult ? renderSqlResult() : (
                                        <div className="flex items-center justify-center h-full text-zinc-600 text-sm">Enter a query above to view results</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Health Tab */}
                    {activeTab === 'health' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> System Status</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { name: 'API Services', status: healthData?.api || 'unknown', uptime: `${Math.floor((healthData?.uptime || 0) / 60)}m`, icon: Server },
                                        { name: 'Database', status: healthData?.database || 'unknown', uptime: '99.99%', icon: Database },
                                        { name: 'Storage', status: 'healthy', uptime: '100%', icon: HardDrive },
                                        { name: 'Auth', status: 'healthy', uptime: '100%', icon: Shield },
                                    ].map((s) => (
                                        <div key={s.name} className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                            <div className="flex items-center gap-3 mb-2"><s.icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" /><span className="font-medium text-zinc-900 dark:text-white">{s.name}</span></div>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-medium ${s.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`}>{s.status}</span>
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.uptime}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2"><Cpu className="w-5 h-5" /> Performance Metrics (24h)</h2>
                                <div className="h-48 flex items-end gap-1 px-2">
                                    {performanceHistory.length > 0 ? performanceHistory.map((point, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col gap-0.5 group relative h-full justify-end">
                                            <div className="w-full bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-colors rounded-t-sm" style={{ height: `${point.ram}%` }}></div>
                                            <div className="w-full bg-indigo-500/40 group-hover:bg-indigo-500/60 transition-colors rounded-t-sm" style={{ height: `${point.cpu}%` }}></div>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                                                <p className="font-bold">{new Date(point.timestamp).getHours()}:00</p>
                                                <p>CPU: {point.cpu.toFixed(1)}%</p>
                                                <p>RAM: {point.ram.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    )) : <div className="w-full h-full flex items-center justify-center text-zinc-400 italic">No performance data available</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Controls Tab */}
                    {activeTab === 'controls' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm p-6 relative overflow-hidden">
                                <h3 className="font-bold text-zinc-800 dark:text-white mb-6 flex items-center gap-2"><Settings size={18} /> Global Controls</h3>
                                <div className="space-y-4">
                                    {[
                                        { key: 'maintenance', label: 'Maintenance Mode', icon: Power, onColor: 'bg-red-500', isSpecial: true },
                                        { key: 'betaFeatures', label: 'Global Beta Access', icon: Sparkles, onColor: 'bg-emerald-500' },
                                        { key: 'registrations', label: 'New Registrations', icon: UserCheck, onColor: 'bg-emerald-500' },
                                        { key: 'aiEngine', label: 'AI Inference Engine', icon: BrainCircuit, onColor: 'bg-indigo-500' },
                                    ].map((ctrl) => (
                                        <div key={ctrl.key} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-700">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800"><ctrl.icon size={16} className="text-zinc-600 dark:text-zinc-400" /></div>
                                                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{ctrl.label}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {ctrl.isSpecial && <button onClick={() => setShowMaintenanceModal(true)} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 underline">Schedule</button>}
                                                <button onClick={() => handleToggleSetting(ctrl.key as keyof SystemSettings)} className={`w-11 h-6 rounded-full transition-colors relative ${systemSettings[ctrl.key as keyof SystemSettings] ? ctrl.onColor : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${systemSettings[ctrl.key as keyof SystemSettings] ? 'left-6' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#0f5c82] to-[#0c4a6e] rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                                <h3 className="font-bold mb-3 flex items-center gap-2"><Megaphone size={18} className="text-yellow-400" /> Global Broadcast</h3>
                                <div className="flex flex-col gap-3">
                                    <textarea className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/40 outline-none resize-none h-24" placeholder="Type system-wide announcement..." value={localBroadcastMsg} onChange={e => setLocalBroadcastMsg(e.target.value)} />
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => setShowBroadcastModal(true)} className="text-xs font-bold text-blue-300 hover:text-white flex items-center gap-1">Targeting Filters <Filter size={10} /></button>
                                        <button disabled={!localBroadcastMsg.trim()} onClick={handleBroadcast} className="bg-white text-[#0f5c82] px-5 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors disabled:opacity-50">Send Broadcast</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showMaintenanceModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <div className="bg-zinc-900 p-4 text-white flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> Schedule Maintenance</h3><button onClick={() => setShowMaintenanceModal(false)}><X className="w-5 h-5" /></button></div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Start Time</label>
                                <input type="datetime-local" className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm" value={maintenanceSchedule.startTime} onChange={e => setMaintenanceSchedule(prev => ({ ...prev, startTime: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Duration (Minutes)</label>
                                <input type="number" className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm" value={maintenanceSchedule.duration} onChange={e => setMaintenanceSchedule(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <button onClick={async () => { try { await db.scheduleMaintenance(maintenanceSchedule.startTime, maintenanceSchedule.duration); addToast('Maintenance scheduled', 'success'); setShowMaintenanceModal(false); } catch { addToast('Failed to schedule', 'error'); } }} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg">Schedule Window</button>
                        </div>
                    </div>
                </div>
            )}

            {showBroadcastModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <div className="bg-[#0f5c82] p-4 text-white flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Filter className="w-5 h-5" /> Broadcast Targeting</h3><button onClick={() => setShowBroadcastModal(false)}><X className="w-5 h-5" /></button></div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Target Roles</label>
                                <select className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm" value={broadcastTarget.role} onChange={e => setBroadcastTarget(prev => ({ ...prev, role: e.target.value }))}>
                                    <option value="all">Everywhere (All Users)</option>
                                    <option value="SUPERADMIN">SuperAdmins Only</option>
                                    <option value="COMPANY_ADMIN">Company Admins Only</option>
                                </select>
                            </div>
                            <button onClick={() => setShowBroadcastModal(false)} className="w-full py-3 bg-[#0f5c82] hover:bg-[#0c4a6e] text-white font-bold rounded-xl shadow-lg">Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminCommandCenter;
