import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Disruption, WorldGeoJSON } from '../types';

interface WorldMapProps {
  disruptions: Disruption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const SEVERITY_COLORS = {
  High: '#ef4444',   // red-500
  Medium: '#f59e0b', // amber-500
  Low: '#3b82f6',    // blue-500
};

// Brand Colors
const DEEP_NAVY = '#1c1053';
const VIBRANT_PURPLE = '#AB39DC';
const OFF_WHITE = '#f5f5f5';
const PURE_WHITE = '#ffffff';

const WorldMap: React.FC<WorldMapProps> = ({ disruptions, selectedId, onSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<WorldGeoJSON | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Sort disruptions so High severity is rendered LAST (on top)
  const sortedDisruptions = useMemo(() => {
    return [...disruptions].sort((a, b) => {
      const score = (s: string) => s === 'High' ? 3 : s === 'Medium' ? 2 : 1;
      return score(a.severity) - score(b.severity);
    });
  }, [disruptions]);

  // Fetch GeoJSON once
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data as WorldGeoJSON))
      .catch(err => console.error("Failed to load map data", err));
  }, []);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw Map
  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const { width, height } = dimensions;

    // Projection
    const projection = d3.geoMercator()
      .scale(width / 6.5) // Adjust scale based on width
      .center([0, 30]) // Center map roughly
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g');

    // Draw Countries - Clean White Look with Navy Stroke
    g.selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('d', pathGenerator as any)
      .attr('fill', PURE_WHITE) 
      .attr('stroke', DEEP_NAVY) // Deep Navy stroke for branding
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.2) // Subtle but visible
      .style('opacity', 1)
      .on('mouseover', function() {
        d3.select(this)
          .attr('fill', '#f1f5f9') // Slate-100 on hover
          .attr('stroke-opacity', 0.5);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('fill', PURE_WHITE)
          .attr('stroke-opacity', 0.2);
      });

    // Draw Disruption Markers
    const markers = g.selectAll('g.marker')
      .data(sortedDisruptions)
      .enter()
      .append('g')
      .attr('class', 'marker')
      .attr('transform', d => {
        const coords = projection(d.coordinates);
        return coords ? `translate(${coords[0]}, ${coords[1]})` : 'translate(0,0)';
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onSelect(d.id);
      });

    // --- HIGH SEVERITY EFFECTS ---
    
    // 1. Static Danger Ring (Always visible for High)
    markers.filter(d => d.severity === 'High')
      .append('circle')
      .attr('r', 10)
      .attr('fill', 'none')
      .attr('stroke', SEVERITY_COLORS['High'])
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.8);

    // 2. Strong Ripple Animation for High
    const highRiskRipples = markers.filter(d => d.severity === 'High' && d.id !== selectedId)
      .append('circle')
      .attr('r', 10)
      .attr('fill', SEVERITY_COLORS['High'])
      .attr('opacity', 0.5);

    highRiskRipples.append('animate')
      .attr('attributeName', 'r')
      .attr('from', 10)
      .attr('to', 35) // Large expansion
      .attr('dur', '2s')
      .attr('repeatCount', 'indefinite');

    highRiskRipples.append('animate')
      .attr('attributeName', 'opacity')
      .attr('from', 0.5)
      .attr('to', 0)
      .attr('dur', '2s')
      .attr('repeatCount', 'indefinite');


    // --- SELECTED STATE EFFECTS ---

    // Active Selection Ring (Vibrant Purple) - pulsing
    const selectionRing = markers.filter(d => d.id === selectedId)
      .append('circle')
      .attr('r', 16)
      .attr('fill', 'transparent')
      .attr('stroke', VIBRANT_PURPLE)
      .attr('stroke-width', 3)
      .attr('opacity', 1);
      
    selectionRing.append('animate')
      .attr('attributeName', 'r')
      .attr('from', 14)
      .attr('to', 22)
      .attr('dur', '1.5s')
      .attr('repeatCount', 'indefinite');

    selectionRing.append('animate')
      .attr('attributeName', 'opacity')
      .attr('from', 1)
      .attr('to', 0)
      .attr('dur', '1.5s')
      .attr('repeatCount', 'indefinite');

      
    // --- MAIN DOT ---
    markers.append('circle')
      .attr('r', d => d.severity === 'High' ? 6.5 : (d.id === selectedId ? 8 : 5))
      .attr('fill', d => SEVERITY_COLORS[d.severity])
      .attr('stroke', PURE_WHITE)
      .attr('stroke-width', 1.5)
      .transition()
      .duration(500)
      .attr('r', d => d.severity === 'High' ? 8 : (d.id === selectedId ? 10 : 6));

    // Tooltip area (invisible hit area slightly larger)
    markers.append('circle')
      .attr('r', 20) // Larger hit area
      .attr('fill', 'transparent');

    // Click background to deselect
    svg.on('click', () => {
        onSelect(null);
    });

  }, [geoData, dimensions, sortedDisruptions, selectedId, onSelect]);

  return (
    <div ref={containerRef} className="w-full h-full relative map-container shadow-inner">
      <svg ref={svgRef} width="100%" height="100%" className="absolute inset-0" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg border border-slate-300 text-xs shadow-xl text-[#1c1053]">
        <h4 className="font-bold mb-3 uppercase tracking-wider text-[#1c1053] border-b border-slate-200 pb-1">Impact Severity</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-bold text-red-600">High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="font-medium">Medium Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="font-medium">Low Impact</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;