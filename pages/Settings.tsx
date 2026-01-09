import React, { useState, useEffect } from 'react';
import { Wifi, Sliders, Camera, Save, Server, Cpu, Database } from 'lucide-react';
import { getBackendMode, setBackendMode, BackendMode } from '../services/backendConfig';

const Settings: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [backendMode, setBackendModeState] = useState<BackendMode>('mac');

  useEffect(() => {
    setBackendModeState(getBackendMode());
  }, []);

  const handleSave = () => {
    setConnectionStatus('connecting');
    setBackendMode(backendMode);
    setTimeout(() => setConnectionStatus('connected'), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">System Configuration</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
          connectionStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          {connectionStatus === 'connected' ? 'Pi Connected' : 'Pi Disconnected'}
        </div>
      </div>
      
      {/* Raspberry Pi Connection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
             <Server className="text-agri-600" size={20} /> Raspberry Pi Connection
           </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rover IP Address</label>
            <input type="text" defaultValue="192.168.1.105" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WebSocket Port (Telemetry)</label>
            <input type="text" defaultValue="8765" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Stream URL (MJPEG)</label>
            <input type="text" defaultValue="http://192.168.1.105:8000/stream.mjpg" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key (Optional)</label>
            <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {/* AI Model Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
             <Cpu className="text-agri-600" size={20} /> Inference Model & Backend
           </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Model</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>YOLOv8n (Nano) - Fastest</option>
                  <option>YOLOv8s (Small) - Balanced</option>
                  <option>YOLOv8m (Medium) - Accurate</option>
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inference Device</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>CPU (ARMv8)</option>
                  <option>Hailo-8L NPU (if attached)</option>
                  <option>Google Coral USB</option>
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telemetry Backend</label>
                <div className="flex flex-col gap-2 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="backendMode"
                      value="mac"
                      checked={backendMode === 'mac'}
                      onChange={() => setBackendModeState('mac')}
                    />
                    <span>Mac (best model on Mac camera)</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="backendMode"
                      value="pi"
                      checked={backendMode === 'pi'}
                      onChange={() => setBackendModeState('pi')}
                    />
                    <span>Raspberry Pi (best.onnx on Pi camera)</span>
                  </label>
                </div>
             </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Confidence Threshold</label>
              <span className="text-sm font-bold text-agri-600">0.65</span>
            </div>
            <input type="range" className="w-full accent-agri-600" min="0" max="1" step="0.05" defaultValue="0.65" />
            <p className="text-xs text-gray-500 mt-1">Lower values detect more pests but increase false positives.</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
              <Database className="text-agri-600" size={20} /> Data & Storage
            </h3>
         </div>
         <div className="p-6 flex items-center justify-between">
            <div>
               <div className="text-sm font-medium text-gray-900">Local Storage (SD Card)</div>
               <div className="text-xs text-gray-500">12GB used of 64GB</div>
            </div>
            <div className="flex gap-3">
               <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">Clear Logs</button>
               <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Backup to Cloud</button>
            </div>
         </div>
      </div>

      <div className="flex justify-end sticky bottom-6">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-agri-600 text-white px-6 py-3 rounded-lg hover:bg-agri-700 transition-colors shadow-lg"
        >
          <Save size={18} />
          Save & Sync to Pi
        </button>
      </div>
    </div>
  );
};

export default Settings;