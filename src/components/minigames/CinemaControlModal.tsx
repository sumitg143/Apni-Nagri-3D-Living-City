import React, { useState } from 'react';
import { X, Film, Users, Play, Sparkles } from 'lucide-react';
import { sound } from '../../utils/sound';
import { useInventory } from '../../context/InventoryContext';

interface Props {
  onClose: () => void;
  onFillSeats: () => void;
  onChangeMovie: (genre: string) => void;
  currentGenre: string;
}

export const CinemaControlModal: React.FC<Props> = ({
  onClose,
  onFillSeats,
  onChangeMovie,
  currentGenre,
}) => {
  const { addItem, hasItem } = useInventory();
  const [isPlaying, setIsPlaying] = useState(true);
  const [filledFeedback, setFilledFeedback] = useState(false);

  const movies = [
    { id: 'bollywood', title: 'शोले 3D (Sholay Action)', icon: '🤠', color: 'from-amber-600 to-red-600' },
    { id: 'scifi', title: 'अंतरिक्ष योद्धा (Cyber Space)', icon: '🚀', color: 'from-cyan-600 to-indigo-600' },
    { id: 'comedy', title: 'हेरा फेरी (Hera Pheri Comedy)', icon: '🎭', color: 'from-emerald-600 to-teal-600' },
    { id: 'animation', title: 'जंगल एडवेंचर (Jungle Magic)', icon: '🦁', color: 'from-purple-600 to-pink-600' },
  ];

  const handleFill = () => {
    onFillSeats();
    setFilledFeedback(true);
    sound.playCheer();
    addItem('cinema_ticket');
    setTimeout(() => setFilledFeedback(false), 2400);
  };

  const handleSelectMovie = (id: string) => {
    onChangeMovie(id);
    sound.playClick();
    addItem('cinema_ticket');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden border border-purple-500/30 rounded-2xl bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-purple-500/20 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <div>
              <h3 className="font-bold text-lg text-purple-300">सिनेमा हॉल नियंत्रण (Theater Showtime)</h3>
              <p className="text-xs text-slate-300">हाउसफुल सीटें भरें, मूवी बदलें और टिकट पाएं</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Synchronized Seat Filling Animation Trigger */}
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-sm text-purple-200">सिंक्रनाइज़्ड सीट-फिलिंग एनीमेशन</h4>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                सारे दर्शक एक साथ हॉल में आएंगे, तालियां बजाएंगे और बैठेंगे!
              </p>
            </div>
            <button
              onClick={handleFill}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 text-white font-bold rounded-lg text-xs shadow-lg transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> सीटें भरो!
            </button>
          </div>

          {filledFeedback && (
            <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs font-semibold text-center animate-in fade-in">
              ✨ थिएटर हाउसफुल हो गया! दर्शक तालियां बजा रहे हैं और टिकट इन्वेंटरी में जुड़ गया!
            </div>
          )}

          {/* Movie Showcase Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-purple-400" /> आज का शो / फ़िल्म का चयन करें:
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {movies.map((m) => {
                const isSelected = currentGenre === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMovie(m.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-400 bg-purple-900/60 shadow-md ring-2 ring-purple-500/50'
                        : 'border-slate-700 bg-slate-800/80 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{m.icon}</span>
                      {isSelected && (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                          चल रहा है
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold mt-2 text-slate-200">{m.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-800 flex items-center justify-between border-t border-slate-700">
          <div className="text-xs text-slate-400">
            {hasItem('cinema_ticket') ? (
              <span className="text-purple-400 font-semibold">✓ वीआईपी सिनेमा टिकट इन्वेंटरी में है</span>
            ) : (
              <span>सीटें भर कर टिकट अनलॉक करें</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition"
          >
            वापस 3D हॉल में जाएं
          </button>
        </div>
      </div>
    </div>
  );
};
