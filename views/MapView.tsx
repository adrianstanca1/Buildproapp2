import React, { useState } from 'react';
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut, Filter, Clock, DollarSign, Users, AlertCircle, Eye, EyeOff, Search, X } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  status: 'Active' | 'Completed' | 'Delayed' | 'Planning';
  color: string;
  manager: string;
  progress: number;
  budget: number;
  spent: number;
  team: number;
  startDate: string;
  endDate: string;
  risk: 'Low' | 'Medium' | 'High';
}

const MapView: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>(['Active', 'Delayed', 'Planning', 'Completed']);
  const [filterRisk, setFilterRisk] = useState<string[]>(['Low', 'Medium', 'High']);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);

  const projects: Project[] = [
    {
      id: 'p1',
      name: 'City Centre Plaza',
      lat: 40.7128,
      lng: -74.0060,
      address: '250 Park Avenue, New York, NY 10169',
      status: 'Active',
      color: 'text-[#0f5c82]',
      manager: 'Mike Thompson',
      progress: 74,
      budget: 2500000,
      spent: 1850000,
      team: 24,
      startDate: '2024-01-15',
      endDate: '2025-08-30',
      risk: 'Low'
    },
    {
      id: 'p2',
      name: 'Residential Complex',
      lat: 40.7580,
      lng: -73.9855,
      address: '100 Central Park South, New York, NY 10019',
      status: 'Active',
      color: 'text-green-600',
      manager: 'Sarah Mitchell',
      progress: 92,
      budget: 4200000,
      spent: 3864000,
      team: 38,
      startDate: '2023-06-01',
      endDate: '2025-03-15',
      risk: 'Low'
    },
    {
      id: 'p3',
      name: 'Highway Bridge Extension',
      lat: 40.6892,
      lng: -73.9760,
      address: 'Brooklyn-Queens Expressway, Brooklyn, NY',
      status: 'Delayed',
      color: 'text-orange-500',
      manager: 'David Chen',
      progress: 45,
      budget: 5800000,
      spent: 2610000,
      team: 42,
      startDate: '2024-03-01',
      endDate: '2026-02-28',
      risk: 'High'
    },
    {
      id: 'p4',
      name: 'Logistics Hub',
      lat: 40.7282,
      lng: -74.0076,
      address: '789 Industrial Boulevard, Jersey City, NJ 07310',
      status: 'Planning',
      color: 'text-zinc-500',
      manager: 'John Anderson',
      progress: 10,
      budget: 3200000,
      spent: 320000,
      team: 8,
      startDate: '2025-01-15',
      endDate: '2026-12-15',
      risk: 'Medium'
    },
    {
      id: 'p5',
      name: 'Retail Shopping Center',
      lat: 40.7489,
      lng: -73.9680,
      address: '555 Fifth Avenue, New York, NY 10017',
      status: 'Active',
      color: 'text-blue-600',
      manager: 'Emma Wilson',
      progress: 58,
      budget: 1800000,
      spent: 1044000,
      team: 16,
      startDate: '2024-05-01',
      endDate: '2025-10-30',
      risk: 'Low'
    },
    {
      id: 'p6',
      name: 'Office Building Renovation',
      lat: 40.7614,
      lng: -73.9776,
      address: '350 Hudson Street, New York, NY 10014',
      status: 'Completed',
      color: 'text-emerald-600',
      manager: 'Robert Martinez',
      progress: 100,
      budget: 2100000,
      spent: 2100000,
      team: 20,
      startDate: '2023-08-01',
      endDate: '2024-11-30',
      risk: 'Low'
    }
  ];

  const filteredProjects = projects.filter(p => {
    const matchesStatus = filterStatus.includes(p.status);
    const matchesRisk = filterRisk.includes(p.risk);
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesRisk && matchesSearch;
  });

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  const toggleFilterStatus = (status: string) => {
    setFilterStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleFilterRisk = (risk: string) => {
    setFilterRisk(prev =>
      prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Delayed': return 'bg-red-100 text-red-700';
      default: return 'bg-zinc-100 text-zinc-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-orange-100 text-orange-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shadow-sm z-10">
        <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Navigation size={20} className="text-[#0f5c82]" /> Project Map
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            <Layers size={16} /> {mapType === 'standard' ? 'Satellite' : 'Standard'}
          </button>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            <Filter size={16} /> Filter ({filteredProjects.length})
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filter Sidebar */}
        {filterOpen && (
          <div className="w-80 bg-white border-r border-zinc-200 overflow-y-auto p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900">Filters & Search</h3>
              <button onClick={() => setFilterOpen(false)} className="p-1 hover:bg-zinc-100 rounded">
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-900 mb-2">Search Projects</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Project, manager, address..."
                  className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f5c82]"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-zinc-900 mb-3">Status</h4>
              <div className="space-y-2">
                {['Active', 'Completed', 'Delayed', 'Planning'].map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterStatus.includes(status)}
                      onChange={() => toggleFilterStatus(status)}
                      className="w-4 h-4 rounded border-zinc-300"
                    />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Risk Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-zinc-900 mb-3">Risk Level</h4>
              <div className="space-y-2">
                {['Low', 'Medium', 'High'].map(risk => (
                  <label key={risk} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterRisk.includes(risk)}
                      onChange={() => toggleFilterRisk(risk)}
                      className="w-4 h-4 rounded border-zinc-300"
                    />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(risk)}`}>
                      {risk} Risk
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Projects List */}
            <div className="border-t border-zinc-200 pt-4">
              <h4 className="text-sm font-medium text-zinc-900 mb-3">Projects</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProject(p.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedProject === p.id
                        ? 'border-[#0f5c82] bg-[#f0f9ff]'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-zinc-900 text-sm">{p.name}</p>
                        <p className="text-xs text-zinc-600 mt-1">{p.manager}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-zinc-600">
                      <div className="flex justify-between mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{p.progress}%</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-1 rounded-full">
                        <div
                          className="h-full bg-[#0f5c82] rounded-full"
                          style={{ width: `${p.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden">
          {/* Map Background */}
          <div
            className={`absolute inset-0 ${
              mapType === 'satellite'
                ? 'bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500'
                : 'bg-gradient-to-br from-blue-50 to-cyan-50'
            }`}
            style={{
              backgroundImage:
                mapType === 'satellite'
                  ? 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                  : 'none',
            }}
          >
            {/* SVG Map Features */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" stroke="currentColor">
              {mapType === 'standard' && (
                <>
                  <path
                    d="M0,300 Q300,250 600,200 T1200,300"
                    stroke="#bfdbfe"
                    strokeWidth="20"
                    opacity="0.5"
                  />
                  <path
                    d="M800,0 Q750,300 900,600"
                    stroke="#93c5fd"
                    strokeWidth="15"
                    opacity="0.5"
                  />
                  <circle cx="40%" cy="35%" r="100" fill="white" fillOpacity="0.15" />
                  <circle cx="70%" cy="60%" r="120" fill="white" fillOpacity="0.1" />
                </>
              )}
            </svg>
          </div>

          {/* Map Controls */}
          <div className="absolute right-6 bottom-6 flex flex-col gap-2 z-20">
            <button
              onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
              className="p-2 bg-white rounded-lg shadow-md text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom - 0.2, 1))}
              className="p-2 bg-white rounded-lg shadow-md text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <ZoomOut size={20} />
            </button>
          </div>

          {/* Project Pins */}
          {filteredProjects.map(p => {
            const xPercent = ((p.lng + 74) / 0.5) % 100;
            const yPercent = ((p.lat - 40) / 0.15) % 100;

            return (
              <div
                key={p.id}
                className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group"
                style={{
                  top: `${40 + yPercent}%`,
                  left: `${40 + xPercent}%`,
                  transform: `translate(-50%, -100%) scale(${1 + (selectedProject === p.id ? 0.3 : 0)})`
                }}
                onClick={() => setSelectedProject(p.id === selectedProject ? null : p.id)}
              >
                <div className="relative">
                  <MapPin
                    size={48}
                    className={`${p.color} drop-shadow-lg transition-transform group-hover:scale-110`}
                    fill="currentColor"
                    stroke="white"
                    strokeWidth={2}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xs font-bold drop-shadow">{p.progress}%</span>
                  </div>
                </div>

                {/* Detailed Info Card */}
                {selectedProject === p.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-white rounded-xl shadow-2xl border border-zinc-100 p-5 z-30">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-zinc-900">{p.name}</h3>
                        <p className="text-xs text-zinc-600 mt-1">{p.address}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-xs text-blue-600 font-medium">Budget</p>
                        <p className="text-sm font-bold text-zinc-900">${(p.budget / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded">
                        <p className="text-xs text-orange-600 font-medium">Spent</p>
                        <p className="text-sm font-bold text-zinc-900">${(p.spent / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded">
                        <p className="text-xs text-purple-600 font-medium">Team</p>
                        <p className="text-sm font-bold text-zinc-900">{p.team} people</p>
                      </div>
                      <div className={`p-2 rounded ${getRiskColor(p.risk)}`}>
                        <p className="text-xs font-medium">Risk</p>
                        <p className="text-sm font-bold">{p.risk}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex items-center gap-2 text-zinc-600">
                        <Users size={14} />
                        <span>{p.manager}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-600">
                        <Clock size={14} />
                        <span>{p.startDate} to {p.endDate}</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span className="font-bold">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 h-2 rounded-full">
                          <div
                            className={`h-full rounded-full ${
                              p.status === 'Delayed' ? 'bg-red-500' : 'bg-[#0f5c82]'
                            }`}
                            style={{ width: `${p.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-2 bg-[#0f5c82] hover:bg-[#0a4563] text-white text-xs font-medium rounded-lg transition-colors">
                      View Details
                    </button>

                    <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45 border-b border-r border-zinc-200"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MapView;