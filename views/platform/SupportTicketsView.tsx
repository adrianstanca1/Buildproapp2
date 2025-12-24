import React, { useState, useEffect } from 'react';
import {
    MessageSquare, AlertCircle, CheckCircle2,
    Clock, Search, Filter, MoreHorizontal,
    User, Building2, ExternalLink, ShieldQuestion,
    ArrowUpRight, LifeBuoy
} from 'lucide-react';
import { db } from '@/services/db';
import { useToast } from '@/contexts/ToastContext';

/**
 * SupportTicketsView
 * Centralized support ticket management for SuperAdmins
 */
const SupportTicketsView: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
    const { addToast } = useToast();

    useEffect(() => {
        const loadTickets = async () => {
            try {
                const data = await db.getSupportTickets();
                setTickets(data);
            } catch (error) {
                console.error("Failed to load tickets", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadTickets();
    }, []);

    const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
        try {
            await db.updateTicketStatus(ticketId, newStatus);
            setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
            addToast(`Ticket status updated to ${newStatus}`, 'success');
        } catch (error) {
            addToast('Failed to update ticket status', 'error');
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.companyName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                        <LifeBuoy className="w-8 h-8 text-blue-600" />
                        Support Center
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Cross-tenant support request management and resolution
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search tickets or companies..."
                            className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                        value={filterStatus}
                        onChange={(e: any) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Priority</th>
                                <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Ticket</th>
                                <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Company</th>
                                <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Created</th>
                                <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                            {filteredTickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-2 text-xs font-bold px-2 py-1 rounded-full w-fit ${ticket.priority === 'high' ? 'bg-red-100 text-red-600' :
                                                ticket.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-blue-100 text-blue-600'
                                            }`}>
                                            <AlertCircle size={12} />
                                            {ticket.priority.toUpperCase()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{ticket.subject}</span>
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                                                <User size={12} />
                                                <span>{ticket.author}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={16} className="text-zinc-400" />
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{ticket.companyName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-2 text-xs font-medium ${ticket.status === 'open' ? 'text-red-500' :
                                                ticket.status === 'pending' ? 'text-amber-500' :
                                                    'text-green-500'
                                            }`}>
                                            {ticket.status === 'open' && <Clock size={14} />}
                                            {ticket.status === 'pending' && <Clock size={14} />}
                                            {ticket.status === 'resolved' && <CheckCircle2 size={14} />}
                                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                title="Resolve Ticket"
                                                onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                                            >
                                                <CheckCircle2 size={18} />
                                            </button>
                                            <button
                                                className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Help Tenant"
                                                onClick={() => addToast('Impersonating tenant context...', 'info')}
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                            <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-lg transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTickets.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        <LifeBuoy size={48} className="mx-auto mb-4 opacity-10" />
                                        <p>No tickets found matching your filters</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Stats Support */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg"><ShieldQuestion size={20} /></div>
                        <h3 className="font-bold">Knowledge Base</h3>
                    </div>
                    <p className="text-sm text-white/80 mb-4 leading-relaxed">System documentation and troubleshooting guides for SuperAdmins.</p>
                    <button className="w-full py-2 bg-white text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                        Open Docs <ArrowUpRight size={14} />
                    </button>
                </div>

                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <MessageSquare className="text-blue-500" size={18} />
                            Active Response Rate
                        </h3>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Live Metrics</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Avg Initial Response', value: '14m', trend: '-2m' },
                            { label: 'Resolution Rate', value: '94%', trend: '+1.5%' },
                            { label: 'SLA Compliance', value: '99.2%', trend: 'stable' },
                        ].map((stat, idx) => (
                            <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-700">
                                <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold text-zinc-900 dark:text-white">{stat.value}</span>
                                    <span className={`text-[10px] ${stat.trend.startsWith('+') ? 'text-green-500' : stat.trend.startsWith('-') ? 'text-blue-500' : 'text-zinc-400'}`}>
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportTicketsView;
