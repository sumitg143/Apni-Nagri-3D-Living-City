import React, { useState } from 'react';
import { X, Trophy, Sparkles, MapPin } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { INITIAL_ITEMS_CATALOG, InventoryItem } from '../types/inventory';
import { sound } from '../utils/sound';

interface Props {
  onClose: () => void;
  onNavigateToLocation?: (locationId: string) => void;
}

export const InventoryModal: React.FC<Props> = ({ onClose, onNavigateToLocation }) => {
  const { items, totalCollected, totalCatalog } = useInventory();
  const [filter, setFilter] = useState<'all' | 'trophy' | 'ticket' | 'sacred' | 'artifact'>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const allCatalogList = Object.values(INITIAL_ITEMS_CATALOG);

  const filteredItems = allCatalogList.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'artifact') return item.category === 'artifact' || item.category === 'food';
    return item.category === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-amber-500/30 rounded-2xl bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl">
              🎒
            </div>
            <div>
              <h3 className="font-bold text-lg text-amber-300">नगरी इन्वेंटरी व संग्रह (Nagri Inventory)</h3>
              <p className="text-xs text-slate-300">शहर की गतिविधियों, खेलों और स्थानों से एकत्रित कीमती सामान</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Filter Tabs */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">संग्रह प्रगति:</span>
            <div className="w-32 h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${(totalCollected / totalCatalog) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-amber-400">
              {totalCollected}/{totalCatalog}
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition ${filter === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              सभी ({allCatalogList.length})
            </button>
            <button
              onClick={() => setFilter('trophy')}
              className={`px-3 py-1 rounded-md transition ${filter === 'trophy' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              ट्राफी
            </button>
            <button
              onClick={() => setFilter('sacred')}
              className={`px-3 py-1 rounded-md transition ${filter === 'sacred' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              पवित्र
            </button>
            <button
              onClick={() => setFilter('ticket')}
              className={`px-3 py-1 rounded-md transition ${filter === 'ticket' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              टिकट
            </button>
            <button
              onClick={() => setFilter('artifact')}
              className={`px-3 py-1 rounded-md transition ${filter === 'artifact' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              वस्तुएं
            </button>
          </div>
        </div>

        {/* Item Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.map((catItem) => {
            const userItem = items.find((i) => i.id === catItem.id);
            const isUnlocked = !!userItem;

            return (
              <div
                key={catItem.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedItem((userItem || catItem) as InventoryItem);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? 'border-amber-500/40 bg-slate-800/70 hover:bg-slate-800 hover:border-amber-400 shadow-md'
                    : 'border-slate-800/80 bg-slate-950/40 opacity-60 hover:opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl filter drop-shadow">{catItem.icon}</span>
                    {isUnlocked ? (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-600/40 px-2 py-0.5 rounded-full">
                        x{userItem.count}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">
                        लॉक 🔒
                      </span>
                    )}
                  </div>
                  <h4 className={`text-sm font-bold ${isUnlocked ? 'text-amber-200' : 'text-slate-400'}`}>
                    {catItem.hindiName}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {catItem.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" /> {catItem.source}
                  </span>
                  {isUnlocked && <span className="text-emerald-400 font-bold">✓ अनलॉक</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Item Detail Modal */}
        {selectedItem && (
          <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedItem.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-amber-300">{selectedItem.hindiName}</h4>
                  <span className="text-xs text-slate-400 font-mono">({selectedItem.name})</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{selectedItem.description}</p>
                <div className="text-[11px] text-amber-400 mt-1">स्थान: {selectedItem.source}</div>
              </div>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-white transition self-end sm:self-center"
            >
              बंद करें
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400">
          <span>शहर में घूमते रहें, खेलें और सभी 12 वस्तुएं अनलॉक करें!</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition"
          >
            ठीक है (OK)
          </button>
        </div>
      </div>
    </div>
  );
};
