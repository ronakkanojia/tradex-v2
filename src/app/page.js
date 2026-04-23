import OptionsChain from '../components/OptionsChain';

export default function HomePage() {
  return (
    <main className="app-shell">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />

      <section className="hero glass">
        <p className="eyebrow">Tradex • Intraday Desk</p>
        <h1>Options Intelligence for Nifty Traders</h1>
        <p className="subtitle">
          Live-delayed market feed for <strong>^NSEI</strong> and <strong>^INDIAVIX</strong>, transformed into
          Black-Scholes pricing and Greeks for fast intraday decision support.
        </p>
        <div className="chips">
          <span>Realtime Polling</span>
          <span>Volatility-Aware</span>
          <span>European Pricing Model</span>
          <span>Vercel Ready</span>
        </div>
      </section>

      <section className="panel glass">
        <div className="panel-head">
          <h3>Intraday Model Chain</h3>
          <p>Model assumptions: risk-free rate 6.5%, short-dated expiry window.</p>
        </div>
        <OptionsChain interval="1m" refreshMs={15000} />
      </section>
    </main>
  );
}
