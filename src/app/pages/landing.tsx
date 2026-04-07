import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { SEOHead } from "../components/SEOHead";

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

// ─── Live ticker data ─────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { pair: "BTC/USDT", price: 67_420.50, change: +2.34 },
  { pair: "ETH/USDT", price: 3_541.20, change: +1.87 },
  { pair: "SOL/USDT", price: 182.45, change: +4.12 },
  { pair: "XAU/USD",  price: 2_318.70, change: +0.43 },
  { pair: "EUR/USD",  price: 1.0842,   change: -0.12 },
  { pair: "AAPL",     price: 213.40,   change: +1.22 },
  { pair: "QQQ",      price: 481.20,   change: +0.98 },
  { pair: "BTC/USDT", price: 67_420.50, change: +2.34 },
  { pair: "ETH/USDT", price: 3_541.20, change: +1.87 },
  { pair: "SOL/USDT", price: 182.45, change: +4.12 },
];

// ─── Fake live trade feed ─────────────────────────────────────────────────────
const TRADE_TEMPLATES = [
  { user: "usr_7x2k", action: "BUY",  asset: "BTC/USDT", amount: "$1,200", pct: "+3.2%",  strategy: "Balanced" },
  { user: "usr_9mf3", action: "SELL", asset: "ETH/USDT", amount: "$840",   pct: "+5.7%",  strategy: "Aggressive" },
  { user: "usr_3qr8", action: "BUY",  asset: "SOL/USDT", amount: "$500",   pct: "+2.1%",  strategy: "Conservative" },
  { user: "usr_1hs6", action: "SELL", asset: "XAU/USD",  amount: "$2,100", pct: "+1.4%",  strategy: "DeFi" },
  { user: "usr_5np2", action: "BUY",  asset: "BTC/USDT", amount: "$3,500", pct: "+4.8%",  strategy: "Aggressive" },
  { user: "usr_8kw4", action: "BUY",  asset: "AAPL",     amount: "$750",   pct: "+0.9%",  strategy: "Conservative" },
  { user: "usr_2xt9", action: "SELL", asset: "ETH/USDT", amount: "$1,800", pct: "+6.3%",  strategy: "Balanced" },
  { user: "usr_4jm7", action: "BUY",  asset: "QQQ",      amount: "$960",   pct: "+1.7%",  strategy: "DeFi" },
];

const STRATEGIES = [
  {
    name: "Conservative Growth",
    tag: "LOW RISK",
    min: "$50",
    ret: "8–12%",
    dur: "3 weeks",
    color: "#10b981",
    desc: "Steady gains with capital protection. Never lose your principal.",
  },
  {
    name: "Balanced Momentum",
    tag: "MEDIUM RISK",
    min: "$200",
    ret: "15–25%",
    dur: "1 week",
    color: "#06b6d4",
    desc: "Optimised for consistent returns across market conditions.",
  },
  {
    name: "Aggressive Scalper",
    tag: "HIGH RISK",
    min: "$1,000",
    ret: "30–50%",
    dur: "1 week",
    color: "#f97316",
    desc: "High-frequency execution for maximum capital deployment.",
  },
  {
    name: "DeFi Yield Optimizer",
    tag: "YIELD",
    min: "$500",
    ret: "20–35%",
    dur: "1 week",
    color: "#8b5cf6",
    desc: "Automated yield farming. Zero loss guarantee on capital.",
  },
];

const STATS = [
  { label: "Active Traders",   value: 12847,  suffix: "+",  prefix: "" },
  { label: "Total Volume",     value: 94,     suffix: "M+", prefix: "$" },
  { label: "Avg Win Rate",     value: 80,     suffix: "%",  prefix: "" },
  { label: "Strategies Live",  value: 4,      suffix: "",   prefix: "" },
];

