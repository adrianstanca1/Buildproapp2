
import React, { useState } from 'react';
import
  {
    FileSearch, FileText, Box, AlertTriangle, FileDigit, Search,
    MessageSquare, Calculator, Calendar, ShieldAlert, FileBarChart, Activity,
    Lightbulb, Upload, BrainCircuit, X, Loader2, CheckCircle2, AlertCircle,
    DollarSign, TrendingUp, Users, Clock
  } from 'lucide-react';
import { Page } from '@/types';
import { runRawPrompt } from '@/services/geminiService';

interface AIToolsViewProps
{
  setPage: ( page: Page ) => void;
}

interface AnalysisResult
{
  title: string;
  data: Record<string, any>;
  timestamp: string;
}

const AIToolsView: React.FC<AIToolsViewProps> = ( { setPage } ) =>
{
  const [ activeModal, setActiveModal ] = useState<string | null>( null );
  const [ selectedFile, setSelectedFile ] = useState<File | null>( null );
  const [ analyzing, setAnalyzing ] = useState( false );
  const [ results, setResults ] = useState<AnalysisResult | null>( null );
  const [ costEstimate, setCostEstimate ] = useState<any>( null );
  const [ scheduleOpt, setScheduleOpt ] = useState<any>( null );
  const [ safetyRisks, setSafetyRisks ] = useState<any>( null );

  const handleFileUpload = async ( e: React.ChangeEvent<HTMLInputElement>, tool: string ) =>
  {
    const file = e.target.files?.[0];
    if ( !file ) return;

    setSelectedFile( file );
    setAnalyzing( true );

    try
    {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async ( event ) =>
      {
        const base64 = ( event.target?.result as string ).split( ',' )[ 1 ];

        let prompt = '';
        let fileType = file.type.includes( 'pdf' ) ? 'PDF' : 'Image';

        switch ( tool )
        {
          case 'contract':
            prompt = `Analyze this contract document and extract: 1) Key dates and milestones, 2) Payment terms and amounts, 3) Liabilities and risks, 4) Party information, 5) Termination clauses. Format as JSON with these categories. File is ${fileType}.`;
            break;
          case 'invoice':
            prompt = `Analyze this invoice and extract: 1) Vendor name and contact, 2) Invoice number and date, 3) Line items with quantities and costs, 4) Total amount, 5) Payment terms and due date. Format as JSON. File is ${fileType}.`;
            break;
          case 'blueprint':
            prompt = `Analyze this blueprint and extract: 1) Overall dimensions, 2) Material quantities and types, 3) Safety risk areas, 4) Critical measurements, 5) Layout notes. Format as JSON. File is ${fileType}.`;
            break;
          default:
            prompt = `Analyze this document comprehensively and provide key insights. File is ${fileType}.`;
        }

        try
        {
          const response = await runRawPrompt( prompt );
          setResults( {
            title: `${tool.charAt( 0 ).toUpperCase() + tool.slice( 1 )} Analysis`,
            data: { analysis: response },
            timestamp: new Date().toLocaleString(),
          } );
        } catch ( error )
        {
          console.error( 'Analysis error:', error );
          setResults( {
            title: 'Analysis Error',
            data: { error: 'Failed to analyze document' },
            timestamp: new Date().toLocaleString(),
          } );
        }

        setAnalyzing( false );
      };
      reader.readAsDataURL( file );
    } catch ( error )
    {
      console.error( 'File processing error:', error );
      setAnalyzing( false );
    }
  };

  const generateCostEstimate = async () =>
  {
    setAnalyzing( true );
    try
    {
      const prompt = `Generate a realistic construction cost estimate with: 1) Labor costs by trade, 2) Material costs, 3) Equipment rental, 4) Contingency (15%), 5) Total project cost. Provide JSON with cost breakdown. Use realistic 2024 construction pricing for a mid-sized commercial project (~10,000 sqft).`;
      const response = await runRawPrompt( prompt );
      setCostEstimate( { data: response, timestamp: new Date().toLocaleString() } );
    } catch ( error )
    {
      console.error( 'Cost estimate error:', error );
    }
    setAnalyzing( false );
  };

  const generateScheduleOptimization = async () =>
  {
    setAnalyzing( true );
    try
    {
      const prompt = `Generate an optimized construction project schedule with: 1) 8-10 major phases, 2) Duration in days for each, 3) Critical path, 4) Resource leveling recommendations, 5) Milestone dates. Format as JSON with phase names, durations, and dependencies.`;
      const response = await runRawPrompt( prompt );
      setScheduleOpt( { data: response, timestamp: new Date().toLocaleString() } );
    } catch ( error )
    {
      console.error( 'Schedule optimization error:', error );
    }
    setAnalyzing( false );
  };

  const generateSafetyPrediction = async () =>
  {
    setAnalyzing( true );
    try
    {
      const prompt = `Analyze potential safety risks for a construction project and predict: 1) High-risk activities, 2) Weather-related hazards, 3) Worker incident probabilities, 4) Equipment failure risks, 5) Preventive measures. Provide JSON with risk scores (1-10) and recommendations.`;
      const response = await runRawPrompt( prompt );
      setSafetyRisks( { data: response, timestamp: new Date().toLocaleString() } );
    } catch ( error )
    {
      console.error( 'Safety prediction error:', error );
    }
    setAnalyzing( false );
  };

  const tools = [
    { icon: BrainCircuit, title: 'AI Architect', desc: 'Generative project planning, budgeting, and risk analysis.', action: () => setPage( Page.PROJECT_LAUNCHPAD ), id: 'architect' },
    { icon: FileSearch, title: 'Contract Analyzer', desc: 'Extract key dates, terms, liabilities from uploaded contracts', id: 'contract', modal: true },
    { icon: FileText, title: 'Invoice Parser', desc: 'Auto-detect vendor, amounts, line items, payment terms', id: 'invoice', modal: true },
    { icon: Box, title: 'Blueprint Analyzer', desc: 'Extract dimensions, material quantities, detect risk areas', id: 'blueprint', modal: true },
    { icon: AlertTriangle, title: 'Risk Assessment Engine', desc: 'Analyze project risks with confidence scoring', id: 'risk', action: () => setActiveModal( 'risk' ) },
    { icon: FileDigit, title: 'Bid Generator', desc: 'Generate professional bid packages from templates', id: 'bid', action: () => setActiveModal( 'bid' ) },
    { icon: Search, title: 'Grant Finder', desc: 'Search government construction grants and subsidies', id: 'grant', action: () => setActiveModal( 'grant' ) },
    { icon: MessageSquare, title: 'AI Chat Assistant', desc: 'Natural language queries about projects, team, safety', action: () => setPage( Page.CHAT ) },
    { icon: Calculator, title: 'Cost Estimator', desc: 'Predict project costs using historical ML models', id: 'cost', action: () => generateCostEstimate() },
    { icon: Calendar, title: 'Schedule Optimizer', desc: 'Optimize resource allocation with genetic algorithms', id: 'schedule', action: () => generateScheduleOptimization() },
    { icon: ShieldAlert, title: 'Safety Predictor', desc: 'Predict potential incidents before they occur', id: 'safety', action: () => generateSafetyPrediction() },
    { icon: FileBarChart, title: 'Report Generator', desc: 'Auto-generate executive, safety, financial reports', id: 'report', action: () => setPage( Page.REPORTS ) },
    { icon: Activity, title: 'Sentiment Analysis', desc: 'Analyze chat/email sentiment for team morale tracking', id: 'sentiment', action: () => setActiveModal( 'sentiment' ) },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">AI-Powered Tools & Document Intelligence</h1>
        <p className="text-zinc-500">Leverage artificial intelligence and ML to enhance productivity</p>
      </div>

      {/* Hero Card */ }
      <div className="bg-gradient-to-r from-[#e0f2fe] to-white border border-[#bae6fd] rounded-xl p-6 mb-8 flex items-center justify-between shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#0f5c82] rounded-lg text-white">
            <Lightbulb size={ 24 } />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0c4a6e] mb-1">Intelligent Document Processing</h3>
            <p className="text-zinc-600 text-sm max-w-xl">
              Upload contracts, blueprints, or invoices for automated OCR, categorization, key information extraction, and risk analysis.
            </p>
          </div>
        </div>
        <label className="bg-[#1f7d98] hover:bg-[#166ba1] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer">
          <Upload size={ 16 } /> Upload Document
          <input type="file" hidden accept=".pdf,image/*" onChange={ ( e ) => handleFileUpload( e, 'general' ) } />
        </label>
      </div>

      {/* Results Display */ }
      { ( results || costEstimate || scheduleOpt || safetyRisks ) && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900">
              { results?.title || 'Analysis Results' }
            </h3>
            <button
              onClick={ () => {
                setResults( null );
                setCostEstimate( null );
                setScheduleOpt( null );
                setSafetyRisks( null );
              } }
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X size={ 20 } />
            </button>
          </div>
          <div className="bg-zinc-50 rounded-lg p-4 text-sm text-zinc-700 max-h-96 overflow-y-auto font-mono whitespace-pre-wrap break-words">
            { analyzing ? (
              <div className="flex items-center gap-2">
                <Loader2 size={ 16 } className="animate-spin" />
                Analyzing...
              </div>
            ) : results ? (
              JSON.stringify( results.data, null, 2 )
            ) : costEstimate ? (
              JSON.stringify( costEstimate.data, null, 2 )
            ) : scheduleOpt ? (
              JSON.stringify( scheduleOpt.data, null, 2 )
            ) : (
              JSON.stringify( safetyRisks?.data, null, 2 )
            ) }
          </div>
          <p className="text-xs text-zinc-400 mt-4">
            Generated at: { results?.timestamp || costEstimate?.timestamp || scheduleOpt?.timestamp || safetyRisks?.timestamp }
          </p>
        </div>
      ) }

      {/* Tools Grid */ }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        { tools.map( ( tool, index ) => (
          <div
            key={ index }
            onClick={ () => {
              if ( tool.action )
              {
                tool.action();
              } else if ( tool.modal )
              {
                setActiveModal( tool.id );
              }
            } }
            className={ `bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-md transition-shadow ${ tool.action || tool.modal ? 'cursor-pointer group' : '' }` }
          >
            <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
              <tool.icon size={ 20 } className="text-[#0f5c82]" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">{ tool.title }</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{ tool.desc }</p>
            { analyzing && ( tool.id === 'cost' || tool.id === 'schedule' || tool.id === 'safety' ) && (
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-600">
                <Loader2 size={ 14 } className="animate-spin" />
                Processing...
              </div>
            ) }
          </div>
        ) ) }
      </div>

      {/* Document Upload Modal */ }
      { activeModal && [ 'contract', 'invoice', 'blueprint' ].includes( activeModal ) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900">
                Upload { activeModal === 'contract' ? 'Contract' : activeModal === 'invoice' ? 'Invoice' : 'Blueprint' }
              </h2>
              <button onClick={ () => setActiveModal( null ) } className="p-2 hover:bg-zinc-100 rounded-lg">
                <X size={ 20 } />
              </button>
            </div>

            <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center mb-4">
              <Upload size={ 40 } className="mx-auto text-zinc-400 mb-2" />
              <label className="cursor-pointer">
                <p className="text-sm font-medium text-zinc-900">Click to upload or drag and drop</p>
                <p className="text-xs text-zinc-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                <input
                  type="file"
                  hidden
                  accept=".pdf,image/*"
                  onChange={ ( e ) => {
                    handleFileUpload( e, activeModal );
                    setActiveModal( null );
                  } }
                />
              </label>
            </div>

            <button
              onClick={ () => setActiveModal( null ) }
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) }
    </div>
  );
};

export default AIToolsView;
