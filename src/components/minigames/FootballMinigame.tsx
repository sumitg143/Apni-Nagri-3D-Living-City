import React, { useState, useEffect } from 'react';
import { X, Trophy, RefreshCw } from 'lucide-react';
import { sound } from '../../utils/sound';
import { useInventory } from '../../context/InventoryContext';

interface Props {
  onClose: () => void;
}

export const FootballMinigame: React.FC<Props> = ({ onClose }) => {
  const { addItem, hasItem } = useInventory();
  const [selectedAim, setSelectedAim] = useState<'left' | 'center' | 'right' | null>(null);
  const [power, setPower] = useState(65);
  const [isShooting, setIsShooting] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 50, y: 85, scale: 1 });
  const [goaliePos, setGoaliePos] = useState<'left' | 'center' | 'right'>('center');
  const [result, setResult] = useState<'goal' | 'saved' | null>(null);
  const [score, setScore] = useState(0);

  // Power bar animation
  useEffect(() => {
    if (isShooting) return;
    const interval = setInterval(() => {
      setPower((p) => {
        const next = p + 4;
        return next > 95 ? 40 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isShooting]);

  const handleShoot = (aim: 'left' | 'center' | 'right') => {
    if (isShooting) return;
    setSelectedAim(aim);
    setIsShooting(true);
    setResult(null);

    sound.playBatHit();

    // Goalie randomly dives
    const dives: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
    const goalieChoice = dives[Math.floor(Math.random() * dives.length)];
    setGoaliePos(goalieChoice);

    const targetX = aim === 'left' ? 24 : aim === 'center' ? 50 : 76;
    const targetY = 32;

    setBallPos({ x: targetX, y: targetY, scale: 0.55 });

    setTimeout(() => {
      const isGoal = aim !== goalieChoice;
      if (isGoal) {
        setResult('goal');
        setScore((s) => s + 1);
        sound.playCheer();
        addItem('football_trophy');
      } else {
        setResult('saved');
        sound.playClick();
      }
    }, 500);
  };

  const handleReset = () => {
    setIsShooting(false);
    setSelectedAim(null);
    setBallPos({ x: 50, y: 85, scale: 1 });
    setGoaliePos('center');
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden border border-emerald-500/30 rounded-2xl bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/20 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <div>
              <h3 className="font-bold text-lg text-emerald-400">फुटबॉल पेनल्टी शूटआउट (Penalty Kick)</h3>
              <p className="text-xs text-slate-300">दिशा चुनो, गोल दागो और चैंपियन कप जीतो!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stadium Grass Pitch */}
        <div className="relative h-72 w-full bg-gradient-to-b from-emerald-800 to-green-600 flex flex-col justify-between p-4 overflow-hidden select-none">
          {/* Pitch lines */}
          <div className="absolute inset-x-8 top-12 h-36 border-2 border-white/60 border-b-0 rounded-t-sm" />
          <div className="absolute left-1/2 -translate-x-1/2 top-4 w-60 h-28 border-4 border-white bg-emerald-700/40 rounded-t-lg shadow-inner flex items-center justify-center">
            {/* Goal Net Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, #fff, #fff 1px, transparent 1px, transparent 8px)',
              }}
            />

            {/* Goalkeeper */}
            <div
              className={`absolute bottom-1 w-10 h-16 transition-all duration-300 transform ${
                goaliePos === 'left' ? '-translate-x-16' : goaliePos === 'right' ? 'translate-x-16' : 'translate-x-0'
              }`}
            >
              <div className="w-6 h-6 mx-auto rounded-full bg-amber-200 border-2 border-amber-400" />
              <div className="w-8 h-8 mx-auto -mt-1 rounded-md bg-yellow-400 flex items-center justify-center font-bold text-[10px] text-black">
                1
              </div>
              <div className="flex justify-between w-6 mx-auto -mt-0.5">
                <div className="w-2 h-5 bg-blue-900 rounded-b" />
                <div className="w-2 h-5 bg-blue-900 rounded-b" />
              </div>
            </div>
          </div>

          {/* Aim Spot Buttons (Top) */}
          {!isShooting && (
            <div className="absolute top-16 inset-x-12 flex justify-between z-10">
              <button
                onClick={() => handleShoot('left')}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/80 hover:bg-emerald-400 rounded-full shadow text-black transform hover:scale-110 active:scale-95 transition"
              >
                बाएं किक ↖
              </button>
              <button
                onClick={() => handleShoot('center')}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/80 hover:bg-emerald-400 rounded-full shadow text-black transform hover:scale-110 active:scale-95 transition"
              >
                सीधा बीच ⬆
              </button>
              <button
                onClick={() => handleShoot('right')}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/80 hover:bg-emerald-400 rounded-full shadow text-black transform hover:scale-110 active:scale-95 transition"
              >
                दाएं किक ↗
              </button>
            </div>
          )}

          {/* Ball Animation */}
          <div
            className="absolute transition-all duration-500 ease-out z-20 pointer-events-none"
            style={{
              left: `${ballPos.x}%`,
              top: `${ballPos.y}%`,
              transform: `translate(-50%, -50%) scale(${ballPos.scale})`,
            }}
          >
            <div className="w-9 h-9 rounded-full bg-white shadow-lg border border-slate-300 flex items-center justify-center text-lg animate-spin">
              ⚽
            </div>
          </div>

          {/* Penalty Spot */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/70" />

          {/* Result Banner */}
          {result && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 animate-in zoom-in-95 duration-200">
              {result === 'goal' ? (
                <div className="text-center p-4 rounded-xl bg-emerald-900/90 border border-emerald-400">
                  <span className="text-5xl block animate-bounce">⚽🎉</span>
                  <h4 className="text-2xl font-black text-amber-300 uppercase tracking-wider">शानदार गोल! GOAL!!</h4>
                  <p className="text-sm text-emerald-200 mt-1">स्टेडियम गूंज उठा! आपको 'फुटबॉल कप' मिला!</p>
                </div>
              ) : (
                <div className="text-center p-4 rounded-xl bg-red-950/90 border border-red-500">
                  <span className="text-5xl block">🧤🚫</span>
                  <h4 className="text-2xl font-black text-red-300">गोलकीपर ने रोक लिया!</h4>
                  <p className="text-sm text-red-200 mt-1">कोई बात नहीं, दोबारा कोशिश करें!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-lg border border-slate-700">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300 font-medium">कुल गोल:</span>
              <span className="text-sm font-bold text-amber-400">{score}</span>
            </div>
            {hasItem('football_trophy') && (
              <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700">
                ✓ कप इन्वेंटरी में सुरक्षित
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {isShooting && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" /> फिर से खेलें
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
