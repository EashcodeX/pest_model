import React, { useState, useEffect, useRef } from 'react';
import { piService } from '../services/piService';
import { TelemetryFrame } from '../types';
import { MapPin, Layers, ZoomIn, ZoomOut, Navigation, Compass } from 'lucide-react';

// Simple conversion for demo mapping (Local Coordinate System)
const latLngToXY = (lat: number, lng: number, baseLat: number, baseLng: number) => {
  const scale = 100000;
  return {
    x: (lng - baseLng) * scale + 400, // Center x
    y: -(lat - baseLat) * scale + 300 // Center y (inverted for SVG)
  };
};

const MapPage: React.FC = () => {
  const [zoom, setZoom] = useState(1);
  const [path, setPath] = useState<{x: number, y: number}[]>([]);
  const [currentPos, setCurrentPos] = useState<{x: number, y: number}>({x: 400, y: 300});
  
  // Keep track of base coordinates to normalize the map view
  const baseCoords = useRef<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // Initialize path history
    const unsubscribe = piService.subscribe((frame: TelemetryFrame) => {
      if (!baseCoords.current) {
        baseCoords.current = frame.gps;
      }

      const pos = latLngToXY(frame.gps.lat, frame.gps.lng, baseCoords.current.lat, baseCoords.current.lng);
      
      setCurrentPos(pos);
      setPath(prev => {
        const newPath = [...prev, pos];
        // Limit path length for performance
        if (newPath.length > 200) return newPath.slice(newPath.length - 200);
        return newPath;
      });
    });

    return () => unsubscribe();
  }, []);

  // Generate SVG path string
  const pathD = path.length > 0 
    ? `M ${path[0].x} ${path[0].y} ` + path.map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-6 h-fit">
        <div>
          <h2 className="font-bold text-gray-800 text-lg mb-1">Real-time Tracking</h2>
          <p className="text-sm text-gray-500 flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             Signal Active
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
                <Compass className="text-slate-400" size={20} />
                <span className="text-sm font-medium text-slate-700">Current Position</span>
            </div>
            <div className="font-mono text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                    <span>LAT:</span>
                    <span>{baseCoords.current ? (baseCoords.current.lat - (currentPos.y-300)/100000).toFixed(6) : '---'}</span>
                </div>
                <div className="flex justify-between">
                    <span>LNG:</span>
                    <span>{baseCoords.current ? (baseCoords.current.lng + (currentPos.x-400)/100000).toFixed(6) : '---'}</span>
                </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Map Layers</label>
            <div className="space-y-2">
               <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 hover:bg-gray-50 rounded">
                 <input type="checkbox" defaultChecked className="rounded text-agri-600 focus:ring-agri-500" />
                 <span>Rover Path</span>
               </label>
               <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 hover:bg-gray-50 rounded">
                 <input type="checkbox" defaultChecked className="rounded text-agri-600 focus:ring-agri-500" />
                 <span>Detection Heatmap</span>
               </label>
               <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 hover:bg-gray-50 rounded">
                 <input type="checkbox" className="rounded text-agri-600 focus:ring-agri-500" />
                 <span>Satellite Overlay</span>
               </label>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Area */}
      <div className="flex-1 bg-[#f0fdf4] rounded-xl border border-gray-200 relative overflow-hidden shadow-inner group">
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 bg-white rounded shadow text-gray-600 hover:text-black transition-colors">
            <ZoomIn size={20} />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 bg-white rounded shadow text-gray-600 hover:text-black transition-colors">
            <ZoomOut size={20} />
          </button>
          <button onClick={() => {setPath([]); setCurrentPos({x:400, y:300});}} className="p-2 bg-white rounded shadow text-gray-600 hover:text-black transition-colors mt-2" title="Recenter/Clear">
            <Navigation size={20} />
          </button>
        </div>

        {/* SVG Map */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden cursor-move">
          <svg 
            viewBox="0 0 800 600" 
            className="w-full h-full"
            style={{ transform: `scale(${zoom})`, transition: 'transform 0.3s ease' }}
          >
            {/* Grid Pattern Background */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#dcfce7" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Field Boundaries (Static) */}
            <rect x="100" y="100" width="600" height="400" fill="none" stroke="#86efac" strokeWidth="2" strokeDasharray="10,5" />

            {/* Rover Path Trace */}
            <path 
              d={pathD} 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              opacity="0.6"
            />

            {/* Rover Current Position Marker */}
            <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
              {/* Pulsing effect */}
              <circle r="15" fill="#3b82f6" opacity="0.2">
                <animate attributeName="r" from="10" to="20" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              {/* Core dot */}
              <circle r="6" fill="#2563eb" stroke="white" strokeWidth="2" />
              {/* Direction arrow (mock) */}
              <path d="M 0 -10 L 4 2 L 0 0 L -4 2 Z" fill="#2563eb" transform="rotate(45)" />
            </g>
            
            {/* Static Waypoints/Detections example */}
            <g transform="translate(450, 350)">
               <circle r="4" fill="#ef4444" />
            </g>
            <g transform="translate(320, 280)">
               <circle r="4" fill="#ef4444" />
            </g>

          </svg>
        </div>
        
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs text-gray-500 border border-gray-200 shadow-sm">
          Zone A • Scale 1:200 • Tracking Active
        </div>
      </div>
    </div>
  );
};

export default MapPage;