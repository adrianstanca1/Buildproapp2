
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Building, Save, Mail, Globe, MapPin, Settings as SettingsIcon, Upload, Loader2, CheckCircle } from 'lucide-react';
import { Company } from '@/types';

const CompanySettingsView: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // We would typically fetch this from /api/my-company
    const [company, setCompany] = useState<Partial<Company>>({
        name: '',
        plan: 'Starter',
        status: 'Active'
    });

    const [settings, setSettings] = useState({
        address: '',
        phone: '',
        website: '',
        primaryColor: '#0f5c82'
    });

    useEffect(() => {
        const fetchCompany = async () => {
            setIsLoading(true);
            try {
                // Mocking for UI build
                setCompany({
                    id: user?.companyId || 'c1',
                    name: 'My Construction Co',
                    plan: 'Business',
                    status: 'Active'
                });
                setSettings({
                    address: '123 Builder Lane, London',
                    phone: '+44 20 1234 5678',
                    website: 'www.myconstructionco.com',
                    primaryColor: '#0f5c82'
                });
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCompany();
    }, [user?.companyId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('sb-access-token');
            const response = await fetch('/api/my-company', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: company.name,
                    ...settings
                })
            });

            if (!response.ok) throw new Error('Failed to update company');

            addToast('Company settings updated successfully', 'success');
        } catch (error) {
            console.error(error);
            addToast('Failed to save settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                    <Building className="text-[#0f5c82]" /> Company Settings
                </h1>
                <p className="text-zinc-500">Manage your company profile, branding, and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col - General Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <SettingsIcon size={20} className="text-zinc-400" /> General Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    value={company.name}
                                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0f5c82] outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={settings.phone}
                                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0f5c82] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Website</label>
                                    <input
                                        type="text"
                                        value={settings.website}
                                        onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0f5c82] outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Address</label>
                                <textarea
                                    value={settings.address}
                                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0f5c82] outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Upload size={20} className="text-zinc-400" /> Branding
                        </h2>
                        <div className="flex items-start gap-6">
                            <div className="w-24 h-24 bg-zinc-100 rounded-xl flex items-center justify-center border-2 border-dashed border-zinc-300 relative group cursor-pointer hover:border-[#0f5c82] transition-colors">
                                <span className="text-xs text-zinc-500 font-medium z-10">Upload Logo</span>
                                {/* Mock upload */}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Primary Brand Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                        className="h-10 w-20 rounded cursor-pointer"
                                    />
                                    <span className="text-sm font-mono bg-zinc-50 px-2 py-1 rounded border border-zinc-200">{settings.primaryColor}</span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">This color will be used for buttons, links, and active states.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col - Subscription & Status */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-[#0f5c82] to-[#0c4a6e] rounded-xl shadow-lg p-6 text-white text-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <Building size={32} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-1">{company.name}</h3>
                        <p className="opacity-80 text-sm mb-4">Tenant ID: {company.id}</p>
                        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            <CheckCircle size={12} /> {company.plan} Plan
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                        <h3 className="font-bold text-zinc-900 mb-4">Plan Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Status</span>
                                <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">{company.status}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Max Users</span>
                                <span className="font-medium text-zinc-900">Unlimited</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Storage</span>
                                <span className="font-medium text-zinc-900">50GB / 100GB</span>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-2 border border-zinc-200 rounded-lg text-sm font-bold text-zinc-600 hover:bg-zinc-50">
                            Upgrade Plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 flex justify-end gap-3 z-40 md:pl-64">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0f5c82] text-white rounded-lg font-bold shadow-sm hover:bg-[#0c4a6e] disabled:opacity-70 transition-colors"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default CompanySettingsView;
