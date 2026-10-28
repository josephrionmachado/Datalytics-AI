import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Sparkles } from 'lucide-react';
import { Dataset } from '../types/data';
import { parseCsvDataset } from '../utils/dataProcessor';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (dataset: Dataset) => void;
  onLoadSample: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
  onLoadSample,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a valid CSV (.csv) file.');
      return;
    }

    if (file.size === 0) {
      setError('The selected CSV file is completely empty.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const dataset = parseCsvDataset(text, file.name, file.size);
        onDatasetLoaded(dataset);
        setIsProcessing(false);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file.');
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError('An error occurred while reading the file.');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#202228] border border-[#2C2F37] w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between border-b border-[#2C2F37] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#a120f7]/15 border border-[#a120f7]/30 flex items-center justify-center text-[#c084fc]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Upload Dataset</h3>
              <p className="text-[11px] text-slate-400">Local deterministic CSV parser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#18191E] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
            isDragging
              ? 'border-[#a120f7] bg-[#a120f7]/10'
              : 'border-[#2C2F37] hover:border-[#a120f7]/60 bg-[#18191E]/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-2xl bg-[#a120f7]/15 text-[#c084fc] flex items-center justify-center border border-[#a120f7]/30">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-bold text-white">
              {isProcessing ? 'Parsing CSV data...' : 'Click or drag CSV file here'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports CSV files with commas, headers, and standard formats
            </p>
          </div>
        </div>

        {/* Sample Data alternative */}
        <div className="pt-2 border-t border-[#2C2F37] flex items-center justify-between text-xs">
          <span className="text-slate-400">Want to test without a file?</span>
          <button
            onClick={() => {
              onLoadSample();
              onClose();
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#18191E] hover:bg-[#a120f7]/20 border border-[#2C2F37] hover:border-[#a120f7]/40 text-[#c084fc] transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#a120f7]" />
            <span>Load Sample Sales Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
