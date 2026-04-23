import React, { useMemo } from 'react';
import useMarketData from '../hooks/useMarketData';
import blackScholes from '../utils/blackScholes';
import './OptionsChain.css';

const RISK_FREE_RATE = 0.065;
const DEFAULT_TIME_TO_EXPIRY = 7 / 365;

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return '--';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function generateStrikes(underlying) {
  const step = 50;
  const atm = Math.round(underlying / step) * step;

  return [
    ...Array.from({ length: 5 }, (_, i) => atm - step * (5 - i)),
    ...Array.from({ length: 5 }, (_, i) => atm + step * (i + 1)),
  ];
}

export function OptionsChain({
  interval = '1m',
  timeToExpiry = DEFAULT_TIME_TO_EXPIRY,
  refreshMs = 15000,
}) {
  const { data, loading, error } = useMarketData({ interval, refreshMs });

  const nifty = data['^NSEI'];
  const indiaVix = data['^INDIAVIX'];

  const underlyingPrice =
    toNumber(nifty?.quote?.regularMarketPrice) || toNumber(nifty?.points?.at(-1)?.close);
  const volatility =
    (toNumber(indiaVix?.quote?.regularMarketPrice) || toNumber(indiaVix?.points?.at(-1)?.close) || 0) /
    100;

  const rows = useMemo(() => {
    if (!underlyingPrice || !volatility) return [];

    return generateStrikes(underlyingPrice).map((strike) => {
      const model = blackScholes({
        underlyingPrice,
        strikePrice: strike,
        timeToExpiry,
        volatility,
        riskFreeRate: RISK_FREE_RATE,
      });

      return {
        strike,
        call: model.call,
        put: model.put,
      };
    });
  }, [timeToExpiry, underlyingPrice, volatility]);

  if (loading) {
    return <div className="options-chain status">Loading intraday options model…</div>;
  }

  if (error) {
    return (
      <div className="options-chain status error">
        Failed to fetch market data: {error.message}
      </div>
    );
  }

  return (
    <section className="options-chain card">
      <header className="chain-header">
        <h2>Nifty 50 Intraday Options Chain (Model)</h2>
        <div className="meta">
          <span>Spot: ₹{formatNumber(underlyingPrice)}</span>
          <span>IV (India VIX): {formatNumber(volatility * 100)}%</span>
          <span>RFR: {(RISK_FREE_RATE * 100).toFixed(2)}%</span>
        </div>
      </header>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th colSpan={6}>CALL</th>
              <th>STRIKE</th>
              <th colSpan={6}>PUT</th>
            </tr>
            <tr>
              <th>Price</th>
              <th>Delta</th>
              <th>Gamma</th>
              <th>Theta</th>
              <th>Vega</th>
              <th>Rho</th>
              <th>₹</th>
              <th>Price</th>
              <th>Delta</th>
              <th>Gamma</th>
              <th>Theta</th>
              <th>Vega</th>
              <th>Rho</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.strike}>
                <td>{formatNumber(row.call.price)}</td>
                <td>{formatNumber(row.call.delta, 3)}</td>
                <td>{formatNumber(row.call.gamma, 4)}</td>
                <td>{formatNumber(row.call.theta, 4)}</td>
                <td>{formatNumber(row.call.vega, 4)}</td>
                <td>{formatNumber(row.call.rho, 4)}</td>
                <td className="strike">{formatNumber(row.strike, 0)}</td>
                <td>{formatNumber(row.put.price)}</td>
                <td>{formatNumber(row.put.delta, 3)}</td>
                <td>{formatNumber(row.put.gamma, 4)}</td>
                <td>{formatNumber(row.put.theta, 4)}</td>
                <td>{formatNumber(row.put.vega, 4)}</td>
                <td>{formatNumber(row.put.rho, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default OptionsChain;
