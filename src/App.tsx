/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DataExplorerView } from './components/DataExplorerView';
import { VisualizationsView } from './components/VisualizationsView';
import { AiAnalystView } from './components/AiAnalystView';
import { DataQualityView } from './components/DataQualityView';
import { AiInsightsView } from './components/AiInsightsView';
import { ExportView } from './components/ExportView';
import { UploadModal } from './components/UploadModal';
import { Dataset } from './types/data';
import { parseCsvDataset } from './utils/dataProcessor';
import { resetToOriginal } from './utils/cleaningOperations';
import { SAMPLE_CSV_RAW, SAMPLE_DATASET_NAME } from './data/sampleDataset';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [analystPrompt, setAnalystPrompt] = useState<string | undefined>(undefined);

  // Auto-load sample dataset on first mount so user immediately sees a live, populated application
  useEffect(() => {
    try {
      const sample = parseCsvDataset(SAMPLE_CSV_RAW, SAMPLE_DATASET_NAME, 0, true);
      setDataset(sample);
    } catch (err) {
      console.error('Failed to load initial sample dataset:', err);
    }
  }, []);

  const handleLoadSample = () => {
    try {
      const sample = parseCsvDataset(SAMPLE_CSV_RAW, SAMPLE_DATASET_NAME, 0, true);
      setDataset(sample);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Failed to load sample data:', err);
    }
  };

  const handleDatasetLoaded = (newDataset: Dataset) => {
    setDataset(newDataset);
    setActiveTab('dashboard');
  };

  const handleUpdateDataset = (updatedDataset: Dataset) => {
    setDataset(updatedDataset);
  };

  const handleResetData = () => {
    if (dataset) {
      const reverted = resetToOriginal(dataset);
      setDataset(reverted);
    }
  };

  return (
    /* Outer gradient canvas matching user's design frame */
    <div className="h-screen w-screen bg-linear-to-br from-[#4F55EE] via-[#7B3FE4] to-[#A120F7] p-2.5 sm:p-4 lg:p-6 flex flex-col overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#A120F7] selection:text-white">
      {/* The Central Rounded Grey Box Container */}
      <div className="flex-1 w-full bg-[#1C1E23] rounded-3xl border border-white/15 shadow-2xl flex overflow-hidden text-slate-100 relative">
        {/* Sidebar inside Grey Box */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dataset={dataset}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onLoadSample={handleLoadSample}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />

        {/* Main Content Area inside Grey Box */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#1E2026]">
          {/* Header */}
          <Header
            activeTab={activeTab}
            dataset={dataset}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onLoadSample={handleLoadSample}
            onResetData={dataset && dataset.history.length > 0 ? handleResetData : undefined}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Workspace Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#18191E]">
            {activeTab === 'dashboard' && (
              <DashboardView
                dataset={dataset}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onLoadSample={handleLoadSample}
                setActiveTab={setActiveTab}
                onLaunchAnalystWithPrompt={(prompt: string) => {
                  setAnalystPrompt(prompt);
                  setActiveTab('analyst');
                }}
              />
            )}

            {activeTab === 'explorer' && (
              <DataExplorerView
                dataset={dataset}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onLoadSample={handleLoadSample}
              />
            )}

            {activeTab === 'visualizations' && (
              <VisualizationsView
                dataset={dataset}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onLoadSample={handleLoadSample}
              />
            )}

            {activeTab === 'analyst' && (
              <AiAnalystView
                dataset={dataset}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onLoadSample={handleLoadSample}
                initialPrompt={analystPrompt}
              />
            )}

            {activeTab === 'quality' && (
              <DataQualityView
                dataset={dataset}
                onUpdateDataset={handleUpdateDataset}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onLoadSample={handleLoadSample}
              />
            )}

            {activeTab === 'insights' && (
              <AiInsightsView
                dataset={dataset}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onLoadSample={handleLoadSample}
              />
            )}

            {activeTab === 'export' && (
              <ExportView
                dataset={dataset}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onLoadSample={handleLoadSample}
              />
            )}
          </main>
        </div>

        {/* CSV Upload Modal */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onDatasetLoaded={handleDatasetLoaded}
          onLoadSample={handleLoadSample}
        />
      </div>
    </div>
  );
}
