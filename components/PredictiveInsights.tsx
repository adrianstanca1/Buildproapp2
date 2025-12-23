import React, { useEffect, useState } from 'react';
import { useProjects } from '../contexts/ProjectContext.js';
import { AlertTriangle, TrendingUp, Clock, Info, Loader2, CheckCircle2 } from 'lucide-react';

interface PredictiveInsightsProps {
    projectId: string;
}

const PredictiveInsights: React.FC<PredictiveInsightsProps> = ({ projectId }) => {
    const { getPredictiveAnalysis } = useProjects();
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            setLoading(true);
            try {
                const data = await getPredictiveAnalysis(projectId);
                setAnalysis(data);
            } catch (err) {
                console.error("Failed to fetch predictive analysis", err);
            } finally {
                setLoading(false);
            }
        };
        if (projectId) fetchAnalysis();
    }, [projectId, getPredictiveAnalysis]);

    if (loading) return (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 flex items-center justify-center min-h-[200px]">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm text-zinc-500 font-medium">AI Analyzing Project History...</p>
            </div>
        </div>
    );

    if (!analysis) return null;

    const getStatusColor = (prob: number) => {
        if (prob < 30) return 'text-green-600 bg-green-50 border-green-100';
        if (prob < 60) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-red-600 bg-red-50 border-red-100';
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-zinc-800">AI Predictive Insights</h3>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(analysis.delayProbability)}`}>
                    {analysis.delayProbability}% Delay Prob.
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${analysis.delayProbability > 60 ? 'bg-red-50' : 'bg-blue-50'}`}>
                        <Clock className={`w-6 h-6 ${analysis.delayProbability > 60 ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Forecasted Delay</p>
                        <p className="text-2xl font-bold text-zinc-900">{analysis.predictedDelayDays} Days</p>
                    </div>
                </div>

                <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-500 uppercase">AI Reasoning</span>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed italic">
                        "{analysis.reasoning}"
                    </p>
                </div>

                {analysis.riskFactors && analysis.riskFactors.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-zinc-500 uppercase px-1">Critical Risk Factors</p>
                        <div className="flex flex-wrap gap-2">
                            {analysis.riskFactors.map((factor: string, i: number) => (
                                <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 shadow-sm">
                                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                                    {factor}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="px-4 py-3 bg-zinc-50/30 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-medium">Analyzed: {new Date(analysis.analyzedAt).toLocaleString()}</span>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                    Full Report <CheckCircle2 className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

export default PredictiveInsights;
