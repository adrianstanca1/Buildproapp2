import React, { useState } from 'react';
import { HardHat, Check, Shield, User, Briefcase, Mail, Lock, Loader2, Sparkles, Globe, Zap, Cpu } from 'lucide-react';
import { Page, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface LoginViewProps {
  setPage: (page: Page) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ setPage }) => {
  const { login, isSupabaseConnected } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDashboardForRole = (role: UserRole): Page => {
    switch (role) {
      case UserRole.SUPERADMIN: return Page.PLATFORM_DASHBOARD;
      case UserRole.COMPANY_ADMIN: return Page.DASHBOARD;
      case UserRole.SUPERVISOR:
      case UserRole.OPERATIVE: return Page.PROJECTS;
      case UserRole.READ_ONLY: return Page.CLIENT_PORTAL;
      default: return Page.DASHBOARD;
    }
  };

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { user, error } = await login(email, password);
      if (error) throw error;
      if (!user) throw new Error("Login failed");
      setPage(getDashboardForRole(user.role));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#020617] overflow-hidden font-sans selection:bg-sky-500/30">
      {/* Left Panel: Cinematic Brand Section */}
      <div className="hidden lg:flex w-[55%] relative flex-col p-16 overflow-hidden">
        {/* Animated Background Layers */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070')] bg-cover bg-center opacity-40 scale-105 animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e]/90 via-[#020617]/95 to-transparent border-r border-white/5" />

        {/* Mesh Gradient Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px]" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-20 animate-fade-in">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-500 p-3 rounded-2xl shadow-lg shadow-indigo-500/20 border border-white/10 group">
              <Cpu size={32} className="text-white transform group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold tracking-tighter text-white">CORTEX<span className="text-indigo-500">BUILD</span></span>
              <span className="text-[10px] font-bold tracking-[0.3em] text-indigo-400/80 uppercase -mt-1 ml-1">AI Intelligence Platform</span>
            </div>
          </div>

          <div className="max-w-xl space-y-8">
            <h2 className="text-6xl font-bold leading-[1.1] text-white tracking-tight animate-slide-up">
              Build the future with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-300">Intelligent</span> automation.
            </h2>


            <p className="text-xl text-zinc-400 leading-relaxed font-light animate-fade-in delay-200">
              The only platform that fuses field execution with Gemini AI to predict risks before they happen.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-10 animate-fade-in delay-500">
              {[
                { icon: Sparkles, label: 'Gemini AI Insights', color: 'text-amber-400' },
                { icon: Globe, label: 'Global Fleet Sync', color: 'text-sky-400' },
                { icon: Zap, label: 'Predictive Safety', color: 'text-emerald-400' },
                { icon: Cpu, label: 'BIM Automation', color: 'text-indigo-400' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-default">
                  <item.icon className={`${item.color}`} size={20} />
                  <span className="text-sm font-semibold text-zinc-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center gap-6 animate-fade-in delay-700">
            <div className="flex -space-x-3">
              {[15, 18, 22, 25].map(i => (
                <img key={i} src={`https://i.pravatar.cc/100?img=${i}`} className="w-12 h-12 rounded-full border-2 border-[#020617] ring-1 ring-white/10" alt="Active user" />
              ))}
              <div className="w-12 h-12 rounded-full border-2 border-[#020617] ring-1 ring-white/10 bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">+2.4k</div>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <p className="text-sm text-zinc-500 font-medium">Powering enterprise construction teams worldwide.</p>
          </div>
        </div>
      </div>

      {/* Right Panel: Sleek Login Section */}
      <div className="flex-1 flex flex-col justify-center p-8 lg:p-24 bg-[#020617] relative">
        {/* Mobile Background Accent */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#0c4a6e]/20 to-transparent" />

        <div className="max-w-md w-full mx-auto relative z-10">
          <div className="lg:hidden mb-12 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl"><Cpu size={20} className="text-white" /></div>
            <span className="text-2xl font-bold text-white tracking-tighter">CORTEX<span className="text-indigo-500">BUILD</span></span>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">System Access</h1>
            <p className="text-zinc-500 font-medium italic">Secure entry required for platform access.</p>
          </div>

          {isSupabaseConnected ? (
            <form onSubmit={handleSupabaseLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-sky-400 transition-colors">Digital Identity</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-sky-400 transition-colors" size={20} />
                    <input
                      type="email"
                      placeholder="name@buildcorp.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xi text-white placeholder-zinc-600 focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-sky-400 transition-colors">Access Key</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-sky-400 transition-colors" size={20} />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-shake">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 text-white py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] shadow-lg shadow-sky-500/20 flex items-center justify-center gap-3 overflow-hidden relative"
              >
                {isLoading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10 uppercase tracking-widest">Authorize Access</span>
                    <Sparkles size={18} className="relative z-10 group-hover:rotate-12 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-sm py-2">
                <label className="flex items-center gap-3 cursor-pointer group text-zinc-500 hover:text-white transition-colors">
                  <input type="checkbox" className="w-5 h-5 rounded-lg bg-zinc-900 border-zinc-800 text-sky-500 focus:ring-sky-500/20" />
                  Keep me authorized
                </label>
                <a href="#" className="text-sky-500 hover:text-sky-400 font-semibold transition-colors">Lost Access?</a>
              </div>
            </form>
          ) : (
            <div className="bg-amber-500/10 text-amber-500 p-6 rounded-3xl border border-amber-500/20 text-sm italic">
              Hardware verification failed. Supabase connection required.
            </div>
          )}

          <div className="mt-20 pt-10 border-t border-zinc-900">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                <span className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full"><Shield size={12} className="text-emerald-500" /> SOC2 COMPLIANT</span>
                <span className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">AES-256</span>
              </div>
              <div className="flex gap-8 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <a href="#" className="hover:text-sky-400 transition-colors">Legal</a>
                <a href="#" className="hover:text-sky-400 transition-colors">Privacy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
