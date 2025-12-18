import React from 'react';
import { Disruption, GroundingSource } from '../types';
import { Anchor, Wind, ShieldAlert, AlertOctagon, Info, ExternalLink, RefreshCw, Link as LinkIcon } from 'lucide-react';

interface NewsSidebarProps {
  disruptions: Disruption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  loading: boolean;
  onRefresh: () => void;
  sources: GroundingSource[];
  lastUpdated: Date | null;
}

const NewsSidebar: React.FC<NewsSidebarProps> = ({ 
  disruptions, 
  selectedId, 
  onSelect, 
  loading, 
  onRefresh,
  sources,
  lastUpdated
}) => {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'Conflict': return <AlertOctagon size={16} className="text-[#AB39DC]" />;
      case 'Weather': return <Wind size={16} className="text-[#AB39DC]" />;
      case 'Strike': return <ShieldAlert size={16} className="text-[#AB39DC]" />;
      default: return <Anchor size={16} className="text-[#AB39DC]" />;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  const selectedDisruption = disruptions.find(d => d.id === selectedId);

  // Sort: High risk first
  const sortedDisruptions = [...disruptions].sort((a, b) => {
      const score = (s: string) => s === 'High' ? 3 : s === 'Medium' ? 2 : 1;
      return score(b.severity) - score(a.severity);
  });

  return (
    <div className="flex flex-col h-full bg-[#1c1053] border-r border-[#2a215c] w-full md:w-96 lg:w-[450px] shrink-0 z-20 shadow-2xl text-white">
      {/* Header */}
      <div className="p-5 border-b border-[#2a215c] bg-[#1c1053]">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Anchor className="text-[#AB39DC]" />
            Maritime Watch
          </h1>
          <button 
            onClick={onRefresh}
            disabled={loading}
            className={`p-2 rounded-full hover:bg-[#2a215c] transition-colors ${loading ? 'animate-spin text-white' : 'text-[#AB39DC]'}`}
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-300">
           <span>Global Freight Disruptions</span>
           {lastUpdated && <span>Updated: {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto relative bg-[#1c1053]">
        {loading && disruptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-6 p-8 text-center">
            {/* Radar Animation */}
            <div className="relative flex items-center justify-center w-32 h-32">
              {/* Outer Ring */}
              <div className="absolute inset-0 border-2 border-[#AB39DC]/20 rounded-full"></div>
              {/* Middle Ring */}
              <div className="absolute inset-8 border border-[#AB39DC]/30 rounded-full"></div>
              {/* Inner Ring */}
              <div className="absolute inset-12 border border-[#AB39DC]/50 rounded-full"></div>
              
              {/* Crosshairs */}
              <div className="absolute w-full h-[1px] bg-[#AB39DC]/20"></div>
              <div className="absolute h-full w-[1px] bg-[#AB39DC]/20"></div>
              
              {/* Radar Sweep - Rotating Conic Gradient */}
              <div className="absolute inset-1 rounded-full animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,#AB39DC_360deg)] opacity-40"></div>
              
              {/* Center Dot */}
              <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff] z-10"></div>
              
              {/* Pulsing Blip (Simulated Object) */}
              <div className="absolute top-6 right-8 w-1.5 h-1.5 bg-red-400 rounded-full animate-ping"></div>
            </div>
            
            <div className="space-y-2">
               <h3 className="text-[#AB39DC] font-bold tracking-[0.2em] uppercase text-xs animate-pulse">System Scanning</h3>
               <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">Acquiring real-time maritime disruption data from global sources...</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
             {/* Stats Summary */}
            {!selectedDisruption && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-[#2a215c]/50 p-3 rounded-lg border border-[#3e327a] text-center">
                        <div className="text-2xl font-bold text-white">{disruptions.length}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-300">Active</div>
                    </div>
                    <div className="bg-[#2a215c]/50 p-3 rounded-lg border border-[#3e327a] text-center">
                        <div className="text-2xl font-bold text-red-400">{disruptions.filter(d => d.severity === 'High').length}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-300">High Risk</div>
                    </div>
                    <div className="bg-[#2a215c]/50 p-3 rounded-lg border border-[#3e327a] text-center">
                        <div className="text-2xl font-bold text-amber-400">{disruptions.filter(d => d.severity === 'Medium').length}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-300">Med Risk</div>
                    </div>
                </div>
            )}

            {selectedDisruption ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <button 
                  onClick={() => onSelect(null)}
                  className="text-xs text-[#AB39DC] hover:text-[#d46bf2] mb-4 flex items-center gap-1 font-semibold"
                >
                  ← BACK TO LIST
                </button>
                
                <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-3 ${
                  selectedDisruption.severity === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  selectedDisruption.severity === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {selectedDisruption.severity.toUpperCase()} SEVERITY
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">{selectedDisruption.title}</h2>
                
                <div className="flex items-center gap-2 text-sm text-slate-300 mb-6">
                  {getIcon(selectedDisruption.type)}
                  <span>{selectedDisruption.type}</span>
                  <span>•</span>
                  <span>{selectedDisruption.locationName}</span>
                  <span>•</span>
                  <span>{formatDate(selectedDisruption.date)}</span>
                </div>

                <div className="bg-[#2a215c] p-4 rounded-lg border border-[#3e327a] mb-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#AB39DC] mb-2 uppercase tracking-wide">Impact Analysis</h3>
                  <p className="text-slate-200 leading-relaxed text-sm">
                    {selectedDisruption.description}
                  </p>
                </div>

                {/* Specific Sources Section */}
                {selectedDisruption.sources && selectedDisruption.sources.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                       <LinkIcon size={12} />
                       Verified Report Sources
                    </h3>
                    <div className="grid gap-2">
                      {selectedDisruption.sources.map((source, idx) => (
                        <a 
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded bg-[#150a42]/50 border border-[#2a215c] hover:bg-[#2a215c] hover:border-[#AB39DC]/50 transition-all group"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                             <span className="w-1.5 h-1.5 rounded-full bg-[#AB39DC] flex-shrink-0"></span>
                             <span className="text-sm text-slate-200 truncate group-hover:text-white">{source.title}</span>
                          </div>
                          <ExternalLink size={12} className="text-slate-500 group-hover:text-[#AB39DC] flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 pt-4 border-t border-[#2a215c]">
                   <h3 className="text-xs font-semibold text-slate-400 uppercase">Location Data</h3>
                   <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                      <div className="bg-[#150a42] p-2 rounded border border-[#2a215c]">
                        LAT: {selectedDisruption.coordinates[1].toFixed(4)}
                      </div>
                      <div className="bg-[#150a42] p-2 rounded border border-[#2a215c]">
                        LNG: {selectedDisruption.coordinates[0].toFixed(4)}
                      </div>
                   </div>
                </div>

              </div>
            ) : (
              <div className="space-y-3">
                {sortedDisruptions.map(disruption => (
                  <div 
                    key={disruption.id}
                    onClick={() => onSelect(disruption.id)}
                    className={`group p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedId === disruption.id 
                        ? 'bg-[#AB39DC] border-[#AB39DC] text-white shadow-lg' 
                        : disruption.severity === 'High'
                          ? 'bg-red-900/10 border-red-500/30 hover:border-red-400 hover:bg-red-900/20' // Highlight High Risk
                          : 'bg-[#2a215c]/40 border-[#3e327a] hover:bg-[#2a215c]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`${selectedId === disruption.id ? 'text-white' : 'text-[#AB39DC]'}`}>
                             {getIcon(disruption.type)}
                        </div>
                        <span className={`text-xs font-medium ${selectedId === disruption.id ? 'text-white' : 'text-slate-400'}`}>
                            {disruption.type}
                        </span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        disruption.severity === 'High' ? 'bg-red-500 animate-pulse' :
                        disruption.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                      } ${selectedId === disruption.id ? 'ring-2 ring-white/50' : ''}`} />
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 line-clamp-2 ${selectedId === disruption.id ? 'text-white' : 'text-slate-100 group-hover:text-[#AB39DC] transition-colors'}`}>
                      {disruption.title}
                    </h3>
                    <div className={`flex justify-between items-center mt-2 text-xs ${selectedId === disruption.id ? 'text-white/80' : 'text-slate-500'}`}>
                        <span>{disruption.locationName}</span>
                        <span>{formatDate(disruption.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Only show global sources if nothing selected or as secondary info */}
      {!selectedDisruption && (
        <div className="p-4 border-t border-[#2a215c] bg-[#150a42] text-xs">
          <h3 className="font-semibold text-slate-400 mb-2 flex items-center gap-1">
            <Info size={12} /> General Live Feed Sources
          </h3>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {sources.length > 0 ? sources.map((source, idx) => (
              <a 
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#2a215c] hover:bg-[#AB39DC] text-slate-300 hover:text-white px-2 py-1 rounded flex items-center gap-1 transition-colors truncate max-w-[200px]"
              >
                <ExternalLink size={10} />
                <span className="truncate">{source.title}</span>
              </a>
            )) : (
              <span className="text-slate-500 italic">No external sources linked yet.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsSidebar;