import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from '../hooks/useAuth';
import {
  Users, Activity, TrendingUp, DollarSign, RefreshCw,
  CheckCircle, XCircle, Clock, AlertCircle, LogOut,
  Shield, Zap, BarChart2, Wallet, ChevronDown, ChevronUp,
  MessageSquare, Send,
} from 'lucide-react';

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ?? 'https://ai.traderfive.com';
const fmt = (n: number, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// ─── Route guard ──────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { user, logout } = useAdminAuth();
  if (!user || user.role !== 'ai_admin') return null;
  return <AdminInner user={user} logout={logout} />;
}

// ─── Main component ───────────────────────────────────────────────────────────
function AdminInner({ user, logout }: { user: any; logout: () => void }) {

  // ── General state ──
  const [stats, setStats]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg]   = useState('');
  const [activeTab, setActiveTab]   = useState<'overview'|'withdrawals'|'tickets'|'users'|'subscriptions'>('overview');

  // ── Users state ──
  const [users, setUsers]           = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // ── Withdrawal decline modal ──
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState<{ email: string; index: number } | null>(null);

  // ── Tickets state ──
  const [tickets, setTickets]             = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeTicket, setActiveTicket]   = useState<any | null>(null);
  const [replyText, setReplyText]         = useState('');
  const [replySending, setReplySending]   = useState(false);
  const [ticketStatus, setTicketStatus]   = useState('');
  const ticketBottomRef                   = useRef<HTMLDivElement>(null);

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    'open':        { label: 'Open',        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
    'in-progress': { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
    'resolved':    { label: 'Resolved',    color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
    'closed':      { label: 'Closed',      color: '#475569', bg: 'rgba(71,85,105,0.1)'   },
  };

  // ── API helper ──
  const token = user.token ?? localStorage.getItem('trader5_token') ?? '';
  const apiFetch = useCallback(async (method: string, path: string, body?: any) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }, [token]);

  // ── Data loaders ──
  async function loadStats() {
    setLoading(true); setError('');
    try {
      const data = await apiFetch('GET', '/api/admin/stats');
      if (data.success) setStats(data.data);
      else setError(data.message ?? 'Failed to load stats.');
    } catch { setError('Could not connect to server.'); }
    finally { setLoading(false); }
  }

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const data = await apiFetch('GET', '/api/admin/users');
      if (data.success) setUsers(data.data);
    } catch {}
    finally { setUsersLoading(false); }
  }

  async function loadTickets() {
    setTicketsLoading(true);
    try {
      const data = await apiFetch('GET', '/api/admin/tickets');
      if (data.success) setTickets(data.data);
    } catch {}
    finally { setTicketsLoading(false); }
  }

  // ── Effects ──
  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (activeTab === 'users'   && !users.length)   loadUsers();   }, [activeTab]);
  useEffect(() => { if (activeTab === 'tickets' && !tickets.length) loadTickets(); }, [activeTab]);

  // Poll active ticket every 4s while thread is open in admin
  useEffect(() => {
    if (activeTab !== 'tickets' || !activeTicket) return;

    const poll = async () => {
      try {
        const data = await apiFetch('GET', `/api/tickets/${activeTicket.id}`);
        if (!data.success) return;
        if (data.data.messages.length !== activeTicket.messages.length) {
          setActiveTicket(data.data);
          setTickets(prev => prev.map((t: any) =>
            t.id === data.data.id ? { ...t, unreadAdmin: 0 } : t
          ));
          setTimeout(() => ticketBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      } catch {}
    };

    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [activeTab, activeTicket?.id]);

  // ── Withdrawal actions ──
  async function approveWithdrawal(userEmail: string, index: number) {
    setActionLoading(`a-${userEmail}-${index}`); setActionMsg('');
    try {
      const data = await apiFetch('POST', `/api/admin/withdrawal/${encodeURIComponent(userEmail)}/${index}/approve`);
      if (data.success) { setActionMsg(`✓ Approved for ${userEmail}`); loadStats(); }
      else setActionMsg(data.message ?? 'Failed.');
    } catch { setActionMsg('Error.'); }
    finally { setActionLoading(null); }
  }

  async function declineWithdrawal(userEmail: string, index: number) {
    setActionLoading(`d-${userEmail}-${index}`); setActionMsg('');
    try {
      const data = await apiFetch('POST', `/api/admin/withdrawal/${encodeURIComponent(userEmail)}/${index}/decline`, {
        reason: declineReason || 'Declined by admin',
      });
      if (data.success) {
        setActionMsg(`✓ Declined and refunded to ${userEmail}`);
        setShowDeclineModal(null); setDeclineReason(''); loadStats();
      } else setActionMsg(data.message ?? 'Failed.');
    } catch { setActionMsg('Error.'); }
    finally { setActionLoading(null); }
  }

  // ── Ticket actions ──
  async function openAdminTicket(ticket: any) {
    const data = await apiFetch('GET', `/api/tickets/${ticket.id}`);
    if (data.success) { setActiveTicket(data.data); setTicketStatus(data.data.status); }
    setTimeout(() => ticketBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function sendReply() {
    if (!replyText.trim() || !activeTicket) return;
    setReplySending(true);
    try {
      const data = await apiFetch('POST', `/api/tickets/${activeTicket.id}/messages`, { message: replyText.trim() });
      if (data.success) {
        setActiveTicket(data.data);
        setTickets(prev => prev.map((t: any) => t.id === data.data.id ? data.data : t));
        setReplyText('');
        setTimeout(() => ticketBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch {}
    finally { setReplySending(false); }
  }

  async function changeTicketStatus(status: string) {
    if (!activeTicket) return;
    await apiFetch('PATCH', `/api/tickets/${activeTicket.id}/status`, { status });
    setActiveTicket((t: any) => ({ ...t, status }));
    setTicketStatus(status);
    setTickets(prev => prev.map((t: any) => t.id === activeTicket.id ? { ...t, status } : t));
  }

  const tabs = [
    { id: 'overview',      label: 'Overview',      icon: BarChart2     },
    { id: 'withdrawals',   label: 'Withdrawals',   icon: Wallet        },
    { id: 'tickets',       label: 'Support',       icon: MessageSquare },
    { id: 'users',         label: 'Users',         icon: Users         },
    { id: 'subscriptions', label: 'Subscriptions', icon: Zap           },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', background: '#030712', fontFamily: "'DM Mono','Fira Code','Courier New',monospace", color: '#e2e8f0' }}>
      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(16,185,129,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.02) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #0f172a', background: 'rgba(3,7,18,0.95)', backdropFilter: 'blur(20px)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color="#10b981" />
          </div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '16px', color: '#fff' }}>
            trader<span style={{ color: '#10b981' }}>5</span>
            <span style={{ fontSize: '11px', color: '#475569', fontWeight: 400, marginLeft: '8px', letterSpacing: '0.1em' }}>ADMIN</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#475569' }}>{user.email}</span>
          <button onClick={loadStats} style={{ background: 'none', border: '1px solid #1e293b', borderRadius: '6px', color: '#64748b', padding: '6px', cursor: 'pointer', display: 'flex' }} title="Refresh">
            <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px', position: 'relative' }}>

        {/* Title */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '28px', color: '#fff', margin: 0 }}>Admin Dashboard</h1>
          <p style={{ color: '#475569', fontSize: '12px', marginTop: '4px', letterSpacing: '0.06em' }}>PLATFORM OVERVIEW · REAL-TIME</p>
        </div>

        {error && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', marginBottom: '20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}><AlertCircle size={16} /> {error}</div>}
        {actionMsg && <div style={{ padding: '12px 16px', marginBottom: '20px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', color: '#34d399', fontSize: '13px' }}>{actionMsg}</div>}

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {([
            { label: 'Total Users',      value: stats?.totalUsers       ?? '—', icon: Users,      color: '#10b981', sub: 'registered accounts' },
            { label: 'Active (7d)',       value: stats?.activeUsers      ?? '—', icon: Activity,   color: '#06b6d4', sub: 'logged in recently' },
            { label: 'In Trade Now',      value: stats?.usersInTrade     ?? '—', icon: TrendingUp, color: '#f97316', sub: 'running sessions' },
            { label: 'Total Balances',    value: stats ? `$${fmt(stats.totalBalance)}` : '—',    icon: DollarSign,  color: '#8b5cf6', sub: 'across all accounts' },
            { label: 'Total Deployed',    value: stats ? `$${fmt(stats.totalDeployed)}` : '—',   icon: BarChart2,   color: '#ec4899', sub: 'in active trades' },
            { label: 'Subscription Rev.', value: stats ? `$${fmt(stats.subscriptionBalance)}` : '—', icon: Zap,    color: '#f59e0b', sub: 'total earned' },
          ] as const).map((card: any) => {
            const Icon = card.icon;
            return (
              <div key={card.label} style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid #0f172a', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${card.color}30`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#0f172a')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#475569', letterSpacing: '0.1em' }}>{card.label.toUpperCase()}</span>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} color={card.color} />
                  </div>
                </div>
                <div style={{ fontSize: loading ? '18px' : '28px', fontWeight: 500, color: card.color, fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>
                  {loading ? <span style={{ color: '#1e293b' }}>Loading…</span> : card.value}
                </div>
                <div style={{ fontSize: '11px', color: '#1e293b', marginTop: '6px' }}>{card.sub}</div>
              </div>
            );
          })}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #0f172a' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badge = tab.id === 'withdrawals' ? (stats?.pendingWithdrawals?.length ?? 0)
                        : tab.id === 'tickets'     ? tickets.filter((t: any) => t.unreadAdmin > 0).length
                        : 0;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${isActive ? '#10b981' : 'transparent'}`, color: isActive ? '#10b981' : '#475569', fontSize: '12px', fontWeight: isActive ? 600 : 400, cursor: 'pointer', letterSpacing: '0.05em', transition: 'all 0.2s', marginBottom: '-1px', fontFamily: 'inherit' }}>
                <Icon size={13} />
                {tab.label.toUpperCase()}
                {badge > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px' }}>{badge}</span>}
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Section title="Recent Subscriptions" icon={Zap}>
              {!stats?.recentSubscriptions?.length ? <Empty message="No subscriptions yet." /> :
                stats.recentSubscriptions.map((s: any, i: number) => (
                  <Row key={i}
                    left={<><span style={{ color: '#e2e8f0', fontSize: '13px' }}>{s.from}</span><span style={{ color: '#475569', fontSize: '11px', marginLeft: '8px' }}>{s.strategy} · {s.plan}</span></>}
                    right={<span style={{ color: '#10b981', fontSize: '13px', fontWeight: 600 }}>+${fmt(s.amount)}</span>}
                    sub={new Date(s.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  />
                ))
              }
            </Section>
            <Section title="Pending Withdrawals" icon={Clock} badge={stats?.pendingWithdrawals?.length} badgeColor="#ef4444">
              {!stats?.pendingWithdrawals?.length ? <Empty message="No pending withdrawals." /> :
                stats.pendingWithdrawals.slice(0, 5).map((w: any, i: number) => (
                  <Row key={i}
                    left={<><span style={{ color: '#e2e8f0', fontSize: '13px' }}>{w.userName ?? w.userEmail}</span><span style={{ color: '#475569', fontSize: '11px', marginLeft: '8px' }}>{w.network}</span></>}
                    right={<span style={{ color: '#f97316', fontSize: '13px', fontWeight: 600 }}>${fmt(w.amount)}</span>}
                    sub={new Date(w.createdAt).toLocaleDateString()}
                    action={<button onClick={() => setActiveTab('withdrawals')} style={{ fontSize: '11px', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}>Review →</button>}
                  />
                ))
              }
            </Section>
          </div>
        )}

        {/* ── WITHDRAWALS TAB ── */}
        {activeTab === 'withdrawals' && (
          <Section title="Pending Withdrawals" icon={Wallet}>
            {!stats?.pendingWithdrawals?.length ? <Empty message="No pending withdrawals. All clear." icon={CheckCircle} /> :
              stats.pendingWithdrawals.map((w: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderBottom: '1px solid #0a0f1e' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 500 }}>{w.userName ?? w.userEmail}</span>
                      <span style={{ fontSize: '11px', color: '#475569' }}>{w.userEmail}</span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>PENDING</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                      <span>Amount: <span style={{ color: '#f97316', fontWeight: 600 }}>${fmt(w.amount)}</span></span>
                      <span>Network: <span style={{ color: '#94a3b8' }}>{w.network}</span></span>
                      {w.address && <span>To: <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{w.address.slice(0, 12)}…{w.address.slice(-6)}</span></span>}
                      <span>{new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => approveWithdrawal(w.userEmail, w._index ?? i)} disabled={actionLoading !== null}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: actionLoading ? 0.5 : 1 }}>
                      <CheckCircle size={13} /> APPROVE
                    </button>
                    <button onClick={() => setShowDeclineModal({ email: w.userEmail, index: w._index ?? i })} disabled={actionLoading !== null}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: actionLoading ? 0.5 : 1 }}>
                      <XCircle size={13} /> DECLINE
                    </button>
                  </div>
                </div>
              ))
            }
          </Section>
        )}

        {/* ── TICKETS TAB ── */}
        {activeTab === 'tickets' && (
          <div style={{ display: 'grid', gridTemplateColumns: activeTicket ? '1fr 1.4fr' : '1fr', gap: '16px' }}>
            {/* Ticket list */}
            <Section title="Support Tickets" icon={MessageSquare} badge={tickets.filter((t: any) => t.unreadAdmin > 0).length} badgeColor="#3b82f6">
              {ticketsLoading ? <Empty message="Loading tickets…" icon={RefreshCw} /> :
               !tickets.length ? <Empty message="No tickets yet." icon={MessageSquare} /> :
                tickets.map((t: any) => (
                  <div key={t.id} onClick={() => openAdminTicket(t)}
                    style={{ padding: '14px 16px', borderBottom: '1px solid #050810', cursor: 'pointer', background: activeTicket?.id === t.id ? 'rgba(16,185,129,0.04)' : 'transparent', borderLeft: activeTicket?.id === t.id ? '2px solid #10b981' : '2px solid transparent', transition: 'background 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: t.unreadAdmin > 0 ? '#fff' : '#94a3b8', fontWeight: t.unreadAdmin > 0 ? 700 : 400 }}>{t.subject}</span>
                      {t.unreadAdmin > 0 && <span style={{ background: '#3b82f6', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px' }}>{t.unreadAdmin}</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>{t.userName} · {t.category}</span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', color: STATUS_CFG[t.status]?.color ?? '#475569', background: STATUS_CFG[t.status]?.bg ?? 'transparent' }}>
                        {(STATUS_CFG[t.status]?.label ?? t.status).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#1e293b', marginTop: '4px' }}>
                      {new Date(t.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              }
            </Section>

            {/* Thread view */}
            {activeTicket && (
              <Section title={activeTicket.subject} icon={MessageSquare}>
                {/* Status controls */}
                <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', borderBottom: '1px solid #0a0f1e', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#475569', marginRight: '4px' }}>Status:</span>
                  {['open', 'in-progress', 'resolved', 'closed'].map(s => (
                    <button key={s} onClick={() => changeTicketStatus(s)}
                      style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: ticketStatus === s ? (STATUS_CFG[s]?.bg ?? 'transparent') : 'transparent', border: `1px solid ${ticketStatus === s ? (STATUS_CFG[s]?.color ?? '#475569') : '#1e293b'}`, color: ticketStatus === s ? (STATUS_CFG[s]?.color ?? '#fff') : '#475569', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                      {s.replace('-', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Messages */}
                <div style={{ height: '320px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeTicket.messages.map((msg: any) => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: msg.sender === 'admin' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.sender === 'admin' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.sender === 'admin' ? 'rgba(16,185,129,0.2)' : '#1e293b'}` }}>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 3px', fontWeight: 600 }}>
                          {msg.sender === 'admin' ? '🛡 You (Support)' : `👤 ${msg.senderName}`}
                        </p>
                        <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.body}</p>
                      </div>
                      <span style={{ fontSize: '10px', color: '#1e293b', marginTop: '3px', padding: '0 4px' }}>
                        {new Date(msg.sentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  <div ref={ticketBottomRef} />
                </div>

                {/* Reply box */}
                {activeTicket.status !== 'closed' ? (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #0f172a', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Type your reply… (Enter to send)" rows={2}
                      style={{ flex: 1, padding: '10px 12px', background: '#030712', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px', fontFamily: "'DM Mono',monospace", resize: 'none', outline: 'none' }} />
                    <button onClick={sendReply} disabled={replySending || !replyText.trim()}
                      style={{ width: '40px', height: '40px', borderRadius: '8px', background: replyText.trim() ? '#10b981' : '#0f172a', border: 'none', cursor: replyText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={15} color={replyText.trim() ? '#030712' : '#1e293b'} />
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', color: '#475569', borderTop: '1px solid #0f172a' }}>
                    This ticket is closed.
                  </div>
                )}
              </Section>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <Section title="All Users" icon={Users}>
            {usersLoading ? <Empty message="Loading users…" icon={RefreshCw} /> :
             !users.length ? <Empty message="No users found." /> :
              users.map((u: any) => {
                const isExpanded = expandedUser === u.email;
                return (
                  <div key={u.email} style={{ borderBottom: '1px solid #0a0f1e' }}>
                    <div onClick={() => setExpandedUser(isExpanded ? null : u.email)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '14px', fontWeight: 700, flexShrink: 0, fontFamily: 'Syne,sans-serif' }}>
                        {(u.fullName ?? u.email)[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 500 }}>{u.fullName ?? u.email}</span>
                          {u.subscriptions && Object.values(u.subscriptions).some((s: any) => s && new Date(s.expiresAt) > new Date()) && (
                            <span style={{ fontSize: '10px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: '10px' }}>PRO</span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#475569' }}>{u.email}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '24px', fontSize: '12px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#10b981', fontWeight: 600 }}>${fmt(u.balance ?? 0)}</div>
                          <div style={{ color: '#1e293b', fontSize: '10px' }}>BALANCE</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#8b5cf6' }}>${fmt(u.referral_balance ?? 0)}</div>
                          <div style={{ color: '#1e293b', fontSize: '10px' }}>REFERRAL</div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 16px 16px 64px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {[
                          { label: 'BTC Balance',  value: `${((u.btc_balance ?? 0) / 1e8).toFixed(8)} BTC` },
                          { label: 'Referral Code', value: u.referral_code ?? '—' },
                          { label: 'Referred By',  value: u.referred_by ?? '—' },
                          { label: 'Joined',       value: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—' },
                          { label: 'Last Login',   value: u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—' },
                          { label: 'Withdrawals',  value: `${(u.withdrawal_log ?? []).length} total` },
                        ].map(item => (
                          <div key={item.label} style={{ padding: '10px 12px', background: '#0a0f1e', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10px', color: '#475569', marginBottom: '4px', letterSpacing: '0.08em' }}>{item.label.toUpperCase()}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            }
          </Section>
        )}

        {/* ── SUBSCRIPTIONS TAB ── */}
        {activeTab === 'subscriptions' && (
          <Section title="Subscription Revenue" icon={Zap}>
            <div style={{ padding: '20px 16px', borderBottom: '1px solid #0a0f1e' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ padding: '16px 24px', background: '#0a0f1e', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>TOTAL REVENUE</div>
                  <div style={{ fontSize: '32px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: '#10b981' }}>${fmt(stats?.subscriptionBalance ?? 0)}</div>
                </div>
                <div style={{ padding: '16px 24px', background: '#0a0f1e', borderRadius: '10px', border: '1px solid #0f172a' }}>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>TOTAL TRANSACTIONS</div>
                  <div style={{ fontSize: '32px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: '#e2e8f0' }}>{stats?.recentSubscriptions?.length ?? 0}</div>
                </div>
              </div>
            </div>
            {!stats?.recentSubscriptions?.length ? <Empty message="No subscriptions yet." /> :
              stats.recentSubscriptions.map((s: any, i: number) => (
                <Row key={i}
                  left={<><span style={{ color: '#e2e8f0', fontSize: '13px' }}>{s.from}</span><span style={{ fontSize: '11px', color: '#475569', marginLeft: '8px' }}>{s.strategy} — {s.plan}</span></>}
                  right={<span style={{ color: '#10b981', fontWeight: 700 }}>+${fmt(s.amount)}</span>}
                  sub={new Date(s.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
              ))
            }
          </Section>
        )}

      </div>

      {/* ── DECLINE MODAL ── */}
      {showDeclineModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: '16px', padding: '28px', width: '420px' }}>
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Decline Withdrawal</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>The amount will be refunded to the user's balance. Optionally add a reason.</p>
            <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)}
              placeholder="Reason (optional)…" rows={3}
              style={{ width: '100%', padding: '10px 12px', background: '#030712', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'inherit', resize: 'none', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowDeclineModal(null); setDeclineReason(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'none', border: '1px solid #1e293b', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
                CANCEL
              </button>
              <button onClick={() => declineWithdrawal(showDeclineModal.email, showDeclineModal.index)} disabled={actionLoading !== null}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '13px' }}>
                CONFIRM DECLINE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, badge, badgeColor }: {
  title: string; icon: any; children: React.ReactNode; badge?: number; badgeColor?: string;
}) {
  return (
    <div style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid #0f172a', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #0a0f1e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={14} color="#10b981" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.06em' }}>{title.toUpperCase()}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span style={{ background: badgeColor ?? '#10b981', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ left, right, sub, action }: {
  left: React.ReactNode; right: React.ReactNode; sub?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #050810' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>{left}</div>
        {sub && <div style={{ fontSize: '11px', color: '#1e293b', marginTop: '3px' }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{right}{action}</div>
    </div>
  );
}

function Empty({ message, icon: Icon = Clock }: { message: string; icon?: any }) {
  return (
    <div style={{ padding: '32px', textAlign: 'center', color: '#1e293b', fontSize: '13px' }}>
      <Icon size={24} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
      {message}
    </div>
  );
}