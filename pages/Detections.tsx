import React, { useState } from 'react';
import { MOCK_DETECTIONS } from '../constants';
import { PestDetection } from '../types';
import { Search, Filter, Download, X } from 'lucide-react';

const Detections: React.FC = () => {
  const [selectedDetection, setSelectedDetection] = useState<PestDetection | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Toolbar */}
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800">Detection Log</h2>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search species..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-agri-500 outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Filter size={18} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-agri-600 text-white rounded-lg text-sm hover:bg-agri-700">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Species</th>
              <th className="px-6 py-4">Count</th>
              <th className="px-6 py-4">Confidence</th>
              <th className="px-6 py-4">Location (GPS)</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {MOCK_DETECTIONS.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div 
                    className="w-16 h-12 rounded-md overflow-hidden cursor-pointer hover:opacity-80 border border-gray-200"
                    onClick={() => setSelectedDetection(item)}
                  >
                    <img src={item.imageUrl} alt={item.species} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{item.species}</td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                    {item.count}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.confidence > 0.9 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${item.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedDetection(item)}
                    className="text-agri-600 hover:text-agri-800 font-medium text-xs"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedDetection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Detection Details</h3>
              <button onClick={() => setSelectedDetection(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="relative rounded-xl overflow-hidden mb-6 bg-gray-100">
                <img src={selectedDetection.imageUrl} alt="Full View" className="w-full object-cover" />
                {/* Mock Overlay Box in Modal */}
                <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 border-2 border-agri-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Species</label>
                  <div className="text-lg font-medium text-gray-900">{selectedDetection.species}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Confidence</label>
                  <div className="text-lg font-medium text-green-600">{(selectedDetection.confidence * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Timestamp</label>
                  <div className="text-sm text-gray-700">{selectedDetection.timestamp}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Coordinates</label>
                  <div className="text-sm font-mono text-gray-700">
                    {selectedDetection.latitude}, {selectedDetection.longitude}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
               <button onClick={() => setSelectedDetection(null)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Detections;