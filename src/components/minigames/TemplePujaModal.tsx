import React, { useState } from 'react';
import { X, Bell, Flame, Sparkles } from 'lucide-react';
import { sound } from '../../utils/sound';
import { useInventory } from '../../context/InventoryContext';

interface Props {
  onClose: () => void;
  onPerformAarti: () => void;
}

export const TemplePujaModal: React.FC<Props> = ({ onClose, onPerformAarti }) => {
  const { addItem, hasItem } = useInventory();
  const [aartiAngle, setAartiAngle] = useState(0);
  const [flowersCount, setFlowersCount] = useState(0);
  const [blessingMessage, setBlessingMessage] = useState<string | null>(null);

  const ringBell = () => {
    sound.playTempleBell();
  };

  const performAarti = () => {
    sound.playTempleBell();
    setAartiAngle((a) => a + 360);
    onPerformAarti();
    addItem('temple_prasad');
    setBlessingMessage('ॐ शांति! भगवान का आशीर्वाद आपको प्राप्त हुआ। पवित्र प्रसाद इन्वेंटरी में शामिल हुआ।');
  };

  const offerFlowers = () => {
    sound.playClick();
    setFlowersCount((f) => f + 1);
    addItem('temple_prasad');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden border border-amber-500/40 rounded-2xl bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/80 to-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛕</span>
            <div>
              <h3 className="font-bold text-lg text-amber-300">मंदिर पूजा व आरती (Temple Sanctum)</h3>
              <p className="text-xs text-amber-200/80">घंटी बजाएं, आरती घुमाएं और पवित्र प्रसाद प्राप्त करें</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sacred Altar View */}
        <div className="relative p-6 flex flex-col items-center bg-gradient-to-b from-amber-950/40 to-slate-900 overflow-hidden">
          {/* Shimmering Diyas */}
          <div className="flex justify-center gap-8 mb-4">
            <span className="text-3xl animate-bounce" style={{ animationDuration: '2s' }}>🪔</span>
            <div className="relative text-center">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-4xl">🕉️</span>
              </div>
              <span className="text-xs font-bold text-amber-300 mt-1 block">श्री विग्रह</span>
            </div>
            <span className="text-3xl animate-bounce" style={{ animationDuration: '2.4s' }}>🪔</span>
          </div>

          {/* Aarti Thali Animation */}
          <div className="relative my-3 flex flex-col items-center">
            <div
              className="w-28 h-28 rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 shadow-2xl flex items-center justify-center transition-transform duration-1000 ease-out cursor-pointer hover:scale-105 active:scale-95"
              style={{ transform: `rotate(${aartiAngle}deg)` }}
              onClick={performAarti}
            >
              <div className="relative text-center">
                <span className="text-3xl filter drop-shadow">🔥</span>
                <span className="text-[10px] font-black text-amber-950 uppercase block">आरती थाली</span>
              </div>
            </div>
            <span className="text-[11px] text-amber-300/80 mt-2">थाल पर क्लिक करके आरती घुमाएं</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            <button
              onClick={ringBell}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold rounded-xl text-xs shadow-md transition"
            >
              <Bell className="w-4 h-4 fill-black" /> घंटी बजाएं (Ring Bell)
            </button>
            <button
              onClick={performAarti}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-95 text-black font-bold rounded-xl text-xs shadow-md transition"
            >
              <Flame className="w-4 h-4 fill-black" /> महा आरती करें (Aarti)
            </button>
          </div>

          <button
            onClick={offerFlowers}
            className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> पुष्प अर्पित करें ({flowersCount} अर्पित)
          </button>

          {blessingMessage && (
            <div className="mt-3 p-3 rounded-xl bg-amber-950/70 border border-amber-400 text-amber-200 text-xs text-center font-medium animate-in fade-in">
              {blessingMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-800 flex items-center justify-between border-t border-slate-700">
          <div className="text-xs text-slate-400">
            {hasItem('temple_prasad') ? (
              <span className="text-amber-400 font-semibold">✓ पवित्र प्रसाद इन्वेंटरी में सुरक्षित है</span>
            ) : (
              <span>पूजा कर प्रसाद प्राप्त करें</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition"
          >
            वापस 3D मंदिर में जाएं
          </button>
        </div>
      </div>
    </div>
  );
};
