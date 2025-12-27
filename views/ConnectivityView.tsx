import React, { useState } from 'react';
import { Page } from '@/types';
import {
  Cpu,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Search,
  Save,
  Key,
  Globe,
  Zap,
  LayoutGrid,
  Database,
  Briefcase,
  Building2,
  PlugZap,
  Share2,
  BookOpen
} from 'lucide-react';

const ConnectivityView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [currentPage, setCurrentPage] = useState(Page.CONNECTIVITY);

  const menuItems = [
    { id: 'Home', label: 'Home', page: Page.CORTEX_BUILD_HOME },
    { id: 'NeuralNetwork', label: 'The Neural Network', page: Page.NEURAL_NETWORK },
    { id: 'PlatformFeatures', label: 'Platform Features', page: Page.PLATFORM_FEATURES },
    { id: 'Connectivity', label: 'Connectivity', page: Page.CONNECTIVITY },
    { id: 'DeveloperPlatform', label: 'Developer Platform', page: Page.DEVELOPER_PLATFORM },
    { id: 'GetStarted', label: 'Get Started', page: Page.PUBLIC_LOGIN }
  ];

  const integrationCategories = [
    {
      title: 'Financial Integrations',
      icon: <Building2 className="text-white" size={24} />,
      iconBg: 'bg-emerald-500',
      items: ['Open Banking APIs', 'Xero & QuickBooks', 'Payment Gateways', 'Tax Authorities (HMRC, IRS)']
    },
    {
      title: 'Business Tools',
      icon: <Briefcase className="text-white" size={24} />,
      iconBg: 'bg-blue-600',
      items: ['Microsoft 365', 'Google Workspace', 'Slack & Teams', 'Email Integration']
    },
    {
      title: 'Construction Platforms',
      icon: <LayoutGrid className="text-white" size={24} />,
      iconBg: 'bg-orange-600',
      items: ['BIM Software (Revit, AutoCAD)', 'Project Management Tools', 'Equipment Tracking', 'Supplier Networks']
    },
    {
      title: 'AI & Analytics',
      icon: <Database className="text-white" size={24} />,
      iconBg: 'bg-violet-600',
      items: ['Google Gemini API', 'Custom ML Models', 'Data Warehouses', 'BI Tools']
    }
  ];

  const securityFeatures = [
    {
      title: 'End-to-End Encryption',
      desc: 'All data encrypted at rest and in transit using industry-standard AES-256 encryption.',
      icon: <Lock className="text-yellow-600" size={24} />
    },
    {
      title: 'Multi-Factor Authentication',
      desc: 'Secure access with MFA, SSO, and role-based access control (RBAC).',
      icon: <ShieldCheck className="text-red-500" size={24} />
    },
    {
      title: 'Compliance Certified',
      desc: 'SOC 2 Type II, GDPR, ISO 27001 certified with regular security audits.',
      icon: <CheckCircle2 className="text-emerald-500" size={24} />
    },
    {
      title: '24/7 Monitoring',
      desc: 'Continuous security monitoring with automated threat detection and response.',
      icon: <Search className="text-slate-500" size={24} />
    },
    {
      title: 'Automated Backups',
      desc: 'Daily automated backups with point-in-time recovery and disaster recovery plans.',
      icon: <Save className="text-slate-600" size={24} />
    },
    {
      title: 'Data Privacy',
      desc: 'Your data is yours. We never share or sell your information to third parties.',
      icon: <Key className="text-amber-500" size={24} />
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-x-hidden">
      {/* --- PREMIUM NAVBAR --- */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-[100]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
          <div className="flex justify-between items-center h-20">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                setPage(Page.CORTEX_BUILD_HOME);
                window.scrollTo(0, 0);
              }}
            >
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Cpu className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-slate-900">CortexBuild Pro</span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-600 uppercase">AI Intelligence Platform</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-10">
              {menuItems.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPage(item.page);
                    setCurrentPage(item.page);
                  }}
                  className={`text-sm font-semibold tracking-wide transition-all ${currentPage === item.page ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"
                    }`}
                >
                  {item.label}
                  {currentPage === item.page && <div className="h-0.5 bg-indigo-600 w-full mt-1" />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage(Page.LOGIN)}
                className="hidden sm:block text-sm font-bold text-slate-700 px-5 py-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                Login
              </button>
              <button
                onClick={() => setPage(Page.PUBLIC_LOGIN)}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 py-16">
        {/* --- HEADER --- */}
        <div className="text-center max-w-4xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-6 [text-wrap:balance]">
            Seamlessly Connected, <span className="text-indigo-600">Infinitely Scalable</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Enterprise-grade integrations that grow with your business. Connect to your existing tools, ensure data security, and scale without limits.
          </p>
        </div>

        {/* --- INTEGRATIONS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {integrationCategories.map((cat, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className={`w-12 h-12 ${cat.iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-6">{cat.title}</h3>
              <ul className="space-y-4">
                {cat.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500" size={16} />
                    <span className="text-sm font-semibold text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* --- SECURITY SECTION --- */}
        <div className="bg-slate-50 rounded-[48px] p-12 lg:p-20 border border-slate-200/50 mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Enterprise-Grade Security & Compliance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feat, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col items-start">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                  {feat.icon}
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-3">{feat.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {[
              { label: 'Uptime SLA', value: '99.9%', color: 'text-blue-600' },
              { label: 'API Response Time', value: '<100ms', color: 'text-emerald-500' },
              { label: 'Projects', value: 'Unlimited', color: 'text-violet-600' },
              { label: 'Scale Storage', value: 'Petabyte', color: 'text-orange-600' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] text-center border border-slate-100 shadow-sm">
                <div className={`text-3xl font-black ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* --- API TOOLS --- */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-12">API & Developer Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'RESTful API', desc: 'Complete REST API with comprehensive documentation and SDKs for popular languages.', icon: <PlugZap className="text-slate-700" /> },
              { title: 'Webhooks', desc: 'Real-time event notifications to keep your systems in sync automatically.', icon: <Zap className="text-amber-500" /> },
              { title: 'Developer Portal', desc: 'Interactive API documentation, code examples, and sandbox environment for testing.', icon: <BookOpen className="text-emerald-600" /> }
            ].map((tool, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                  {tool.icon}
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-3">{tool.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Cpu className="text-white" size={16} />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">CortexBuild Pro</span>
          </div>
          <div className="text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase">
            © 2025 CortexBuild Pro AI • Built for the Future of Construction
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ConnectivityView;