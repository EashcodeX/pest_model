import React from 'react';
import { Bug, Battery, Signal, Wifi, Menu } from 'lucide-react';
import { ViewState, RoverStatus } from '../types';

interface NavbarProps {
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  roverStatus: RoverStatus;
}

const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView, roverStatus }) => {
  const navItems = [
    { id: ViewState.LIVE_FEED, label: 'Live Feed' },
    { id: ViewState.DETECTIONS, label: 'Detections' },
    { id: ViewState.MAP, label: 'Map' },
    { id: ViewState.REPORTS, label: 'Reports' },
    { id: ViewState.SETTINGS, label: 'Settings' },
  ];

  return (
    <nav className="bg-agri-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full text-agri-700">
              <Bug size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight">Pest Rover</span>
          </div>

          <div className="hidden md:block">
            <div className="flex items-baseline space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === item.id
                      ? 'bg-agri-900 text-white'
                      : 'text-agri-100 hover:bg-agri-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm bg-agri-900 px-3 py-1 rounded-full">
              {roverStatus.status === 'online' ? <Wifi size={14} className="text-green-400" /> : <Wifi size={14} className="text-red-400" />}
              <span className="uppercase font-semibold text-xs">{roverStatus.status}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Battery size={18} className={roverStatus.battery < 20 ? 'text-red-300' : 'text-green-300'} />
              <span>{roverStatus.battery}%</span>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
               <Menu className="cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;