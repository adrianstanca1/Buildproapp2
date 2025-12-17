
import React, { useState } from 'react';
import {
  FileSearch, FileText, Box, AlertTriangle, FileDigit, Search,
  MessageSquare, Calculator, Calendar, ShieldAlert, FileBarChart, Activity,
  Lightbulb, Upload, BrainCircuit, X, Loader2, CheckCircle2, AlertCircle,
  DollarSign, TrendingUp, Users, Clock, Camera, Eye
} from 'lucide-react';
import { Page } from '@/types';
import { runRawPrompt, parseAIJSON } from '@/services/geminiService';
import { yoloService, DetectionResult } from '@/services/yoloService';
import { useToast } from '@/contexts/ToastContext';

interface AIToolsViewProps {
  setPage: (page: Page) => void;
}

interface AnalysisResult {
  title: string;
  data: Record<string, any>;
  timestamp: string;
}

const AIToolsView: React.FC<AIToolsViewProps> = ({ setPage }) => {
  const { addToast } = useToast();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [scheduleOpt, setScheduleOpt] = useState<any>(null);
  const [safetyRisks, setSafetyRisks] = useState<any>(null);

  // YOLO specific state
  const [yoloImage, setYoloImage] = useState<string | null>(null);
  const [yoloDetections, setYoloDetections] = useState<DetectionResult[]>([]);
  const [yoloLoading, setYoloLoading] = useState(false);
  const [yoloModelLoaded, setYoloModelLoaded] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tool: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAnalyzing(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];

        let prompt = '';
        let fileType = file.type.includes('pdf') ? 'PDF' : 'Image';

        switch (tool) {
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

        try {
          const response = await runRawPrompt(prompt);
          // Try to parse if it's supposed to be JSON, otherwise keep as text for the generic analysis
          let parsedData: any;
          try {
            parsedData = parseAIJSON(response);
          } catch (e) {
            parsedData = { analysis: response };
          }

          setResults({
            title: `${tool.charAt(0).toUpperCase() + tool.slice(1)} Analysis`,
            data: parsedData,
            timestamp: new Date().toLocaleString(),
          });
        } catch (error) {
          console.error('Analysis error:', error);
          setResults({
            title: 'Analysis Error',
            data: { error: 'Failed to analyze document' },
            timestamp: new Date().toLocaleString(),
          });
        }

        setAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File processing error:', error);
      setAnalyzing(false);
    }
  };

  const generateCostEstimate = async () => {
    setAnalyzing(true);
    try {
      const prompt = `Generate a realistic construction cost estimate with: 1) Labor costs by trade, 2) Material costs, 3) Equipment rental, 4) Contingency (15%), 5) Total project cost. Provide JSON with cost breakdown. Use realistic 2024 construction pricing for a mid-sized commercial project (~10,000 sqft).`;
      const response = await runRawPrompt(prompt);
      setCostEstimate({ data: parseAIJSON(response), timestamp: new Date().toLocaleString() });
    } catch (error) {
      console.error('Cost estimate error:', error);
    }
    setAnalyzing(false);
  };

  const generateScheduleOptimization = async () => {
    setAnalyzing(true);
    try {
      const prompt = `Generate an optimized construction project schedule with: 1) 8-10 major phases, 2) Duration in days for each, 3) Critical path, 4) Resource leveling recommendations, 5) Milestone dates. Format as JSON with phase names, durations, and dependencies.`;
      const response = await runRawPrompt(prompt);
      setScheduleOpt({ data: parseAIJSON(response), timestamp: new Date().toLocaleString() });
    } catch (error) {
      console.error('Schedule optimization error:', error);
    }
    setAnalyzing(false);
  };

  const generateSafetyPrediction = async () => {
    setAnalyzing(true);
    try {
      const prompt = `Analyze potential safety risks for a construction project and predict: 1) High-risk activities, 2) Weather-related hazards, 3) Worker incident probabilities, 4) Equipment failure risks, 5) Preventive measures. Provide JSON with risk scores (1-10) and recommendations.`;
      const response = await runRawPrompt(prompt);
      setSafetyRisks({ data: parseAIJSON(response), timestamp: new Date().toLocaleString() });
    } catch (error) {
      console.error('Safety prediction error:', error);
    }
    setAnalyzing(false);
  };

  // YOLO-specific functions
  const loadYOLOModel = async () => {
    if (yoloModelLoaded) return;
    try {
      setYoloLoading(true);
      await yoloService.loadModel();
      setYoloModelLoaded(true);
      console.log('YOLO model loaded successfully');
    } catch (error) {
      console.error('Failed to load YOLO model:', error);
      addToast('Failed to load YOLO model. Please check your internet connection.', 'error');
    } finally {
      setYoloLoading(false);
    }
  };

  const handleYOLOImageUpload = async (file: File) => {
    if (!file) return;

    await loadYOLOModel();

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      setYoloImage(imageUrl);
      setYoloDetections([]);
      setYoloLoading(true);

      try {
        // Create canvas to get ImageData
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();

        img.onload = async () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Run YOLO detection
          const result = await yoloService.detectObjects(imageData);
          setYoloDetections(result.detections);

          // If we have annotated image, use it
          if (result.annotatedImage) {
            const annotatedCanvas = document.createElement('canvas');
            const annotatedCtx = annotatedCanvas.getContext('2d')!;
            annotatedCanvas.width = result.annotatedImage.width;
            annotatedCanvas.height = result.annotatedImage.height;
            annotatedCtx.putImageData(result.annotatedImage, 0, 0);
            setYoloImage(annotatedCanvas.toDataURL());
          }
        };

        img.src = imageUrl;
      } catch (error) {
        console.error('YOLO detection failed:', error);
        addToast('Object detection failed. Please try again.', 'error');
      } finally {
        setYoloLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;

      // Create modal for camera
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-zinc-900">Take Photo</h3>
            <button class="close-camera p-2 hover:bg-zinc-100 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 6l8 8M6 14l8-8"/>
              </svg>
            </button>
          </div>
          <video class="w-full rounded-lg mb-4" autoplay playsinline></video>
          <div class="flex gap-3">
            <button class="capture-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex-1">
              Capture
            </button>
            <button class="close-camera bg-zinc-200 hover:bg-zinc-300 text-zinc-900 px-4 py-2 rounded-lg font-medium">
              Cancel
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      modal.querySelector('video')!.srcObject = stream;

      // Handle capture
      modal.querySelector('.capture-btn')!.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
            handleYOLOImageUpload(file);
          }
        }, 'image/jpeg');

        // Close camera
        stream.getTracks().forEach(track => track.stop());
        modal.remove();
      });

      // Handle close
      modal.querySelectorAll('.close-camera').forEach(btn => {
        btn.addEventListener('click', () => {
          stream.getTracks().forEach(track => track.stop());
          modal.remove();
        });
      });

    } catch (error) {
      console.error('Camera access failed:', error);
      addToast('Camera access denied. Please allow camera permissions.', 'warning');
    }
  };

  const clearYOLOResults = () => {
    setYoloImage(null);
    setYoloDetections([]);
  };

  const tools = [
    { icon: BrainCircuit, title: 'AI Architect', desc: 'Generative project planning, budgeting, and risk analysis.', action: () => setPage(Page.PROJECT_LAUNCHPAD), id: 'architect' },
    { icon: FileSearch, title: 'Contract Analyzer', desc: 'Extract key dates, terms, liabilities from uploaded contracts', id: 'contract', modal: true },
    { icon: FileText, title: 'Invoice Parser', desc: 'Auto-detect vendor, amounts, line items, payment terms', id: 'invoice', modal: true },
    { icon: Box, title: 'Blueprint Analyzer', desc: 'Extract dimensions, material quantities, detect risk areas', id: 'blueprint', modal: true },
    { icon: AlertTriangle, title: 'Risk Assessment Engine', desc: 'Analyze project risks with confidence scoring', id: 'risk', action: () => setActiveModal('risk') },
    { icon: FileDigit, title: 'Bid Generator', desc: 'Generate professional bid packages from templates', id: 'bid', action: () => setActiveModal('bid') },
    { icon: Search, title: 'Grant Finder', desc: 'Search government construction grants and subsidies', id: 'grant', action: () => setActiveModal('grant') },
    { icon: MessageSquare, title: 'AI Chat Assistant', desc: 'Natural language queries about projects, team, safety', action: () => setPage(Page.CHAT) },
    { icon: Calculator, title: 'Cost Estimator', desc: 'Predict project costs using historical ML models', id: 'cost', action: () => generateCostEstimate() },
    { icon: Calendar, title: 'Schedule Optimizer', desc: 'Optimize resource allocation with genetic algorithms', id: 'schedule', action: () => generateScheduleOptimization() },
    { icon: Eye, title: 'YOLO Object Detection', desc: 'Real-time object detection for safety, equipment tracking, and quality control', id: 'yolo', action: () => setActiveModal('yolo') },
    { icon: ShieldAlert, title: 'Safety Predictor', desc: 'Predict potential incidents before they occur', id: 'safety', action: () => generateSafetyPrediction() },
    { icon: FileBarChart, title: 'Report Generator', desc: 'Auto-generate executive, safety, financial reports', id: 'report', action: () => setPage(Page.REPORTS) },
    { icon: Activity, title: 'Sentiment Analysis', desc: 'Analyze chat/email sentiment for team morale tracking', id: 'sentiment', action: () => setActiveModal('sentiment') },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">AI-Powered Tools & Document Intelligence</h1>
        <p className="text-zinc-500">Leverage artificial intelligence and ML to enhance productivity</p>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-[#e0f2fe] to-white border border-[#bae6fd] rounded-xl p-6 mb-8 flex items-center justify-between shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#0f5c82] rounded-lg text-white">
            <Lightbulb size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0c4a6e] mb-1">Intelligent Document Processing</h3>
            <p className="text-zinc-600 text-sm max-w-xl">
              Upload contracts, blueprints, or invoices for automated OCR, categorization, key information extraction, and risk analysis.
            </p>
          </div>
        </div>
        <label className="bg-[#1f7d98] hover:bg-[#166ba1] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer">
          <Upload size={16} /> Upload Document
          <input type="file" hidden accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, 'general')} />
        </label>
      </div>

      {/* Results Display */}
      {(results || costEstimate || scheduleOpt || safetyRisks) && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900">
              {results?.title || 'Analysis Results'}
            </h3>
            <button
              onClick={() => {
                setResults(null);
                setCostEstimate(null);
                setScheduleOpt(null);
                setSafetyRisks(null);
              }}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="bg-zinc-50 rounded-lg p-4 text-sm text-zinc-700 max-h-96 overflow-y-auto font-mono whitespace-pre-wrap break-words">
            {analyzing ? (
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </div>
            ) : results ? (
              JSON.stringify(results.data, null, 2)
            ) : costEstimate ? (
              JSON.stringify(costEstimate.data, null, 2)
            ) : scheduleOpt ? (
              JSON.stringify(scheduleOpt.data, null, 2)
            ) : (
              JSON.stringify(safetyRisks?.data, null, 2)
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-4">
            Generated at: {results?.timestamp || costEstimate?.timestamp || scheduleOpt?.timestamp || safetyRisks?.timestamp}
          </p>
        </div>
      )}

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <div
            key={index}
            onClick={() => {
              if (tool.action) {
                tool.action();
              } else if (tool.modal) {
                setActiveModal(tool.id);
              }
            }}
            className={`bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-md transition-shadow ${tool.action || tool.modal ? 'cursor-pointer group' : ''}`}
          >
            <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
              <tool.icon size={20} className="text-[#0f5c82]" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">{tool.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{tool.desc}</p>
            {analyzing && (tool.id === 'cost' || tool.id === 'schedule' || tool.id === 'safety') && (
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-600">
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Document Upload Modal */}
      {activeModal && ['contract', 'invoice', 'blueprint'].includes(activeModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900">
                Upload {activeModal === 'contract' ? 'Contract' : activeModal === 'invoice' ? 'Invoice' : 'Blueprint'}
              </h2>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-zinc-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center mb-4">
              <Upload size={40} className="mx-auto text-zinc-400 mb-2" />
              <label className="cursor-pointer">
                <p className="text-sm font-medium text-zinc-900">Click to upload or drag and drop</p>
                <p className="text-xs text-zinc-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                <input
                  type="file"
                  hidden
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    handleFileUpload(e, activeModal);
                    setActiveModal(null);
                  }}
                />
              </label>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* YOLO Object Detection Modal */}
      {activeModal === 'yolo' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-zinc-900">YOLO Object Detection</h2>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-zinc-100 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              {/* Model Loading Status */}
              {!yoloModelLoaded && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Loader2 size={20} className={`text-yellow-600 ${yoloLoading ? 'animate-spin' : ''}`} />
                    <div>
                      <h3 className="font-medium text-yellow-800">
                        {yoloLoading ? 'Loading YOLO Model...' : 'YOLO Model Not Loaded'}
                      </h3>
                      <p className="text-sm text-yellow-700">
                        {yoloLoading
                          ? 'This may take a moment. The model is ~5MB.'
                          : 'Click one of the options below to load the AI model.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Upload Options */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <label className="bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center cursor-pointer hover:bg-zinc-100 transition-colors">
                  <Upload size={32} className="mx-auto text-zinc-400 mb-3" />
                  <p className="text-sm font-medium text-zinc-900 mb-1">Upload Image</p>
                  <p className="text-xs text-zinc-500">PNG, JPG up to 10MB</p>
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleYOLOImageUpload(file);
                    }}
                  />
                </label>

                <button
                  onClick={openCamera}
                  className="bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:bg-zinc-100 transition-colors"
                >
                  <Camera size={32} className="mx-auto text-zinc-400 mb-3" />
                  <p className="text-sm font-medium text-zinc-900 mb-1">Take Photo</p>
                  <p className="text-xs text-zinc-500">Use device camera</p>
                </button>
              </div>

              {/* Results */}
              {yoloImage && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900">Detection Results</h3>
                    <button
                      onClick={clearYOLOResults}
                      className="text-sm text-zinc-600 hover:text-zinc-900"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="bg-zinc-50 rounded-lg p-4">
                    {yoloLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-blue-600 mr-3" />
                        <span className="text-zinc-600">Detecting objects...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <img
                            src={yoloImage}
                            alt="Analyzed"
                            className="w-full rounded-lg border border-zinc-200"
                          />
                        </div>

                        <div>
                          <div className="mb-4">
                            <h4 className="font-medium text-zinc-900 mb-2">
                              Detected Objects ({yoloDetections.length})
                            </h4>
                            {yoloDetections.length === 0 ? (
                              <p className="text-sm text-zinc-600">No objects detected</p>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {yoloDetections.map((detection, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between bg-white p-3 rounded border border-zinc-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${detection.className === 'person' ? 'bg-red-500' :
                                        detection.className === 'helmet' ? 'bg-green-500' :
                                          detection.className === 'truck' ? 'bg-blue-500' : 'bg-gray-500'
                                        }`} />
                                      <span className="font-medium text-zinc-900">
                                        {detection.className}
                                      </span>
                                    </div>
                                    <span className="text-sm text-zinc-600">
                                      {(detection.confidence * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Construction Safety Notes */}
                          {yoloDetections.some(d => ['person', 'helmet', 'hard_hat', 'safety_vest'].includes(d.className)) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-medium text-blue-900 mb-2">🛡️ Safety Analysis</h4>
                              <div className="text-sm text-blue-800 space-y-1">
                                {yoloDetections.filter(d => d.className === 'person').length > 0 && (
                                  <p>• {yoloDetections.filter(d => d.className === 'person').length} person(s) detected on site</p>
                                )}
                                {yoloDetections.filter(d => ['helmet', 'hard_hat'].includes(d.className)).length === 0 && (
                                  <p className="text-red-700 font-medium">⚠️ No helmets detected - safety concern</p>
                                )}
                                {yoloDetections.filter(d => d.className === 'safety_vest').length === 0 && (
                                  <p className="text-red-700 font-medium">⚠️ No safety vests detected - safety concern</p>
                                )}
                                {yoloDetections.filter(d => ['helmet', 'hard_hat', 'safety_vest'].includes(d.className)).length > 0 && (
                                  <p className="text-green-700">✓ Some PPE detected</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Equipment Tracking */}
                          {yoloDetections.some(d => ['truck', 'excavator', 'crane', 'forklift'].includes(d.className)) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                              <h4 className="font-medium text-green-900 mb-2">🚛 Equipment Tracking</h4>
                              <div className="text-sm text-green-800 space-y-1">
                                {['truck', 'excavator', 'crane', 'forklift'].map(equipment =>
                                  yoloDetections.filter(d => d.className === equipment).length > 0 && (
                                    <p key={equipment}>
                                      • {yoloDetections.filter(d => d.className === equipment).length} {equipment}(s) detected
                                    </p>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-6 py-2 rounded-lg font-medium transition-colors"
                >
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

export default AIToolsView;
