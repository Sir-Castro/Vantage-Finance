import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface Holding {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  avgBuyPrice: number;
  addedAt: number;
}

interface PortfolioContextType {
  holdings: Holding[];
  addHolding: (holding: Omit<Holding, "id" | "addedAt">) => void;
  removeHolding: (id: string) => void;
  updateHolding: (id: string, updates: Partial<Omit<Holding, "id" | "addedAt">>) => void;
  isLoading: boolean;
}

const STORAGE_KEY = "@cryptorisk_holdings";

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) {
          setHoldings(JSON.parse(data));
        } else {
          const demo: Holding[] = [
            {
              id: "1",
              coinId: "bitcoin",
              symbol: "BTC",
              name: "Bitcoin",
              amount: 0.15,
              avgBuyPrice: 42000,
              addedAt: Date.now() - 86400000 * 30,
            },
            {
              id: "2",
              coinId: "ethereum",
              symbol: "ETH",
              name: "Ethereum",
              amount: 2.5,
              avgBuyPrice: 2200,
              addedAt: Date.now() - 86400000 * 20,
            },
            {
              id: "3",
              coinId: "solana",
              symbol: "SOL",
              name: "Solana",
              amount: 25,
              avgBuyPrice: 95,
              addedAt: Date.now() - 86400000 * 10,
            },
          ];
          setHoldings(demo);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback((updated: Holding[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const addHolding = useCallback(
    (holding: Omit<Holding, "id" | "addedAt">) => {
      const newHolding: Holding = {
        ...holding,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        addedAt: Date.now(),
      };
      setHoldings((prev) => {
        const updated = [...prev, newHolding];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const removeHolding = useCallback(
    (id: string) => {
      setHoldings((prev) => {
        const updated = prev.filter((h) => h.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const updateHolding = useCallback(
    (id: string, updates: Partial<Omit<Holding, "id" | "addedAt">>) => {
      setHoldings((prev) => {
        const updated = prev.map((h) => (h.id === id ? { ...h, ...updates } : h));
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  return (
    <PortfolioContext.Provider
      value={{ holdings, addHolding, removeHolding, updateHolding, isLoading }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
