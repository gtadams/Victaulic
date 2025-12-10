import React, { useState, useCallback } from 'react';
import { UploadedImage, AnalysisStatus } from './types';
import { ImageUploader } from './components/ImageUploader';
import { ImageGrid } from './components/ImageGrid';
import { ResultDisplay } from './components/ResultDisplay';
import { Button } from './components/Button';
import { analyzeImages } from './services/geminiService';
import { Camera, Wand2, Trash2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState<string>('Identify the Victaulic part number in the uploaded images. Provide details about the part if possible.');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImagesSelected = useCallback((files: File[]) => {
    const newImages: UploadedImage[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      mimeType: file.type
    }));

    setImages(prev => [...prev, ...newImages]);
    // Reset status if we were in success/error state to allow new analysis
    if (status !== AnalysisStatus.ANALYZING) {
      setStatus(AnalysisStatus.IDLE);
      setError(null);
    }
  }, [status]);

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // Clean up object URLs to avoid memory leaks
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setResult(null);
    setStatus(AnalysisStatus.IDLE);
    setError(null);
  }, [images]);

  const handleAnalyze = async () => {
    if (images.length === 0) return;

    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeImages(images, prompt);
      setResult(analysisResult);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during analysis.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-md">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Visionary Lens</h1>
              <p className="text-xs text-gray-500 font-medium">Powered by Gemini 2.5</p>
            </div>
          </div>
          <div className="hidden sm:block">
            <a 
              href="https://ai.google.dev/" 
              target="_blank" 
              rel="noreferrer"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Documentation &rarr;
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Intro Section */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
            Transform Images into Insights
          </h2>
          <p className="text-lg text-gray-600">
            Upload one or more photos and let our AI analyze them to identify the Victaulic part number.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Upload Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  Upload Images
                </h3>
                {images.length > 0 && (
                  <button 
                    onClick={handleClearAll} 
                    className="text-sm text-red-500 hover:text-red-700 flex items-center transition-colors"
                    disabled={status === AnalysisStatus.ANALYZING}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </button>
                )}
              </div>
              
              <ImageUploader 
                onImagesSelected={handleImagesSelected} 
                disabled={status === AnalysisStatus.ANALYZING}
              />
              
              <ImageGrid 
                images={images} 
                onRemove={handleRemoveImage} 
                disabled={status === AnalysisStatus.ANALYZING}
              />
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500 order-2 sm:order-1">
                {images.length === 0 ? 'Upload images to start' : `${images.length} image${images.length !== 1 ? 's' : ''} selected`}
              </span>
              <Button
                onClick={handleAnalyze}
                disabled={images.length === 0 || status === AnalysisStatus.ANALYZING}
                isLoading={status === AnalysisStatus.ANALYZING}
                className="w-full sm:w-auto px-8 py-3 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all order-1 sm:order-2"
                icon={<Wand2 className="w-5 h-5" />}
              >
                {status === AnalysisStatus.ANALYZING ? 'Analyzing...' : 'Identify Part'}
              </Button>
            </div>
          </div>
          
          {/* Progress Bar (Visual only) */}
          {status === AnalysisStatus.ANALYZING && (
            <div className="h-1 w-full bg-indigo-100 overflow-hidden">
              <div className="h-full bg-indigo-600 animate-progress"></div>
            </div>
          )}
        </div>

        {/* Error State */}
        {status === AnalysisStatus.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start space-x-4 animate-fade-in">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Analysis Failed</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button 
                onClick={handleAnalyze}
                className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {status === AnalysisStatus.SUCCESS && result && (
          <div className="animate-fade-in">
             <ResultDisplay result={result} />
          </div>
        )}

      </main>
      
      {/* Global Style for simpler animations */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; margin-left: 0; }
          50% { width: 50%; }
          100% { width: 100%; margin-left: 100%; }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;