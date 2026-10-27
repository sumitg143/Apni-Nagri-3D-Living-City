import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, RefreshCw, Trophy } from 'lucide-react';
import { sound } from '../../utils/sound';
import { useInventory } from '../../context/InventoryContext';

interface Props {
  onClose: () => void;
}

export const ArcadeMinigame: React.FC<Props> = ({ onClose }) => {
  const { addItem, hasItem } = useInventory();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const playerRef = useRef({
    x: 50,
    y: 160,
    vy: 0,
    w: 24,
    h: 28,
    isGrounded: true,
  });

  const obstaclesRef = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
  const coinsRef = useRef<{ x: number; y: number; r: number; collected: boolean }[]>([]);
  const frameCountRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const jump = useCallback(() => {
    if (gameState !== 'playing') return;
    if (playerRef.current.isGrounded) {
      playerRef.current.vy = -10;
      playerRef.current.isGrounded = false;
      sound.playClick();
    }
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    playerRef.current = {
      x: 50,
      y: 160,
      vy: 0,
      w: 24,
      h: 28,
      isGrounded: true,
    };
    obstaclesRef.current = [];
    coinsRef.current = [];
    frameCountRef.current = 0;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'playing') {
          jump();
        } else if (gameState === 'start' || gameState === 'gameover') {
          startGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localScore = score;

    const loop = () => {
      if (gameState === 'playing') {
        frameCountRef.current += 1;
        const groundY = 190;

        // Player physics
        const p = playerRef.current;
        p.vy += 0.55; // gravity
        p.y += p.vy;

        if (p.y + p.h >= groundY) {
          p.y = groundY - p.h;
          p.vy = 0;
          p.isGrounded = true;
        }

        // Spawn obstacles
        if (frameCountRef.current % 110 === 0) {
          obstaclesRef.current.push({
            x: 480,
            y: groundY - 24,
            w: 18,
            h: 24,
          });
        }

        // Spawn coins
        if (frameCountRef.current % 80 === 0) {
          coinsRef.current.push({
            x: 480,
            y: groundY - 50 - Math.random() * 30,
            r: 8,
            collected: false,
          });
        }

        // Move obstacles
        obstaclesRef.current.forEach((obs) => {
          obs.x -= 4.2;
          // Collision check
          if (
            p.x < obs.x + obs.w &&
            p.x + p.w > obs.x &&
            p.y < obs.y + obs.h &&
            p.y + p.h > obs.y
          ) {
            // Hit!
            setGameState('gameover');
            sound.playClick();
          }
        });
        obstaclesRef.current = obstaclesRef.current.filter((o) => o.x > -30);

        // Move coins
        coinsRef.current.forEach((c) => {
          c.x -= 4.2;
          // Coin collection
          if (
            !c.collected &&
            p.x < c.x + c.r * 2 &&
            p.x + p.w > c.x - c.r &&
            p.y < c.y + c.r * 2 &&
            p.y + p.h > c.y - c.r
          ) {
            c.collected = true;
            localScore += 20;
            setScore(localScore);
            sound.playArcadeCoin();

            if (localScore >= 100) {
              addItem('arcade_token');
            }
          }
        });
        coinsRef.current = coinsRef.current.filter((c) => c.x > -20 && !c.collected);

        // Passive distance score
        if (frameCountRef.current % 10 === 0) {
          localScore += 1;
          setScore(localScore);
          setHighScore((h) => Math.max(h, localScore));
        }
      }

      // DRAWING
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 480, 240);

      // Distant pixel city skyline
      ctx.fillStyle = '#1e293b';
      for (let i = 0; i < 15; i++) {
        const bx = i * 36;
        const bh = 40 + ((i * 19) % 60);
        ctx.fillRect(bx, 190 - bh, 30, bh);
      }

      // Ground
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 190, 480, 50);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 190, 480, 4);

      // Draw obstacles
      ctx.fillStyle = '#ef4444';
      obstaclesRef.current.forEach((obs) => {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(obs.x + 3, obs.y + 3, obs.w - 6, 4);
        ctx.fillStyle = '#ef4444';
      });

      // Draw coins
      coinsRef.current.forEach((c) => {
        if (c.collected) return;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Player
      const pl = playerRef.current;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      // Face
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(pl.x + 4, pl.y + 4, 16, 12);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(pl.x + 14, pl.y + 8, 3, 3);
      // Legs
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(pl.x + 3, pl.y + 20, 6, 8);
      ctx.fillRect(pl.x + 13, pl.y + 20, 6, 8);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, addItem]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden border border-cyan-500/30 rounded-2xl bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/20 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕹️</span>
            <div>
              <h3 className="font-bold text-lg text-cyan-400">रेट्रो आर्केड रनर (Nagri Pixel Runner)</h3>
              <p className="text-xs text-slate-300">जंप करें (Space / स्क्रीन टैप), कॉइन बटोरें और टोकन जीतें!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Canvas Container */}
        <div
          onClick={jump}
          className="relative w-full aspect-[2/1] bg-slate-950 overflow-hidden cursor-pointer select-none flex items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={240}
            className="w-full h-full object-contain"
          />

          {/* Overlays */}
          {gameState === 'start' && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
              <span className="text-4xl mb-2">👾</span>
              <h4 className="text-xl font-black text-cyan-300">नगरिया 8-बिट आर्केड</h4>
              <p className="text-xs text-slate-300 mt-1 mb-4">रुकावटों से बचें और 100 अंक बनाकर आर्केड टोकन पाएं</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-sm transition shadow-lg transform hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" /> खेल शुरू करें (START GAME)
              </button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
              <span className="text-4xl mb-2">💥</span>
              <h4 className="text-2xl font-black text-red-400">गेम ओवर (GAME OVER)</h4>
              <p className="text-sm text-slate-200 mt-1">आपका स्कोर: <span className="font-bold text-amber-400">{score}</span></p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-sm transition shadow-lg transform hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> दोबारा खेलें (PLAY AGAIN)
              </button>
            </div>
          )}
        </div>

        {/* Footer controls & Jump Button */}
        <div className="p-4 bg-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-lg border border-slate-700">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300">स्कोर:</span>
              <span className="text-sm font-bold text-cyan-300">{score}</span>
            </div>
            {hasItem('arcade_token') && (
              <span className="text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700">
                ✓ आर्केड टोकन अनलॉक
              </span>
            )}
          </div>

          <button
            onClick={jump}
            disabled={gameState !== 'playing'}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 disabled:opacity-40 text-black font-bold rounded-xl text-xs uppercase tracking-wider shadow"
          >
            जंप करें (JUMP)
          </button>
        </div>
      </div>
    </div>
  );
};
