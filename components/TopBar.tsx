
import React, { useState, useEffect } from 'react';
import { Search, Bell, WifiOff, AlertOctagon, X, Siren, Send, Wifi, Loader2, Menu } from 'lucide-react';
import { Page } from '@/types';
import { offlineQueue } from '../services/offlineQueue';
import { useToast } from '../contexts/ToastContext';
import { TenantSelector } from './TenantSelector';
import { useTenant } from '../contexts/TenantContext';
import { useProjects } from '../contexts/ProjectContext';
import { useNotifications } from '../contexts/NotificationContext';
import { searchService, SearchResult } from '../services/SearchService';

interface TopBarProps {
  setPage: (page: Page) => void;
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ setPage, onMenuClick }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSOS, setShowSOS] = useState(false);
  const [sosMessage, setSosMessage] = useState('');
  const [sosSent, setSosSent] = useState(false);
  const { addToast } = useToast();
  const { tenant } = useTenant();
  const { projects, tasks, teamMembers, defects, safetyIncidents } = useProjects();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const notificationRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    // Debounce search would be better, but for now simple trigger
    const results = await searchService.semanticSearch(query, {
      projects,
      tasks,
      team: teamMembers,
      defects,
      safety: safetyIncidents
    });

    setSearchResults(results);
    setIsSearching(false);
  };

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); offlineQueue.processQueue(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    setSosSent(true);
    // In a real app, this would send to an endpoint immediately or queue it with high priority
    setTimeout(() => {
      setSosSent(false);
      setShowSOS(false);
      setSosMessage('');
      addToast("EMERGENCY ALERT: Site Safety Team and Emergency Services Notified.", "error");
    }, 2000);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-zinc-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 gap-4">

        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
        >
          <Menu size={24} />
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-xl md:w-96" ref={searchRef}>
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-zinc-400'}`} size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-400"
          />

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in slide-in-from-top-2">
              <div className="p-2 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">AI Search Results</span>
                {isSearching && <Loader2 size={12} className="text-blue-500 animate-spin" />}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {isSearching && searchResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-zinc-500">AI is analyzing project data...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-zinc-50">
                    {searchResults.map((result, idx) => (
                      <button
                        key={`${result.id}-${idx}`}
                        onClick={() => {
                          setPage(result.page);
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-3 hover:bg-zinc-50 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                            {result.title}
                          </p>
                          <p className="text-[11px] text-zinc-500">{result.subtitle}</p>
                          <p className="text-[9px] text-blue-500 mt-0.5 bg-blue-50 w-fit px-1.5 py-0.5 rounded italic">"{result.relevance}"</p>
                        </div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase bg-zinc-100 px-1.5 py-0.5 rounded">
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-zinc-400 text-xs">
                    No matching results found across projects, tasks, or safety logs.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {!isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold animate-pulse border border-orange-200">
              <WifiOff size={14} /> OFFLINE MODE
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Wifi size={14} className="text-green-500" /> Connected
            </div>
          )}

          <button
            onClick={() => setShowSOS(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 shadow-sm transition-colors animate-pulse"
          >
            <AlertOctagon size={16} /> SOS
          </button>

          <div className="h-6 w-px bg-zinc-200 mx-2" />

          <div className="hidden lg:block">
            <TenantSelector />
          </div>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowResults(false);
              }}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-full transition-all relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-zinc-200 rounded-[2rem] shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 flex flex-col max-h-[500px]">
                <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Notification Hub</h3>
                  <button onClick={markAllAsRead} className="text-[10px] font-bold text-blue-600 hover:text-blue-700">Mark all read</button>
                </div>
                <div className="overflow-y-auto divide-y divide-zinc-50 custom-scrollbar flex-1">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-5 flex gap-4 transition-colors cursor-pointer group ${n.read ? 'bg-white' : 'bg-blue-50/30'}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-zinc-200' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                        <div className="flex-1">
                          <p className={`text-sm font-bold leading-tight ${n.read ? 'text-zinc-600' : 'text-zinc-900'}`}>{n.title}</p>
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-zinc-400 font-bold mt-2 uppercase">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {n.type === 'ai' && (
                          <div className="p-1 px-2 bg-blue-100 text-blue-600 rounded text-[8px] font-black h-fit uppercase">AI</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center">
                      <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                        <Bell size={24} className="text-zinc-300" />
                      </div>
                      <p className="text-sm font-bold text-zinc-400">All caught up!</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-4 text-center text-[10px] font-black text-zinc-400 hover:text-red-500 uppercase tracking-widest border-t border-zinc-50 bg-white"
                  >
                    Clear History
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setPage(Page.PROFILE)}
            className="flex items-center gap-3 pl-2 border-l border-zinc-200 hover:bg-zinc-50 py-1 pr-2 rounded transition-colors"
          >
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm`}>
              {tenant?.name?.substring(0, 2).toUpperCase() || 'JA'}
            </div>
            <div className="text-left hidden xl:block">
              <div className="text-sm font-semibold text-zinc-900">John Anderson</div>
              <div className="text-xs text-zinc-500">{tenant?.plan} Admin</div>
            </div>
          </button>
        </div>
      </header>

      {/* Emergency Modal */}
      {showSOS && (
        <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border-4 border-red-500 animate-in zoom-in-95">
            <div className="bg-red-600 p-6 text-white flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3"><Siren size={32} className="animate-bounce" /> EMERGENCY ALERT</h2>
                <p className="text-red-100 mt-1 text-sm">This will trigger high-priority notifications to all staff and emergency services.</p>
              </div>
              <button onClick={() => setShowSOS(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-8">
              {sosSent ? (
                <div className="text-center py-8">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send size={48} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Alert Broadcasted</h3>
                  <p className="text-zinc-500 mt-2">Emergency protocols initiated. Stay calm and follow safety procedures.</p>
                </div>
              ) : (
                <form onSubmit={handleEmergency} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase">Nature of Emergency</label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {['Medical Emergency', 'Fire / Explosion', 'Structural Collapse', 'Hazardous Spill'].map(type => (
                        <button
                          type="button"
                          key={type}
                          onClick={() => setSosMessage(type)}
                          className={`p-3 rounded-xl border text-sm font-bold transition-all ${sosMessage === type ? 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-200' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="w-full p-4 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
                      placeholder="Additional details (Location, number of people involved...)"
                      rows={3}
                      value={sosMessage}
                      onChange={e => setSosMessage(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Siren size={24} /> BROADCAST ALERT
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
