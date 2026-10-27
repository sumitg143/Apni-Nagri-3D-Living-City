import React, { useState, useEffect } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { TownshipCanvas } from './components/TownshipCanvas';
import { QuickActionToolbar } from './components/QuickActionToolbar';
import { NavigationDock } from './components/NavigationDock';
import { FootballMinigame } from './components/minigames/FootballMinigame';
import { CricketMinigame } from './components/minigames/CricketMinigame';
import { ArcadeMinigame } from './components/minigames/ArcadeMinigame';
import { CinemaControlModal } from './components/minigames/CinemaControlModal';
import { TemplePujaModal } from './components/minigames/TemplePujaModal';
import { InventoryModal } from './components/InventoryModal';
import { HouseSearchModal } from './components/HouseSearchModal';
import { SceneMode, WeatherType, CITY_LOCATIONS } from './types/city';
import { sound } from './utils/sound';

function CityAppContent() {
  const { latestUnlocked, clearLatestUnlocked, addItem } = useInventory();

  const [mode, setMode] = useState<SceneMode>('city');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [showLabels, setShowLabels] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [targetFollow, setTargetFollow] = useState<'train' | 'plane' | 'football' | null>(null);

  // Modals
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isHouseSearchOpen, setIsHouseSearchOpen] = useState(false);
  const [activeMinigame, setActiveMinigame] = useState<'football' | 'cricket' | 'arcade' | 'cinema' | 'temple' | null>(null);

  // Cinema show state
  const [cinemaMovie, setCinemaMovie] = useState('bollywood');
  const [cinemaTriggerCounter, setCinemaTriggerCounter] = useState(0);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 317 Residents List from localStorage
  const [residentsList, setResidentsList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('apni_residents_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Generate default initial residents
    return Array.from({ length: 317 }).map((_, i) =>
      i === 0 ? 'sumit' : i === 4 ? 'nagri_king' : i === 20 ? 'rohit_45' : `resident_${String(i + 1).padStart(3, '0')}`
    );
  });

  const [selectedHouseIndex, setSelectedHouseIndex] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3600);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const handleUpdateResidents = (newList: string[]) => {
    setResidentsList(newList);
    try {
      localStorage.setItem('apni_residents_v1', JSON.stringify(newList));
    } catch {
      // ignore
    }
    showToast(`✅ ${newList.length} नए निवासियों के नाम सेव हुए!`);
  };

  const handleSelectHouse = (index: number) => {
    setSelectedHouseIndex(index);
    const name = residentsList[index] || `resident_${String(index + 1).padStart(3, '0')}`;
    showToast(`🏠 घर नं. ${index + 1} — @${name}`);
  };

  const handleEnterMode = (newMode: SceneMode) => {
    setMode(newMode);
    setTargetFollow(null);

    // Audio cue based on location
    if (newMode === 'mandir') {
      sound.playTempleBell();
      addItem('temple_prasad');
    } else if (newMode === 'police') {
      sound.playPoliceSiren();
      addItem('police_badge');
    } else if (newMode === 'cinema') {
      addItem('cinema_ticket');
    } else if (newMode === 'hotel') {
      addItem('hotel_keycard');
    } else if (newMode === 'restaurant') {
      addItem('royal_thali');
    } else if (newMode === 'library') {
      addItem('library_book');
    } else if (newMode === 'pool') {
      sound.playSplash();
      addItem('swimmer_medal');
    } else if (newMode === 'jhoola') {
      addItem('carnival_token');
    } else if (newMode === 'game') {
      sound.playArcadeCoin();
      addItem('arcade_token');
    } else if (newMode === 'plane') {
      addItem('plane_ticket');
    }

    const loc = CITY_LOCATIONS.find((l) => l.id === newMode);
    if (loc) {
      showToast(`${loc.nameHindi} — ${loc.tagline}`);
    }
  };

  const handleBackToCity = () => {
    setMode('city');
    setTargetFollow(null);
  };

  const handleFollow = (target: 'train' | 'plane' | 'football') => {
    setMode('city');
    setTargetFollow(target);
    const label = target === 'plane' ? 'हवाई जहाज़ का पीछा' : target === 'train' ? 'ट्रेन का पीछा' : 'फुटबॉल का पीछा';
    showToast(`🎥 कैमरा साथ चल रहा है: ${label}`);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Action Toolbar */}
      <QuickActionToolbar
        currentMode={mode}
        onBackToCity={handleBackToCity}
        weather={weather}
        onChangeWeather={setWeather}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenHouseSearch={() => setIsHouseSearchOpen(true)}
        onOpenMinigame={(game) => setActiveMinigame(game)}
      />

      {/* 3D Master City Scene */}
      <TownshipCanvas
        mode={mode}
        weather={weather}
        showLabels={showLabels}
        onEnterMode={handleEnterMode}
        onSelectHouseNotify={(text) => showToast(text)}
        targetFollow={targetFollow}
        onClearFollow={() => setTargetFollow(null)}
        cinemaTriggerCounter={cinemaTriggerCounter}
        selectedHouseIndex={selectedHouseIndex}
      />

      {/* Collapsible Bottom Navigation Dock */}
      <NavigationDock
        currentMode={mode}
        onSelectMode={handleEnterMode}
        onFollow={handleFollow}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-900/95 text-white border border-amber-500/40 shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md max-w-[90vw] text-center">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Latest Unlocked Item Celebration Toast */}
      {latestUnlocked && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-950/95 to-slate-900/95 text-white border-2 border-amber-400 shadow-2xl flex items-center gap-3 animate-in zoom-in-95 duration-300 backdrop-blur-md max-w-sm">
          <span className="text-3xl filter drop-shadow">{latestUnlocked.icon}</span>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-400">नया सामान इन्वेंटरी में शामिल!</div>
            <div className="text-xs font-bold text-amber-200">{latestUnlocked.hindiName}</div>
            <div className="text-[11px] text-slate-300">{latestUnlocked.source} से प्राप्त</div>
          </div>
          <button
            onClick={clearLatestUnlocked}
            className="ml-auto text-xs font-bold px-2 py-1 bg-amber-500 text-black rounded-lg hover:bg-amber-400"
          >
            देखा
          </button>
        </div>
      )}

      {/* Interactive Minigame Modals */}
      {activeMinigame === 'football' && (
        <FootballMinigame onClose={() => setActiveMinigame(null)} />
      )}

      {activeMinigame === 'cricket' && (
        <CricketMinigame onClose={() => setActiveMinigame(null)} />
      )}

      {activeMinigame === 'arcade' && (
        <ArcadeMinigame onClose={() => setActiveMinigame(null)} />
      )}

      {activeMinigame === 'cinema' && (
        <CinemaControlModal
          onClose={() => setActiveMinigame(null)}
          onFillSeats={() => {
            setCinemaTriggerCounter((c) => c + 1);
            showToast('🎬 सभी दर्शक हॉल में पहुंच चुके हैं और शो शुरू हो गया!');
          }}
          onChangeMovie={(genre) => {
            setCinemaMovie(genre);
            showToast(`🍿 फ़िल्म बदल दी गई: ${genre}`);
          }}
          currentGenre={cinemaMovie}
        />
      )}

      {activeMinigame === 'temple' && (
        <TemplePujaModal
          onClose={() => setActiveMinigame(null)}
          onPerformAarti={() => {
            showToast('🪔 आरती संपन्न हुई! भगवान की कृपा आप पर बनी रहे।');
          }}
        />
      )}

      {/* Inventory Modal */}
      {isInventoryOpen && (
        <InventoryModal onClose={() => setIsInventoryOpen(false)} />
      )}

      {/* 317 House Search Modal */}
      {isHouseSearchOpen && (
        <HouseSearchModal
          onClose={() => setIsHouseSearchOpen(false)}
          onSelectHouse={handleSelectHouse}
          residentsList={residentsList}
          onUpdateResidents={handleUpdateResidents}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <CityAppContent />
    </InventoryProvider>
  );
}
