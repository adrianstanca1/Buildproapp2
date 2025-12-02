import React, { useState } from 'react';
import { Briefcase, Shield, List, DollarSign, Users, Wrench, Filter, Calculator, FileDown, Eye, X, Loader2, Download, Mail, Clock } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  lastModified: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'powerpoint';
  schedule?: string;
  lastRun?: string;
  nextRun?: string;
}

interface ReportTemplate {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
  id: string;
  metrics: string[];
}

const ReportsView = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel' | 'csv' | 'powerpoint'>('pdf');
  const [recipients, setRecipients] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [scheduleFrequency, setScheduleFrequency] = useState<string>('');
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);

  const templates: ReportTemplate[] = [
    {
      icon: Briefcase,
      title: 'Executive Summary',
      desc: 'Portfolio overview, KPIs, forecast',
      id: 'executive',
      metrics: ['Revenue', 'Profit Margin', 'Projects Active', 'Team Utilization', 'Budget Variance']
    },
    {
      icon: Shield,
      title: 'Safety Report',
      desc: 'Incidents, TRIFR, compliance status',
      id: 'safety',
      metrics: ['Total Incidents', 'TRIFR Rate', 'Near Misses', 'Safety Training Hours', 'Compliance Score']
    },
    {
      icon: List,
      title: 'Project Progress',
      desc: 'Timeline, budget, milestones',
      id: 'progress',
      metrics: ['On-Time Rate', 'Budget Variance', 'Milestones Completed', 'Critical Path', 'Resource Allocation']
    },
    {
      icon: DollarSign,
      title: 'Financial Closeout',
      desc: 'Cost breakdown, profit, variance',
      id: 'financial',
      metrics: ['Total Cost', 'Revenue', 'Gross Profit', 'Cost Variance', 'Unbilled Amount']
    },
    {
      icon: Users,
      title: 'Team Performance',
      desc: 'KPIs, utilization, productivity',
      id: 'team',
      metrics: ['Utilization Rate', 'Productivity Score', 'Training Completion', 'Turnover Rate', 'Certification Status']
    },
    {
      icon: Wrench,
      title: 'Equipment Utilization',
      desc: 'ROI, maintenance, availability',
      id: 'equipment',
      metrics: ['Availability', 'Utilization Rate', 'Maintenance Cost', 'Equipment ROI', 'Downtime']
    },
  ];

  const reports: Report[] = [
    {
      id: 'r1',
      name: 'Weekly Safety Summary',
      type: 'Safety Report',
      createdAt: '2025-11-01',
      lastModified: '2025-12-01',
      recipients: ['safety@buildpro.com', 'compliance@buildpro.com', 'ceo@buildpro.com'],
      format: 'pdf',
      schedule: 'Every Monday 8AM',
      lastRun: '2025-12-01',
      nextRun: '2025-12-08'
    },
    {
      id: 'r2',
      name: 'Monthly Financial',
      type: 'Financial Closeout',
      createdAt: '2025-10-01',
      lastModified: '2025-12-01',
      recipients: ['finance@buildpro.com', 'accounting@buildpro.com', 'cfo@buildpro.com', 'ceo@buildpro.com', 'investors@buildpro.com'],
      format: 'excel',
      schedule: '1st of month at 9AM',
      lastRun: '2025-12-01',
      nextRun: '2026-01-01'
    },
    {
      id: 'r3',
      name: 'Executive Dashboard',
      type: 'Executive Summary',
      createdAt: '2025-09-15',
      lastModified: '2025-11-28',
      recipients: ['ceo@buildpro.com', 'cfo@buildpro.com', 'coo@buildpro.com'],
      format: 'pdf',
      schedule: 'Weekly on Friday 5PM',
      lastRun: '2025-11-28',
      nextRun: '2025-12-05'
    }
  ];

  const filters = [
    'Date Range',
    'Project Type',
    'Location',
    'Team Member',
    'Budget Range',
    'Status',
    'Completion Percentage'
  ];

  const handleGenerateReport = async () => {
    if (!reportName || !selectedTemplate) {
      alert('Please enter a report name and select a template');
      return;
    }

    setGenerating(true);

    // Simulate report generation
    setTimeout(() => {
      const newReport: Report = {
        id: `r${Date.now()}`,
        name: reportName,
        type: templates.find(t => t.id === selectedTemplate)?.title || 'Report',
        createdAt: new Date().toLocaleString(),
        lastModified: new Date().toLocaleString(),
        recipients: recipients.split(',').map(r => r.trim()).filter(r => r),
        format: reportFormat,
        schedule: scheduleFrequency || undefined,
        lastRun: scheduleFrequency ? new Date().toLocaleString() : undefined,
        nextRun: scheduleFrequency ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString() : undefined
      };

      setGeneratedReport(newReport);
      setGenerating(false);
      setActiveModal('preview');
    }, 2500);
  };

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv' | 'powerpoint') => {
    if (!generatedReport) return;

    // Simulate file download
    const filename = `${generatedReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${
      format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : 'pptx'
    }`;

    const element = document.createElement('a');
    element.href = '#';
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert(`Report exported as ${filename}`);
  };

  const handleEmailReport = () => {
    if (!generatedReport) return;
    alert(`Report "${generatedReport.name}" will be emailed to:\n${generatedReport.recipients.join('\n')}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Custom Report Builder</h1>
        <p className="text-zinc-500">Generate professional reports, schedule delivery, export to multiple formats</p>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {templates.map((t) => (
          <div
            key={t.id}
            onClick={() => {
              setSelectedTemplate(t.id);
              setReportName('');
              setActiveModal('create');
            }}
            className={`bg-white border-2 p-6 rounded-xl hover:shadow-md transition-all cursor-pointer ${
              selectedTemplate === t.id ? 'border-[#0f5c82] bg-[#f0f9ff]' : 'border-zinc-200'
            }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
              selectedTemplate === t.id ? 'bg-[#0f5c82] text-white' : 'bg-zinc-100 text-zinc-700'
            }`}>
              <t.icon size={20} />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-1">{t.title}</h3>
            <p className="text-sm text-zinc-500 mb-3">{t.desc}</p>
            <div className="text-xs text-zinc-600 space-y-1">
              {t.metrics.slice(0, 3).map((metric) => (
                <div key={metric} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#0f5c82] rounded-full"></div>
                  {metric}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Generated Report Preview */}
      {generatedReport && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">{generatedReport.name}</h3>
              <p className="text-sm text-zinc-600">Generated: {generatedReport.createdAt}</p>
            </div>
            <button
              onClick={() => setGeneratedReport(null)}
              className="p-2 hover:bg-white rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4 border border-green-100">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#0f5c82]">1,245</p>
                <p className="text-xs text-zinc-600 mt-1">Records Processed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">$2.4M</p>
                <p className="text-xs text-zinc-600 mt-1">Total Value</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">87%</p>
                <p className="text-xs text-zinc-600 mt-1">Completion Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">24</p>
                <p className="text-xs text-zinc-600 mt-1">Pages</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleExportReport('pdf')}
              className="flex items-center gap-2 flex-1 px-4 py-2 bg-[#1f7d98] hover:bg-[#166ba1] text-white rounded-lg text-sm font-medium transition-colors">
              <FileDown size={16} /> Export as PDF
            </button>
            <button
              onClick={() => handleExportReport('excel')}
              className="flex items-center gap-2 flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Download size={16} /> Export as Excel
            </button>
            <button
              onClick={handleEmailReport}
              className="flex items-center gap-2 flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Mail size={16} /> Email Report
            </button>
          </div>
        </div>
      )}

      {/* Scheduled Reports */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="font-semibold text-zinc-800 mb-6">Scheduled Reports & Audit Trail</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-zinc-400 border-b border-zinc-100">
              <th className="pb-3 font-medium uppercase text-xs">Report Name</th>
              <th className="pb-3 font-medium uppercase text-xs">Type</th>
              <th className="pb-3 font-medium uppercase text-xs">Schedule</th>
              <th className="pb-3 font-medium uppercase text-xs">Recipients</th>
              <th className="pb-3 font-medium uppercase text-xs">Last Run</th>
              <th className="pb-3 font-medium uppercase text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-zinc-600">
            {reports.map((item) => (
              <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                <td className="py-4 text-zinc-800 font-medium">{item.name}</td>
                <td className="py-4">{item.type}</td>
                <td className="py-4 flex items-center gap-1">
                  <Clock size={14} className="text-amber-600" />
                  {item.schedule || 'One-time'}
                </td>
                <td className="py-4">
                  <span className="px-2 py-1 bg-zinc-100 rounded text-xs">{item.recipients.length} recipients</span>
                </td>
                <td className="py-4 text-xs">{item.lastRun}</td>
                <td className="py-4 text-right">
                  <button className="text-zinc-400 hover:text-[#0f5c82] transition-colors">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Report Modal */}
      {activeModal === 'create' && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-zinc-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Create New Report</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-zinc-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">Report Name</label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., Q4 Executive Summary"
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5c82]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">Export Format</label>
                <div className="grid grid-cols-4 gap-3">
                  {['pdf', 'excel', 'csv', 'powerpoint'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setReportFormat(fmt as any)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium capitalize text-sm transition-all ${
                        reportFormat === fmt
                          ? 'border-[#0f5c82] bg-[#f0f9ff] text-[#0f5c82]'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {fmt === 'powerpoint' ? 'PPT' : fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">Add Filters</label>
                <div className="grid grid-cols-2 gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() =>
                        setSelectedFilters(
                          selectedFilters.includes(filter)
                            ? selectedFilters.filter((f) => f !== filter)
                            : [...selectedFilters, filter]
                        )
                      }
                      className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                        selectedFilters.includes(filter)
                          ? 'border-[#0f5c82] bg-[#f0f9ff] text-[#0f5c82]'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">Email Recipients (comma-separated)</label>
                <input
                  type="text"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="e.g., ceo@buildpro.com, finance@buildpro.com"
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5c82]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">Schedule (Optional)</label>
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f5c82]"
                >
                  <option value="">No Schedule (One-time)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1f7d98] hover:bg-[#166ba1] disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <FileDown size={16} /> Generate Report
                    </>
                  )}
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {activeModal === 'preview' && generatedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-zinc-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Report Preview: {generatedReport.name}</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-zinc-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="border-b-2 border-zinc-200 pb-4">
                <h1 className="text-3xl font-bold text-zinc-900 mb-1">{generatedReport.name}</h1>
                <p className="text-zinc-600">Report Type: {generatedReport.type}</p>
                <p className="text-zinc-600">Generated: {generatedReport.createdAt}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">$2,450,000</p>
                  <p className="text-xs text-blue-600 mt-2">↑ 12% from last period</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Gross Profit</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">$612,500</p>
                  <p className="text-xs text-green-600 mt-2">25% margin</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                <h3 className="font-semibold text-zinc-900 mb-3">Key Metrics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Projects Completed</span>
                    <span className="text-lg font-semibold text-zinc-900">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">On-Time Delivery Rate</span>
                    <span className="text-lg font-semibold text-green-600">94%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Budget Variance</span>
                    <span className="text-lg font-semibold text-amber-600">2.3%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Team Utilization</span>
                    <span className="text-lg font-semibold text-blue-600">87%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleExportReport('pdf')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1f7d98] hover:bg-[#166ba1] text-white rounded-lg font-medium transition-colors">
                  <FileDown size={16} /> Download PDF
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg font-medium transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;