
import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Shield, Lock, UserX, UserCheck, Eye } from 'lucide-react';
import { db } from '@/services/db';
import { useAuth } from '@/contexts/AuthContext';

const UserManagementView: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'COMPANY_ADMIN', companyId: '' });
    const { impersonateUser } = useAuth();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await db.getAllPlatformUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId: string, newStatus: string) => {
        try {
            await db.updateUserStatus(userId, newStatus);
            setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        } catch (e) {
            console.error('Failed to update status', e);
            alert('Failed to update user status');
        }
    };

    const handlePasswordReset = async (userId: string) => {
        if (!confirm('Send password reset email to this user?')) return;
        try {
            await db.resetUserPassword(userId);
            alert('Password reset email sent.');
        } catch (e) {
            console.error(e);
            alert('Failed to trigger password reset');
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`Change user role to ${newRole}?`)) return;
        try {
            await db.updateUserRole(userId, users.find(u => u.id === userId)?.companyId || '', newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (e) {
            console.error('Failed to update role', e);
            alert('Failed to update user role');
        }
    };

    const handleInviteUser = async () => {
        try {
            if (!inviteForm.email || !inviteForm.companyId) {
                alert('Please fill in all fields');
                return;
            }
            await db.inviteUser(inviteForm.email, inviteForm.role, inviteForm.companyId);
            alert('Invitation sent successfully!');
            setShowInviteModal(false);
            setInviteForm({ email: '', role: 'COMPANY_ADMIN', companyId: '' });
            loadUsers(); // Refresh list
        } catch (e) {
            console.error('Failed to invite user', e);
            alert('Failed to invite user');
        }
    };

    const handleImpersonate = async (userId: string) => {
        if (!confirm('Are you sure you want to impersonate this user?')) return;
        try {
            await impersonateUser(userId);
            // Redirect to dashboard or show success. 
            // Since AuthContext updates state, the app might re-render, but a redirect ensures we land in the right place.
            window.location.href = '/dashboard';
        } catch (e) {
            console.error('Impersonation failed', e);
            alert('Failed to impersonate user');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Global User Management</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage user access across all tenants</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
                    >
                        <UserCheck size={16} /> Invite User
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Company ID</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Loading users...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No users found.</td></tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-zinc-900 dark:text-white">{user.name || 'Unknown'}</div>
                                            <div className="text-xs text-zinc-500">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="text-xs font-medium border-0 bg-transparent focus:ring-0 cursor-pointer text-blue-600 hover:text-blue-800"
                                        >
                                            <option value="SUPERADMIN">SUPERADMIN</option>
                                            <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
                                            <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                                            <option value="FINANCE">FINANCE</option>
                                            <option value="SUPERVISOR">SUPERVISOR</option>
                                            <option value="OPERATIVE">OPERATIVE</option>
                                            <option value="READ_ONLY">READ_ONLY</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{user.companyId || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePasswordReset(user.id)}
                                                title="Reset Password"
                                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500"
                                            >
                                                <Lock size={16} />
                                            </button>
                                            {user.status === 'active' ? (
                                                <button
                                                    onClick={() => handleStatusChange(user.id, 'suspended')}
                                                    title="Suspend User"
                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                                                >
                                                    <UserX size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStatusChange(user.id, 'active')}
                                                    title="Activate User"
                                                    className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-500"
                                                >
                                                    <UserCheck size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleImpersonate(user.id)}
                                                title="Impersonate User"
                                                className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded text-purple-500"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-700">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Invite New User</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                                    placeholder="colleague@company.com"
                                    value={inviteForm.email}
                                    onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Role</label>
                                <select
                                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                                    value={inviteForm.role}
                                    onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                                >
                                    <option value="SUPERADMIN">SUPERADMIN</option>
                                    <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
                                    <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                                    <option value="FINANCE">FINANCE</option>
                                    <option value="SUPERVISOR">SUPERVISOR</option>
                                    <option value="OPERATIVE">OPERATIVE</option>
                                    <option value="READ_ONLY">READ_ONLY</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Company ID</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                                    placeholder="Company ID"
                                    value={inviteForm.companyId}
                                    onChange={e => setInviteForm({ ...inviteForm, companyId: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInviteUser}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm"
                            >
                                Send Invitation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementView;