// ─── Neural network SVG ───────────────────────────────────────────────────────
function NeuralNet() {
  const nodes = [
    // input layer
    { x: 60, y: 80 }, { x: 60, y: 160 }, { x: 60, y: 240 }, { x: 60, y: 320 },
    // hidden 1
    { x: 180, y: 60 }, { x: 180, y: 140 }, { x: 180, y: 200 }, { x: 180, y: 280 }, { x: 180, y: 340 },
    // hidden 2
    { x: 300, y: 100 }, { x: 300, y: 180 }, { x: 300, y: 260 }, { x: 300, y: 320 },
    // output
    { x: 400, y: 150 }, { x: 400, y: 250 },
  ];
  const edges = [
    [0,4],[0,5],[0,6],[1,4],[1,5],[1,6],[1,7],[2,5],[2,6],[2,7],[2,8],[3,6],[3,7],[3,8],
    [4,9],[4,10],[5,9],[5,10],[5,11],[6,10],[6,11],[6,12],[7,11],[7,12],[8,12],
    [9,13],[9,14],[10,13],[10,14],[11,13],[11,14],[12,14],
  ];
  return (
    <svg viewBox="0 0 460 400" className="w-full h-full opacity-20">
      <defs>
        <radialGradient id="ng" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
      </defs>
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.3"
        />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="5"
          fill="none" stroke="#10b981" strokeWidth="1" strokeOpacity="0.6"
        />
      ))}
    </svg>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function LandingPage() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState(TRADE_TEMPLATES.slice(0, 5));
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Rotate live trade feed
  useEffect(() => {
    let idx = 5;
    const interval = setInterval(() => {
      const newTrade = TRADE_TEMPLATES[idx % TRADE_TEMPLATES.length];
      setTrades(prev => [newTrade, ...prev.slice(0, 4)]);
      idx++;
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Trigger stat counters when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const counters = STATS.map(s => useCounter(s.value, 2200, statsVisible));

  return (
    <div style={{
      background: '#030712',
      fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
      color: '#e2e8f0',
      overflowX: 'hidden',
    }}>
      <SEOHead canonical="/" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #030712; }
        ::-webkit-scrollbar-thumb { background: #10b981; border-radius: 2px; }

        .display-font { font-family: 'Syne', sans-serif; }

        .grid-bg {
          background-image:
            linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track { animation: ticker-scroll 30s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }

        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .pulse-ring { animation: pulse-ring 2s ease-out infinite; }

        @keyframes fade-slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-slide-up 0.6s ease forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.15s; }
        .delay-2 { animation-delay: 0.30s; }
        .delay-3 { animation-delay: 0.45s; }
        .delay-4 { animation-delay: 0.60s; }

        @keyframes trade-in {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .trade-row { animation: trade-in 0.4s ease forwards; }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.15); }
          50%       { box-shadow: 0 0 40px rgba(16,185,129,0.30); }
        }
        .glow-card { animation: glow-pulse 3s ease-in-out infinite; }

        .btn-primary {
          background: #10b981;
          color: #030712;
          border: none;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.05em;
          padding: 14px 36px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.2s;
        }
        .btn-primary:hover::after { background: rgba(255,255,255,0.1); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(16,185,129,0.35); }

        .btn-outline {
          background: transparent;
          color: #94a3b8;
          border: 1px solid #1e293b;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 14px;
          padding: 13px 28px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-outline:hover { border-color: #10b981; color: #10b981; }

        .strategy-card {
          background: rgba(15,23,42,0.6);
          border: 1px solid #0f172a;
          border-radius: 12px;
          padding: 28px;
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
        }
        .strategy-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .strategy-card:hover::before { opacity: 1; }
        .strategy-card:hover {
          border-color: var(--accent);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }

        .stat-card {
          background: rgba(15,23,42,0.5);
          border: 1px solid #0f172a;
          border-radius: 12px;
          padding: 32px 24px;
          text-align: center;
          transition: border-color 0.3s;
        }
        .stat-card:hover { border-color: rgba(16,185,129,0.3); }

        .nav-link {
          color: #64748b;
          font-size: 13px;
          text-decoration: none;
          letter-spacing: 0.06em;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #10b981; }

        .step-num {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          color: #10b981;
          font-weight: 500;
          flex-shrink: 0;
        }

        .faq-item {
          border-bottom: 1px solid #0f172a;
          padding: 20px 0;
          cursor: pointer;
        }
        .faq-item:hover .faq-q { color: #10b981; }

        .testimonial {
          background: rgba(15,23,42,0.5);
          border: 1px solid #0f172a;
          border-radius: 12px;
          padding: 28px;
          transition: border-color 0.3s;
        }
        .testimonial:hover { border-color: rgba(16,185,129,0.2); }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: '1px solid rgba(15,23,42,0.8)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(3,7,18,0.85)',
        padding: '0 max(24px, calc((100vw - 1200px) / 2))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10 L5 6 L8 8 L12 3" stroke="#030712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', color: '#fff' }}>
            trader<span style={{ color: '#10b981' }}>5</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#strategies" className="nav-link">STRATEGIES</a>
          <a href="#how" className="nav-link">HOW IT WORKS</a>
          <a href="#stats" className="nav-link">PERFORMANCE</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-outline" style={{ padding: '8px 20px', fontSize: '13px' }}
            onClick={() => navigate('/signin')}>
            SIGN IN
          </button>
          <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}
            onClick={() => navigate('/signup')}>
            GET STARTED
          </button>
        </div>
      </nav>

      {/* ── TICKER ── */}
      <div style={{
        position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 99,
        borderBottom: '1px solid #0f172a',
        background: 'rgba(3,7,18,0.95)',
        overflow: 'hidden', height: '36px',
        display: 'flex', alignItems: 'center',
      }}>
        <div className="ticker-track" style={{ display: 'flex', gap: '0', whiteSpace: 'nowrap' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '0 24px', borderRight: '1px solid #0f172a',
              fontSize: '11px',
            }}>
              <span style={{ color: '#64748b', letterSpacing: '0.08em' }}>{t.pair}</span>
              <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                {t.price.toLocaleString('en-US', { minimumFractionDigits: t.price < 10 ? 4 : 2 })}
              </span>
              <span style={{ color: t.change >= 0 ? '#10b981' : '#ef4444' }}>
                {t.change >= 0 ? '▲' : '▼'} {Math.abs(t.change)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="grid-bg" style={{
        minHeight: '100vh',
        paddingTop: '120px',
        paddingBottom: '80px',
        padding: '120px max(24px, calc((100vw - 1200px) / 2)) 80px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '60px',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '30%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Left: Copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="fade-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '20px', padding: '6px 14px', marginBottom: '32px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.1em' }}>
              NEURAL TRADING ENGINE — LIVE
            </span>
          </div>

          <h1 className="fade-up delay-1 display-font" style={{
            fontSize: 'clamp(40px, 5vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.05,
            color: '#fff',
            marginBottom: '24px',
          }}>
            Your Money<br />
            Works While<br />
            <span style={{ color: '#10b981' }}>You Sleep.</span>
          </h1>

          <p className="fade-up delay-2" style={{
            fontSize: '16px', color: '#64748b', lineHeight: 1.7,
            marginBottom: '40px', maxWidth: '440px',
          }}>
            AI-powered trading across crypto, forex, gold and equities.
            Start with $50 and watch intelligent algorithms compound your capital — 24/7, no experience needed.
          </p>

          <div className="fade-up delay-3" style={{ display: 'flex', gap: '12px', marginBottom: '48px' }}>
            <button className="btn-primary" onClick={() => navigate('/signup')}>
              START TRADING FREE →
            </button>
            <button className="btn-outline" onClick={() => navigate('/signin')}>
              VIEW DASHBOARD
            </button>
          </div>

          <div className="fade-up delay-4" style={{
            display: 'flex', gap: '32px',
            paddingTop: '32px', borderTop: '1px solid #0f172a',
          }}>
            {[
              { n: '80%', l: 'Avg win rate' },
              { n: '$50', l: 'Min deposit' },
              { n: '4', l: 'AI strategies' },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: '24px', fontWeight: 500, color: '#10b981', fontFamily: 'Syne, sans-serif' }}>{s.n}</div>
                <div style={{ fontSize: '11px', color: '#475569', letterSpacing: '0.06em', marginTop: '2px' }}>{s.l.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live trade feed + neural net */}
        <div className="fade-up delay-2" style={{ position: 'relative' }}>
          {/* Neural net bg */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <NeuralNet />
          </div>

          {/* Terminal card */}
          <div className="glow-card" style={{
            background: 'rgba(10,15,30,0.9)',
            border: '1px solid #0f172a',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Terminal header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative', width: '8px', height: '8px' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981' }} />
                  <div className="pulse-ring" style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '1px solid #10b981',
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', letterSpacing: '0.08em' }}>
                  LIVE TRADE EXECUTION
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#1e293b' }}>trader5.ai</span>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px',
              padding: '10px 20px',
              fontSize: '10px', color: '#1e293b', letterSpacing: '0.1em',
              borderBottom: '1px solid #0a0f1e',
            }}>
              <span>USER</span><span>ACTION</span><span>ASSET</span><span>AMOUNT</span><span>RETURN</span>
            </div>

            {/* Trades */}
            <div style={{ padding: '8px 0' }}>
              {trades.map((t, i) => (
                <div key={`${t.user}-${i}`} className="trade-row" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 80px 80px 80px',
                  padding: '10px 20px',
                  fontSize: '12px',
                  borderBottom: i < trades.length - 1 ? '1px solid #050810' : 'none',
                  transition: 'background 0.2s',
                }}>
                  <span style={{ color: '#475569', fontFamily: 'monospace' }}>{t.user}</span>
                  <span style={{ color: t.action === 'BUY' ? '#10b981' : '#f97316' }}>{t.action}</span>
                  <span style={{ color: '#94a3b8' }}>{t.asset}</span>
                  <span style={{ color: '#e2e8f0' }}>{t.amount}</span>
                  <span style={{ color: '#10b981' }}>{t.pct}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid #0a0f1e',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '11px', color: '#1e293b',
            }}>
              <span>↑ 12,847 positions active globally</span>
              <span style={{ color: '#10b981' }}>94.2% uptime ✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" ref={statsRef} style={{
        padding: '80px max(24px, calc((100vw - 1200px) / 2))',
        borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a',
        background: 'rgba(10,15,25,0.5)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="stat-card">
              <div style={{
                fontSize: 'clamp(36px, 4vw, 52px)',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                color: '#10b981',
                lineHeight: 1,
                marginBottom: '8px',
              }}>
                {s.prefix}{counters[i].toLocaleString()}{s.suffix}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', letterSpacing: '0.1em' }}>
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STRATEGIES ── */}
      <section id="strategies" style={{
        padding: '100px max(24px, calc((100vw - 1200px) / 2))',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{
            display: 'inline-block', fontSize: '11px', color: '#10b981',
            letterSpacing: '0.15em', marginBottom: '16px',
            borderBottom: '1px solid rgba(16,185,129,0.3)', paddingBottom: '8px',
          }}>
            CHOOSE YOUR STRATEGY
          </div>
          <h2 className="display-font" style={{
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800,
            color: '#fff', lineHeight: 1.1,
          }}>
            Four Ways to Grow.<br />
            <span style={{ color: '#10b981' }}>One Platform.</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {STRATEGIES.map(s => (
            <div
              key={s.name}
              className="strategy-card"
              style={{ '--accent': s.color } as any}
              onClick={() => navigate('/signup')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{
                    fontSize: '10px', letterSpacing: '0.12em',
                    color: s.color, marginBottom: '8px',
                    background: `${s.color}15`,
                    border: `1px solid ${s.color}30`,
                    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                  }}>
                    {s.tag}
                  </div>
                  <h3 className="display-font" style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                    {s.name}
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 500, color: s.color, fontFamily: 'Syne, sans-serif' }}>
                    {s.ret}
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.08em' }}>EXPECTED RETURN</div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
                {s.desc}
              </p>

              <div style={{
                display: 'flex', gap: '24px',
                paddingTop: '20px', borderTop: `1px solid ${s.color}15`,
              }}>
                <div>
                  <div style={{ fontSize: '16px', color: '#e2e8f0', fontWeight: 500 }}>{s.min}</div>
                  <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.08em', marginTop: '2px' }}>MIN DEPOSIT</div>
                </div>
                <div>
                  <div style={{ fontSize: '16px', color: '#e2e8f0', fontWeight: 500 }}>{s.dur}</div>
                  <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.08em', marginTop: '2px' }}>DURATION</div>
                </div>
                <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
                  <span style={{
                    fontSize: '11px', color: s.color,
                    letterSpacing: '0.1em',
                  }}>START →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{
        padding: '100px max(24px, calc((100vw - 1200px) / 2))',
        background: 'rgba(10,15,25,0.5)',
        borderTop: '1px solid #0f172a',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.15em', marginBottom: '16px' }}>
            THE PROCESS
          </div>
          <h2 className="display-font" style={{
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#fff',
          }}>
            Up and running in <span style={{ color: '#10b981' }}>3 minutes.</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
          {[
            {
              n: '01', title: 'Create Account',
              body: 'Sign up in seconds. No KYC required for initial access. Your identity stays private.',
              icon: '◉',
            },
            {
              n: '02', title: 'Fund Your Wallet',
              body: 'Deposit Bitcoin to your unique wallet address. Funds appear in your account after 1 confirmation.',
              icon: '⬡',
            },
            {
              n: '03', title: 'Choose a Strategy',
              body: 'Select from 4 AI-powered strategies. Conservative is free. Premium strategies unlock from $50/month.',
              icon: '◈',
            },
          ].map((step, i) => (
            <div key={step.n} style={{
              padding: '40px',
              background: i === 1 ? 'rgba(16,185,129,0.04)' : 'transparent',
              border: '1px solid #0f172a',
              borderRadius: i === 1 ? '12px' : '0',
              position: 'relative',
            }}>
              {i === 1 && (
                <div style={{
                  position: 'absolute', top: 0, left: '20%', right: '20%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                }} />
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div className="step-num">{step.n}</div>
                <div>
                  <h3 className="display-font" style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7 }}>{step.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{
        padding: '100px max(24px, calc((100vw - 1200px) / 2))',
        borderTop: '1px solid #0f172a',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.15em', marginBottom: '16px' }}>
            COMMUNITY
          </div>
          <h2 className="display-font" style={{
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#fff',
          }}>
            What our traders say.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { name: 'Marcus T.', role: 'Conservative Growth', profit: '+$340 in 3 weeks', text: 'Started with $200, made $340 profit. The AI never stopped working even when I was sleeping. Absolutely remarkable.' },
            { name: 'Priya S.', role: 'Balanced Momentum', profit: '+$1,200 in 2 weeks', text: 'The subscription paid for itself in the first 3 trades. I\'ve been compounding ever since. This platform is the real deal.' },
            { name: 'David K.', role: 'DeFi Yield', profit: '+$890 in 2 weeks', text: 'The zero-loss guarantee on DeFi is what sold me. Slow and steady — exactly what I needed. Highly recommend.' },
          ].map(t => (
            <div key={t.name} className="testimonial">
              <div style={{
                fontSize: '24px', color: '#10b981', marginBottom: '16px',
                lineHeight: 1, fontFamily: 'serif',
              }}>"</div>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '24px' }}>{t.text}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{t.role}</div>
                </div>
                <div style={{ fontSize: '16px', color: '#10b981', fontWeight: 500, fontFamily: 'Syne, sans-serif' }}>
                  {t.profit}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{
        padding: '100px max(24px, calc((100vw - 1200px) / 2))',
        background: 'rgba(10,15,25,0.5)',
        borderTop: '1px solid #0f172a',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.15em', marginBottom: '16px' }}>FAQ</div>
            <h2 className="display-font" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Everything you<br />need to know.
            </h2>
            <p style={{ fontSize: '14px', color: '#475569', marginTop: '20px', lineHeight: 1.7 }}>
              Still have questions? Our system is designed to be transparent. Every trade, every signal, every result is logged in your dashboard.
            </p>
            <button className="btn-primary" style={{ marginTop: '32px' }} onClick={() => navigate('/signup')}>
              START FOR FREE →
            </button>
          </div>

          <div>
            {[
              { q: 'Is my principal safe?', a: 'Our simulation engine is designed so your deposited capital is never at risk. Any losses only come from accumulated profits, and the first 5 trades always close positive.' },
              { q: 'How does the AI make trades?', a: 'The neural engine analyzes real market candles from multiple assets, generates buy/sell signals based on momentum and sentiment, and executes at optimal entry points 24/7.' },
              { q: 'Can I withdraw at any time?', a: 'You can pause or stop a session anytime, but withdrawals before the minimum strategy duration apply the session lock — you\'ll be shown the exact unlock time.' },
              { q: 'How do referrals work?', a: 'Share your referral link. You earn $0.50 on every deposit your referrals make, plus 0.15% of their trading profits. Earnings go to your referral balance and can be transferred to your main balance anytime.' },
              { q: 'What currencies are supported?', a: 'Deposits are in Bitcoin (BTC). Your trading balance is denominated in USD. We\'re adding USDT support soon.' },
            ].map((faq, i) => (
              <div key={i} className="faq-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="faq-q" style={{ fontSize: '15px', color: '#e2e8f0', fontWeight: 500, transition: 'color 0.2s' }}>
                    {faq.q}
                  </span>
                  <span style={{ color: '#10b981', fontSize: '18px', lineHeight: 1 }}>+</span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, marginTop: '12px' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{
        padding: '100px max(24px, calc((100vw - 1200px) / 2))',
        borderTop: '1px solid #0f172a',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '20px', padding: '6px 16px', marginBottom: '32px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.1em' }}>
              12,847 TRADERS ACTIVE NOW
            </span>
          </div>
          <h2 className="display-font" style={{
            fontSize: 'clamp(36px, 5vw, 72px)', fontWeight: 800, color: '#fff',
            lineHeight: 1.05, marginBottom: '24px',
          }}>
            Your capital deserves<br />
            <span style={{ color: '#10b981' }}>to work harder.</span>
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
            Join thousands of traders already compounding returns with AI. Start free with the Conservative strategy — no subscription required.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn-primary" style={{ fontSize: '15px', padding: '16px 40px' }} onClick={() => navigate('/signup')}>
              CREATE FREE ACCOUNT →
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#1e293b', marginTop: '20px' }}>
            No credit card required · BTC deposits only · Withdraw anytime after lock period
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '40px max(24px, calc((100vw - 1200px) / 2))',
        borderTop: '1px solid #0f172a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '5px',
            background: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M2 10 L5 6 L8 8 L12 3" stroke="#030712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '15px', color: '#fff' }}>
            trader<span style={{ color: '#10b981' }}>5</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#" className="nav-link">Privacy</a>
          <a href="#" className="nav-link">Terms</a>
          <a href="/risk-disclosure" className="nav-link">Risk Disclosure</a>
        </div>
        <div style={{ fontSize: '11px', color: '#1e293b', letterSpacing: '0.06em' }}>
          © 2026 TRADER5. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}