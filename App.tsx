import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LiveFeed from './pages/LiveFeed';
import Detections from './pages/Detections';
import MapPage from './pages/MapPage';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ChatWidget from './components/ChatWidget';
import { ViewState, RoverStatus } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.LIVE_FEED);
  
  // Mock rover status state
  const [roverStatus] = useState<RoverStatus>({
    battery: 78,
    status: 'online',
    signalStrength: 92,
    speed: 0
  });

  const renderContent = () => {
    switch (activeView) {
      case ViewState.LIVE_FEED:
        return <LiveFeed />;
      case ViewState.DETECTIONS:
        return <Detections />;
      case ViewState.MAP:
        return <MapPage />;
      case ViewState.REPORTS:
        return <Reports />;
      case ViewState.SETTINGS:
        return <Settings />;
      default:
        return <LiveFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        roverStatus={roverStatus} 
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {renderContent()}
      </main>

      {/* Persistent AI Chat Assistant */}
      <ChatWidget />

      {/* Keyframes for simple animations */}
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0.2; }
          50% { opacity: 0.5; }
          100% { top: 100%; opacity: 0.2; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;