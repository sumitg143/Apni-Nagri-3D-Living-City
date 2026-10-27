import React from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Tag,
  Search,
  Gamepad2,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { SceneMode, WeatherType, CITY_LOCATIONS } from '../types/city';
import { WeatherControls } from './WeatherControls';
import { useInventory } from '../context/InventoryContext';
import { sound } from '../utils/sound';

interface Props {
  currentMode: SceneMode;
  onBackToCity: () => void;
  weather: WeatherType;
  onChangeWeather: (w: WeatherType) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onOpenHouseSearch: () => void;
  onOpenMinigame: (game: 'football' | 'cricket' | 'arcade' | 'cinema' | 'temple') => void;
}

export const QuickActionToolbar: React.FC<Props> = ({
  currentMode,
  onBackToCity,
  weather,
  onChangeWeather,
  showLabels,
  onToggleLabels,
  isMuted,
  onToggleMute,
  onOpenInventory,
  onOpenHouseSearch,
  onOpenMinigame,
}) => {
  const { totalCollected } = useInventory();

  const activeLoc = CITY_LOCATIONS.find((l) => l.id === currentMode);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 p-3 pointer-events-none flex flex-wrap items-center justify-between gap-2">
      {/* Left side: Back to City button or City Brand title */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {currentMode !== 'city' ? (
          <button
            onClick={() => {
              sound.playClick();
              onBackToCity();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-extrabold rounded-2xl shadow-xl transition border-2 border-amber-500 animate-in fade-in"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>← पूरा शहर देखें (Back to City)</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl">
            <span className="text-xl">🏙️</span>
            <div>
              <h1 className="text-xs font-black text-amber-300 tracking-wide uppercase">
                अपनी नगरी 3D
              </h1>
              <p className="text-[10px] text-slate-300 leading-tight">जीवंत शहर व 317 घर</p>
            </div>
          </div>
        )}

        {/* Current interior location badge */}
        {activeLoc && currentMode !== 'city' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 text-xs text-white">
            <span className="text-base">{activeLoc.icon}</span>
            <span className="font-bold text-amber-300">{activeLoc.nameHindi}</span>
          </div>
        )}
      </div>

      {/* Center: Weather System controls */}
      <div className="pointer-events-auto">
        <WeatherControls weather={weather} onChangeWeather={onChangeWeather} />
      </div>

      {/* Right side: Minigame launcher, Inventory, Search, Sound, Labels */}
      <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-xl">
        {/* Minigames quick menu */}
        <div className="relative group">
          <button
            title="इंटरैक्टिव खेल (Minigames)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow transition"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">खेलें (Games)</span>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 hidden group-hover:flex flex-col gap-1 z-50">
            <button
              onClick={() => onOpenMinigame('football')}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-lg text-left"
            >
              <span>⚽</span> फुटबॉल पेनल्टी शूटआउट
            </button>
            <button
              onClick={() => onOpenMinigame('cricket')}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-lg text-left"
            >
              <span>🏏</span> क्रिकेट बैटिंग चैलेंज
            </button>
            <button
              onClick={() => onOpenMinigame('arcade')}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-lg text-left"
            >
              <span>🕹️</span> रेट्रो 8-बिट आर्केड रनर
            </button>
            <button
              onClick={() => onOpenMinigame('cinema')}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-lg text-left"
            >
              <span>🎬</span> थिएटर सीट-फिलिंग शो
            </button>
            <button
              onClick={() => onOpenMinigame('temple')}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-lg text-left"
            >
              <span>🛕</span> मंदिर आरती व घंटी
            </button>
          </div>
        </div>

        {/* Inventory button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenInventory();
          }}
          title="इन्वेंटरी व ट्रॉफियां"
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">इन्वेंटरी</span>
          {totalCollected > 0 && (
            <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {totalCollected}
            </span>
          )}
        </button>

        {/* 317 House Search */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenHouseSearch();
          }}
          title="नई बस्ती (317 घर खोजें)"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <Search className="w-4 h-4 text-pink-400" />
        </button>

        {/* 3D Labels toggle */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleLabels();
          }}
          title={showLabels ? 'नाम छुपाएं' : 'नाम दिखाएं'}
          className={`p-2 rounded-xl transition ${
            showLabels ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'आवाज़ चालू करें' : 'आवाज़ म्यूट करें'}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>
    </div>
  );
};
