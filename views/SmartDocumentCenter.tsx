import React, { useState, useRef } from 'react';
import {
    FileText, UploadCloud, Scan, X, Check,
    ClipboardCheck, Copy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTenant } from '@/contexts/TenantContext';

interface ExtractedData {
    [key: string]: any;
}

const SmartDocumentCenter: React.FC = () => {
    const { token } = useAuth();
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [docType, setDocType] = useState('invoice');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            // Generate preview
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(selectedFile);

            // Reset extraction
            setExtractedData(null);
        }
    };

    const handleExtract = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', docType);

        try {
            const res = await fetch('/api/ocr/extract', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setExtractedData(data.data);
                addToast('Document processed successfully', 'success');
            } else {
                addToast('Extraction failed', 'error');
            }
        } catch (error) {
            console.error('OCR Error', error);
            addToast('Failed to process document', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (extractedData) {
            navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
            addToast('JSON copied to clipboard', 'success');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <Scan className="text-blue-500" />
                    Smart Document Center
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                    AI-powered OCR to extract data from invoices and RFIs
                </p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                {/* Left Panel: Upload & Preview */}
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-zinc-700 dark:text-zinc-200">Source Document</h3>
                        <div className="flex bg-zinc-100 dark:bg-zinc-700 rounded-lg p-1">
                            {['invoice', 'rfi', 'general'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setDocType(type)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${docType === type ? 'bg-white dark:bg-zinc-600 shadow text-blue-600 dark:text-blue-400' : 'text-zinc-500'}`}
                                >
                                    {type.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!preview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl flex flex-col items-center justify-center p-8 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                        >
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                accept="image/*,application/pdf"
                                onChange={handleFileSelect}
                            />
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                <UploadCloud size={32} />
                            </div>
                            <p className="text-zinc-900 dark:text-white font-bold text-lg">Click to Upload Document</p>
                            <p className="text-zinc-500 text-sm mt-2">Supports JPG, PNG, PDF</p>
                        </div>
                    ) : (
                        <div className="flex-1 relative bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center">
                            <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                            <button
                                onClick={() => { setFile(null); setPreview(null); setExtractedData(null); }}
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                            >
                                <X size={20} />
                            </button>
                            {!extractedData && !loading && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                                    <button
                                        onClick={handleExtract}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        <Scan size={20} />
                                        Process Document
                                    </button>
                                </div>
                            )}
                            {loading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                                    <p className="text-white font-bold animate-pulse">Analyzing Document...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel: Extraction Results */}
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                            <ClipboardCheck className="text-green-500" />
                            Extracted Data
                        </h3>
                        {extractedData && (
                            <button
                                onClick={handleCopyToClipboard}
                                className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Copy JSON"
                            >
                                <Copy size={18} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 overflow-auto border border-zinc-200 dark:border-zinc-700 font-mono text-sm">
                        {extractedData ? (
                            <pre className="text-zinc-800 dark:text-zinc-300">
                                {JSON.stringify(extractedData, null, 2)}
                            </pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                                <FileText size={48} className="mb-4 opacity-20" />
                                <p>Upload and process a document to see extracted data here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartDocumentCenter;
