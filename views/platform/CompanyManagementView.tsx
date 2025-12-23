import React, { useState } from 'react';
import {
    Building2, Plus, Search, MoreVertical, Users,
    DollarSign, AlertCircle, CheckCircle, XCircle, Pause, LogIn
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { Modal } from '@/components/Modal';
import { db } from '@/services/db';

/**
 * CompanyManagementView
 * Superadmin-only view for managing all companies (tenants)
 */
const CompanyManagementView: React.FC = () => {
    const { tenants, addTenant, updateTenant } = useTenant();
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [fullCompanyDetails, setFullCompanyDetails] = useState<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Fetch deep details when a company is selected
    React.useEffect(() => {
        if (selectedCompany?.id) {
            setFullCompanyDetails(null); // Reset
            db.getCompanyDetails(selectedCompany.id).then(setFullCompanyDetails).catch(console.error);
        }
    }, [selectedCompany]);

    // Form States

    // Form States
    const [newCompany, setNewCompany] = useState({
        name: '',
        plan: 'starter',
        email: '',
        phone: '',
        address: '',
        isTrial: false
    });

    const [editPlan, setEditPlan] = useState('');

    const filteredCompanies = tenants.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateCompany = async () => {
        const newId = `tenant-${Date.now()}`;
        try {
            await addTenant({
                id: newId,
                companyId: newId,
                ...newCompany,
                status: newCompany.isTrial ? 'Trial' : 'Active', // Handle Trial Status
                plan: newCompany.plan as 'Enterprise' | 'Business' | 'Starter',
                users: 0,
                projects: 0,
                mrr: newCompany.isTrial ? 0 : getPlanMRR(newCompany.plan), // No MRR for Trial
                joinedDate: new Date().toISOString(),
                settings: {
                    timezone: 'UTC',
                    language: 'en',
                    dateFormat: 'MM/DD/YYYY',
                    currency: 'USD',
                    emailNotifications: true,
                    dataRetention: 365,
                    twoFactorAuth: false,
                    sso: false,
                    customBranding: false
                },
                subscription: {
                    id: `sub-${newId}`,
                    planId: newCompany.plan,
                    status: newCompany.isTrial ? 'trialing' : 'active',
                    currentPeriodStart: new Date().toISOString(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    billingEmail: newCompany.email,
                },
                features: [],
                maxUsers: newCompany.plan === 'enterprise' ? 1000 : newCompany.plan === 'professional' ? 100 : 25,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            setShowCreateModal(false);
            setNewCompany({ name: '', plan: 'starter', email: '', phone: '', address: '', isTrial: false });
        } catch (e) {
            console.error(e);
            alert('Failed to create company');
        }
    };

    const handleUpdatePlan = async () => {
        if (!selectedCompany || !editPlan) return;
        try {
            const mrr = getPlanMRR(editPlan);
            await updateTenant(selectedCompany.id, {
                plan: editPlan as any,
                mrr: mrr,
                subscription: {
                    ...selectedCompany.subscription,
                    planId: editPlan,
                    status: 'active' // Assume active if plan changed manually
                }
            });
            setShowDetailsModal(false);
            setEditPlan('');
        } catch (e) {
            console.error(e);
            alert('Failed to update plan');
        }
    };

    const getPlanMRR = (plan: string) => {
        const rates: Record<string, number> = {
            starter: 99,
            professional: 299,
            enterprise: 999,
        };
        return rates[plan] || 0;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            Active: 'green',
            Suspended: 'yellow',
            Trial: 'blue',
            Cancelled: 'red',
        };
        return colors[status] || 'gray';
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, any> = {
            Active: CheckCircle,
            Suspended: Pause,
            Trial: AlertCircle,
            Cancelled: XCircle,
        };
        return icons[status] || AlertCircle;
    };

    const handleSuspendCompany = async (id: string) => {
        if (!confirm('Are you sure you want to suspend this company? This will block access for all its users.')) return;
        try {
            await updateTenant(id, { status: 'Suspended' });
            setShowDetailsModal(false);
        } catch (error) {
            alert('Failed to suspend company');
        }
    };

    const handleActivateCompany = async (id: string) => {
        try {
            await updateTenant(id, { status: 'Active' });
            setShowDetailsModal(false);
        } catch (error) {
            alert('Failed to activate company');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        Company Management
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Manage all tenant companies and subscriptions
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Company
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Companies</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                                {tenants.length}
                            </p>
                        </div>
                        <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Active</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {tenants.filter(t => t.status === 'Active').length}
                            </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Users</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                                {tenants.reduce((sum, t) => sum + (t.users || 0), 0)}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total MRR</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                                ${tenants.reduce((sum, t) => sum + (t.mrr || 0), 0).toLocaleString()}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                    type="text"
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Companies Table */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Users
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Projects
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    MRR
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                            {filteredCompanies.map((company) => {
                                const StatusIcon = getStatusIcon(company.status);
                                const statusColor = getStatusColor(company.status);

                                return (
                                    <tr
                                        key={company.id}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSelectedCompany(company);
                                            setEditPlan(company.plan); // Init edit plan
                                            setShowDetailsModal(true);
                                        }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                                    {company.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-900 dark:text-white">
                                                        {company.name}
                                                    </p>
                                                    <p className="text-sm text-zinc-500">
                                                        {company.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full capitalize">
                                                {company.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-${statusColor}-100 dark:bg-${statusColor}-900/30 text-${statusColor}-800 dark:text-${statusColor}-300 rounded-full capitalize w-fit`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                                            {company.users || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-white">
                                            {company.projects || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                                            ${company.mrr || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                            {new Date(company.joinedDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Impersonate first admin found or just verify access
                                                        // For now, we just "log in" as them by switching context if implemented
                                                        // or show a toast
                                                        alert(`Impersonating admin for ${company.name}`);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Login as Tenant Admin"
                                                >
                                                    <LogIn className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCompany(company);
                                                        setEditPlan(company.plan);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Company Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Company"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Company Name
                        </label>
                        <input
                            type="text"
                            value={newCompany.name}
                            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Acme Construction"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Plan
                        </label>
                        <select
                            value={newCompany.plan}
                            onChange={(e) => setNewCompany({ ...newCompany, plan: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="starter">Starter - $99/mo</option>
                            <option value="professional">Professional - $299/mo</option>
                            <option value="enterprise">Enterprise - $999/mo</option>
                        </select>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input
                                type="checkbox"
                                checked={newCompany.isTrial}
                                onChange={(e) => setNewCompany({ ...newCompany, isTrial: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">Start in Trial Mode (14 Days)</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={newCompany.email}
                            onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="admin@acme.com"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateCompany}
                            disabled={!newCompany.name}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Company
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Company Details Modal */}
            {selectedCompany && (
                <Modal
                    isOpen={showDetailsModal}
                    onClose={() => setShowDetailsModal(false)}
                    title={selectedCompany.name}
                >
                    <div className="space-y-6">
                        {/* Status Sections */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Status</p>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-${getStatusColor(selectedCompany.status)}-100 text-${getStatusColor(selectedCompany.status)}-700`}>
                                    {selectedCompany.status}
                                </span>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
                                <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Resources</p>
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {selectedCompany.users} Users • {selectedCompany.projects} Projects
                                </p>
                            </div>
                        </div>

                        {/* Subscription Editing */}
                        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Subscription Management</h4>
                            <div className="flex gap-2">
                                <select
                                    value={editPlan}
                                    onChange={(e) => setEditPlan(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm"
                                >
                                    <option value="starter">Starter - $99/mo</option>
                                    <option value="professional">Professional - $299/mo</option>
                                    <option value="enterprise">Enterprise - $999/mo</option>
                                </select>
                                <button
                                    onClick={handleUpdatePlan}
                                    disabled={editPlan === selectedCompany.plan}
                                    className="px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    Update Plan
                                </button>
                            </div>
                        </div>

                        {/* Billing History (Mock) */}
                        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Billing History</h4>
                            <div className="space-y-2">
                                {[
                                    { date: 'Dec 01, 2025', amount: selectedCompany.plan === 'enterprise' ? '$999.00' : selectedCompany.plan === 'professional' ? '$299.00' : '$99.00', status: 'Paid', invoice: '#INV-2025-012' },
                                    { date: 'Nov 01, 2025', amount: selectedCompany.plan === 'enterprise' ? '$999.00' : selectedCompany.plan === 'professional' ? '$299.00' : '$99.00', status: 'Paid', invoice: '#INV-2025-011' },
                                    { date: 'Oct 01, 2025', amount: selectedCompany.plan === 'enterprise' ? '$999.00' : selectedCompany.plan === 'professional' ? '$299.00' : '$99.00', status: 'Paid', invoice: '#INV-2025-010' },
                                ].map((inv, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700/30 rounded-lg text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                                <DollarSign size={14} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-zinc-900 dark:text-white">{inv.invoice}</p>
                                                <p className="text-xs text-zinc-500">{inv.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-zinc-900 dark:text-white">{inv.amount}</p>
                                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">{inv.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                            <h4 className="text-xs text-red-500 font-bold uppercase mb-2">Danger Zone</h4>
                            <div className="flex gap-3">
                                {selectedCompany.status === 'Active' || selectedCompany.status === 'Trial' ? (
                                    <button
                                        onClick={() => handleSuspendCompany(selectedCompany.id)}
                                        className="flex-1 px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Suspend Access
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleActivateCompany(selectedCompany.id)}
                                        className="flex-1 px-4 py-2 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Reactivate Access
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default CompanyManagementView;
