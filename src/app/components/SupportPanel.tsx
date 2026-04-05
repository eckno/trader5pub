import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, X, Plus, Send, ChevronLeft,
  Clock, CheckCircle, AlertCircle, RefreshCw, Inbox,
} from 'lucide-react';

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ?? 'https://ai.traderfive.com';

const CATEGORIES = [
  { id: 'deposit',    label: 'Deposit Issue'     },
  { id: 'withdrawal', label: 'Withdrawal Issue'  },
  { id: 'trading',    label: 'Trading / Session' },
  { id: 'account',    label: 'Account Access'    },
  { id: 'other',      label: 'Other'             },
];

const STATUS_CONFIG = {
  'open':        { label: 'Open',        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  'in-progress': { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  'resolved':    { label: 'Resolved',    color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  'closed':      { label: 'Closed',      color: '#475569', bg: 'rgba(71,85,105,0.1)'   },
} as const;

type Ticket = {
  id: string; subject: string; category: string;
  status: keyof typeof STATUS_CONFIG;
  messages: Array<{ id: string; sender: 'user'|'admin'; senderName: string; body: string; sentAt: string }>;
  createdAt: string; updatedAt: string;
  unreadUser: number;
};

export function SupportPanel({ user, token }: { user: any; token: string }) {
  const [open, setOpen]             = useState(false);
  const [view, setView]             = useState<'list' | 'thread' | 'new'>('list');
  const [tickets, setTickets]       = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [loading, setLoading]       = useState(false);
  const [sending, setSending]       = useState(false);
  const [msgText, setMsgText]       = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const [form, setForm]             = useState({ subject: '', category: 'other', message: '' });
  const [formError, setFormError]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const bottomRef                   = useRef<HTMLDivElement>(null);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  async function loadTickets() {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/tickets`, { headers });
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
        setTotalUnread((data.data as Ticket[]).reduce((s, t) => s + (t.unreadUser ?? 0), 0));
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function openTicket(ticket: Ticket) {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/tickets/${ticket.id}`, { headers });
      const data = await res.json();
      if (data.success) {
        setActiveTicket(data.data);
        setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, unreadUser: 0 } : t));
        setTotalUnread(prev => Math.max(0, prev - (ticket.unreadUser ?? 0)));
        setView('thread');
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function sendMessage() {
    if (!msgText.trim() || !activeTicket) return;
    setSending(true);
    try {
      const res  = await fetch(`${API_BASE}/api/tickets/${activeTicket.id}/messages`, {
        method: 'POST', headers,
        body: JSON.stringify({ message: msgText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveTicket(data.data);
        setMsgText('');
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch {}
    finally { setSending(false); }
  }

  async function submitTicket() {
    if (!form.subject.trim()) { setFormError('Please enter a subject.'); return; }
    if (!form.message.trim()) { setFormError('Please describe your issue.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const res  = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST', headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setTickets(prev => [data.data, ...prev]);
        setActiveTicket(data.data);
        setForm({ subject: '', category: 'other', message: '' });
        setView('thread');
      } else { setFormError(data.message ?? 'Failed to submit.'); }
    } catch { setFormError('Could not connect to server.'); }
    finally { setSubmitting(false); }
  }

  useEffect(() => { if (open) loadTickets(); }, [open]);

  // ── Background poll for unread count — runs even when panel is CLOSED ─────
  // This is what drives the red badge on the floating button.
  // Checks every 20s regardless of panel state so users always see new replies.
  useEffect(() => {
    const checkUnread = async () => {
      if (!user?.email) return;
      try {
        const res  = await fetch(`${API_BASE}/api/tickets`, { headers });
        const data = await res.json();
        if (!data.success) return;
        const unread = (data.data as Ticket[]).reduce((s, t) => s + (t.unreadUser ?? 0), 0);
        setTotalUnread(unread);
        // If panel is open on list view, also refresh the full list
        if (open && view === 'list') {
          setTickets(data.data);
        }
      } catch {}
    };

    // Run immediately on mount, then every 20s
    checkUnread();
    const interval = setInterval(checkUnread, 20000);
    return () => clearInterval(interval);
  }, [user?.email, open, view]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (view === 'thread' && activeTicket) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [view, activeTicket?.messages?.length]);

  // ── Poll active ticket every 4s while thread is open ──────────────────────
  // Silently refreshes messages so new replies from admin appear immediately
  // without the user needing to navigate away.
  useEffect(() => {
    if (view !== 'thread' || !activeTicket || !open) return;

    const poll = async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/tickets/${activeTicket.id}`, { headers });
        const data = await res.json();
        if (!data.success) return;

        const incoming = data.data as Ticket;
        // Only update if there are new messages to avoid unnecessary re-renders
        if (incoming.messages.length !== activeTicket.messages.length) {
          setActiveTicket(incoming);
          // Also reset unread count for this ticket in the list
          setTickets(prev => prev.map(t =>
            t.id === incoming.id ? { ...t, unreadUser: 0 } : t
          ));
        }
      } catch {}
    };

    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [view, activeTicket?.id, open]);

  // ── Poll ticket list every 15s while on list view to catch new unread ─────
  useEffect(() => {
    if (view !== 'list' || !open) return;
    const interval = setInterval(loadTickets, 15000);
    return () => clearInterval(interval);
  }, [view, open]);

  const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      {/* ── FLOATING BUTTON ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: typeof window !== 'undefined' && window.innerWidth < 640 ? '24px' : '28px',
          right: '20px',
          zIndex: 200,
          width: '54px', height: '54px', borderRadius: '50%',
          background: '#10b981', border: 'none',
          boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        {open
          ? <X size={22} color="#030712" />
          : <MessageCircle size={22} color="#030712" />
        }
        {!open && totalUnread > 0 && (
          <div style={{
            position: 'absolute', top: '-2px', right: '-2px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#ef4444', border: '2px solid #030712',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700, color: '#fff',
          }}>
            {totalUnread > 9 ? '9+' : totalUnread}
          </div>
        )}
      </button>

      {/* Mobile backdrop */}
      {open && typeof window !== 'undefined' && window.innerWidth < 640 && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 198, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* ── PANEL ── */}
      {open && (
        <div style={{
          position: 'fixed',
          // Mobile: full-width bottom sheet
          bottom: 0, left: 0, right: 0,
          // Desktop override via media query handled via JS below
          zIndex: 199,
          background: '#0a0f1e',
          border: '1px solid #0f172a',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          height: '85vh',
          fontFamily: "'DM Mono','Fira Code','Courier New',monospace",
          // Desktop: reposition as floating panel
          ...( typeof window !== 'undefined' && window.innerWidth >= 640 ? {
            bottom: '96px', left: 'auto', right: '28px',
            width: '380px', height: '580px',
            borderRadius: '20px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          } : {}),
        }}>
          {/* Top accent */}
          <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,#10b981,transparent)', flexShrink: 0 }} />

          {/* Mobile drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#1e293b' }} />
          </div>

          {/* ── HEADER ── */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {view !== 'list' && (
                <button
                  onClick={() => { setView('list'); setActiveTicket(null); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>
                  {view === 'new' ? 'New Ticket' : view === 'thread' ? activeTicket?.subject ?? 'Ticket' : 'Support'}
                </p>
                <p style={{ color: '#475569', fontSize: '11px', margin: 0, letterSpacing: '0.06em' }}>
                  {view === 'thread' && activeTicket
                    ? <StatusBadge status={activeTicket.status} />
                    : 'We typically reply within 24h'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {view === 'list' && (
                <button
                  onClick={() => setView('new')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                    color: '#10b981', fontSize: '11px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Plus size={12} /> NEW
                </button>
              )}
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* LIST VIEW */}
            {view === 'list' && (
              <div style={{ flex: 1 }}>
                {loading ? (
                  <CenterMsg icon={<RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />} text="Loading tickets…" />
                ) : !tickets.length ? (
                  <CenterMsg icon={<Inbox size={32} color="#1e293b" />} text="No tickets yet. Tap + NEW to get help." />
                ) : tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => openTicket(ticket)}
                    style={{
                      padding: '14px 20px', borderBottom: '1px solid #050810',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.03)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '13px', color: '#e2e8f0', fontWeight: ticket.unreadUser > 0 ? 700 : 400,
                        flex: 1, marginRight: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {ticket.subject}
                      </span>
                      {ticket.unreadUser > 0 && (
                        <div style={{
                          background: '#10b981', color: '#030712',
                          fontSize: '10px', fontWeight: 700,
                          padding: '2px 7px', borderRadius: '10px', flexShrink: 0,
                        }}>{ticket.unreadUser}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>
                        {ticket.messages[ticket.messages.length - 1]?.body.slice(0, 40)}…
                      </span>
                      <StatusBadge status={ticket.status} small />
                    </div>
                    <div style={{ fontSize: '10px', color: '#1e293b', marginTop: '4px' }}>
                      {fmt(ticket.updatedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* NEW TICKET FORM */}
            {view === 'new' && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={inputStyle}
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => { setForm(f => ({ ...f, subject: e.target.value })); setFormError(''); }}
                    placeholder="Brief description of your issue"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Message</label>
                  <textarea
                    value={form.message}
                    onChange={e => { setForm(f => ({ ...f, message: e.target.value })); setFormError(''); }}
                    placeholder="Describe your issue in detail…"
                    rows={5}
                    style={{ ...inputStyle, resize: 'none', height: '120px' }}
                  />
                </div>
                {formError && (
                  <p style={{ fontSize: '12px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <AlertCircle size={12} /> {formError}
                  </p>
                )}
                <button
                  onClick={submitTicket}
                  disabled={submitting}
                  style={{
                    padding: '12px', borderRadius: '10px',
                    background: '#10b981', border: 'none',
                    color: '#030712', fontWeight: 700, fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'inherit',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? 'Submitting…' : 'SUBMIT TICKET'}
                </button>
              </div>
            )}

            {/* THREAD VIEW */}
            {view === 'thread' && activeTicket && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeTicket.messages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.sender === 'user'
                        ? 'rgba(16,185,129,0.15)'
                        : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${msg.sender === 'user' ? 'rgba(16,185,129,0.2)' : '#1e293b'}`,
                    }}>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 2px', fontWeight: 600 }}>
                        {msg.sender === 'admin' ? '🛡 Support Team' : 'You'}
                      </p>
                      <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {msg.body}
                      </p>
                    </div>
                    <span style={{ fontSize: '10px', color: '#1e293b', marginTop: '4px', padding: '0 4px' }}>
                      {fmt(msg.sentAt)}
                    </span>
                  </div>
                ))}
                {activeTicket.status === 'closed' && (
                  <div style={{
                    textAlign: 'center', padding: '12px',
                    background: 'rgba(71,85,105,0.1)', border: '1px solid #1e293b',
                    borderRadius: '10px', fontSize: '12px', color: '#475569',
                  }}>
                    <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    This ticket has been closed.
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* ── MESSAGE INPUT (thread view only) ── */}
          {view === 'thread' && activeTicket && activeTicket.status !== 'closed' && (
            <div style={{
              padding: '12px 16px', borderTop: '1px solid #0f172a',
              display: 'flex', gap: '8px', alignItems: 'flex-end',
              flexShrink: 0,
            }}>
              <textarea
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message… (Enter to send)"
                rows={2}
                style={{
                  flex: 1, padding: '10px 12px',
                  background: '#030712', border: '1px solid #1e293b',
                  borderRadius: '10px', color: '#e2e8f0',
                  fontSize: '12px', fontFamily: 'inherit',
                  resize: 'none', outline: 'none',
                  lineHeight: 1.5,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !msgText.trim()}
                style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: msgText.trim() ? '#10b981' : '#0f172a',
                  border: 'none', cursor: msgText.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <Send size={16} color={msgText.trim() ? '#030712' : '#1e293b'} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status, small }: { status: keyof typeof STATUS_CONFIG; small?: boolean }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: small ? '10px' : '11px',
      color: cfg.color, background: cfg.bg,
      padding: small ? '1px 6px' : '3px 8px',
      borderRadius: '6px', fontWeight: 600,
      letterSpacing: '0.05em',
    }}>
      {cfg.label.toUpperCase()}
    </span>
  );
}

function CenterMsg({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', padding: '40px 20px',
      gap: '12px', color: '#475569', fontSize: '13px', textAlign: 'center',
    }}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: '#030712', border: '1px solid #1e293b',
  borderRadius: '8px', color: '#e2e8f0',
  fontSize: '12px', fontFamily: "'DM Mono','Fira Code','Courier New',monospace",
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', color: '#475569',
  letterSpacing: '0.08em', marginBottom: '6px',
};