import React, { useState } from 'react';
import { Shield, Lock, Key, Eye, EyeOff, Search, X, AlertTriangle, CheckCircle2, Clock, Trash2, Edit, Plus } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, string[]>;
  userCount: number;
  color: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  twoFaEnabled: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  status: 'success' | 'failure' | 'warning';
  ipAddress: string;
}

const SecurityView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'audit' | 'settings'>('roles');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const roles: Role[] = [
    {
      id: 'admin',
      name: 'Principal Admin',
      description: 'Full system access, user management, configuration',
      permissions: {
        projects: ['create', 'read', 'update', 'delete'],
        team: ['create', 'read', 'update', 'delete'],
        financials: ['create', 'read', 'update', 'delete'],
        settings: ['create', 'read', 'update', 'delete']
      },
      userCount: 1,
      color: 'bg-red-100 text-red-800'
    },
    {
      id: 'company-admin',
      name: 'Company Admin',
      description: 'Company-level management and user oversight',
      permissions: {
        projects: ['create', 'read', 'update', 'delete'],
        team: ['create', 'read', 'update', 'delete'],
        financials: ['read'],
        settings: ['read', 'update']
      },
      userCount: 3,
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'manager',
      name: 'Project Manager',
      description: 'Project and team management for assigned projects',
      permissions: {
        projects: ['read', 'update'],
        team: ['read', 'update'],
        financials: ['read'],
        settings: []
      },
      userCount: 8,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'foreman',
      name: 'Foreman',
      description: 'Site-level oversight and reporting',
      permissions: {
        projects: ['read', 'update'],
        team: ['read'],
        financials: [],
        settings: []
      },
      userCount: 12,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'operative',
      name: 'Operative',
      description: 'Basic access for task execution and reporting',
      permissions: {
        projects: ['read'],
        team: [],
        financials: [],
        settings: []
      },
      userCount: 42,
      color: 'bg-gray-100 text-gray-800'
    }
  ];

  const users: User[] = [
    { id: 'u1', name: 'Sarah Mitchell', email: 'sarah@buildpro.com', role: 'Principal Admin', lastLogin: 'Just now', status: 'active', twoFaEnabled: true },
    { id: 'u2', name: 'Mike Thompson', email: 'mike@buildpro.com', role: 'Company Admin', lastLogin: '2h ago', status: 'active', twoFaEnabled: true },
    { id: 'u3', name: 'David Chen', email: 'david@buildpro.com', role: 'Company Admin', lastLogin: '1h ago', status: 'active', twoFaEnabled: true },
    { id: 'u4', name: 'John Anderson', email: 'john@buildpro.com', role: 'Project Manager', lastLogin: '30m ago', status: 'active', twoFaEnabled: false },
    { id: 'u5', name: 'Emma Wilson', email: 'emma@buildpro.com', role: 'Foreman', lastLogin: '2d ago', status: 'inactive', twoFaEnabled: false },
    { id: 'u6', name: 'Robert Martinez', email: 'robert@buildpro.com', role: 'Operative', lastLogin: '5h ago', status: 'active', twoFaEnabled: false },
  ];

  const auditLogs: AuditLog[] = [
    { id: 'a1', timestamp: new Date(Date.now() - 2 * 60000).toLocaleString(), user: 'Sarah Mitchell', action: 'User login', resource: 'Authentication', details: 'Successful login with 2FA', status: 'success', ipAddress: '192.168.1.100' },
    { id: 'a2', timestamp: new Date(Date.now() - 15 * 60000).toLocaleString(), user: 'Mike Thompson', action: 'Permission change', resource: 'Role Management', details: 'Updated John Anderson role to Project Manager', status: 'success', ipAddress: '192.168.1.101' },
    { id: 'a3', timestamp: new Date(Date.now() - 1 * 60 * 60000).toLocaleString(), user: 'System', action: 'API key generated', resource: 'API Access', details: 'New API key created for integration', status: 'success', ipAddress: '192.168.1.102' },
    { id: 'a4', timestamp: new Date(Date.now() - 2 * 60 * 60000).toLocaleString(), user: 'David Chen', action: 'User deletion attempt', resource: 'User Management', details: 'Insufficient permissions - access denied', status: 'failure', ipAddress: '192.168.1.103' },
    { id: 'a5', timestamp: new Date(Date.now() - 4 * 60 * 60000).toLocaleString(), user: 'Sarah Mitchell', action: 'Password changed', resource: 'Account Security', details: 'Password update successful', status: 'success', ipAddress: '192.168.1.100' },
    { id: 'a6', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60000).toLocaleString(), user: 'John Anderson', action: 'Suspicious login attempt', resource: 'Authentication', details: 'Failed login from unknown location', status: 'warning', ipAddress: '203.0.113.45' },
  ];

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getAuditStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 size={16} className="text-green-600" />;
      case 'failure': return <AlertTriangle size={16} className="text-red-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-orange-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Security & Access Control</h1>
        <p className="text-zinc-500">Enterprise security, role management, audit logs, compliance</p>
      </div>

      {/* Security Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="text-green-600 text-3xl font-bold mb-1">A+</div>
          <div className="text-xs text-zinc-500">Security Score</div>
          <div className="text-xs text-zinc-600 mt-2">Based on configuration</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="text-zinc-900 text-3xl font-bold mb-1">5</div>
          <div className="text-xs text-zinc-500">Roles Defined</div>
          <div className="text-xs text-zinc-600 mt-2">66 users assigned</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="text-blue-600 text-3xl font-bold mb-1">58</div>
          <div className="text-xs text-zinc-500">Active Users</div>
          <div className="text-xs text-zinc-600 mt-2">2FA: 36%</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="text-zinc-900 text-3xl font-bold mb-1">2,847</div>
          <div className="text-xs text-zinc-500">Audit Logs (30d)</div>
          <div className="text-xs text-zinc-600 mt-2">AES-256 encrypted</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-zinc-200 mb-6">
        <div className="flex gap-8 px-6">
          {['roles', 'users', 'audit', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#0f5c82] text-[#0f5c82]'
                  : 'border-transparent text-zinc-600 hover:text-zinc-900'
              }`}>
              {tab === 'roles' && 'Role Management'}
              {tab === 'users' && 'User Management'}
              {tab === 'audit' && 'Audit Logs'}
              {tab === 'settings' && 'Security Settings'}
            </button>
          ))}
        </div>
      </div>

      {/* Role Management Tab */}
      {activeTab === 'roles' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-zinc-900">Role-Based Access Control</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1f7d98] hover:bg-[#166ba1] text-white rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> Add Role
            </button>
          </div>

          <div className="space-y-4">
            {roles.map(role => (
              <div key={role.id} className="border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className={`font-semibold px-3 py-1 rounded w-fit ${role.color}`}>{role.name}</h4>
                    <p className="text-sm text-zinc-600 mt-1">{role.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                      <Edit size={16} className="text-zinc-600" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-3">
                  {Object.entries(role.permissions).map(([resource, perms]) => (
                    <div key={resource} className="bg-zinc-50 rounded p-3">
                      <p className="text-xs font-medium text-zinc-700 capitalize mb-2">{resource}</p>
                      <div className="text-xs text-zinc-600 space-y-1">
                        {perms.length > 0 ? (
                          perms.map(perm => (
                            <div key={perm} className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-[#0f5c82] rounded-full"></div>
                              {perm}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">No access</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-zinc-600">
                  <strong>{role.userCount}</strong> users assigned to this role
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-zinc-900">User Management</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1f7d98] hover:bg-[#166ba1] text-white rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> Add User
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5c82]"
              />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-200 text-xs uppercase">
                <th className="pb-3 text-left font-medium">User</th>
                <th className="pb-3 text-left font-medium">Role</th>
                <th className="pb-3 text-left font-medium">Last Login</th>
                <th className="pb-3 text-left font-medium">Status</th>
                <th className="pb-3 text-left font-medium">2FA</th>
                <th className="pb-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-zinc-900">{user.name}</p>
                      <p className="text-xs text-zinc-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-zinc-600">{user.lastLogin}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(user.status)}`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      {user.twoFaEnabled ? (
                        <><CheckCircle2 size={14} className="text-green-600" /> <span className="text-xs text-green-600">Enabled</span></>
                      ) : (
                        <><AlertTriangle size={14} className="text-orange-600" /> <span className="text-xs text-orange-600">Disabled</span></>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-right flex justify-end gap-2">
                    <button className="p-1.5 hover:bg-zinc-200 rounded-lg transition-colors">
                      <Edit size={14} className="text-zinc-600" />
                    </button>
                    <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} className="text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-zinc-900">Audit Trail (Last 30 Days)</h3>
            <button className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
              Export Logs
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.map(log => (
              <div key={log.id} className="border border-zinc-100 rounded-lg p-4 hover:bg-zinc-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getAuditStatusIcon(log.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-zinc-900">{log.action}</p>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        log.status === 'success' ? 'bg-green-100 text-green-700' :
                        log.status === 'failure' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600">{log.details}</p>
                    <div className="flex gap-6 mt-2 text-xs text-zinc-500">
                      <span><strong>User:</strong> {log.user}</span>
                      <span><strong>Resource:</strong> {log.resource}</span>
                      <span><strong>IP:</strong> {log.ipAddress}</span>
                      <span><strong>Time:</strong> {log.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Authentication Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">Require Two-Factor Authentication</p>
                  <p className="text-xs text-zinc-600">For all administrator accounts</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">Session Timeout</p>
                  <p className="text-xs text-zinc-600">Automatically logout after 60 minutes of inactivity</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">IP Whitelist</p>
                  <p className="text-xs text-zinc-600">Restrict login to approved IP addresses</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Data Governance</h3>
            <div className="space-y-3 text-sm text-zinc-600">
              <p><strong className="text-zinc-900">Encryption:</strong> AES-256 for data at rest, TLS 1.3 for data in transit</p>
              <p><strong className="text-zinc-900">Backups:</strong> Automated daily, 30-day retention, tested weekly</p>
              <p><strong className="text-zinc-900">Compliance:</strong> GDPR, SOC 2 Type II, HIPAA ready</p>
              <p><strong className="text-zinc-900">Audit Trail:</strong> All changes logged with tamper detection, 1-year retention</p>
              <p><strong className="text-zinc-900">Data Retention:</strong> 90-day retention for deleted records, permanent audit log</p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Password Policy</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">Minimum Password Length</label>
                <input type="number" defaultValue="12" className="w-32 px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">Password Expiration (days)</label>
                <input type="number" defaultValue="90" className="w-32 px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">Password History (prevent reuse)</label>
                <input type="number" defaultValue="5" className="w-32 px-3 py-2 border border-zinc-200 rounded-lg text-sm" />
              </div>
            </div>
            <button className="mt-4 px-4 py-2 bg-[#1f7d98] hover:bg-[#166ba1] text-white rounded-lg text-sm font-medium transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityView;