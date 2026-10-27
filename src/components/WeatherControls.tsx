import React from 'react';
import { Sun, CloudRain, Snowflake, Moon } from 'lucide-react';
import { WeatherType } from '../types/city';
import { sound } from '../utils/sound';

interface Props {
  weather: WeatherType;
  onChangeWeather: (w: WeatherType) => void;
}

export const WeatherControls: React.FC<Props> = ({ weather, onChangeWeather }) => {
  const options: { id: WeatherType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'sunny', label: 'धूप (Sunny)', icon: <Sun className="w-3.5 h-3.5 text-amber-400" />, color: 'hover:border-amber-400' },
    { id: 'rain', label: 'बारिश (Rain)', icon: <CloudRain className="w-3.5 h-3.5 text-blue-400" />, color: 'hover:border-blue-400' },
    { id: 'snow', label: 'बर्फ (Snow)', icon: <Snowflake className="w-3.5 h-3.5 text-cyan-300" />, color: 'hover:border-cyan-300' },
    { id: 'night', label: 'रात (Night)', icon: <Moon className="w-3.5 h-3.5 text-indigo-300" />, color: 'hover:border-indigo-400' },
  ];

  const handleSelect = (id: WeatherType) => {
    sound.playClick();
    onChangeWeather(id);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl">
      {options.map((opt) => {
        const isActive = weather === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-slate-700 text-white shadow-sm ring-1 ring-white/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            } ${opt.color}`}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
