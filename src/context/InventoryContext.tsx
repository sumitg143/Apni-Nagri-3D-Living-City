import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { InventoryItem, INITIAL_ITEMS_CATALOG } from '../types/inventory';
import { sound } from '../utils/sound';

interface InventoryContextType {
  items: InventoryItem[];
  addItem: (id: string) => boolean;
  hasItem: (id: string) => boolean;
  totalCollected: number;
  totalCatalog: number;
  latestUnlocked: InventoryItem | null;
  clearLatestUnlocked: () => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

const STORAGE_KEY = 'apni_nagri_inventory_v1';

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    // Pre-seed with a welcoming starter badge
    return [
      {
        ...INITIAL_ITEMS_CATALOG.plane_ticket,
        unlockedAt: 'अभी-अभी मिला',
        count: 1,
      },
    ];
  });

  const [latestUnlocked, setLatestUnlocked] = useState<InventoryItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = (id: string): boolean => {
    const catalogItem = INITIAL_ITEMS_CATALOG[id];
    if (!catalogItem) return false;

    let isNew = false;
    let unlockedObj: InventoryItem;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === id);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          count: copy[existingIndex].count + 1,
        };
        unlockedObj = copy[existingIndex];
        return copy;
      } else {
        isNew = true;
        unlockedObj = {
          ...catalogItem,
          unlockedAt: 'हाल ही में अनलॉक हुआ',
          count: 1,
        };
        return [...prev, unlockedObj];
      }
    });

    sound.playAchievement();

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    setLatestUnlocked(catalogItem as InventoryItem);
    return isNew;
  };

  const hasItem = (id: string) => {
    return items.some((i) => i.id === id);
  };

  const clearLatestUnlocked = () => {
    setLatestUnlocked(null);
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        addItem,
        hasItem,
        totalCollected: items.length,
        totalCatalog: Object.keys(INITIAL_ITEMS_CATALOG).length,
        latestUnlocked,
        clearLatestUnlocked,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return ctx;
};
