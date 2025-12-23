import React, { useState, useEffect } from 'react';
import { Page, Project, ProjectDocument } from '@/types';
import { db } from '@/services/db';
import {
    Building2, Calendar, FileText, CheckCircle2, Clock,
    ArrowRight, Download, MessageSquare, AlertCircle, Menu, X, Bell, Lock
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface ClientPortalViewProps {
    setPage?: (page: Page) => void;
}

const ClientPortalView: React.FC<ClientPortalViewProps> = ({ setPage }) => {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [project, setProject] = useState<Project | null>(null);
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'financials'>('overview');
    const [password, setPassword] = useState('');
    const [isPasswordRequired, setIsPasswordRequired] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Extract token from URL
    const token = window.location.pathname.split('/').pop();

    useEffect(() => {
        if (token) {
            validateToken();
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const validateToken = async (pwd?: string) => {
        setIsLoading(true);
        try {
            // 1. Validate Token (Post to validation endpoint)
            await db.validateShareToken(token!, pwd);

            // 2. Fetch Project Data
            const projectData = await db.getSharedProject(token!);
            const docsData = await db.getSharedDocuments(token!);

            setProject(projectData);
            setDocuments(docsData);
            setIsAuthenticated(true);
            setIsPasswordRequired(false);
        } catch (error: any) {
            console.error(error);
            if (error.message === 'PASSWORD_REQUIRED') {
                setIsPasswordRequired(true);
            } else {
                addToast(error.message || 'Invalid or expired link', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        validateToken(password);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f5c82]"></div>
            </div>
        );
    }

    if (isPasswordRequired && !isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-zinc-200">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0f5c82]">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900">Protected Project</h2>
                        <p className="text-zinc-500 mt-2">This shared project is password protected.</p>
                    </div>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#0f5c82] outline-none"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!password}
                            className="w-full bg-[#0f5c82] text-white py-3 rounded-xl font-bold hover:bg-[#0c4a6e] transition-colors disabled:opacity-50"
                        >
                            Access Project
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-zinc-50">
                <Building2 size={64} className="text-zinc-300 mb-4" />
                <h2 className="text-2xl font-bold text-zinc-800">Project Not Found</h2>
                <p className="text-zinc-500 mt-2">The link may be invalid or expired.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-zinc-50 h-screen overflow-y-auto flex flex-col">
            {/* Client Header */}
            <header className="bg-white border-b border-zinc-200 px-6 lg:px-8 py-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#0f5c82] rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
                        {project.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-zinc-900 leading-tight">{project.name}</h1>
                        <p className="text-zinc-500 text-xs flex items-center gap-1">
                            <Building2 size={10} /> {project.location || 'Site Location'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-xs text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Client View
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
                                Use this portal to track real-time progress, review documents, and stay up to date.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Completion</div>
                        <div className="text-3xl font-black text-zinc-900">{project.progress || 0}%</div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${project.progress || 0}%` }} />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Status</div>
                        <div className="text-xl font-black text-[#0f5c82]">{project.status}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Start Date</div>
                        <div className="text-lg font-bold text-zinc-700">{project.startDate || 'TBD'}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">End Date</div>
                        <div className="text-lg font-bold text-zinc-700">{project.endDate || 'TBD'}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Recent Photos */}
                        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                            <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-[#0f5c82]" /> Project Imagery
                            </h3>
                            {documents.filter(d => d.type === 'Image').length > 0 ? (
                                <div className="grid grid-cols-3 gap-4">
                                    {documents.filter(d => d.type === 'Image').slice(0, 6).map((photo) => (
                                        <div key={photo.id} className="aspect-square rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden relative group">
                                            {photo.url ? (
                                                <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-300">No Img</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-sm">No photos available.</p>
                            )}
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
                                {documents.filter(d => d.type !== 'Image').length > 0 ? (
                                    documents.filter(d => d.type !== 'Image').map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg text-sm group cursor-pointer hover:bg-zinc-100 hover:shadow-sm border border-transparent hover:border-zinc-200 transition-all">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-1.5 bg-white rounded border border-zinc-200 text-red-500">
                                                    <FileText size={12} />
                                                </div>
                                                <div className="truncate">
                                                    <span className="block truncate text-zinc-700 group-hover:text-zinc-900 font-medium">{doc.name}</span>
                                                    <span className="text-[10px] text-zinc-400">{doc.date}</span>
                                                </div>
                                            </div>
                                            <a href={doc.url} download className="p-1 text-zinc-300 group-hover:text-[#0f5c82]">
                                                <Download size={14} />
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-zinc-500 text-sm italic">No documents shared.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClientPortalView;
