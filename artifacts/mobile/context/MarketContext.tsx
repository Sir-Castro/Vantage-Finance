import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_24h: number;
  high_24h: number;
  low_24h: number;
  sparkline_in_7d: { price: number[] };
}

export interface WhaleAlert {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  type: "large_buy" | "large_sell" | "volume_spike";
  amount: number;
  usdValue: number;
  timestamp: number;
  severity: "low" | "medium" | "high";
}

interface MarketContextType {
  coins: CoinMarket[];
  isLoading: boolean;
  isError: boolean;
  lastUpdated: number | null;
  refresh: () => void;
  whaleAlerts: WhaleAlert[];
  globalData: {
    totalMarketCap: number;
    totalVolume: number;
    btcDominance: number;
    marketCapChange24h: number;
  } | null;
}

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const COIN_IDS =
  "bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,avalanche-2,chainlink,polkadot,uniswap,litecoin,shiba-inu,tron,matic-network";

const MarketContext = createContext<MarketContextType | null>(null);

function generateWhaleAlerts(coins: CoinMarket[]): WhaleAlert[] {
  const alerts: WhaleAlert[] = [];
  for (const coin of coins) {
    const volumeToMarketCapRatio = coin.total_volume / coin.market_cap;
    if (volumeToMarketCapRatio > 0.15) {
      const severity =
        volumeToMarketCapRatio > 0.35 ? "high" : volumeToMarketCapRatio > 0.25 ? "medium" : "low";
      const type =
        coin.price_change_percentage_24h > 0
          ? "large_buy"
          : coin.price_change_percentage_24h < -2
          ? "large_sell"
          : "volume_spike";
      const estimatedWhaleAmount = coin.total_volume * 0.08;
      alerts.push({
        id: `whale_${coin.id}_${Date.now()}`,
        coinId: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        type,
        amount: estimatedWhaleAmount / coin.current_price,
        usdValue: estimatedWhaleAmount,
        timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        severity,
      });
    }
  }
  return alerts.sort((a, b) => b.usdValue - a.usdValue).slice(0, 8);
}

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState<CoinMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([]);
  const [globalData, setGlobalData] = useState<MarketContextType["globalData"]>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setIsError(false);
      const [marketsRes, globalRes] = await Promise.all([
        fetch(
          `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h`
        ),
        fetch(`${COINGECKO_BASE}/global`),
      ]);

      if (marketsRes.ok) {
        const data: CoinMarket[] = await marketsRes.json();
        setCoins(data);
        setWhaleAlerts(generateWhaleAlerts(data));
        setLastUpdated(Date.now());
      } else {
        setIsError(true);
      }

      if (globalRes.ok) {
        const gData = await globalRes.json();
        const d = gData.data;
        setGlobalData({
          totalMarketCap: d.total_market_cap?.usd ?? 0,
          totalVolume: d.total_volume?.usd ?? 0,
          btcDominance: d.market_cap_percentage?.btc ?? 0,
          marketCapChange24h: d.market_cap_change_percentage_24h_usd ?? 0,
        });
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return (
    <MarketContext.Provider
      value={{
        coins,
        isLoading,
        isError,
        lastUpdated,
        refresh: fetchMarketData,
        whaleAlerts,
        globalData,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within MarketProvider");
  return ctx;
}
