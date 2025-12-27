import React, { useState } from 'react';
import { Page } from '@/types';
import {
  Cpu,
  Puzzle,
  Wrench,
  Coins,
  Globe,
  Terminal,
  Box,
  Activity,
  Rocket,
  CheckCircle2,
  Code2
} from 'lucide-react';

const DeveloperPlatformView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [currentPage, setCurrentPage] = useState(Page.DEVELOPER_PLATFORM);

  const menuItems = [
    { id: 'Home', label: 'Home', page: Page.CORTEX_BUILD_HOME },
    { id: 'NeuralNetwork', label: 'The Neural Network', page: Page.NEURAL_NETWORK },
    { id: 'PlatformFeatures', label: 'Platform Features', page: Page.PLATFORM_FEATURES },
    { id: 'Connectivity', label: 'Connectivity', page: Page.CONNECTIVITY },
    { id: 'DeveloperPlatform', label: 'Developer Platform', page: Page.DEVELOPER_PLATFORM },
    { id: 'GetStarted', label: 'Get Started', page: Page.PUBLIC_LOGIN }
  ];

  const reasons = [
    {
      title: 'Modular Architecture',
      desc: 'Build self-contained modules that integrate seamlessly with our platform, allowing for easy deployment and maintenance.',
      icon: <Puzzle className="text-white" size={24} />,
      iconBg: 'bg-blue-600'
    },
    {
      title: 'Complete Toolkit',
      desc: 'Access comprehensive APIs, SDKs, and documentation to build power integrations and extensions.',
      icon: <Wrench className="text-white" size={24} />,
      iconBg: 'bg-indigo-600'
    },
    {
      title: 'Monetization',
      desc: 'Publish your modules to our marketplace and earn revenue from your innovations with a 70% revenue share.',
      icon: <Coins className="text-white" size={24} />,
      iconBg: 'bg-emerald-500'
    },
    {
      title: 'Global Impact',
      desc: 'Your modules reach thousands of construction professionals worldwide, making a real impact on the industry.',
      icon: <Globe className="text-white" size={24} />,
      iconBg: 'bg-violet-600'
    }
  ];

  const sandboxFeatures = [
    {
      title: 'Build & Test',
      desc: 'Create modules with our comprehensive SDK and test them in a secure sandbox environment.',
      icon: <Box className="text-slate-600" size={24} />
    },
    {
      title: 'Monitor Performance',
      desc: 'Track module performance, API usage, error rates, and user engagement metrics.',
      icon: <Activity className="text-blue-600" size={24} />
    },
    {
      title: 'Deploy Instantly',
      desc: 'One-click deployment to production with automatic versioning and rollback capabilities.',
      icon: <Rocket className="text-orange-600" size={24} />
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
        {/* --- HERO --- */}
        <div className="text-center max-w-4xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-700 font-bold text-xs uppercase tracking-wider mb-6">
            <Terminal size={14} />
            <span>Developer Ecosystem</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-6 [text-wrap:balance]">
            Build the Future of <span className="text-indigo-600">Construction Tech</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Join the first open developer platform for construction management, where innovation meets the building blocks of tomorrow.
          </p>
        </div>

        {/* --- WHY BUILD GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
          {reasons.map((reason, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group flex items-start gap-6">
              <div className={`w-14 h-14 ${reason.iconBg} rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                {reason.icon}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{reason.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {reason.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* --- CODE EXAMPLE --- */}
        <div className="bg-[#1e293b] rounded-[40px] p-8 md:p-12 mb-24 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-slate-400 text-xs font-mono">example-module.ts</div>
          </div>

          <pre className="font-mono text-sm md:text-base text-slate-300 relative z-10 overflow-x-auto">
            <code>{`import { CortexBuild } from '@cortexbuild/sdk';

export class SmartScheduler {
  async optimizeSchedule(project: Project) {
    // Access project data
    const tasks = await project.getTasks();

    // Run AI optimization
    const optimized = await this.ai.optimize(tasks);

    // Update schedule
    return project.updateSchedule(optimized);
  }
}`}</code>
          </pre>

          <div className="flex flex-wrap gap-4 mt-8 relative z-10">
            <span className="bg-slate-700/50 text-emerald-400 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={14} /> Type-safe APIs
            </span>
            <span className="bg-slate-700/50 text-blue-400 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={14} /> Real-time data
            </span>
            <span className="bg-slate-700/50 text-purple-400 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={14} /> AI-powered
            </span>
          </div>
        </div>

        {/* --- SANDBOX & MARKETPLACE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Developer Sandbox</h3>
            <p className="text-slate-500 mb-8 font-medium">Safe environment to build, test, and debug.</p>

            <div className="space-y-6">
              {sandboxFeatures.map((feat, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-slate-600">
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{feat.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2"></div>

            <h3 className="text-2xl font-black mb-2 relative z-10">Module Marketplace</h3>
            <p className="text-indigo-100 mb-8 font-medium relative z-10">Publish your modules and reach thousands.</p>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                <div className="text-3xl font-black mb-1">70%</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-200">Revenue Share</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                <div className="text-3xl font-black mb-1">100+</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-200">Modules</div>
              </div>
              <div className="col-span-2 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                <Code2 size={24} />
                <div>
                  <div className="font-bold">One-Click Install</div>
                  <div className="text-xs text-indigo-200">Seamless integration for users</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setPage(Page.MARKETPLACE)}
              className="w-full mt-8 bg-white text-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Visit Marketplace
            </button>
          </div>
        </div>

        {/* --- CTA --- */}
        <div className="text-center bg-slate-50 rounded-[48px] p-16 border border-slate-100">
          <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">Start Building Today</h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium">
            Join our growing community of developers transforming the construction industry.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setPage(Page.PUBLIC_LOGIN)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-indigo-200 transition duration-300"
            >
              Get API Access
            </button>
            <button
              onClick={() => setPage(Page.PUBLIC_LOGIN)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-4 px-10 rounded-2xl shadow-sm transition duration-300"
            >
              View Documentation
            </button>
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

export default DeveloperPlatformView;