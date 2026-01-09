import React, { useState } from 'react';
import { PEST_DISTRIBUTION, HOURLY_TRENDS } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { Download, FileText, Terminal, Database } from 'lucide-react';
import TreatmentResearcher from '../components/TreatmentResearcher';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16'];

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'system'>('general');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div className="flex gap-4 items-center">
           <h2 className="text-2xl font-bold text-gray-800">Operations Center</h2>
           <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('general')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeTab === 'general' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Reports
              </button>
              <button 
                onClick={() => setActiveTab('system')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeTab === 'system' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                System Logs
              </button>
           </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Database size={18} />
            Export Training Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-agri-600 text-white rounded-lg text-sm font-medium hover:bg-agri-700">
            <Download size={18} />
            Download PDF
          </button>
        </div>
      </div>

      {activeTab === 'general' ? (
        <>
          {/* Top Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-2">Total Detections</div>
                <div className="text-4xl font-bold text-gray-800">142</div>
                <div className="text-sm text-green-600 mt-2 font-medium">↑ 12% from yesterday</div>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-2">Dominant Species</div>
                <div className="text-4xl font-bold text-red-500">Aphid</div>
                <div className="text-sm text-red-600 mt-2 font-medium">Critical Level</div>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-2">Area Covered</div>
                <div className="text-4xl font-bold text-blue-600">2.4 <span className="text-xl text-gray-400">acres</span></div>
                <div className="text-sm text-gray-400 mt-2">100% of Zone A</div>
             </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Species Distribution</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PEST_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {PEST_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detections Over Time</h3>
              <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={HOURLY_TRENDS}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Research Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <TreatmentResearcher />
            </div>
            <div className="bg-agri-800 text-white p-6 rounded-xl shadow-lg flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
                
                <h3 className="text-xl font-bold mb-4 relative z-10">Automated Insight</h3>
                <p className="text-agri-100 mb-6 relative z-10 leading-relaxed">
                   Based on today's data, Aphid populations are clustering in the northeast sector.
                   Consider spot treatment in Rows 1-3 rather than broad application.
                </p>
                <button className="bg-white text-agri-800 px-4 py-3 rounded-lg font-bold text-sm hover:bg-agri-50 transition-colors relative z-10">
                  Schedule Spot Treatment
                </button>
            </div>
          </div>
        </>
      ) : (
        /* System Logs Tab */
        <div className="space-y-6">
          <div className="bg-slate-900 text-slate-300 p-6 rounded-xl font-mono text-sm h-[500px] overflow-y-auto shadow-inner">
            <div className="flex items-center gap-2 text-green-400 mb-4 border-b border-slate-800 pb-2">
              <Terminal size={16} />
              <span>pi@rover-01:~/logs $ tail -f system.log</span>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500">[10:15:30] <span className="text-blue-400">INFO</span> System boot sequence initiated.</div>
              <div className="text-slate-500">[10:15:32] <span className="text-blue-400">INFO</span> Camera interface (CSI) detected. Initializing...</div>
              <div className="text-slate-500">[10:15:35] <span className="text-blue-400">INFO</span> Model 'yolov8n.pt' loaded on CPU (ARMv8).</div>
              <div className="text-slate-500">[10:15:36] <span className="text-green-400">SUCCESS</span> WebSocket server listening on port 8765.</div>
              <div className="text-slate-500">[10:18:45] <span className="text-yellow-400">WARN</span> CPU Temperature exceeding 65°C. Throttling disabled.</div>
              <div className="text-slate-500">[10:22:10] <span className="text-blue-400">INFO</span> Client connected from 192.168.1.55</div>
              <div className="text-slate-500">[10:22:11] <span className="text-blue-400">INFO</span> Stream started. MJPEG at 15fps.</div>
              <div className="text-slate-500">[10:25:00] <span className="text-blue-400">DETECTION</span> Aphid (0.89) at [0.45, 0.32]</div>
              <div className="text-slate-500">[10:25:02] <span className="text-blue-400">DETECTION</span> Whitefly (0.72) at [0.12, 0.88]</div>
              {/* Mock log entries continuing */}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2">Storage Health</h3>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>/dev/root</span>
                  <span>12GB / 64GB</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2">Sensor Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IMU (MPU6050)</span>
                    <span className="text-green-600 font-medium">OK</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GPS (NEO-6M)</span>
                    <span className="text-green-600 font-medium">OK (8 Sats)</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;