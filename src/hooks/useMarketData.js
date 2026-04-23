import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_SYMBOLS = ['^NSEI', '^INDIAVIX'];
const DEFAULT_INTERVAL = '1m';

function parseJsonSafe(response) {
  return response
    .json()
    .catch(() => ({}));
}

export function useMarketData({
  functionUrl = process.env.NEXT_PUBLIC_MARKET_DATA_FUNCTION_URL,
  symbols = DEFAULT_SYMBOLS,
  interval = DEFAULT_INTERVAL,
  refreshMs = 15000,
} = {}) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const isMountedRef = useRef(true);

  const stableSymbols = useMemo(
    () => Array.from(new Set(symbols.map((symbol) => String(symbol).trim()).filter(Boolean))),
    [symbols]
  );
  const symbolKey = useMemo(() => stableSymbols.join(','), [stableSymbols]);

  const fetchTicker = useCallback(
    async (symbol, signal) => {
      const qs = new URLSearchParams({ symbol, interval });
      const response = await fetch(`${functionUrl}?${qs.toString()}`, { signal });
      const payload = await parseJsonSafe(response);

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

    const controller = new AbortController();

    try {
      const results = await Promise.all(stableSymbols.map((symbol) => fetchTicker(symbol, controller.signal)));
      if (!isMountedRef.current) return;
      setData(Object.fromEntries(results));
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      if (!isMountedRef.current || err?.name === 'AbortError') return;
      setError(err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }

    return () => controller.abort();
  }, [fetchTicker, functionUrl, stableSymbols]);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelCurrent;

    const run = async () => {
      cancelCurrent = await refresh();
    };

    run();
    const timer = setInterval(run, refreshMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
      if (typeof cancelCurrent === 'function') {
        cancelCurrent();
      }
    };
  }, [refresh, refreshMs, symbolKey]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated,
  };
}

export default useMarketData;
