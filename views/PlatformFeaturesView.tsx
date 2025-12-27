import React, { useState } from 'react';
import { Page } from '@/types';
import {
  Cpu,
  Construction,
  Coins,
  FileText,
  ShieldCheck,
  TrendingUp,
  Bot,
  RefreshCw,
  Zap,
  Target
} from 'lucide-react';

const PlatformFeaturesView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [currentPage, setCurrentPage] = useState(Page.PLATFORM_FEATURES);

  const menuItems = [
    { id: 'Home', label: 'Home', page: Page.CORTEX_BUILD_HOME },
    { id: 'NeuralNetwork', label: 'The Neural Network', page: Page.NEURAL_NETWORK },
    { id: 'PlatformFeatures', label: 'Platform Features', page: Page.PLATFORM_FEATURES },
    { id: 'Connectivity', label: 'Connectivity', page: Page.CONNECTIVITY },
    { id: 'DeveloperPlatform', label: 'Developer Platform', page: Page.DEVELOPER_PLATFORM },
    { id: 'GetStarted', label: 'Get Started', page: Page.PUBLIC_LOGIN }
  ];

  const agents = [
    {
      title: 'Project Intelligence',
      subtitle: 'AI Project Manager',
      desc: 'Monitors project health, predicts delays, optimizes schedules, and identifies risks before they become critical issues.',
      icon: <Construction size={24} />,
      iconBg: 'bg-blue-600',
      tags: ['Schedule Optimization', 'Risk Detection', 'Resource Planning'],
      tagColor: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Financial Advisor',
      subtitle: 'AI Accountant',
      desc: 'Analyzes cash flow, forecasts budgets, detects anomalies, and provides real-time financial insights for better decision-making.',
      icon: <Coins size={24} />,
      iconBg: 'bg-emerald-500',
      tags: ['Cash Flow Analysis', 'Budget Forecasting', 'Cost Optimization'],
      tagColor: 'text-emerald-600 bg-emerald-50'
    },
    {
      title: 'Document Intelligence',
      subtitle: 'AI Document Analyst',
      desc: 'Extracts data from contracts, drawings, and RFIs. Answers questions instantly by searching through your entire document library.',
      icon: <FileText size={24} />,
      iconBg: 'bg-violet-600',
      tags: ['Smart Search', 'Data Extraction', 'Auto-Tagging'],
      tagColor: 'text-violet-600 bg-violet-50'
    },
    {
      title: 'Safety Monitor',
      subtitle: 'AI Safety Officer',
      desc: 'Uses computer vision and ML to detect safety violations, predict incidents, and ensure compliance with regulations.',
      icon: <ShieldCheck size={24} />,
      iconBg: 'bg-red-500',
      tags: ['Hazard Detection', 'Compliance Checks', 'Incident Prevention'],
      tagColor: 'text-red-600 bg-red-50'
    },
    {
      title: 'Business Strategist',
      subtitle: 'AI Business Advisor',
      desc: 'Analyzes market trends, identifies opportunities, scores leads, and provides strategic recommendations for growth.',
      icon: <TrendingUp size={24} />,
      iconBg: 'bg-orange-600',
      tags: ['Market Analysis', 'Lead Scoring', 'Growth Strategy'],
      tagColor: 'text-orange-600 bg-orange-50'
    },
    {
      title: 'Conversational Assistant',
      subtitle: 'AI Chat Interface',
      desc: 'Your natural language interface to the entire platform. Ask questions, get insights, and execute tasks through simple conversation.',
      icon: <Bot size={24} />,
      iconBg: 'bg-indigo-600',
      tags: ['Natural Language', 'Voice Commands', '24/7 Support'],
      tagColor: 'text-indigo-600 bg-indigo-50'
    }
  ];

  const collaborationFeatures = [
    {
      title: 'Real-Time Sync',
      desc: 'All agents share a unified knowledge base, ensuring consistent insights across your entire operation.',
      icon: <RefreshCw className="text-blue-500" size={24} />
    },
    {
      title: 'Instant Insights',
      desc: 'Get answers in seconds, not hours. Our AI processes millions of data points to deliver actionable intelligence.',
      icon: <Zap className="text-amber-500" size={24} />
    },
    {
      title: 'Proactive Alerts',
      desc: "Don't wait for problems. Our AI predicts issues and notifies you before they impact your projects.",
      icon: <Target className="text-red-500" size={24} />
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-x-hidden">
      {/* --- PREMIUM NAVBAR --- */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-[100]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
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

            <button
              onClick={() => setPage(Page.PUBLIC_LOGIN)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-6 sm:px-10 py-16">
        {/* --- HEADER --- */}
        <div className="text-center max-w-4xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-6 [text-wrap:balance]">
            The AI Core: <span className="text-indigo-600">Your Digital Team of Experts</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Powered by advanced AI models, our intelligent agents work 24/7 to optimize your construction business.
            Each agent specializes in a specific domain, collaborating seamlessly to deliver insights and automation.
          </p>
        </div>

        {/* --- AGENTS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {agents.map((agent, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${agent.iconBg} group-hover:scale-110 transition-transform`}>
                  {agent.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{agent.title}</h3>
                  <p className={`text-xs font-bold uppercase tracking-widest ${agent.iconBg.replace('bg-', 'text-')}`}>{agent.subtitle}</p>
                </div>
              </div>

              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                {agent.desc}
              </p>

              <div className="flex flex-wrap gap-2">
                {agent.tags.map((tag, j) => (
                  <span key={j} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight ${agent.tagColor}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* --- COLLABORATION SECTION --- */}
        <div className="bg-[#f1f5f9] rounded-[48px] p-12 lg:p-16 border border-slate-200/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">How Our AI Agents Collaborate</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {collaborationFeatures.map((feat, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-200/50 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col items-start">
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
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-slate-200 bg-white mt-12">
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

export default PlatformFeaturesView;