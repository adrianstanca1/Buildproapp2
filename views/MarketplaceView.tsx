import React, { useState } from 'react';
import { Store, Search, Check, Download, Star, X, AlertCircle, CheckCircle2, Loader2, Settings, Trash2, Eye, Code, Users, TrendingUp, Shield, Zap, Plus, ChevronRight, Clock, Globe, Package } from 'lucide-react';

interface AppListing {
  id: string;
  name: string;
  category: 'Project Management' | 'Design & BIM' | 'Financials' | 'Communication' | 'Safety' | 'Analytics' | 'Integrations';
  desc: string;
  fullDescription: string;
  rating: number;
  reviews: number;
  downloads: string;
  icon: string;
  version: string;
  author: string;
  lastUpdated: string;
  permissions: string[];
  features: string[];
  webhooks: boolean;
  apiAccess: boolean;
  verified: boolean;
  popularity: number;
}

interface InstalledApp {
  appId: string;
  appName: string;
  version: string;
  installDate: string;
  enabled: boolean;
  apiKey?: string;
  webhookUrl?: string;
  permissions: string[];
  lastSync?: string;
}

interface MarketplaceViewProps {
  installedApps: string[];
  toggleInstall: (appName: string) => void;
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ installedApps, toggleInstall }) => {
  const [category, setCategory] = useState('All');
  const [selectedApp, setSelectedApp] = useState<AppListing | null>(null);
  const [showAppDetails, setShowAppDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [installedAppsList, setInstalledAppsList] = useState<InstalledApp[]>([
    { appId: 'procore', appName: 'Procore', version: '2.5.1', installDate: '2025-10-15', enabled: true, apiKey: 'sk_live_***', permissions: ['read:projects', 'write:rfis', 'read:documents'], lastSync: '2m ago' },
    { appId: 'slack', appName: 'Slack', version: '1.8.0', installDate: '2025-09-20', enabled: true, webhookUrl: 'https://hooks.slack.com/...', permissions: ['send:messages', 'read:channels'], lastSync: '1m ago' },
  ]);
  const [showSettings, setShowSettings] = useState(false);
  const [showInstalling, setShowInstalling] = useState<string | null>(null);

  const categories = ['All', 'Project Management', 'Design & BIM', 'Financials', 'Communication', 'Safety', 'Analytics', 'Integrations'];

  const apps: AppListing[] = [
    { id: 'procore', name: 'Procore', category: 'Project Management', desc: 'Construction management software integration for RFI and submittals.', fullDescription: 'Industry-leading construction management platform with real-time project collaboration, budget tracking, and field management capabilities integrated directly into BuildPro.', rating: 4.9, reviews: 2341, downloads: '10k+', icon: 'P', version: '2.5.1', author: 'Procore Technologies', lastUpdated: '2025-11-08', permissions: ['read:projects', 'write:rfis', 'read:documents', 'read:budget'], features: ['Real-time RFI Sync', 'Daily Reports', 'Budget Tracking', 'Photo Sync'], webhooks: true, apiAccess: true, verified: true, popularity: 98 },
    { id: 'autodesk', name: 'Autodesk BIM 360', category: 'Design & BIM', desc: 'Connect your BIM workflows directly to the field.', fullDescription: 'Connect Autodesk BIM 360 models directly to your field teams with real-time clash detection, change management, and model-based issue tracking.', rating: 4.8, reviews: 1856, downloads: '8.5k', icon: 'A', version: '3.2.0', author: 'Autodesk Inc.', lastUpdated: '2025-11-10', permissions: ['read:models', 'write:issues', 'read:versions'], features: ['Model Sync', 'Clash Detection', 'Change Orders', 'Version Control'], webhooks: true, apiAccess: true, verified: true, popularity: 95 },
    { id: 'quickbooks', name: 'QuickBooks', category: 'Financials', desc: 'Sync invoices and expenses automatically.', fullDescription: 'Complete financial management integration with automatic invoice syncing, expense categorization, and real-time financial reporting from the field.', rating: 4.7, reviews: 1923, downloads: '12k+', icon: 'Q', version: '1.4.2', author: 'Intuit Inc.', lastUpdated: '2025-11-05', permissions: ['read:invoices', 'write:expenses', 'read:reports'], features: ['Auto Invoice', 'Expense Sync', 'Budget Reports', 'Tax Integration'], webhooks: true, apiAccess: true, verified: true, popularity: 96 },
    { id: 'bluebeam', name: 'Bluebeam', category: 'Design & BIM', desc: 'PDF markup and collaboration tools.', fullDescription: 'Powerful PDF markup and collaboration platform enabling teams to annotate, mark up, and manage documents with version control and accountability.', rating: 4.8, reviews: 1654, downloads: '6k', icon: 'B', version: '2.1.5', author: 'Bluebeam Software', lastUpdated: '2025-11-09', permissions: ['read:documents', 'write:markups', 'read:sessions'], features: ['PDF Markup', 'Studio Sessions', 'File Sync', 'Collaboration'], webhooks: false, apiAccess: true, verified: true, popularity: 92 },
    { id: 'slack', name: 'Slack', category: 'Communication', desc: 'Real-time team messaging notifications.', fullDescription: 'Enterprise-grade team communication with real-time notifications, thread-based conversations, and integration with all your favorite tools.', rating: 4.9, reviews: 3211, downloads: '15k+', icon: 'S', version: '1.8.0', author: 'Slack Technologies', lastUpdated: '2025-11-11', permissions: ['send:messages', 'read:channels', 'upload:files'], features: ['Instant Notifications', 'File Sharing', 'App Integration', 'Search History'], webhooks: true, apiAccess: true, verified: true, popularity: 99 },
    { id: 'docusign', name: 'DocuSign', category: 'Financials', desc: 'Electronic signature integration for contracts.', fullDescription: 'Industry-leading eSignature platform for contract management with legally binding digital signatures, audit trails, and compliance certifications.', rating: 4.6, reviews: 1432, downloads: '9k', icon: 'D', version: '2.0.3', author: 'DocuSign Inc.', lastUpdated: '2025-11-07', permissions: ['read:documents', 'send:signature', 'read:status'], features: ['eSignature', 'Audit Trail', 'Template Library', 'Integration API'], webhooks: true, apiAccess: true, verified: true, popularity: 88 },
    { id: 'safetyculture', name: 'SafetyCulture', category: 'Safety', desc: 'Mobile inspection and safety checklist sync.', fullDescription: 'Comprehensive mobile safety platform with customizable checklists, incident tracking, and real-time reporting to ensure job site compliance.', rating: 4.7, reviews: 1289, downloads: '5k', icon: 'SC', version: '1.6.0', author: 'SafetyCulture', lastUpdated: '2025-11-06', permissions: ['read:checklists', 'write:incidents', 'read:reports'], features: ['Mobile Checklists', 'Incident Reports', 'Analytics', 'Trending'], webhooks: true, apiAccess: true, verified: true, popularity: 87 },
    { id: 'primavera', name: 'Oracle Primavera', category: 'Project Management', desc: 'Enterprise project portfolio management.', fullDescription: 'Enterprise resource planning solution for large-scale construction projects with advanced scheduling, resource management, and portfolio optimization.', rating: 4.5, reviews: 945, downloads: '3k', icon: 'O', version: '18.8.0', author: 'Oracle Corporation', lastUpdated: '2025-11-04', permissions: ['read:schedule', 'write:resources', 'read:portfolio'], features: ['Project Scheduling', 'Resource Planning', 'Cost Control', 'Reporting'], webhooks: true, apiAccess: true, verified: true, popularity: 78 },
  ];

  const filteredApps = category === 'All'
    ? apps.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : apps.filter(a => a.category === category && a.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleInstallApp = (app: AppListing) => {
    setShowInstalling(app.id);
    setTimeout(() => {
      setInstalledAppsList(prev => [...prev, {
        appId: app.id,
        appName: app.name,
        version: app.version,
        installDate: new Date().toLocaleDateString(),
        enabled: true,
        permissions: app.permissions,
        lastSync: 'Just now'
      }]);
      setShowInstalling(null);
      toggleInstall(app.name);
    }, 2000);
  };

  const handleUninstallApp = (appId: string) => {
    setInstalledAppsList(prev => prev.filter(a => a.appId !== appId));
  };

  const handleOpenAppDetails = (app: AppListing) => {
    setSelectedApp(app);
    setShowAppDetails(true);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50">
      {/* Header */}
      <div className="p-8 border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2 flex items-center gap-3">
            <Store className="text-[#0f5c82]" size={32} /> App Marketplace
          </h1>
          <p className="text-zinc-500">Discover, install, and manage integrations to power up your workflow. Browse { apps.length } apps across { categories.length - 1 } categories.</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="p-8 border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setSearchQuery(''); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    category === cat
                      ? 'bg-[#0f5c82] text-white shadow-sm'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 whitespace-nowrap"
            >
              <Settings size={16} /> Installed
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search apps by name or feature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0f5c82] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Installed Apps Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[80vh] flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2"><Zap size={24} /> Installed Apps ({ installedAppsList.length })</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-500"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {installedAppsList.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <Package size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No apps installed yet</p>
                </div>
              ) : (
                installedAppsList.map(installed => (
                  <div key={installed.appId} className="border border-zinc-200 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-zinc-900">{installed.appName}</h4>
                        <p className="text-xs text-zinc-500">v{installed.version} • Installed {installed.installDate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${installed.enabled ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                          {installed.enabled ? 'Enabled' : 'Disabled'}
                        </div>
                        <button onClick={() => handleUninstallApp(installed.appId)} className="p-1.5 hover:bg-red-100 rounded text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {installed.lastSync && <p className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={12} /> Last sync: {installed.lastSync}</p>}
                    {installed.permissions.length > 0 && (
                      <div className="text-xs text-zinc-500 mt-2">
                        <span className="font-medium">Permissions: </span>{installed.permissions.slice(0, 2).join(', ')}{installed.permissions.length > 2 ? ` +${installed.permissions.length - 2} more` : ''}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* App Details Modal */}
      {showAppDetails && selectedApp && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-100 bg-gradient-to-r from-[#0f5c82]/5 to-[#0f5c82]/10 flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0f5c82] to-[#1f7d98] rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md">
                  {selectedApp.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-zinc-900">{selectedApp.name}</h3>
                    {selectedApp.verified && <Shield size={20} className="text-green-600" />}
                  </div>
                  <p className="text-sm text-zinc-600 mt-1">{selectedApp.category} by {selectedApp.author}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1 text-amber-600"><Star size={14} className="fill-current" /> {selectedApp.rating} ({selectedApp.reviews} reviews)</span>
                    <span className="flex items-center gap-1 text-blue-600"><TrendingUp size={14} /> {selectedApp.popularity}% popularity</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowAppDetails(false)} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-500"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-zinc-900 mb-2">About</h4>
                <p className="text-sm text-zinc-600 leading-relaxed">{selectedApp.fullDescription}</p>
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 mb-3">Key Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedApp.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                      <ChevronRight size={14} className="text-[#0f5c82]" /> {feature}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-zinc-200 rounded-xl p-4 text-center">
                  <Code size={20} className="mx-auto mb-2 text-[#0f5c82]" />
                  <p className="text-xs text-zinc-500">API Access</p>
                  <p className="text-sm font-semibold text-zinc-900 mt-1">{selectedApp.apiAccess ? 'Yes' : 'No'}</p>
                </div>
                <div className="border border-zinc-200 rounded-xl p-4 text-center">
                  <Globe size={20} className="mx-auto mb-2 text-[#0f5c82]" />
                  <p className="text-xs text-zinc-500">Webhooks</p>
                  <p className="text-sm font-semibold text-zinc-900 mt-1">{selectedApp.webhooks ? 'Yes' : 'No'}</p>
                </div>
                <div className="border border-zinc-200 rounded-xl p-4 text-center">
                  <Clock size={20} className="mx-auto mb-2 text-[#0f5c82]" />
                  <p className="text-xs text-zinc-500">Last Updated</p>
                  <p className="text-sm font-semibold text-zinc-900 mt-1">{selectedApp.lastUpdated}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 mb-2">Permissions Required</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.permissions.map((perm, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">{perm}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex gap-3">
              <button onClick={() => setShowAppDetails(false)} className="px-6 py-2.5 text-zinc-600 font-medium hover:bg-zinc-200 rounded-lg transition-colors">Cancel</button>
              {installedAppsList.find(a => a.appId === selectedApp.id) ? (
                <button onClick={() => { handleUninstallApp(selectedApp.id); setShowAppDetails(false); }} className="px-6 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 flex-1 justify-center">
                  <Trash2 size={16} /> Uninstall
                </button>
              ) : (
                <button onClick={() => { handleInstallApp(selectedApp); setShowAppDetails(false); }} disabled={showInstalling === selectedApp.id} className="px-6 py-2.5 bg-[#0f5c82] text-white font-medium rounded-lg hover:bg-[#0c4a6e] transition-colors flex items-center gap-2 flex-1 justify-center disabled:opacity-50">
                  {showInstalling === selectedApp.id ? (
                    <><Loader2 size={16} className="animate-spin" /> Installing...</>
                  ) : (
                    <><Download size={16} /> Install App</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apps Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {filteredApps.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">No apps found</p>
              <p className="text-sm">Try adjusting your search or category filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map((app) => {
                const isInstalled = installedAppsList.some(a => a.appId === app.id);
                return (
                  <div key={app.id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-[#0f5c82] transition-all flex flex-col group cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#0f5c82] to-[#1f7d98] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
                        {app.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        {isInstalled && <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle2 size={10} /> Installed</span>}
                        {app.verified && <Shield size={14} className="text-green-600" />}
                      </div>
                    </div>
                    <h3 className="font-bold text-zinc-900 text-lg mb-1">{app.name}</h3>
                    <p className="text-xs text-zinc-500 mb-3">{app.category}</p>
                    <p className="text-sm text-zinc-600 mb-4 flex-1 leading-relaxed">{app.desc}</p>

                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4 pt-4 border-t border-zinc-50">
                      <span className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-current" /> {app.rating}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {app.reviews}</span>
                      <span className="flex items-center gap-1"><Download size={12} /> {app.downloads}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenAppDetails(app)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={14} /> Details
                      </button>
                      {isInstalled ? (
                        <button
                          onClick={() => handleUninstallApp(app.id)}
                          className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Uninstall
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInstallApp(app)}
                          disabled={showInstalling === app.id}
                          className="flex-1 py-2 rounded-lg text-sm font-medium bg-[#0f5c82] text-white hover:bg-[#0c4a6e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          {showInstalling === app.id ? (
                            <><Loader2 size={14} className="animate-spin" /> Installing</>
                          ) : (
                            <><Plus size={14} /> Install</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceView;