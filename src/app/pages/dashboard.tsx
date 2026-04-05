import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, TrendingUp, TrendingDown, Activity, DollarSign, Zap,
  Play, Pause, Brain, Target, Wifi, WifiOff, RefreshCw, AlertCircle,
  Shield, Cpu, Radio, X, ArrowDownLeft, ArrowUpRight, Lock,
  Clock, Download, Upload,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SupportPanel } from '../components/SupportPanel';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE  = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ?? 'https://ai.traderfive.com';
const WS_BASE   = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WS_URL)  ?? 'wss://ai.traderfive.com';
const SESSION_KEY = 'trading_sim_session_id';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type StrategyId = 'Conservative' | 'Balanced' | 'Aggressive' | 'DeFi';

interface LiveSession {
  id: string;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  tick: number;
  config: { strategy: string; entryAmount: number };
  currentAsset: string;
  signal?: {
    asset: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    side: 'LONG' | 'SHORT';
    confidence: number;
    trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  };
  openPositions: Array<{
    id: string;
    asset: string;
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    currentPrice: number;
    sizeUsd: number;
    quantity: number;
    unrealizedPnl: number;
    unrealizedPnlPct: number;
  }>;
  tradeHistory: Array<{
    id: string;
    asset: string;
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    pnlPct: number;
    reason: string;
    closedAt: string;
  }>;
  performance: {
    startingBalance: number;
    balance: number;
    equity: number;
    totalPnL: number;
    totalPnLPct: number;
    winRate: number;
    totalTrades: number;
    wins: number;
    losses: number;
    activePositions: number;
  };
  feedbackLog: Array<{
    id: string;
    category: string;
    title: string;
    detail: string;
    tick: number;
  }>;
}

// ─── STRATEGIES ───────────────────────────────────────────────────────────────
const aiStrategies = [
  {
    id: 1,
    backendId: 'Conservative' as StrategyId,
    name: 'Conservative Growth',
    description: 'Low-risk strategy focused on stable, long-term gains',
    riskLevel: 'Low',
    riskColor: 'emerald',
    minInvestment: 50,
    expectedReturn: '8-12%',
    duration: '2 weeks',
    icon: Shield,
  },
  {
    id: 2,
    backendId: 'Balanced' as StrategyId,
    name: 'Balanced Momentum',
    description: 'Medium-risk strategy balancing growth and stability',
    riskLevel: 'Medium',
    riskColor: 'cyan',
    minInvestment: 500,
    expectedReturn: '15-25%',
    duration: '2 – 3 weeks',
    icon: Activity,
  },
  {
    id: 3,
    backendId: 'Aggressive' as StrategyId,
    name: 'Aggressive Scalper',
    description: 'High-frequency trading for maximum returns',
    riskLevel: 'High',
    riskColor: 'orange',
    minInvestment: 2500,
    expectedReturn: '30-50%',
    duration: '2 – 3 weeks',
    icon: Zap,
  },
  {
    id: 4,
    backendId: 'DeFi' as StrategyId,
    name: 'DeFi Yield Optimizer',
    description: 'Automated yield farming across multiple protocols',
    riskLevel: 'Medium',
    riskColor: 'violet',
    minInvestment: 1000,
    expectedReturn: '20-35%',
    duration: '2 – 3 weeks',
    icon: Cpu,
  },
];

const fmt = (n: number, d = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const token = user.token ?? '';
  return <AITradingInner user={user} token={token} logout={logout} />;
}

function AITradingInner({ user, token, logout }: { user: any; token: string; logout: () => void }) {
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [pendingExitSummary, setPendingExitSummary] = useState<{
    message: string; returnAmount: number; adjustedProfit: number;
  } | null>(null);
  const isManuallyStoppingRef = useRef(false);
  const intentionalCloseRef = useRef(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const userBalanceRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [scanAngle, setScanAngle] = useState(0);
  const [referralBalance, setReferralBalance] = useState<number>(0);
  const [withdrawingReferral, setWithdrawingReferral] = useState(false);

  // History panel
  const [showHistory, setShowHistory]     = useState(false);
  const [historyTab, setHistoryTab]       = useState<'trades' | 'deposits' | 'withdrawals'>('trades');
  const [historyData, setHistoryData]     = useState<{ trades: any[]; deposits: any[]; withdrawals: any[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  function openHistory() {
    setShowHistory(true);
    if (historyData) return; // already loaded
    setHistoryLoading(true);
    fetch(`${API_BASE}/api/users/${encodeURIComponent(user.email)}/history`)
      .then(r => r.json())
      .then(d => { if (d.success) setHistoryData(d.data); })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }

  // Drawer states
  const [showReceive, setShowReceive] = useState(false);
  const [btcAddress, setBtcAddress]   = useState<string | null>(null);
  const [btcBalance, setBtcBalance]   = useState<number>(0);
  const [btcPrice, setBtcPrice]       = useState<number>(0);
  const [addressLoading, setAddressLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ address: '', amount: '', network: 'BTC' });
  const [sendStep, setSendStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [sendError, setSendError] = useState('');

  // Subscription state
  type SubInfo = { active: boolean; remainingMs: number; expiresAt: string | null; prices: { monthly: number; quarterly: number } };
  const [subscriptions, setSubscriptions] = useState<Record<string, SubInfo>>({});
  const [showSubModal, setShowSubModal]   = useState(false);
  const [subTarget, setSubTarget]         = useState<{ id: string; name: string; prices: { monthly: number; quarterly: number } } | null>(null);
  const [subPlan, setSubPlan]             = useState<'monthly' | 'quarterly'>('monthly');
  const [subLoading, setSubLoading]       = useState(false);
  const [subError, setSubError]           = useState('');
  const [subSuccess, setSubSuccess]       = useState('');

  function loadSubscriptions() {
    if (!user?.email) return;
    fetch(`${API_BASE}/api/users/${encodeURIComponent(user.email)}/subscriptions`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const map: Record<string, SubInfo> = {};
          for (const s of data.data) map[s.strategy] = s;
          setSubscriptions(map);
        }
      }).catch(() => {});
  }

  async function handleSubscribe() {
    if (!subTarget || !user?.email) return;
    setSubLoading(true); setSubError(''); setSubSuccess('');
    try {
      const res  = await fetch(`${API_BASE}/api/users/subscribe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: user.email, strategy: subTarget.id, plan: subPlan }),
      });
      const data = await res.json();
      if (!data.success) {
        setSubError(data.message ?? 'Subscription failed.');
      } else {
        setSubSuccess(`${subTarget.name} unlocked! Your subscription is active.`);
        updateBalance(data.subscription.newBalance);
        loadSubscriptions();
        setTimeout(() => { setShowSubModal(false); setSubSuccess(''); }, 2500);
      }
    } catch { setSubError('Could not connect to server.'); }
    finally { setSubLoading(false); }
  }

  async function openReceive() {
    setShowReceive(true);
    if (btcAddress) return; // already fetched
    setAddressLoading(true);
    try {
      // Fetch address and BTC price in parallel
      const [addrRes, priceRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/${encodeURIComponent(user.email)}/deposit-address`),
        fetch(`${API_BASE}/api/btc-price`),
      ]);
      const addrData  = await addrRes.json();
      const priceData = await priceRes.json();
      if (addrData.success)  setBtcAddress(addrData.address);
      if (priceData.success) setBtcPrice(priceData.price);

      // Also load the user's BTC balance
      const userRes  = await fetch(`${API_BASE}/api/users/${encodeURIComponent(user.email)}`);
      const userData = await userRes.json();
      setBtcBalance(Number(userData?.data?.btc_balance ?? 0));
    } catch {}
    finally { setAddressLoading(false); }
  }

  function copyAddress() {
    if (!btcAddress) return;
    navigator.clipboard.writeText(btcAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSendSubmit() {
    if (!sendForm.address.trim()) { setSendError('Recipient address is required.'); return; }
    if (!sendForm.amount || isNaN(Number(sendForm.amount)) || Number(sendForm.amount) <= 0) {
      setSendError('Enter a valid amount.'); return;
    }
    if (userBalanceRef.current !== null && Number(sendForm.amount) > userBalanceRef.current) {
      setSendError(`Insufficient balance. Available: $${fmt(userBalanceRef.current)}`); return;
    }
    setSendError('');
    setSendStep('confirm');
  }

  function handleSendConfirm() {
    fetch(`${API_BASE}/api/users/${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(async data => {
        const u   = data?.data ?? {};
        const log = [...(u.withdrawal_log ?? []), {
          amount:    Number(sendForm.amount),
          network:   sendForm.network,
          address:   sendForm.address,
          status:    'pending',
          createdAt: new Date().toISOString(),
        }];
        await fetch(`${API_BASE}/api/users/update`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...u, withdrawal_log: log }),
        });
        setHistoryData(null);
      }).catch(() => {});
    setSendStep('done');
  }

  function closeSendDrawer() {
    setShowSend(false);
    setTimeout(() => { setSendStep('form'); setSendForm({ address: '', amount: '', network: 'BTC' }); setSendError(''); }, 300);
  }

  function updateBalance(val: number) {
    userBalanceRef.current = val;
    setUserBalance(val);
  }

  // Rotating scan animation for active AI
  useEffect(() => {
    if (!session || session.status !== 'RUNNING') return;
    const interval = setInterval(() => setScanAngle(a => (a + 2) % 360), 30);
    return () => clearInterval(interval);
  }, [session?.status]);

  const totalProfit = session ? session.performance.totalPnL : null;
  const totalTrades = session ? session.performance.totalTrades : null;
  const winRate = session ? session.performance.winRate : null;
  const isRunning = session?.status === 'RUNNING';

  const activeTrades = session
    ? session.openPositions.map(p => ({
        pair: `${p.asset.replace('USD', '')}/USDT`,
        entry: p.entryPrice,
        current: p.currentPrice,
        profit: `${p.unrealizedPnlPct >= 0 ? '+' : ''}${fmt(p.unrealizedPnlPct)}%`,
        amount: p.quantity,
        isProfit: p.unrealizedPnl >= 0,
        pnl: p.unrealizedPnl,
      }))
    : [];

  useEffect(() => {
    if (!user?.email) return;
    fetch(`${API_BASE}/api/users/${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        // Default to 0 if balance field is missing, null, or empty
        const raw = data?.data?.balance ?? data?.data?.deposit ?? 0;
        updateBalance(Number(raw) || 0);
      })
      .catch(() => updateBalance(0));
    loadSubscriptions();
    // Load referral balance
    fetch(`${API_BASE}/api/users/${encodeURIComponent(user.email)}/referral`)
      .then(r => r.json())
      .then(data => { if (data.success) setReferralBalance(Number(data.data.referral_balance ?? 0)); })
      .catch(() => {});
  }, [user?.email]);

  async function withdrawReferralBalance() {
    if (referralBalance < 0.01 || withdrawingReferral) return;
    setWithdrawingReferral(true);
    try {
      const res  = await fetch(`${API_BASE}/api/users/referral-withdraw`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.success) {
        updateBalance(data.newBalance);
        setReferralBalance(0);
      }
    } catch {}
    finally { setWithdrawingReferral(false); }
  }

  useEffect(() => {
    if (!user?.email) return;
    fetch(`${API_BASE}/api/users/${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        const sessionId = data?.data?.ai_session_id;
        if (!sessionId) return;
        return apiFetch('GET', `/api/sessions/${sessionId}`)
          .then(d => {
            if (d?.success && d.data.status !== 'STOPPED') setSession(d.data);
            else saveUserField({ ai_session_id: null });
          });
      }).catch(() => {});
  }, [user?.email]);

  useEffect(() => {
    if (!session?.id) return;
    connectWs(session.id);
    return () => { intentionalCloseRef.current = true; wsRef.current?.close(); };
  }, [session?.id]);

  useEffect(() => {
    if (session) setAiEnabled(session.status === 'RUNNING');
  }, [session?.status]);

  async function apiFetch(method: string, path: string, body?: unknown) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }

  async function saveUserField(fields: Record<string, any>) {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(user.email)}`);
      const data = await res.json();
      await fetch(`${API_BASE}/api/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(data?.data ?? {}), ...fields }),
      });
    } catch {}
  }

  async function postBalance(newBalance: number) {
    await saveUserField({ balance: newBalance });
    updateBalance(newBalance);
  }

  const connectWs = useCallback((sessionId: string) => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`${WS_BASE}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(JSON.stringify({ type: 'SUBSCRIBE', sessionId }));
      apiFetch('GET', `/api/sessions/${sessionId}`)
        .then(data => { if (data?.success) setSession(data.data); }).catch(() => {});
    };

    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'SESSION_UPDATE') {
          if (isManuallyStoppingRef.current) return;
          setSession(msg.data);
          if (msg.data.status === 'STOPPED' && userBalanceRef.current !== null) {
            const staked = msg.data.config?.entryAmount ?? 0;
            const totalPnL = msg.data.performance?.totalPnL ?? 0;
            const returnAmount = Math.max(0, staked + totalPnL);
            postBalance(userBalanceRef.current + returnAmount);
            saveUserField({ ai_session_id: null });
            intentionalCloseRef.current = true;
            ws.close();
            setSession(null); setAiEnabled(false); setSelectedStrategy(null);
            setInvestmentAmount(''); localStorage.removeItem(SESSION_KEY);
            setError(`Session auto-closed — 98% loss limit reached. $${fmt(returnAmount)} returned to balance.`);
          }
        }
      } catch {}
    };

    ws.onclose = () => {
      setWsConnected(false);
      if (intentionalCloseRef.current) { intentionalCloseRef.current = false; return; }
      setTimeout(() => { if (wsRef.current?.readyState === WebSocket.CLOSED) connectWs(sessionId); }, 3000);
    };

    ws.onerror = () => setWsConnected(false);
  }, [token]);

  async function handleAiToggle() {
    setError(null);
    if (!session) {
      if (!selectedStrategy) { setError('Please select a strategy first.'); return; }
      const strat = aiStrategies.find(s => s.id === selectedStrategy)!;
      const entry = parseFloat(investmentAmount);
      if (isNaN(entry) || entry < strat.minInvestment) {
        setError(`Minimum investment for "${strat.name}" is $${strat.minInvestment.toLocaleString()}.`); return;
      }
      if (userBalanceRef.current === null) { setError('Unable to verify balance.'); return; }
      if (entry > userBalanceRef.current) {
        setError(`Insufficient balance. Available: $${fmt(userBalanceRef.current)}`); return;
      }
      setLoading(true);
      try {
        const data = await apiFetch('POST', '/api/sessions', {
          strategy: strat.backendId, entryAmount: entry, autoSwitchAssets: true, feedbackIntervalTicks: 3,
        });
        if (data.success) {
          await saveUserField({ ai_session_id: data.data.id });
          await postBalance(userBalanceRef.current! - entry);
          setSession(data.data); setAiEnabled(true);
        } else if (data.cooldownRemainingMs) {
          setError(data.message);
        } else {
          setError(data.message ?? 'Failed to start session.');
        }
      } catch { setError('Could not reach the trading server.'); }
      finally { setLoading(false); }
      return;
    }
    const action = session.status === 'RUNNING' ? 'pause' : 'resume';
    const data = await apiFetch('POST', `/api/sessions/${session.id}/${action}`);
    if (data.success) setSession(data.data);
  }

  async function handleStop() {
    if (!session) return;
    setError(null); setLoading(true);
    try {
      // First try stopping directly — backend will block if minimum duration not met
      const stopData = await apiFetch('POST', `/api/sessions/${session.id}/stop`);

      // ── Locked: minimum duration not yet reached ───────────────────────────
      if (stopData.locked) {
        setError(stopData.message);
        setLoading(false);
        return;
      }

      if (!stopData.success) {
        setError(stopData.message ?? 'Could not close session.');
        setLoading(false);
        return;
      }

      // ── Minimum duration met — show confirmation with actual PnL ──────────
      const currentPnL   = stopData?.exitSummary?.adjustedProfit ?? stopData?.data?.performance?.totalPnL ?? 0;
      const staked       = session.config.entryAmount;
      const returnAmount = Math.max(0, staked + currentPnL);

      setPendingExitSummary({
        message: currentPnL >= 0
          ? `Your session has completed its minimum duration. You made $${fmt(currentPnL)} profit. You will receive $${fmt(returnAmount)} back (stake + profit).`
          : `Your session has completed its minimum duration with a loss of $${fmt(Math.abs(currentPnL))}. You will receive $${fmt(returnAmount)} back.`,
        returnAmount,
        adjustedProfit: currentPnL,
      });
      setShowStopConfirm(true);
      setLoading(false);
    } catch {
      setError('Could not reach the server.');
      setLoading(false);
    }
  }

  async function confirmStop() {
    if (!session || !pendingExitSummary) return;
    setShowStopConfirm(false); setLoading(true);
    isManuallyStoppingRef.current = true;
    try {
      intentionalCloseRef.current = true;
      wsRef.current?.close();

      const { returnAmount, adjustedProfit } = pendingExitSummary;
      if (userBalanceRef.current !== null) await postBalance(userBalanceRef.current + returnAmount);
      await saveUserField({ ai_session_id: null });
      setSession(null); setAiEnabled(false); setSelectedStrategy(null);
      setInvestmentAmount(''); localStorage.removeItem(SESSION_KEY); setPendingExitSummary(null);
    } catch {
      setError('Could not close session.');
      apiFetch('POST', `/api/sessions/${session.id}/resume`).catch(() => {});
    } finally { setLoading(false); isManuallyStoppingRef.current = false; }
  }

  function cancelStop() {
    if (!session) return;
    setShowStopConfirm(false); setPendingExitSummary(null);
    apiFetch('POST', `/api/sessions/${session.id}/resume`)
      .then(data => { if (data?.success) setSession(data.data); }).catch(() => {});
  }

  const selectedStrat = aiStrategies.find(s => s.id === selectedStrategy);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace" }}>

      {/* Ambient background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-emerald-500/40 blur-sm pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* ── HEADER ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/30" />
              {isRunning && (
                <>
                  <div className="absolute inset-0 rounded-full border border-emerald-400/20 animate-ping" />
                  <div className="absolute -inset-1 rounded-full border border-emerald-500/10 animate-pulse" />
                </>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                AI <span className="text-emerald-400">TRADING</span>
              </h1>
              <p className="text-xs text-slate-500 tracking-widest uppercase">Neural Execution Engine</p>
            </div>
          </div>

          {/* Controls — horizontally scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 flex-nowrap">
            {/* WS status */}
            {session && (
              <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${
                wsConnected
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                  : 'text-slate-500 border-slate-700 bg-slate-900'
              }`}>
                {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span className="hidden xs:inline">{wsConnected ? 'LIVE' : '…'}</span>
              </div>
            )}

            {/* Balance pill */}
            <div className="flex-shrink-0 flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-xl border border-slate-700 bg-slate-900">
              <div className="px-1">
                <p className="text-xs text-slate-500 uppercase leading-none mb-0.5">Bal</p>
                <p className="text-sm font-bold text-white leading-none">${fmt(userBalance ?? 0)}</p>
              </div>
              {referralBalance > 0 && (
                <>
                  <div className="w-px h-6 bg-slate-700/60" />
                  <div className="px-1">
                    <p className="text-xs text-violet-400/70 uppercase leading-none mb-0.5">Ref</p>
                    <button onClick={withdrawReferralBalance} disabled={withdrawingReferral}
                      className="text-sm font-bold text-violet-400 leading-none hover:text-violet-300 transition-colors disabled:opacity-50"
                      title="Tap to transfer to main balance">
                      {withdrawingReferral ? '…' : `$${fmt(referralBalance)}`}
                    </button>
                  </div>
                </>
              )}
              <div className="w-px h-6 bg-slate-700/60" />
              <button onClick={openReceive}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition-all"
                title="Receive">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">RECV</span>
              </button>
              <button onClick={() => { setShowSend(true); setSendStep('form'); }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-700/50 transition-all"
                title="Send">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SEND</span>
              </button>
            </div>

            {/* History */}
            <button onClick={openHistory}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:text-white"
              title="History">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">HISTORY</span>
            </button>

            {/* Start/Pause */}
            <button onClick={handleAiToggle} disabled={loading}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border ${
                isRunning
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {loading ? '…' : isRunning ? 'PAUSE' : session ? 'RESUME' : 'START'}
            </button>
          </div>
        </div>

        {/* ── ERROR BANNER ── */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
          </div>
        )}

        {/* ── RECEIVE DRAWER ── */}
        {showReceive && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowReceive(false)} />

            {/* Panel */}
            <div className="relative w-full sm:max-w-sm mx-auto bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-slate-700" />
              </div>

              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Receive Funds</p>
                      <p className="text-xs text-slate-500">Deposit via Bitcoin</p>
                    </div>
                  </div>
                  <button onClick={() => setShowReceive(false)} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-lg shadow-black/40 w-[204px] h-[204px] flex items-center justify-center">
                    {addressLoading ? (
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                        <p className="text-xs text-slate-400">Generating…</p>
                      </div>
                    ) : btcAddress ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${btcAddress}&margin=0&color=000000&bgcolor=ffffff`}
                        alt="BTC QR Code"
                        width={180}
                        height={180}
                        className="rounded-lg"
                      />
                    ) : (
                      <p className="text-xs text-slate-400 text-center px-4">Could not load address. Check your XPUB config.</p>
                    )}
                  </div>

                  {/* Network badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <span className="text-xs text-orange-400 font-semibold">BITCOIN NETWORK</span>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 tracking-widest uppercase">Your deposit address</p>
                  <div className="flex items-center gap-2 p-3 bg-slate-800 border border-slate-700 rounded-xl">
                    {addressLoading ? (
                      <span className="text-xs text-slate-600 font-mono flex-1">Deriving address…</span>
                    ) : (
                      <span className="text-xs text-slate-300 font-mono flex-1 break-all leading-relaxed">
                        {btcAddress ?? '—'}
                      </span>
                    )}
                    <button
                      onClick={copyAddress}
                      disabled={!btcAddress || addressLoading}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${
                        copied
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                      }`}
                    >
                      {copied ? (
                        <><Target className="w-3 h-3" /> COPIED</>
                      ) : (
                        <><Radio className="w-3 h-3" /> COPY</>
                      )}
                    </button>
                  </div>
                </div>

                {/* BTC Balance */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">BTC Balance</p>
                    <p className="text-sm font-bold text-white font-mono">
                      {(btcBalance / 1e8).toFixed(8)}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">{btcBalance.toLocaleString()} sats</p>
                  </div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">USD Value</p>
                    <p className="text-sm font-bold text-emerald-400">
                      ${btcPrice > 0 ? fmt((btcBalance / 1e8) * btcPrice) : '—'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      @ ${btcPrice > 0 ? btcPrice.toLocaleString() : '…'}/BTC
                    </p>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500/70 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Only send <span className="text-amber-400/80">Bitcoin (BTC)</span> to this address. Sending any other asset may result in permanent loss.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SEND DRAWER ── */}
        {showSend && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeSendDrawer} />

            {/* Panel */}
            <div className="relative w-full sm:max-w-sm mx-auto bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500/40 to-transparent" />

              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-slate-700" />
              </div>

              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Send Funds</p>
                      <p className="text-xs text-slate-500">Withdraw to external wallet</p>
                    </div>
                  </div>
                  <button onClick={closeSendDrawer} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* ── FORM STEP ── */}
                {sendStep === 'form' && (
                  <div className="space-y-4">
                    {/* Network selector */}
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500 tracking-widest uppercase">Network</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'BTC', label: 'Bitcoin', available: true },
                          { id: 'USDT', label: 'Tether', available: false },
                        ].map(n => (
                          <button
                            key={n.id}
                            onClick={() => n.available && setSendForm(f => ({ ...f, network: n.id }))}
                            disabled={!n.available}
                            className={`relative py-3 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-start gap-0.5 overflow-hidden ${
                              !n.available
                                ? 'bg-slate-800/40 border-slate-800 text-slate-700 cursor-not-allowed'
                                : sendForm.network === n.id
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            <span className="text-sm">{n.id}</span>
                            <span className="text-xs font-normal opacity-60">
                              {n.available ? n.label : 'Unavailable'}
                            </span>
                            {!n.available && (
                              <span className="absolute top-2 right-2 text-[9px] font-bold text-slate-600 tracking-widest uppercase">
                                SOON
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500 tracking-widest uppercase">Recipient Address</p>
                      <input
                        type="text"
                        value={sendForm.address}
                        onChange={e => { setSendForm(f => ({ ...f, address: e.target.value })); setSendError(''); }}
                        placeholder="Enter wallet address…"
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20"
                      />
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 tracking-widest uppercase">Amount (USD)</p>
                        {userBalance !== null && (
                          <button
                            onClick={() => setSendForm(f => ({ ...f, amount: String(userBalance) }))}
                            className="text-xs text-emerald-500 hover:text-emerald-400"
                          >
                            MAX ${fmt(userBalance)}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                        <input
                          type="number"
                          value={sendForm.amount}
                          onChange={e => { setSendForm(f => ({ ...f, amount: e.target.value })); setSendError(''); }}
                          placeholder="0.00"
                          min="0"
                          className="w-full pl-7 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20"
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {sendError && (
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{sendError}
                      </p>
                    )}

                    <button
                      onClick={handleSendSubmit}
                      className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      REVIEW WITHDRAWAL
                    </button>
                  </div>
                )}

                {/* ── CONFIRM STEP ── */}
                {sendStep === 'confirm' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-3">
                      <p className="text-xs text-slate-500 tracking-widest uppercase mb-3">Review Details</p>
                      {[
                        { label: 'Network', value: sendForm.network },
                        { label: 'To', value: sendForm.address, mono: true, truncate: true },
                        { label: 'Amount', value: `$${fmt(Number(sendForm.amount))}` },
                        { label: 'Remaining Balance', value: `$${fmt((userBalance ?? 0) - Number(sendForm.amount))}` },
                      ].map(row => (
                        <div key={row.label} className="flex items-start justify-between gap-3">
                          <span className="text-xs text-slate-500 flex-shrink-0">{row.label}</span>
                          <span className={`text-xs text-white text-right ${row.mono ? 'font-mono' : 'font-semibold'} ${row.truncate ? 'truncate max-w-[160px]' : ''}`}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSendStep('form')}
                        className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-semibold hover:border-slate-500 transition-all"
                      >
                        BACK
                      </button>
                      <button
                        onClick={handleSendConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-all"
                      >
                        CONFIRM SEND
                      </button>
                    </div>
                  </div>
                )}

                {/* ── DONE STEP ── */}
                {sendStep === 'done' && (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">Withdrawal Submitted</p>
                      <p className="text-xs text-slate-500 mt-1">Your request has been received and is being processed.</p>
                    </div>
                    <div className="w-full p-3 bg-slate-800 rounded-xl text-center">
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="text-lg font-bold text-white mt-0.5">${fmt(Number(sendForm.amount))}</p>
                    </div>
                    <button onClick={closeSendDrawer} className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold hover:border-slate-500 transition-all">
                      CLOSE
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY PANEL ── */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Transaction History</p>
                  <p className="text-xs text-slate-500">All your trades, deposits and withdrawals</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 py-3 border-b border-slate-800 flex-shrink-0">
              {([
                { id: 'trades',      label: 'Trades',      icon: Activity },
                { id: 'deposits',    label: 'Deposits',    icon: Download },
                { id: 'withdrawals', label: 'Withdrawals', icon: Upload   },
              ] as const).map(tab => {
                const Icon = tab.icon;
                const count = historyData?.[tab.id]?.length ?? 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setHistoryTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      historyTab === tab.id
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'text-slate-500 hover:text-slate-300 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label.toUpperCase()}
                    {count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        historyTab === tab.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
                      }`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {historyLoading ? (
                <div className="flex items-center justify-center h-40 gap-3 text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading history…</span>
                </div>
              ) : (

                // ── TRADES TAB ──
                historyTab === 'trades' && (
                  <div className="space-y-2">
                    {!historyData?.trades?.length ? (
                      <EmptyState icon={Activity} message="No trades yet. Start a session to begin trading." />
                    ) : (
                      <>
                        {/* Summary row */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[
                            {
                              label: 'Total Trades',
                              value: historyData.trades.length,
                              color: 'text-white',
                            },
                            {
                              label: 'Total Profit',
                              value: `${historyData.trades.reduce((s: number, t: any) => s + (t.pnl ?? 0), 0) >= 0 ? '+' : '-'}$${fmt(Math.abs(historyData.trades.reduce((s: number, t: any) => s + (t.pnl ?? 0), 0)))}`,
                              color: historyData.trades.reduce((s: number, t: any) => s + (t.pnl ?? 0), 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
                            },
                            {
                              label: 'Win Rate',
                              value: `${fmt(historyData.trades.filter((t: any) => t.pnl > 0).length / Math.max(historyData.trades.length, 1) * 100)}%`,
                              color: 'text-cyan-400',
                            },
                          ].map(s => (
                            <div key={s.label} className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Trade rows */}
                        {historyData.trades.map((trade: any, i: number) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              trade.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {trade.pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white font-semibold">{trade.asset}</span>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                  trade.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>{trade.side}</span>
                                <span className="text-xs text-slate-600">{trade.reason?.replace('_', ' ')}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-slate-500">Entry: <span className="text-slate-300">{fmt(trade.entryPrice)}</span></span>
                                <span className="text-xs text-slate-500">Exit: <span className="text-slate-300">{fmt(trade.exitPrice)}</span></span>
                                <span className="text-xs text-slate-600">{trade.strategy}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trade.pnl >= 0 ? '+' : '-'}${fmt(Math.abs(trade.pnl))}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {new Date(trade.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )
              )}

              {/* ── DEPOSITS TAB ── */}
              {!historyLoading && historyTab === 'deposits' && (
                <div className="space-y-2">
                  {!historyData?.deposits?.length ? (
                    <EmptyState icon={Download} message="No deposits yet. Click Receive to fund your account with Bitcoin." />
                  ) : (
                    historyData.deposits.map((d: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0">
                          <Download className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-semibold">Bitcoin Deposit</p>
                          <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                            {d.txHash ? `tx: ${d.txHash.slice(0, 16)}…${d.txHash.slice(-8)}` : 'Confirmed'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-emerald-400">+${fmt(d.usdAmount ?? 0)}</p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {d.satoshis ? `${d.satoshis.toLocaleString()} sats` : ''}
                          </p>
                          <p className="text-xs text-slate-600">
                            {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── WITHDRAWALS TAB ── */}
              {!historyLoading && historyTab === 'withdrawals' && (
                <div className="space-y-2">
                  {!historyData?.withdrawals?.length ? (
                    <EmptyState icon={Upload} message="No withdrawals yet." />
                  ) : (
                    historyData.withdrawals.map((w: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-slate-700/50 text-slate-400 flex items-center justify-center flex-shrink-0">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-semibold">
                            {w.source === 'referral' ? 'Referral Withdrawal' : `Send — ${w.network ?? 'BTC'}`}
                          </p>
                          {w.address && (
                            <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                              to: {w.address.slice(0, 14)}…{w.address.slice(-8)}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-300">
                            -${fmt(Math.abs(w.amount ?? 0))}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SUBSCRIPTION MODAL ── */}
        {showSubModal && subTarget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSubModal(false)} />
            <div className="relative w-full sm:max-w-sm mx-auto bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-slate-700" />
              </div>

              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{subTarget.name}</p>
                      <p className="text-xs text-slate-500">Unlock with a subscription</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSubModal(false)} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Plan selector */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 tracking-widest uppercase">Choose Plan</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'monthly',   label: 'Monthly',   duration: '30 days', price: subTarget.prices.monthly },
                      { id: 'quarterly', label: '3 Months',  duration: '90 days', price: subTarget.prices.quarterly,
                        savings: `Save $${(subTarget.prices.monthly * 3 - subTarget.prices.quarterly)}` },
                    ] as const).map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => setSubPlan(plan.id)}
                        className={`relative p-3 rounded-xl border text-left transition-all ${
                          subPlan === plan.id
                            ? 'border-amber-500/40 bg-amber-500/10'
                            : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {'savings' in plan && (
                          <span className="absolute -top-2 right-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                            {plan.savings}
                          </span>
                        )}
                        <p className={`text-sm font-bold ${subPlan === plan.id ? 'text-amber-400' : 'text-white'}`}>
                          ${plan.price}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{plan.label}</p>
                        <p className="text-xs text-slate-600">{plan.duration}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Balance check */}
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-xs text-slate-500">Your balance</span>
                  <span className={`text-sm font-bold ${(userBalance ?? 0) >= (subPlan === 'monthly' ? subTarget.prices.monthly : subTarget.prices.quarterly) ? 'text-white' : 'text-red-400'}`}>
                    ${fmt(userBalance ?? 0)}
                  </span>
                </div>

                {/* Error / Success */}
                {subError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{subError}
                  </p>
                )}
                {subSuccess && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 flex-shrink-0" />{subSuccess}
                  </p>
                )}

                {/* Subscribe button */}
                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {subLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Subscribe — ${subPlan === 'monthly' ? subTarget.prices.monthly : subTarget.prices.quarterly}</>
                  )}
                </button>
                <p className="text-xs text-slate-600 text-center">
                  Amount deducted from your balance. Auto-renew not enabled.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── STOP CONFIRMATION MODAL ── */}
        {showStopConfirm && pendingExitSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Close Session?</h3>
                  <p className="text-xs text-slate-500">Your funds and profit will be returned</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">{pendingExitSummary.message}</p>
              <div className="flex gap-3">
                <button onClick={cancelStop} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-semibold hover:border-slate-500 transition">
                  Keep Trading
                </button>
                <button onClick={confirmStop} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition disabled:opacity-50">
                  {loading ? 'Closing…' : 'Confirm Close'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {[
            {
              label: 'NET P&L',
              value: totalProfit === null
                ? '—'
                : `${totalProfit >= 0 ? '+' : '-'}$${fmt(Math.abs(totalProfit))}`,
              sub: session
                ? `${session.performance.totalPnLPct >= 0 ? '+' : '-'}${fmt(Math.abs(session.performance.totalPnLPct))}% overall`
                : 'No session',
              color: totalProfit === null ? 'slate' : totalProfit >= 0 ? 'emerald' : 'red',
              icon: DollarSign,
            },
            {
              label: 'TRADES',
              value: totalTrades === null ? '—' : String(totalTrades),
              sub: session ? `${session.performance.activePositions} open` : 'No session',
              color: 'cyan',
              icon: Activity,
            },
            {
              label: 'WIN RATE',
              value: winRate === null ? '—' : `${fmt(winRate)}%`,
              sub: session ? `${session.performance.wins}W / ${session.performance.losses}L` : 'No session',
              color: 'violet',
              icon: Target,
            },
            {
              label: 'AI STATUS',
              value: session ? session.status : 'STANDBY',
              sub: session ? `TICK #${session.tick}` : '24/7 READY',
              color: isRunning ? 'emerald' : 'slate',
              icon: Cpu,
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            const colorMap: Record<string, string> = {
              emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
              red:     'text-red-400     border-red-500/20     bg-red-500/5',
              cyan:    'text-cyan-400    border-cyan-500/20    bg-cyan-500/5',
              violet:  'text-violet-400  border-violet-500/20  bg-violet-500/5',
              slate:   'text-slate-400   border-slate-700      bg-slate-900',
            };
            const cls = colorMap[stat.color] ?? colorMap.slate;
            return (
              <div key={i} className={`rounded-xl border p-4 ${cls}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs tracking-widest opacity-60">{stat.label}</span>
                  <Icon className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs mt-1 opacity-50">{stat.sub}</p>
              </div>
            );
          })}
        </div>

        {/* ── ACTIVE SESSION STRIP ── */}
        {session && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              {/* Scan orb */}
              <div className="relative w-8 h-8 flex-shrink-0">
                <svg className="absolute inset-0 w-8 h-8" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="1" />
                  <line
                    x1="16" y1="16"
                    x2={16 + 12 * Math.cos((scanAngle * Math.PI) / 180)}
                    y2={16 + 12 * Math.sin((scanAngle * Math.PI) / 180)}
                    stroke="rgba(16,185,129,0.7)" strokeWidth="1.5"
                  />
                  <circle cx="16" cy="16" r="2" fill="rgba(16,185,129,0.8)" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">
                  {session.config.strategy.toUpperCase()} · ${session.config.entryAmount.toLocaleString()} DEPLOYED
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  FOCUS: {session.currentAsset}
                  {session.signal && (
                    <span className={`ml-2 ${session.signal.action === 'BUY' ? 'text-emerald-400' : session.signal.action === 'SELL' ? 'text-red-400' : 'text-slate-400'}`}>
                      · {session.signal.action} {session.signal.confidence}% CONF
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleStop}
              className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition"
            >
              STOP
            </button>
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">

          {/* LEFT: Strategy selector */}
          <div className="xl:col-span-1 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs tracking-widest text-slate-500 uppercase">Strategy Matrix</span>
            </div>

            {aiStrategies.map((strategy) => {
              const isActive   = session && session.config.strategy === strategy.backendId;
              const isSelected = selectedStrategy === strategy.id;
              const isFree     = strategy.backendId === 'Conservative';
              const subInfo    = subscriptions[strategy.backendId];
              const isLocked   = !isFree && !subInfo?.active;
              const Icon       = strategy.icon;

              const accentMap: Record<string, string> = {
                emerald: 'border-emerald-500/40 bg-emerald-500/5 shadow-emerald-500/10',
                cyan:    'border-cyan-500/40    bg-cyan-500/5    shadow-cyan-500/10',
                orange:  'border-orange-500/40  bg-orange-500/5  shadow-orange-500/10',
                violet:  'border-violet-500/40  bg-violet-500/5  shadow-violet-500/10',
              };
              const iconColorMap: Record<string, string> = {
                emerald: 'text-emerald-400 bg-emerald-500/10',
                cyan:    'text-cyan-400    bg-cyan-500/10',
                orange:  'text-orange-400  bg-orange-500/10',
                violet:  'text-violet-400  bg-violet-500/10',
              };

              return (
                <div
                  key={strategy.id}
                  onClick={() => {
                    if (isLocked) {
                      setSubTarget({ id: strategy.backendId, name: strategy.name, prices: subInfo?.prices ?? { monthly: 0, quarterly: 0 } });
                      setSubPlan('monthly'); setSubError(''); setSubSuccess('');
                      setShowSubModal(true);
                    } else if (!session) {
                      setSelectedStrategy(strategy.id);
                    }
                  }}
                  className={`relative rounded-xl border p-4 transition-all overflow-hidden ${
                    isLocked
                      ? 'border-slate-800 bg-slate-900/30 cursor-pointer hover:border-slate-600'
                      : isActive
                      ? `${accentMap[strategy.riskColor]} shadow-lg cursor-default`
                      : isSelected && !session
                      ? `${accentMap[strategy.riskColor]} shadow-lg cursor-pointer`
                      : session
                      ? 'border-slate-800 bg-slate-900/50 opacity-40 cursor-default'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 cursor-pointer'
                  }`}
                >
                  {isActive && <div className={`absolute top-0 left-0 right-0 h-px bg-${strategy.riskColor}-400/60`} />}

                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isLocked ? 'bg-slate-800 text-slate-600' : iconColorMap[strategy.riskColor]
                    }`}>
                      {isLocked ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-semibold ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                          {strategy.name}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-xs font-bold text-amber-500/80 border border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5 rounded">
                            PRO
                          </span>
                        )}
                        {!isFree && subInfo?.active && (
                          <span className="text-xs text-emerald-500/70">✓ SUBSCRIBED</span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed ${isLocked ? 'text-slate-600' : 'text-slate-500'}`}>
                        {strategy.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {isLocked ? (
                          <>
                            <span className="text-xs text-amber-500/70 font-semibold">
                              from ${subInfo?.prices?.monthly ?? '?'}/mo
                            </span>
                            <span className="text-xs text-slate-600 ml-auto">TAP TO UNLOCK</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-slate-400">Min <span className="text-white">${strategy.minInvestment}</span></span>
                            <span className="text-xs text-slate-400">Ret <span className="text-emerald-400">{strategy.expectedReturn}</span></span>
                            <span className="text-xs text-slate-400 ml-auto">{strategy.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Investment input */}
            {selectedStrategy && !session && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                <p className="text-xs tracking-widest text-emerald-400 uppercase">Deploy Capital</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="0.00"
                    step="100"
                    min="0"
                    className="w-full pl-7 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder-slate-600"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Min ${selectedStrat?.minInvestment}
                  {userBalance !== null && <span> · Avail <span className="text-white">${fmt(userBalance)}</span></span>}
                </p>
                <button
                  onClick={handleAiToggle}
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {loading ? 'INITIALIZING…' : 'ACTIVATE STRATEGY'}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Trades + Feed */}
          <div className="xl:col-span-2 space-y-5">

            {/* Active Trades */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-white tracking-wide">OPEN POSITIONS</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-slate-500">{isRunning ? 'SCANNING' : session ? 'PAUSED' : 'STANDBY'}</span>
                </div>
              </div>

              {activeTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  {session ? (
                    <>
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
                        <div className="absolute inset-2 rounded-full border border-emerald-500/30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-emerald-500/60" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 tracking-wider">SCANNING MARKETS…</p>
                    </>
                  ) : (
                    <>
                      <Bot className="w-10 h-10 text-slate-700" />
                      <p className="text-sm text-slate-600">No active session</p>
                      <p className="text-xs text-slate-700">Select a strategy to begin</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 overflow-x-auto">
                  {/* Header */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 px-4 sm:px-5 py-2.5 text-xs text-slate-600 tracking-widest uppercase min-w-0">
                    <span>Pair</span>
                    <span className="text-right hidden sm:block">Entry</span>
                    <span className="text-right hidden sm:block">Current</span>
                    <span className="text-right">Size</span>
                    <span className="text-right">P&L</span>
                  </div>
                  {activeTrades.map((trade, index) => (
                    <div key={index} className="grid grid-cols-3 sm:grid-cols-5 px-4 sm:px-5 py-3 hover:bg-slate-800/30 transition-colors min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-5 rounded-full flex-shrink-0 ${trade.isProfit ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-xs sm:text-sm font-semibold text-white truncate">{trade.pair}</span>
                      </div>
                      <span className="text-right text-xs sm:text-sm text-slate-400 hidden sm:block">${trade.entry.toLocaleString()}</span>
                      <span className="text-right text-xs sm:text-sm text-white hidden sm:block">${trade.current.toLocaleString()}</span>
                      <span className="text-right text-xs sm:text-sm text-slate-400">{trade.amount}</span>
                      <span className={`text-right text-xs sm:text-sm font-bold ${trade.isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trade.profit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Feed */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
                <Brain className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-bold text-white tracking-wide">NEURAL FEED</span>
                {session && session.feedbackLog.length > 0 && (
                  <span className="ml-auto text-xs text-slate-600">{session.feedbackLog.length} EVENTS</span>
                )}
              </div>

              {session && session.feedbackLog.length > 0 ? (
                <div className="divide-y divide-slate-800/40 max-h-72 overflow-y-auto">
                  {session.feedbackLog.slice(0, 20).map(entry => {
                    const catColor: Record<string, string> = {
                      TRADE:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      RISK:         'text-amber-400   bg-amber-500/10   border-amber-500/20',
                      SIGNAL:       'text-cyan-400    bg-cyan-500/10    border-cyan-500/20',
                      ASSET_SWITCH: 'text-violet-400  bg-violet-500/10  border-violet-500/20',
                      SUMMARY:      'text-slate-400   bg-slate-500/10   border-slate-500/20',
                      MARKET_SCAN:  'text-blue-400    bg-blue-500/10    border-blue-500/20',
                    };
                    const cls = catColor[entry.category] ?? catColor.SUMMARY;
                    return (
                      <div key={entry.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-800/20 transition-colors">
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-mono flex-shrink-0 mt-0.5 ${cls}`}>
                          {entry.category.slice(0, 3)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-300">{entry.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed truncate">{entry.detail}</p>
                        </div>
                        <span className="text-xs text-slate-700 flex-shrink-0 font-mono">T{entry.tick}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-sm bg-slate-800" style={{ opacity: 0.3 + Math.random() * 0.4 }} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 tracking-wider">AWAITING NEURAL INPUT</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── RISK FOOTER ── */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <AlertCircle className="w-4 h-4 text-amber-500/60 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="text-amber-500/80 font-semibold">RISK NOTICE · </span>
            AI trading involves substantial risk. Past performance does not guarantee future results.
            Algorithms cannot predict all market conditions. Only deploy capital you can afford to lose.
          </p>
        </div>

        {/* ── REFERRAL SECTION ── */}
        <ReferralSection user={user} apiBase={API_BASE} fmt={fmt} />

        {/* ── LOGOUT ── */}
        <div className="flex items-center justify-center pb-4">
          <button
            onClick={logout}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors tracking-widest uppercase"
          >
            Sign out of {user.email}
          </button>
        </div>

      </div>
    </div>

    {/* ── SUPPORT PANEL (floating) ── */}
    <SupportPanel user={user} token={token} />
    </>
  );
}

// ─── EMPTY STATE HELPER ───────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-600" />
      </div>
      <p className="text-sm text-slate-600 text-center max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}

// ─── REFERRAL SECTION COMPONENT ───────────────────────────────────────────────
function ReferralSection({ user, apiBase, fmt }: { user: any; apiBase: string; fmt: (n: number, d?: number) => string }) {
  const [referralCode, setReferralCode] = useState<string>('');
  const [editCode, setEditCode]         = useState('');
  const [editing, setEditing]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState('');
  const [copied, setCopied]             = useState(false);
  const [referralLog, setReferralLog]   = useState<any[]>([]);
  const [totalEarned, setTotalEarned]   = useState(0);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`${apiBase}/api/users/${encodeURIComponent(user.email)}/referral`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setReferralCode(data.data.referral_code ?? '');
          setEditCode(data.data.referral_code ?? '');
          setReferralLog((data.data.referral_log ?? []).slice().reverse().slice(0, 5));
          const total = (data.data.referral_log ?? [])
            .filter((e: any) => e.type !== 'withdrawal')
            .reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
          setTotalEarned(parseFloat(total.toFixed(2)));
        }
      }).catch(() => {});
  }, [user?.email]);

  async function saveCode() {
    setSaving(true); setSaveMsg('');
    try {
      const res  = await fetch(`${apiBase}/api/users/referral-code`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: user.email, code: editCode }),
      });
      const data = await res.json();
      if (data.success) {
        setReferralCode(data.code); setEditCode(data.code);
        setEditing(false); setSaveMsg('Code saved!');
        setTimeout(() => setSaveMsg(''), 2000);
      } else { setSaveMsg(data.message ?? 'Failed to save.'); }
    } catch { setSaveMsg('Could not connect.'); }
    finally { setSaving(false); }
  }

  function copyLink() {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white tracking-wide">REFERRAL PROGRAM</span>
        </div>
        <div className="text-xs text-slate-500">
          Total earned: <span className="text-violet-400 font-semibold">${fmt(totalEarned)}</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Rates */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Per deposit',     value: '$0.50',  sub: 'flat bonus' },
            { label: 'Per profit close', value: '0.15%', sub: 'of trade profit' },
          ].map(item => (
            <div key={item.label} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-bold text-violet-400 mt-0.5">{item.value}</p>
              <p className="text-xs text-slate-600">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Code */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 tracking-widest uppercase">Your Referral Code</p>
          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editCode}
                onChange={e => setEditCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={12}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono tracking-widest focus:outline-none focus:border-violet-500/50"
                placeholder="4–12 characters"
              />
              <button onClick={saveCode} disabled={saving}
                className="px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-bold hover:bg-violet-500/20 transition-all disabled:opacity-50">
                {saving ? '…' : 'SAVE'}
              </button>
              <button onClick={() => { setEditing(false); setEditCode(referralCode); }}
                className="px-3 py-2 rounded-lg border border-slate-700 text-slate-500 text-xs hover:border-slate-500 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <div className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg font-mono tracking-[0.3em] text-white text-sm">
                {referralCode || <span className="text-slate-600 text-xs tracking-normal font-sans">No code set yet</span>}
              </div>
              <button onClick={() => setEditing(true)}
                className="px-3 py-2.5 rounded-lg border border-slate-700 text-slate-400 text-xs hover:border-slate-500 hover:text-white transition-all">
                EDIT
              </button>
              {referralCode && (
                <button onClick={copyLink}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${copied ? 'bg-violet-500/20 border-violet-500/30 text-violet-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  {copied ? 'COPIED!' : 'COPY LINK'}
                </button>
              )}
            </div>
          )}
          {saveMsg && <p className={`text-xs ${saveMsg === 'Code saved!' ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</p>}
        </div>

        {/* Activity log */}
        {referralLog.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 tracking-widest uppercase">Recent Activity</p>
            <div className="space-y-1.5">
              {referralLog.map((entry, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-800/40 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">{entry.description}</p>
                    <p className="text-xs text-slate-600">{new Date(entry.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-bold ${entry.type === 'withdrawal' ? 'text-slate-500' : 'text-violet-400'}`}>
                    {entry.type === 'withdrawal' ? '-' : '+'}${fmt(Number(entry.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}