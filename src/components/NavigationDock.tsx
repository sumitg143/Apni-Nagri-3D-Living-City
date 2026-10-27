import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Navigation } from 'lucide-react';
import { SceneMode, CITY_LOCATIONS } from '../types/city';
import { sound } from '../utils/sound';

interface Props {
  currentMode: SceneMode;
  onSelectMode: (mode: SceneMode) => void;
  onFollow: (target: 'train' | 'plane' | 'football') => void;
  onFocusCityCoord?: (x: number, z: number, zoom: number) => void;
}

export const NavigationDock: React.FC<Props> = ({
  currentMode,
  onSelectMode,
  onFollow,
  onFocusCityCoord,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'core' | 'activity' | 'transport'>('all');

  const filteredLocations = CITY_LOCATIONS.filter((loc) => {
    if (activeCategory === 'all') return true;
    return loc.category === activeCategory;
  });

  const handleSelect = (mode: SceneMode) => {
    sound.playClick();
    onSelectMode(mode);
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] w-max select-none transition-transform duration-300">
      {/* Collapse Toggle Tab */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => {
            sound.playClick();
            setIsCollapsed(!isCollapsed);
          }}
          className="px-4 py-1 bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/80 border-b-0 rounded-t-xl text-xs font-medium flex items-center gap-1.5 shadow-md backdrop-blur-md"
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isCollapsed ? 'स्थान नेविगेशन दिखाएं (Show Dock)' : 'नेविगेशन छुपाएं (Hide Dock)'}</span>
        </button>
      </div>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md text-white max-w-[min(940px,94vw)] flex flex-col gap-2">
          {/* Top row: Core actions and category tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSelect('city')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  currentMode === 'city'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>🏙️ पूरा शहर (Overview)</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onFollow('plane');
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-900/40 text-blue-300 hover:bg-blue-800/60 border border-blue-500/30 flex items-center gap-1 transition"
              >
                <span>✈️ हवाई जहाज़ पीछा</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onFollow('train');
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-red-900/40 text-red-300 hover:bg-red-800/60 border border-red-500/30 flex items-center gap-1 transition"
              >
                <span>🚆 ट्रेन पीछा</span>
              </button>
            </div>

            {/* Category filter pills */}
            <div className="flex gap-1 text-[11px] bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-0.5 rounded ${activeCategory === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
              >
                सभी
              </button>
              <button
                onClick={() => setActiveCategory('core')}
                className={`px-2 py-0.5 rounded ${activeCategory === 'core' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
              >
                मुख्य भवन
              </button>
              <button
                onClick={() => setActiveCategory('activity')}
                className={`px-2 py-0.5 rounded ${activeCategory === 'activity' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
              >
                खेल व मनोरंजन
              </button>
              <button
                onClick={() => setActiveCategory('transport')}
                className={`px-2 py-0.5 rounded ${activeCategory === 'transport' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
              >
                सवारी
              </button>
            </div>
          </div>

          {/* Bottom row: Horizontal scrollable location buttons */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {filteredLocations.map((loc) => {
              const isActive = currentMode === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => handleSelect(loc.id)}
                  title={loc.tagline}
                  className={`flex-none flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold border-amber-300 shadow-lg scale-105'
                      : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border-slate-700/60 hover:border-slate-500'
                  }`}
                >
                  <span className="text-base">{loc.icon}</span>
                  <span className="whitespace-nowrap">{loc.nameHindi.split(' ')[0]} {loc.nameHindi.split(' ')[1] || ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
