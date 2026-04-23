import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_SYMBOLS = ['^NSEI', '^INDIAVIX'];
const DEFAULT_INTERVAL = '1m';

export function useMarketData({
  functionUrl = process.env.NEXT_PUBLIC_MARKET_DATA_FUNCTION_URL,
  symbols = DEFAULT_SYMBOLS,
  interval = DEFAULT_INTERVAL,
  refreshMs = 15000,
} = {}) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const symbolKey = useMemo(() => symbols.join(','), [symbols]);

  const fetchTicker = useCallback(
    async (symbol) => {
      const qs = new URLSearchParams({ symbol, interval });
      const response = await fetch(`${functionUrl}?${qs.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        const err = new Error(payload?.error || `Failed to fetch ${symbol}`);
        err.status = response.status;
        err.payload = payload;
        throw err;
      }

      return [symbol, payload];
    },
    [functionUrl, interval]
  );

  const refresh = useCallback(async () => {
    if (!functionUrl) {
      setError(new Error('Missing NEXT_PUBLIC_MARKET_DATA_FUNCTION_URL configuration'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(symbols.map(fetchTicker));
      setData(Object.fromEntries(results));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchTicker, functionUrl, symbols]);

  useEffect(() => {
    refresh();

    const timer = setInterval(refresh, refreshMs);
    return () => clearInterval(timer);
  }, [refresh, refreshMs, symbolKey]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

export default useMarketData;
