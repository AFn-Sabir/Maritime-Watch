import React, { useState, useEffect, useCallback } from 'react';
import WorldMap from './components/WorldMap';
import NewsSidebar from './components/NewsSidebar';
import { fetchDisruptions } from './services/geminiService';
import { Disruption, GroundingSource } from './types';

const App: React.FC = () => {
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { disruptions: fetchedData, sources: fetchedSources } = await fetchDisruptions();
      setDisruptions(fetchedData);
      setSources(fetchedSources);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to fetch maritime disruption data. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="flex h-screen w-screen bg-[#f5f5f5] overflow-hidden font-sans">
      
      {/* Sidebar List */}
      <NewsSidebar 
        disruptions={disruptions}
        selectedId={selectedId}
        onSelect={setSelectedId}
        loading={loading}
        onRefresh={loadData}
        sources={sources}
        lastUpdated={lastUpdated}
      />

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <WorldMap 
          disruptions={disruptions}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Error Toast */}
        {error && (
          <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 z-50 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border border-red-400 max-w-md animate-in slide-in-from-top-4">
            <div className="font-bold mb-1">Error Loading Data</div>
            <div className="text-sm opacity-90">{error}</div>
            <button 
              onClick={() => setError(null)}
              className="absolute top-2 right-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;