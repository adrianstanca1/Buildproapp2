import React, { useState } from 'react';
import { Page } from '@/types';
import {
  Cpu,
  Search,
  LayoutGrid,
  ClipboardList,
  BarChart4,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Construction,
  Users,
  FileText,
  Camera,
  FolderOpen,
  MessageSquare,
  Repeat,
  Target,
  PenTool,
  Coins,
  ShieldCheck,
  TrendingUp,
  Layout,
  UserPlus,
  Package,
  Wrench,
  Globe,
  Mic,
  Brain,
  Zap,
  Bot,
  Globe2,
  Lock,
  Network,
  Truck,
  Boxes,
  Recycle,
  Lightbulb,
  Stethoscope,
  Smartphone,
  Eye,
  Smile,
  Printer,
  Microchip,
  Dna,
  Languages,
  Book,
  GraduationCap,
  HardHat,
  Monitor
} from 'lucide-react';

type FeatureStatus = 'Active' | 'In Progress' | 'Planned';
type FeatureCategory = 'Project Ops' | 'Financial Mgt' | 'Business Dev';

interface Feature {
  id: string;
  title: string;
  category: FeatureCategory;
  status: FeatureStatus;
  icon: React.ReactNode;
}

const NeuralNetworkView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [currentPage, setCurrentPage] = useState(Page.NEURAL_NETWORK);
  const [activeCategory, setActiveCategory] = useState<string>('All Features');

  const menuItems = [
    { id: 'Home', label: 'Home', page: Page.CORTEX_BUILD_HOME },
    { id: 'NeuralNetwork', label: 'The Neural Network', page: Page.NEURAL_NETWORK },
    { id: 'PlatformFeatures', label: 'Platform Features', page: Page.PLATFORM_FEATURES },
    { id: 'Connectivity', label: 'Connectivity', page: Page.CONNECTIVITY },
    { id: 'DeveloperPlatform', label: 'Developer Platform', page: Page.DEVELOPER_PLATFORM },
    { id: 'GetStarted', label: 'Get Started', page: Page.PUBLIC_LOGIN }
  ];

  const categories = [
    { id: 'All Features', label: 'All Features', desc: 'Complete Platform', icon: <LayoutGrid size={24} />, activeColor: 'bg-blue-600', shadow: 'shadow-blue-100' },
    { id: 'Project Ops', label: 'Project Ops', desc: 'Construction Management', icon: <Construction size={24} />, activeColor: 'bg-emerald-500', shadow: 'shadow-emerald-100' },
    { id: 'Financial Mgt', label: 'Financial Mgt', desc: 'Accounting & Finance', icon: <Coins size={24} />, activeColor: 'bg-violet-600', shadow: 'shadow-violet-100' },
    { id: 'Business Dev', label: 'Business Dev', desc: 'Growth & Strategy', icon: <Briefcase size={24} />, activeColor: 'bg-orange-500', shadow: 'shadow-orange-100' },
  ];

  const features: Feature[] = [
    // --- ACTIVE FEATURES (Screenshot 4) ---
    { id: 'pm', title: 'Project Management', category: 'Project Ops', status: 'Active', icon: <Construction className="text-orange-500" /> },
    { id: 'tt', title: 'Task Tracking', category: 'Project Ops', status: 'Active', icon: <CheckCircle2 className="text-slate-700" /> },
    { id: 'dl', title: 'Daily Logs', category: 'Project Ops', status: 'Active', icon: <PenTool className="text-yellow-600" /> },
    { id: 'pg', title: 'Photo Gallery', category: 'Project Ops', status: 'Active', icon: <Camera className="text-slate-800" /> },
    { id: 'dm', title: 'Document Management', category: 'Project Ops', status: 'Active', icon: <FolderOpen className="text-amber-500" /> },
    { id: 'tc', title: 'Team Collaboration', category: 'Project Ops', status: 'Active', icon: <Users className="text-blue-600" /> },
    { id: 'rm', title: 'RFI Management', category: 'Project Ops', status: 'Active', icon: <FileText className="text-slate-500" /> },
    { id: 'rt', title: 'RFI Tracking', category: 'Project Ops', status: 'Active', icon: <Search className="text-slate-800" /> },
    { id: 'pl', title: 'Punch List', category: 'Project Ops', status: 'Active', icon: <CheckCircle2 className="text-slate-700" /> },
    { id: 'qc', title: 'Quality Control', category: 'Project Ops', status: 'Active', icon: <Target className="text-red-500" /> },
    { id: 'dp', title: 'Drawings & Plans', category: 'Project Ops', status: 'Active', icon: <PenTool className="text-slate-400" /> },
    { id: 'dc', title: 'Drawing Comparison', category: 'Project Ops', status: 'Active', icon: <Repeat className="text-blue-500" /> },
    { id: 'ds', title: 'Daywork Sheets', category: 'Project Ops', status: 'Active', icon: <BarChart4 className="text-blue-600" /> },
    { id: 'lb', title: 'Labor Tracking', category: 'Project Ops', status: 'Active', icon: <Clock className="text-slate-700" /> },
    { id: 'ib', title: 'Invoicing & Billing', category: 'Financial Mgt', status: 'Active', icon: <FileText className="text-slate-400" /> },
    { id: 'fr', title: 'Financial Reports', category: 'Financial Mgt', status: 'Active', icon: <BarChart4 className="text-blue-600" /> },
    { id: 'ia', title: 'Integrated Accounting', category: 'Financial Mgt', status: 'Active', icon: <Network className="text-slate-500" /> },
    { id: 'sm', title: 'Subcontractor Management', category: 'Project Ops', status: 'Active', icon: <HardHat className="text-amber-600" /> },
    { id: 'cm', title: 'Contract Management', category: 'Project Ops', status: 'Active', icon: <FileText className="text-slate-400" /> },
    { id: 'tm', title: 'Time Tracking', category: 'Project Ops', status: 'Active', icon: <Clock className="text-slate-700" /> },
    { id: 'pi', title: 'Payroll Integration', category: 'Financial Mgt', status: 'Active', icon: <Coins className="text-yellow-600" /> },

    // --- IN PROGRESS FEATURES (Screenshot 3) ---
    { id: 'ca', title: 'AI Chatbot Assistant', category: 'Project Ops', status: 'In Progress', icon: <Bot className="text-cyan-500" size={20} /> },
    { id: 'da', title: 'Document Analysis', category: 'Project Ops', status: 'In Progress', icon: <FileText className="text-slate-400" size={20} /> },
    { id: 'pa', title: 'Predictive Analytics', category: 'Project Ops', status: 'In Progress', icon: <Brain className="text-purple-500" size={20} /> },
    { id: 'ss', title: 'Smart Scheduling', category: 'Project Ops', status: 'In Progress', icon: <Clock className="text-slate-700" size={20} /> },
    { id: 'ra', title: 'Risk Assessment', category: 'Project Ops', status: 'In Progress', icon: <AlertCircle className="text-yellow-500" size={20} /> },
    { id: 'ce', title: 'Cost Estimation', category: 'Financial Mgt', status: 'In Progress', icon: <Network className="text-red-700" size={20} /> },
    { id: 'pm_metrics', title: 'Performance Metrics', category: 'Business Dev', status: 'In Progress', icon: <BarChart4 className="text-blue-600" size={20} /> },
    { id: 'ta', title: 'Trend Analysis', category: 'Business Dev', status: 'In Progress', icon: <TrendingUp className="text-red-500" size={20} /> },
    { id: 'cd', title: 'Custom Dashboards', category: 'Business Dev', status: 'In Progress', icon: <Monitor className="text-slate-700" size={20} /> },

    // --- PLANNED FEATURES (Screenshots 1, 2, 3) ---
    { id: 'lm', title: 'Lead Management', category: 'Business Dev', status: 'Planned', icon: <Target className="text-red-600" /> },
    { id: 'pg_gen', title: 'Proposal Generation', category: 'Business Dev', status: 'Planned', icon: <PenTool className="text-yellow-500" /> },
    { id: 'cp', title: 'Client Portal', category: 'Business Dev', status: 'Planned', icon: <Globe2 className="text-blue-400" /> },
    { id: 'bm', title: 'Bid Management', category: 'Business Dev', status: 'Planned', icon: <Briefcase className="text-amber-800" /> },
    { id: 'crm', title: 'CRM Integration', category: 'Business Dev', status: 'Planned', icon: <Users className="text-blue-600" /> },
    { id: 'al', title: 'Agent Library', category: 'Project Ops', status: 'Planned', icon: <Bot className="text-slate-500" /> },
    { id: 'cw', title: 'Custom Workflows', category: 'Project Ops', status: 'Planned', icon: <Network className="text-slate-700" /> },
    { id: 'apim', title: 'API Marketplace', category: 'Project Ops', status: 'Planned', icon: <Zap className="text-slate-900" /> },
    { id: 'vc', title: 'Voice Commands', category: 'Project Ops', status: 'Planned', icon: <Mic className="text-slate-600" /> },
    { id: 'dp_pricing', title: 'Dynamic Pricing', category: 'Financial Mgt', status: 'Planned', icon: <Zap className="text-blue-400" /> },
    { id: 'cff', title: 'Cash Flow Forecasting', category: 'Financial Mgt', status: 'Planned', icon: <Coins className="text-yellow-600" /> },
    { id: 'fd', title: 'Fraud Detection', category: 'Financial Mgt', status: 'Planned', icon: <Search className="text-slate-800" /> },
    { id: 'to', title: 'Tax Optimization', category: 'Financial Mgt', status: 'Planned', icon: <FileText className="text-slate-400" /> },
    { id: 'ian', title: 'Investment Analysis', category: 'Financial Mgt', status: 'Planned', icon: <BarChart4 className="text-blue-600" /> },
    { id: 'sp', title: 'Smart Procurement', category: 'Financial Mgt', status: 'Planned', icon: <Package className="text-pink-500" /> },
    { id: 'sn', title: 'Supplier Network', category: 'Business Dev', status: 'Planned', icon: <Globe className="text-blue-400" /> },
    { id: 'lo', title: 'Logistics Optimization', category: 'Project Ops', status: 'Planned', icon: <Truck className="text-orange-600" /> },
    { id: 'ip', title: 'Inventory Prediction', category: 'Project Ops', status: 'Planned', icon: <Boxes className="text-amber-700" /> },
    { id: 'wr', title: 'Waste Reduction', category: 'Project Ops', status: 'Planned', icon: <Recycle className="text-green-600" /> },
    { id: 'sm_match', title: 'Skills Matching', category: 'Business Dev', status: 'Planned', icon: <Target className="text-red-500" /> },
    { id: 'tr', title: 'Training Recommendations', category: 'Business Dev', status: 'Planned', icon: <GraduationCap className="text-slate-700" /> },
    { id: 'pa_analytics', title: 'Performance Analytics', category: 'Business Dev', status: 'Planned', icon: <TrendingUp className="text-red-500" /> },
    { id: 'shift', title: 'Shift Optimization', category: 'Project Ops', status: 'Planned', icon: <Clock className="text-slate-400" /> },
    { id: 'wellness', title: 'Wellness Monitoring', category: 'Project Ops', status: 'Planned', icon: <Lightbulb className="text-amber-500" /> },
    { id: 'cma', title: 'Client Mobile App', category: 'Business Dev', status: 'Planned', icon: <Smartphone className="text-slate-800" /> },
    { id: 'vt', title: 'Virtual Tours', category: 'Project Ops', status: 'Planned', icon: <Eye className="text-slate-700" /> },
    { id: 'csa', title: 'Client Sentiment Analysis', category: 'Business Dev', status: 'Planned', icon: <Smile className="text-yellow-500" /> },
    { id: 'ar', title: 'Automated Reporting', category: 'Project Ops', status: 'Planned', icon: <FileText className="text-slate-400" /> },
    { id: '3dp', title: '3D Printing Integration', category: 'Project Ops', status: 'Planned', icon: <Printer className="text-slate-700" /> },
    { id: 'rc', title: 'Robotics Coordination', category: 'Project Ops', status: 'Planned', icon: <Bot className="text-cyan-600" /> },
    { id: 'bc', title: 'Blockchain Contracts', category: 'Financial Mgt', status: 'Planned', icon: <Network className="text-slate-500" /> },
    { id: 'qc_comp', title: 'Quantum Computing', category: 'Project Ops', status: 'Planned', icon: <Microchip className="text-purple-500" /> },
    { id: 'nas', title: 'Neural Architecture Search', category: 'Project Ops', status: 'Planned', icon: <Brain className="text-pink-500" /> },
    { id: 'rtt', title: 'Real-time Translation', category: 'Business Dev', status: 'Planned', icon: <Languages className="text-blue-500" /> },
    { id: 'mi', title: 'Meeting Intelligence', category: 'Business Dev', status: 'Planned', icon: <Mic className="text-slate-700" /> },
    { id: 'kb', title: 'Knowledge Base', category: 'Business Dev', status: 'Planned', icon: <Book className="text-slate-600" /> },
    { id: 'en', title: 'Expert Network', category: 'Business Dev', status: 'Planned', icon: <ShieldCheck className="text-amber-600" /> },
    { id: 'pm_maint', title: 'Predictive Maintenance', category: 'Project Ops', status: 'Planned', icon: <Wrench className="text-slate-500" /> },
    { id: 'mi_intel', title: 'Market Intelligence', category: 'Business Dev', status: 'Planned', icon: <BarChart4 className="text-blue-700" /> },
    { id: 'bench', title: 'Benchmarking', category: 'Business Dev', status: 'Planned', icon: <Repeat className="text-slate-400" /> },
    { id: 'sp_plan', title: 'Scenario Planning', category: 'Business Dev', status: 'Planned', icon: <Boxes className="text-slate-600" /> },

    // --- ADDITIONAL TO MATCH COUNTS (83 total: 24 Active, 9 In Progress, 50 Planned) ---
    { id: 'extra_a1', title: 'Equipment Tracking', category: 'Project Ops', status: 'Active', icon: <Truck className="text-orange-500" /> },
    { id: 'extra_a2', title: 'Safety Compliance', category: 'Project Ops', status: 'Active', icon: <ShieldCheck className="text-emerald-600" /> },
    { id: 'extra_a3', title: 'Asset Management', category: 'Financial Mgt', status: 'Active', icon: <Boxes className="text-blue-500" /> },

    { id: 'extra_p1', title: 'Carbon Footprint Tracking', category: 'Project Ops', status: 'Planned', icon: <Recycle className="text-green-500" /> },
    { id: 'extra_p2', title: 'Autonomous Workflows', category: 'Project Ops', status: 'Planned', icon: <Cpu className="text-purple-600" /> },
    { id: 'extra_p3', title: 'Smart Grid Integration', category: 'Project Ops', status: 'Planned', icon: <Zap className="text-yellow-500" /> },
    { id: 'extra_p4', title: 'AI Legal Counsel', category: 'Business Dev', status: 'Planned', icon: <ShieldCheck className="text-slate-700" /> },
    { id: 'extra_p5', title: 'Global Supply Intelligence', category: 'Business Dev', status: 'Planned', icon: <Globe className="text-blue-600" /> },
    { id: 'extra_p6', title: 'Venture Optimization', category: 'Business Dev', status: 'Planned', icon: <TrendingUp className="text-emerald-500" /> },
    { id: 'extra_p7', title: 'Strategic Forecasting', category: 'Business Dev', status: 'Planned', icon: <Target className="text-red-500" /> },
    { id: 'extra_p8', title: 'Digital Twin Sync', category: 'Project Ops', status: 'Planned', icon: <Monitor className="text-blue-400" /> },
  ];

  const filteredFeatures = activeCategory === 'All Features'
    ? features
    : features.filter(f => f.category === activeCategory);

  const stats = {
    total: features.length,
    active: features.filter(f => f.status === 'Active').length,
    inProgress: features.filter(f => f.status === 'In Progress').length,
    planned: features.filter(f => f.status === 'Planned').length
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-x-hidden">
      {/* --- REUSED PREMIUM NAVBAR --- */}
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

      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 py-12">
        {/* --- INTRO SECTION --- */}
        <div className="text-center mb-12">
          <p className="text-slate-500 font-semibold mb-2">with intelligent automation to streamline your operations. Click on any card to see details.</p>
        </div>

        {/* --- STATS DASHBOARD (Screenshot 4 Inspiration) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Total Features', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active', value: stats.active, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Planned', value: stats.planned, color: 'text-slate-500', bg: 'bg-slate-50' }
          ].map((stat, i) => (
            <div key={i} className={`p-8 rounded-[32px] border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]`}>
              <div className={`text-4xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* --- CATEGORY SELECTORS (Screenshot 4 Inspiration) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-6 rounded-[32px] flex items-center gap-5 transition-all duration-300 border-2 ${activeCategory === cat.id
                ? `bg-white border-indigo-600 shadow-2xl ${cat.shadow} -translate-y-1`
                : "bg-white border-transparent hover:border-slate-200 shadow-sm"
                }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${cat.activeColor}`}>
                {cat.icon}
              </div>
              <div className="text-left">
                <div className="font-black text-slate-900">{cat.label}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-tight">{cat.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* --- COMPREHENSIVE FEATURE GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature) => (
            <div key={feature.id} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {React.cloneElement(feature.icon as React.ReactElement<any>, { size: 24 })}
                </div>
                <h4 className="font-bold text-slate-800 tracking-tight">{feature.title}</h4>
              </div>

              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${feature.status === 'Active' ? 'bg-emerald-500' :
                  feature.status === 'In Progress' ? 'bg-amber-500' :
                    'bg-slate-400'
                  }`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {feature.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="mt-20 py-10 border-t border-slate-100 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 flex justify-between items-center text-slate-400 font-bold text-xs tracking-widest uppercase">
          <div>CortexBuild Pro Neural Architecture</div>
          <div>© 2025 AI Intelligence Platform</div>
        </div>
      </footer>
    </div>
  );
};

export default NeuralNetworkView;