import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, RefreshCw, Zap } from 'lucide-react';
import { sound } from '../../utils/sound';
import { useInventory } from '../../context/InventoryContext';

interface Props {
  onClose: () => void;
}

export const CricketMinigame: React.FC<Props> = ({ onClose }) => {
  const { addItem, hasItem } = useInventory();
  const [runs, setRuns] = useState(0);
  const [ballsFaced, setBallsFaced] = useState(0);
  const [ballState, setBallState] = useState<'waiting' | 'bowling' | 'hit' | 'missed'>('waiting');
  const [timingPercent, setTimingPercent] = useState(0);
  const [shotResult, setShotResult] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startBowling = () => {
    setBallState('bowling');
    setShotResult(null);
    setTimingPercent(0);
    startTimeRef.current = performance.now();

    const duration = 1200; // ms for ball to reach crease

    const animate = (time: number) => {
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setTimingPercent(progress * 100);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Missed swing
        setBallState('missed');
        setShotResult('डॉट बॉल / मिस! (Dot Ball)');
        setBallsFaced((b) => b + 1);
        sound.playClick();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    startBowling();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleBatSwing = () => {
    if (ballState !== 'bowling') return;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const timing = timingPercent; // Perfect sweet spot: 70% to 88%
    sound.playBatHit();

    let scoredRuns = 0;
    let comment = '';

    if (timing >= 74 && timing <= 86) {
      scoredRuns = 6;
      comment = '💥 विशालकाय गगनचुंबी छक्का!! (MAXIMUM 6!)';
      sound.playCheer();
      addItem('cricket_bat');
    } else if (timing >= 65 && timing <= 92) {
      scoredRuns = 4;
      comment = '⚡ गोली की रफ़्तार से चौका!! (FOUR!)';
      sound.playCheer();
      addItem('cricket_bat');
    } else if (timing >= 50 && timing <= 97) {
      scoredRuns = 1;
      comment = '🏃 बढ़िया सिंगल रन (Single)';
    } else {
      scoredRuns = 0;
      comment = '🏏 बल्ला देर/जल्दी घुमाया (Missed Timing)';
      sound.playClick();
    }

    setRuns((r) => r + scoredRuns);
    setBallsFaced((b) => b + 1);
    setShotResult(comment);
    setBallState('hit');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden border border-amber-500/30 rounded-2xl bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-amber-500/20 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏏</span>
            <div>
              <h3 className="font-bold text-lg text-amber-400">क्रिकेट बैटिंग चैलेंज (Nagri Cricket)</h3>
              <p className="text-xs text-slate-300">हरी पट्टी में सही समय पर बल्ला घुमाएं और छक्का जड़ें!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cricket Pitch View */}
        <div className="relative h-72 w-full bg-gradient-to-b from-emerald-900 via-green-800 to-amber-950/60 flex flex-col justify-between p-4 overflow-hidden select-none">
          {/* Pitch 22 yards strip */}
          <div className="absolute left-1/2 -translate-x-1/2 inset-y-0 w-28 bg-amber-200/25 border-x-2 border-amber-400/40 shadow-inner flex flex-col justify-between py-2">
            {/* Bowling Wickets (Far) */}
            <div className="w-8 h-4 mx-auto flex justify-between items-end">
              <div className="w-1 h-3 bg-white" />
              <div className="w-1 h-3 bg-white" />
              <div className="w-1 h-3 bg-white" />
            </div>

            {/* Bowling Crease */}
            <div className="w-full h-0.5 bg-white/70" />

            {/* Batting Crease */}
            <div className="w-full h-1 bg-white" />

            {/* Batsman Wickets (Near) */}
            <div className="w-14 h-8 mx-auto flex justify-between items-end">
              <div className="w-1.5 h-7 bg-amber-400 rounded-t" />
              <div className="w-1.5 h-7 bg-amber-400 rounded-t" />
              <div className="w-1.5 h-7 bg-amber-400 rounded-t" />
            </div>
          </div>

          {/* Bowler Avatar (Far) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-center">
            <div className="text-xs font-bold text-amber-300 bg-slate-900/70 px-2 py-0.5 rounded-full border border-amber-500/40">
              गेंदबाज़ (Fast Bowler)
            </div>
          </div>

          {/* Ball Traveling down pitch */}
          {ballState === 'bowling' && (
            <div
              className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-600 shadow-md border border-red-300 transition-all pointer-events-none"
              style={{
                top: `${8 + timingPercent * 0.72}%`,
                transform: `translateX(-50%) scale(${0.4 + (timingPercent / 100) * 1.2})`,
              }}
            />
          )}

          {/* Batsman (Near bottom) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-x-10 text-center pointer-events-none">
            <div className="text-4xl filter drop-shadow">🏏</div>
          </div>

          {/* Timing Meter Bar */}
          <div className="absolute bottom-16 inset-x-8 bg-slate-900/90 rounded-xl p-2.5 border border-slate-700 shadow-xl">
            <div className="flex justify-between text-[11px] text-slate-300 mb-1 font-semibold">
              <span>बॉलिंग शुरू</span>
              <span className="text-emerald-400 font-bold">★ परफेक्ट टाइमिंग ज़ोन (छक्का) ★</span>
              <span>क्रीज़</span>
            </div>
            <div className="relative w-full h-4 bg-slate-700 rounded-full overflow-hidden">
              {/* Sweet spot highlight */}
              <div className="absolute left-[72%] w-[16%] h-full bg-emerald-500/80 animate-pulse" />
              <div className="absolute left-[64%] w-[28%] h-full bg-amber-500/40" />

              {/* Indicator needle */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-white shadow-md transform -translate-x-1/2 rounded-full transition-all"
                style={{ left: `${timingPercent}%` }}
              />
            </div>
          </div>

          {/* Shot Result Banner */}
          {shotResult && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 animate-in zoom-in-95 duration-150">
              <div className="text-center p-4 rounded-xl bg-slate-900/95 border border-amber-400 max-w-xs shadow-2xl">
                <h4 className="text-lg font-black text-amber-300">{shotResult}</h4>
                <p className="text-xs text-slate-300 mt-1">
                  {shotResult.includes('छक्का') || shotResult.includes('चौका')
                    ? '🎉 बाउंड्री! आपको गोल्डन बल्ला प्राप्त हुआ!'
                    : 'अगली गेंद पर छक्का लगाने का प्रयास करें!'}
                </p>
                <button
                  onClick={startBowling}
                  className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs shadow flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> अगली गेंद खेलें (Next Ball)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Big Bat Swing Action Button & Stats */}
        <div className="p-4 bg-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-lg border border-slate-700">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300">रन:</span>
              <span className="text-sm font-bold text-amber-400">{runs}</span>
              <span className="text-[11px] text-slate-400">({ballsFaced} गेंदें)</span>
            </div>
            {hasItem('cricket_bat') && (
              <span className="text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700">
                ✓ बल्ला इन्वेंटरी में
              </span>
            )}
          </div>

          <div>
            <button
              onClick={handleBatSwing}
              disabled={ballState !== 'bowling'}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black rounded-xl text-sm transition shadow-lg"
            >
              <Zap className="w-4 h-4 fill-black" /> शॉट मारो! (HIT SHOT)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
