import React, { useState } from 'react';
import { Page } from '@/types';
import {
  Rocket,
  Target,
  Zap,
  Shield,
  Cpu,
  Activity,
  Database,
  Code2,
  Globe,
  ArrowRight,
  Monitor,
  Layout,
  Layers,
  CheckCircle2,
  BarChart3,
  Clock,
  BrainCircuit,
  Lightbulb
} from 'lucide-react';

const CortexBuildHomeView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [currentPage, setCurrentPage] = useState(Page.CORTEX_BUILD_HOME);

  const menuItems = [
    { id: 'Home', label: 'Home', page: Page.CORTEX_BUILD_HOME },
    { id: 'NeuralNetwork', label: 'The Neural Network', page: Page.NEURAL_NETWORK },
    { id: 'PlatformFeatures', label: 'Platform Features', page: Page.PLATFORM_FEATURES },
    { id: 'Connectivity', label: 'Connectivity', page: Page.CONNECTIVITY },
    { id: 'DeveloperPlatform', label: 'Developer Platform', page: Page.DEVELOPER_PLATFORM },
    { id: 'GetStarted', label: 'Get Started', page: Page.PUBLIC_LOGIN }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* --- PREMIUM NAVBAR --- */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-[100] transition-all duration-300">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Cpu className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent transform hover:scale-105 transition-transform cursor-default">
                  CortexBuild
                </span>
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
                  className={`text-sm font-semibold tracking-wide transition-all duration-300 relative group overflow-hidden ${currentPage === item.page ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"
                    }`}
                >
                  {item.label}
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 transform transition-transform duration-300 ${currentPage === item.page ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`} />
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION (Screenshot 3 Inspiration) --- */}
      <section className="relative pt-20 pb-40 overflow-hidden bg-[radial-gradient(circle_at_top_right,_#f0f9ff,_transparent_40%),radial-gradient(circle_at_bottom_left,_#eef2ff,_transparent_40%)]">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          <div className="lg:col-span-6 space-y-10">
            <div className="inline-flex items-center gap-3 bg-white/50 backdrop-blur-md border border-slate-200 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-shadow">
              <span className="flex h-3 w-3 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-black text-slate-700 uppercase tracking-widest">🚀 The Future of Construction Intelligence</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-7xl xl:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Build Smarter,<br />
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">Not Harder</span>
              </h1>
              <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-xl">
                AI-powered construction intelligence platform that gives SMBs the power of enterprise-level tools. Transform your workflow today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <button
                onClick={() => setPage(Page.PUBLIC_LOGIN)}
                className="bg-slate-900 group overflow-hidden text-white px-10 py-5 rounded-3xl font-black text-lg shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 transform hover:-translate-y-1 transition-all active:scale-95"
              >
                Start Free Trial
                <ArrowRight className="group-hover:translate-x-1.5 transition-transform" />
              </button>
              <button
                onClick={() => setPage(Page.LOGIN)}
                className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-5 rounded-3xl font-black text-lg shadow-xl shadow-slate-100 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
              >
                Watch Demo
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            {/* CENTRAL AI GRAPHIC */}
            <div className="relative w-full aspect-square max-w-2xl mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-cyan-400/20 blur-[100px] animate-pulse" />

              {/* ORBITAL RINGS */}
              <div className="absolute w-[80%] h-[80%] border border-slate-200/50 rounded-full animate-[spin_60s_linear_infinite]" />
              <div className="absolute w-[60%] h-[60%] border border-slate-200/50 rounded-full animate-[spin_40s_linear_infinite_reverse]" />

              {/* CENTRAL BRAIN ICON */}
              <div className="relative z-10 w-48 h-48 bg-white/70 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(79,70,229,0.3)] flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                <BrainCircuit className="text-indigo-600" size={80} />
              </div>

              {/* ORBITING APPS */}
              {[
                { Icon: Database, color: 'bg-blue-500', pos: 'top-10 left-1/4' },
                { Icon: Activity, color: 'bg-green-500', pos: 'bottom-10 right-1/4' },
                { Icon: Zap, color: 'bg-amber-500', pos: 'top-1/2 right-0' },
                { Icon: Shield, color: 'bg-red-500', pos: 'top-1/2 left-0' }
              ].map((App, i) => (
                <div key={i} className={`absolute ${App.pos} w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-bounce transition-all duration-1000`} style={{ animationDelay: `${i * 0.5}s` }}>
                  <App.Icon className="text-slate-700" size={28} />
                </div>
              ))}
            </div>

            {/* FLOATING STATUS CARDS */}
            <div className="grid grid-cols-2 gap-4 mt-12">
              {[
                { label: '100+', sub: 'AI Features', color: 'text-indigo-600' },
                { label: '24/7', sub: 'Automation', color: 'text-emerald-500' },
                { label: 'Real-time', sub: 'Insights', color: 'text-violet-600' },
                { label: 'Smart', sub: 'Decisions', color: 'text-orange-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-[32px] shadow-xl shadow-slate-200/50 transform hover:scale-105 transition-all">
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.label}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- VISION & MISSION (Screenshot 2 Inspiration) --- */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 text-center mb-24">
          <h2 className="text-5xl font-black text-slate-900 mb-6">Our Vision & Mission</h2>
          <p className="text-lg text-slate-500 font-semibold max-w-2xl mx-auto">
            Transforming the construction industry through intelligent automation and data-driven insights.
          </p>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="relative group p-10 rounded-[48px] overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-3xl shadow-indigo-200">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center">
                <Target size={40} />
              </div>
              <h3 className="text-4xl font-black">Our Vision</h3>
              <p className="text-lg font-medium text-white/80 leading-relaxed">
                To revolutionize the construction industry by making enterprise-level AI technology accessible to every construction business, regardless of size. We envision a future where every project is optimized, every decision is data-driven, and every construction professional is empowered with intelligent tools.
              </p>
            </div>
          </div>

          <div className="relative group p-10 rounded-[48px] overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-3xl shadow-emerald-200">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center">
                <Rocket size={40} />
              </div>
              <h3 className="text-4xl font-black">Our Mission</h3>
              <p className="text-lg font-medium text-white/80 leading-relaxed">
                To empower construction SMBs with a unified, AI-powered platform that eliminates inefficiencies, reduces risks, and maximizes profitability. We're committed to delivering intelligent automation that learns from your business and continuously improves your operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- BENEFITS (Screenshot 2 Inspiration) --- */}
      <section className="py-40 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              Icon: Layout,
              title: 'Unified Workflow',
              desc: 'Replace disconnected tools with a single source of truth.',
              color: 'bg-blue-50',
              iconColor: 'text-blue-600'
            },
            {
              Icon: Activity,
              title: 'Proactive Insights',
              desc: 'AI agents analyze data and predict issues before they happen.',
              color: 'bg-violet-50',
              iconColor: 'text-violet-600'
            },
            {
              Icon: BarChart3,
              title: 'Increased Profitability',
              desc: 'Real-time job costing and AI-powered estimation.',
              color: 'bg-amber-50',
              iconColor: 'text-amber-600'
            }
          ].map((benefit, i) => (
            <div key={i} className="group p-12 bg-white border border-slate-100 rounded-[48px] hover:border-indigo-600/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-500">
              <div className={`${benefit.color} w-24 h-24 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500`}>
                <benefit.Icon className={benefit.iconColor} size={40} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-6">{benefit.title}</h4>
              <p className="text-slate-500 font-semibold leading-relaxed">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- DEVELOPER ECOSYSTEM (Screenshot 1 Inspiration) --- */}
      <section className="py-40 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />

        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 text-center mb-32 relative z-10">
          <div className="inline-block bg-indigo-600/20 text-indigo-400 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-10 border border-indigo-500/30">
            Industry First
          </div>
          <h2 className="text-6xl xl:text-7xl font-black mb-8">Developer Ecosystem &<br />Modular Platform</h2>
          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
            The first and only construction management platform with an open developer ecosystem. Build, share, and monetize intelligent modules.
          </p>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 relative z-10">
          {[
            {
              title: 'Modular Architecture',
              desc: 'Built on open-source, extensible architecture. Each module is self-contained.',
              features: ['Independent development', 'Plug-and-play integration', 'Scalable & future-proof'],
              gradient: 'from-blue-600 to-cyan-500',
              Icon: Layers
            },
            {
              title: 'Developer Sandbox',
              desc: 'Dedicated workspace to create, test, and deploy your innovations safely.',
              features: ['Build custom AI agents', 'Create API applications', 'Real-time testing'],
              gradient: 'from-violet-600 to-indigo-500',
              Icon: Code2
            },
            {
              title: 'Module Marketplace',
              desc: 'Publish, share, and monetize your intelligent modules with the community.',
              features: ['Browse community modules', 'Revenue sharing model', 'Ratings & reviews'],
              gradient: 'from-fuchsia-600 to-pink-500',
              Icon: Globe
            },
            {
              title: 'Transform the Industry',
              desc: 'Join a community revolutionizing construction through collaborative innovation.',
              features: ['Democratize tech', 'Continuous evolution', 'Industrial transformation'],
              gradient: 'from-orange-500 to-rose-500',
              Icon: Lightbulb
            }
          ].map((card, i) => (
            <div key={i} className={`p-10 rounded-[40px] bg-gradient-to-br ${card.gradient} hover:scale-[1.03] transition-all duration-500 cursor-default group`}>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8">
                <card.Icon size={32} />
              </div>
              <h4 className="text-2xl font-black mb-6">{card.title}</h4>
              <p className="text-white/80 font-medium mb-10 leading-relaxed min-h-[80px]">
                {card.desc}
              </p>
              <ul className="space-y-4">
                {card.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm font-bold text-white/90">
                    <CheckCircle2 size={18} className="text-white/40" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* --- FINAL CTA area --- */}
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 mt-40">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-[64px] p-20 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="relative z-10 space-y-10">
              <h2 className="text-5xl xl:text-6xl font-black leading-tight">Ready to Build the Future?</h2>
              <p className="text-xl text-white/80 font-semibold max-w-2xl mx-auto">
                Join our developer community and start creating intelligent modules that will shape the future of construction technology.
              </p>
              <button
                onClick={() => setPage(Page.PUBLIC_LOGIN)}
                className="bg-white text-indigo-600 px-16 py-7 rounded-[32px] font-black text-2xl shadow-3xl shadow-indigo-900/40 hover:scale-105 transition-all active:scale-95"
              >
                Join Community
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3 opacity-50">
            <Cpu className="text-slate-900" size={32} />
            <span className="text-xl font-black tracking-tight text-slate-900 capitalize">CortexBuild</span>
          </div>
          <div className="text-slate-400 font-bold text-sm tracking-widest uppercase">
            © 2025 CortexBuild AI Intelligence. All Rights Reserved.
          </div>
          <div className="flex gap-8">
            {['Twitter', 'LinkedIn', 'YouTube'].map(s => (
              <button key={s} className="text-slate-400 hover:text-indigo-600 font-black text-sm uppercase tracking-widest transition-colors">{s}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CortexBuildHomeView;
