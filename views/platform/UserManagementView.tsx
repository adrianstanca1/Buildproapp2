
import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Shield, Lock, UserX, UserCheck } from 'lucide-react';
import { db } from '@/services/db';

const UserManagementView: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
            await db.updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (e) {
            console.error('Failed to update role', e);
            alert('Failed to update user role');
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
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagementView;
