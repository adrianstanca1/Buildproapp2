import React, { useState } from 'react';
import { Calendar, Cloud, Users, FileText, Plus, Sun, CloudRain, Wind, Thermometer, Save } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { DailyLog } from '@/types';

const DailyLogsView: React.FC = () => {
    const { projects, addDailyLog } = useProjects();
    const { user } = useAuth();
    const { addToast } = useToast();

    // State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');

    // Form State (Mocked per project/day)
    const [weather, setWeather] = useState({ condition: 'Sunny', temp: '72°F', wind: '5mph' });
    const [crewCount, setCrewCount] = useState(15);
    const [notes, setNotes] = useState('');
    const [workPerformed, setWorkPerformed] = useState('');

    const handleSave = async () => {
        if (!selectedProject) {
            addToast("Please select a project", "error");
            return;
        }

        const log: DailyLog = {
            id: crypto.randomUUID(),
            projectId: selectedProject,
            date: selectedDate,
            weather: `${weather.condition}, ${weather.temp}, Wind ${weather.wind}`,
            crewCount,
            workPerformed,
            notes,
            author: user?.name || 'Unknown',
            createdAt: new Date().toISOString()
        };

        try {
            await addDailyLog(log);
            addToast("Daily Log saved successfully", "success");
            // Optional: reset form or keep it to verify persistence
        } catch (error) {
            console.error("Failed to save daily log", error);
            addToast("Failed to save daily log", "error");
        }
    };

    const project = projects.find(p => p.id === selectedProject);

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-zinc-50 font-sans text-zinc-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900">Daily Logs</h1>
                    <p className="text-zinc-500 mt-1">Site diary and progress tracking.</p>
                </div>

                <div className="flex gap-3 bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-zinc-50 border-none rounded-lg text-sm font-bold text-zinc-700 focus:ring-0"
                    />
                    <div className="w-px bg-zinc-200 my-1"></div>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="bg-zinc-50 border-none rounded-lg text-sm font-bold text-zinc-700 focus:ring-0 min-w-[200px]"
                    >
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Log Entry */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Weather Section */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Cloud size={24} />
                            </div>
                            <h2 className="text-xl font-bold">Site Conditions</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col items-center justify-center text-center gap-2">
                                <Sun className="text-amber-500" size={28} />
                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Condition</span>
                                <span className="text-lg font-bold text-zinc-800">{weather.condition}</span>
                            </div>
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col items-center justify-center text-center gap-2">
                                <Thermometer className="text-red-500" size={28} />
                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Temp</span>
                                <span className="text-lg font-bold text-zinc-800">{weather.temp}</span>
                            </div>
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col items-center justify-center text-center gap-2">
                                <Wind className="text-blue-500" size={28} />
                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Wind</span>
                                <span className="text-lg font-bold text-zinc-800">{weather.wind}</span>
                            </div>
                        </div>
                    </div>

                    {/* Work Performed */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <FileText size={24} />
                            </div>
                            <h2 className="text-xl font-bold">Work Performed</h2>
                        </div>

                        <textarea
                            value={workPerformed}
                            onChange={(e) => setWorkPerformed(e.target.value)}
                            placeholder="Describe work completed today, delays, and major events..."
                            className="w-full h-48 p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#0f5c82] focus:border-transparent outline-none resize-none"
                        />
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <FileText size={24} />
                            </div>
                            <h2 className="text-xl font-bold">Additional Notes</h2>
                        </div>

                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Deliveries, visitors, safety observations..."
                            className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#0f5c82] focus:border-transparent outline-none resize-none"
                        />
                    </div>

                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    {/* Crew Count */}
                    <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                <Users size={24} />
                            </div>
                            <h2 className="text-xl font-bold">Manpower</h2>
                        </div>

                        <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                            <span className="font-medium text-zinc-600">Site Personnel</span>
                            <input
                                type="number"
                                value={crewCount}
                                onChange={(e) => setCrewCount(parseInt(e.target.value))}
                                className="w-20 text-right bg-white border border-zinc-200 rounded-lg px-2 py-1 font-bold text-lg focus:ring-2 focus:ring-[#0f5c82]"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-gradient-to-br from-[#0f5c82] to-[#0c4a6e] rounded-3xl p-8 text-white shadow-xl">
                        <h3 className="text-xl font-bold mb-2">Log Completion</h3>
                        <p className="text-blue-100 text-sm mb-6">Ensure all sections are filled out before signing off.</p>

                        <button
                            onClick={handleSave}
                            className="w-full py-4 bg-white text-[#0f5c82] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                        >
                            <Save size={20} />
                            Save & Sign Log
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DailyLogsView;
