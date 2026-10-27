import React, { useState } from 'react';
import { X, Search, Home, Save, Check } from 'lucide-react';
import { sound } from '../utils/sound';

interface Props {
  onClose: () => void;
  onSelectHouse: (index: number) => void;
  residentsList: string[];
  onUpdateResidents: (list: string[]) => void;
}

export const HouseSearchModal: React.FC<Props> = ({
  onClose,
  onSelectHouse,
  residentsList,
  onUpdateResidents,
}) => {
  const [query, setQuery] = useState('');
  const [customListText, setCustomListText] = useState('');
  const [showPasteList, setShowPasteList] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const totalHouses = 317;

  const handleSearch = () => {
    sound.playClick();
    const q = query.trim().replace(/^@/, '').toLowerCase();
    if (!q) return;

    // Check by number first (e.g. "45" or "घर 45")
    const num = parseInt(q.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num >= 1 && num <= totalHouses) {
      onSelectHouse(num - 1);
      onClose();
      return;
    }

    // Search by resident username
    const foundIndex = residentsList.findIndex((name) =>
      name.toLowerCase().includes(q)
    );

    if (foundIndex >= 0) {
      onSelectHouse(foundIndex);
      onClose();
    } else {
      // Default to house 1 if not found or pick random
      alert(`नाम '@${query}' नहीं मिला! आप अपनी पसंद का घर चुन सकते हैं या नीचे लिस्ट पेस्ट कर सकते हैं।`);
    }
  };

  const handleSaveCustomList = () => {
    const lines = customListText
      .split('\n')
      .map((s) => s.trim().replace(/^@/, ''))
      .filter(Boolean);

    if (lines.length > 0) {
      onUpdateResidents(lines);
      sound.playAchievement();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden border border-pink-500/30 rounded-2xl bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-pink-500/20 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏘️</span>
            <div>
              <h3 className="font-bold text-lg text-pink-400">नई बस्ती — 317 घर खोजो</h3>
              <p className="text-xs text-slate-300">घर नंबर या Instagram नाम से अपना मकान ढूंढें</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="घर नं. (जैसे 42) या नाम (sumit)..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl text-sm transition shadow flex items-center gap-1.5"
            >
              खोजो
            </button>
          </div>

          {/* Quick House shortcuts */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <span className="text-xs text-slate-400 font-semibold mb-2 block">
              त्वरित चयन (Quick Jump):
            </span>
            <div className="flex flex-wrap gap-2">
              {[1, 21, 55, 100, 150, 200, 250, 317].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    sound.playClick();
                    onSelectHouse(num - 1);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-pink-900/60 hover:text-pink-300 border border-slate-600 text-xs font-mono transition"
                >
                  घर #{num}
                </button>
              ))}
            </div>
          </div>

          {/* Paste list accordian */}
          <div className="border border-slate-700/80 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowPasteList(!showPasteList)}
              className="w-full px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between"
            >
              <span>📋 नाम लिस्ट जोड़ें (Instagram फ़ॉलोअर्स)</span>
              <span>{showPasteList ? '▲' : '▼'}</span>
            </button>

            {showPasteList && (
              <div className="p-3 bg-slate-950 space-y-2">
                <textarea
                  rows={4}
                  value={customListText}
                  onChange={(e) => setCustomListText(e.target.value)}
                  placeholder="हर लाइन में एक नाम लिखें (उदा. sumit, rohit, priya)..."
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveCustomList}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                >
                  {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {savedSuccess ? 'लिस्ट सेव हो गई!' : 'लिस्ट सेव करें'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-800/80 flex items-center justify-between border-t border-slate-700 text-xs text-slate-400">
          <span>कुल 317 परिवार अपनी नगरी में निवास करते हैं</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            बंद
          </button>
        </div>
      </div>
    </div>
  );
};
