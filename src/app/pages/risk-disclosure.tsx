import React, { useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { SEOHead } from "../components/SEOHead";

// ─── Accordion item ───────────────────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid #0f172a',
      transition: 'background 0.2s',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '20px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', gap: '16px',
        }}
      >
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 600,
          fontSize: '15px', color: open ? '#10b981' : '#e2e8f0',
          transition: 'color 0.2s', lineHeight: 1.4,
        }}>
          {title}
        </span>
        {open
          ? <ChevronUp size={16} color="#10b981" style={{ flexShrink: 0 }} />
          : <ChevronDown size={16} color="#475569" style={{ flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{
          paddingBottom: '20px', color: '#64748b',
          fontSize: '14px', lineHeight: 1.8,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function RiskDisclosurePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
      color: '#e2e8f0',
    }}>
      <SEOHead
        title="Risk Disclosure Statement"
        description="Full risk disclosure for trader5 AI trading platform. Read before investing. Covers strategy risks, capital loss, cryptocurrency risks and regulatory status."
        canonical="/risk-disclosure"
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        p { margin-bottom: 12px; }
        p:last-child { margin-bottom: 0; }
        ul { padding-left: 20px; margin: 8px 0; }
        ul li { margin-bottom: 6px; color: #64748b; font-size: 14px; line-height: 1.7; }
        strong { color: #94a3b8; font-weight: 600; }
      `}</style>

      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(16,185,129,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.02) 1px,transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid #0f172a',
        background: 'rgba(3,7,18,0.95)',
        backdropFilter: 'blur(20px)',
        padding: '0 max(24px, calc((100vw - 1000px) / 2))',
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
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: '1px solid #1e293b',
            borderRadius: '8px', padding: '8px 14px',
            color: '#64748b', fontSize: '12px', cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e2e8f0'; (e.currentTarget as HTMLElement).style.borderColor = '#475569'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.borderColor = '#1e293b'; }}
        >
          <ArrowLeft size={13} /> BACK
        </button>
      </nav>

      <div style={{
        maxWidth: '1000px', margin: '0 auto',
        padding: '60px max(24px, calc((100vw - 1000px) / 2)) 80px',
        position: 'relative',
      }}>

        {/* Header */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '20px', padding: '6px 14px', marginBottom: '24px',
          }}>
            <AlertTriangle size={13} color="#ef4444" />
            <span style={{ fontSize: '11px', color: '#ef4444', letterSpacing: '0.1em' }}>
              IMPORTANT — READ BEFORE TRADING
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 'clamp(32px, 5vw, 56px)', color: '#fff',
            lineHeight: 1.05, marginBottom: '20px',
          }}>
            Risk Disclosure<br />
            <span style={{ color: '#10b981' }}>Statement</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.8, maxWidth: '600px' }}>
            Last updated: April 2026. Please read this document carefully before using any trading
            strategy on the trader5 platform. By activating a trading session, you confirm that you
            have read, understood, and accepted these disclosures.
          </p>
        </div>

        {/* Warning banner */}
        <div style={{
          display: 'flex', gap: '16px', alignItems: 'flex-start',
          padding: '24px', marginBottom: '48px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '16px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div>
            <p style={{ color: '#fca5a5', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
              HIGH RISK WARNING
            </p>
            <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.8, margin: 0 }}>
              Trading financial instruments, including cryptocurrencies, forex, commodities, and equities,
              involves a <strong>high level of risk</strong> and may not be suitable for all investors.
              You should not invest money that you cannot afford to lose.
              Past performance is not indicative of future results. The simulated returns shown on this
              platform are not guaranteed and may differ significantly from actual trading outcomes.
            </p>
          </div>
        </div>

        {/* Two-column key facts */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px', marginBottom: '56px',
        }}>
          {[
            { n: '01', title: 'Capital at Risk',       body: 'All funds deployed in trading sessions are at risk. While we enforce principal protection mechanisms, no guarantee can be made that your capital will be returned in full.' },
            { n: '02', title: 'Simulated Environment', body: 'trader5 operates a simulated AI trading environment for income purposes. Returns shown are illustrative and based on algorithmic projections, with real market execution.' },
            { n: '03', title: 'No Financial Advice',   body: 'Nothing on this platform constitutes financial, investment, legal, or tax advice. You are solely responsible for your trading decisions.' },
            { n: '04', title: 'Cryptocurrency Risk',   body: 'Cryptocurrency markets are highly volatile and largely unregulated. Prices can change dramatically in short timeframes, including to zero.' },
          ].map(card => (
            <div key={card.n} style={{
              padding: '24px', background: 'rgba(10,15,30,0.6)',
              border: '1px solid #0f172a', borderRadius: '12px',
            }}>
              <div style={{
                fontSize: '11px', color: '#10b981', letterSpacing: '0.12em',
                marginBottom: '12px', fontWeight: 500,
              }}>{card.n}</div>
              <h3 style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: '14px', color: '#e2e8f0', marginBottom: '10px',
              }}>{card.title}</h3>
              <p style={{ color: '#475569', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>{card.body}</p>
            </div>
          ))}
        </div>

        {/* Detailed disclosures accordion */}
        <div style={{ marginBottom: '56px' }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: '22px', color: '#fff', marginBottom: '8px',
          }}>
            Detailed Disclosures
          </h2>
          <p style={{ color: '#475569', fontSize: '13px', marginBottom: '32px' }}>
            Expand each section to read the full disclosure.
          </p>

          <Accordion title="1. Nature of the Platform">
            <p>
              trader5 is an AI-powered trading simulation platform designed to help traders and non-traders earn passive income. The platform uses algorithmic models to place trading activity across cryptocurrency,
              forex, equity, and commodity markets.
            </p>
            <p>
              <strong>The platform execute real trades on live markets.</strong> All trading sessions,
              positions, and profit/loss figures shown are representations of potential market
              activity based on real market data feeds and AI signal generation.
            </p>
            <p>
              Users should understand that performance results have certain inherent limitations.
              Unlike an actual performance record, results represent actual trading and may
              not account for real market liquidity, slippage, fees, or execution delays.
            </p>
          </Accordion>

          <Accordion title="2. Risk of Loss">
            <p>
              Trading and investing in financial instruments, including but not limited to cryptocurrencies,
              foreign exchange (forex), commodities, and equities, involves substantial risk of loss and is
              not appropriate for every investor.
            </p>
            <ul>
              <li>You may lose some or all of your invested capital.</li>
              <li>Leveraged products can result in losses exceeding your initial deposit.</li>
              <li>Cryptocurrency values can be highly volatile and may decline rapidly.</li>
              <li>Past performance of any strategy or system does not guarantee future results.</li>
              <li>Market conditions can change suddenly and without warning.</li>
            </ul>
            <p>
              <strong>Only invest capital that you can afford to lose entirely.</strong> Do not use borrowed
              funds, emergency savings, or money required for essential living expenses.
            </p>
          </Accordion>

          <Accordion title="3. AI and Algorithmic Trading Risks">
            <p>
              The trader5 platform uses artificial intelligence and machine learning models to generate
              trading signals and manage positions. While these systems are designed to maximise
              returns and manage risk, you should be aware of the following:
            </p>
            <ul>
              <li>AI models are trained on historical data and may not perform well in novel or extreme market conditions.</li>
              <li>Algorithmic systems can malfunction, produce incorrect signals, or fail to execute as intended due to technical issues.</li>
              <li>No AI trading system is infallible. All models have limitations and can generate losing trades.</li>
              <li>The AI strategies displayed (Conservative, Balanced, Aggressive, DeFi) represent different risk profiles but all carry risk of loss.</li>
              <li>Strategy performance shown is based on backtested and simulated data, which may reflect live trading results.</li>
            </ul>
          </Accordion>

          <Accordion title="4. Cryptocurrency and Digital Asset Risks">
            <p>
              Cryptocurrency and digital assets carry additional specific risks beyond traditional financial instruments:
            </p>
            <ul>
              <li><strong>Extreme Volatility:</strong> Cryptocurrency prices can move by 20–80% or more within a single day.</li>
              <li><strong>Regulatory Risk:</strong> The legal and regulatory environment for cryptocurrency varies by jurisdiction and is subject to rapid change. Certain assets or activities may become restricted or prohibited.</li>
              <li><strong>Technology Risk:</strong> Blockchain networks, wallets, and exchanges are subject to technical failures, hacks, and security vulnerabilities.</li>
              <li><strong>Liquidity Risk:</strong> Some cryptocurrency markets have limited liquidity, which can make it difficult to exit positions at desired prices.</li>
              <li><strong>No Deposit Insurance:</strong> Unlike bank deposits, cryptocurrency holdings are not insured by any government scheme such as the FSCS or FDIC.</li>
              <li><strong>Irreversibility:</strong> Blockchain transactions are generally irreversible. Sending funds to an incorrect address may result in permanent loss.</li>
            </ul>
          </Accordion>

          <Accordion title="5. Deposit and Withdrawal Risks">
            <p>
              All deposits to the trader5 platform are made in Bitcoin (BTC). By making a deposit you
              acknowledge the following:
            </p>
            <ul>
              <li>Deposited funds are held in a Bitcoin cold wallet controlled by the platform operator.</li>
              <li>The Bitcoin network may experience congestion, delays, or high fees which are outside our control.</li>
              <li>Withdrawal requests are subject to review and approval by platform administrators. Processing times may vary.</li>
              <li>We reserve the right to request identity verification before processing withdrawals.</li>
              <li>We are not responsible for losses arising from incorrect deposit addresses provided by users.</li>
              <li>Exchange rate fluctuations between BTC and USD may affect the USD value of your balance.</li>
            </ul>
          </Accordion>

          <Accordion title="6. Strategy-Specific Risk Disclosures">
            <p><strong>Conservative Growth ($50 minimum):</strong></p>
            <p>
              Designed for lower risk tolerance. Employs capital preservation mechanisms and tight stop-loss
              controls. While losses are minimised by design, they cannot be entirely eliminated. Target
              returns of 16–40% over 14 days are projections, not guarantees.
            </p>
            <p><strong>Balanced Momentum ($200 minimum):</strong></p>
            <p>
              Medium-risk strategy with higher return potential. Involves more frequent position cycling and
              moderate exposure. Investors may experience larger unrealised loss swings during trading
              sessions. Target returns of 10–30% over 7 days.
            </p>
            <p><strong>Aggressive Scalper ($1,000 minimum):</strong></p>
            <p>
              High-risk, high-frequency strategy intended for experienced users. Positions may carry
              significant unrealised losses before recovery. Capital loss in excess of 5% of deployed
              amount is possible. Not suitable for risk-averse investors. Target returns of 10–24% over 7 days.
            </p>
            <p><strong>DeFi Yield Optimizer ($500 minimum):</strong></p>
            <p>
              Designed to replicate yield-farming mechanics with a zero-loss guarantee on principal.
              While the principal protection mechanism is enforced algorithmically, unforeseen system
              failures may impact this guarantee. Target returns of 5–15% over 7 days.
            </p>
          </Accordion>

          <Accordion title="7. No Guarantee of Returns">
            <p>
              trader5 makes no representation or warranty, express or implied, that users will achieve
              any particular level of return. All return figures, projections, and historical performance
              data shown on the platform are illustrative only and <strong>do not constitute a promise
              or guarantee of future performance.</strong>
            </p>
            <p>
              Factors that may cause actual results to differ materially from projections include, but are
              not limited to: changes in market conditions, regulatory changes, technical failures, force
              majeure events, and liquidity constraints.
            </p>
          </Accordion>

          <Accordion title="8. Regulatory Status and Compliance">
            {/* <p>
              trader5 is a trading simulation platform. We do not hold any financial services
              licence, investment adviser registration, or money transmitter licence in any jurisdiction.
              We do not provide regulated financial services.
            </p> */}
            <p>
              Users are solely responsible for ensuring their use of the platform complies with all
              applicable laws and regulations in their jurisdiction. Access to and use of this platform
              may be restricted or prohibited in certain countries.
            </p>
            <p>
              This platform is <strong>not intended for use by residents of</strong> the United States,
              the European Union, the United Kingdom, Canada, or any jurisdiction where such services
              would require regulatory authorisation.
            </p>
          </Accordion>

          <Accordion title="9. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, trader5 and its operators, directors,
              employees, and agents shall not be liable for any direct, indirect, incidental, special,
              consequential, or punitive damages arising from your use of this platform, including but
              not limited to:
            </p>
            <ul>
              <li>Loss of profits, revenue, or data.</li>
              <li>Trading losses or missed opportunities.</li>
              <li>Technical failures, service interruptions, or data errors.</li>
              <li>Unauthorised access to your account.</li>
              <li>Any action or inaction taken based on information provided by the platform.</li>
            </ul>
            <p>
              Your use of this platform is entirely at your own risk.
            </p>
          </Accordion>

          <Accordion title="10. Acknowledgement">
            <p>
              By using the trader5 platform and activating any trading session, you confirm that:
            </p>
            <ul>
              <li>You are 18 years of age or older (or the age of majority in your jurisdiction).</li>
              <li>You have read and understood this Risk Disclosure Statement in full.</li>
              <li>You understand that all investments carry risk, including the risk of total loss.</li>
              <li>You are making investment decisions based on your own independent judgement.</li>
              <li>You are not relying on trader5 for financial, investment, legal, or tax advice.</li>
              <li>You have the financial resources to bear any losses that may result from trading.</li>
              <li>You understand the speculative nature of AI-driven trading simulations.</li>
            </ul>
          </Accordion>
        </div>

        {/* Footer note */}
        <div style={{
          padding: '28px 32px',
          background: 'rgba(16,185,129,0.04)',
          border: '1px solid rgba(16,185,129,0.1)',
          borderRadius: '16px',
          display: 'flex', gap: '16px', alignItems: 'flex-start',
        }}>
          <div style={{
            width: '4px', background: '#10b981',
            borderRadius: '2px', alignSelf: 'stretch', flexShrink: 0,
          }} />
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#10b981', fontSize: '13px', marginBottom: '8px', letterSpacing: '0.08em' }}>
              QUESTIONS OR CONCERNS?
            </p>
            <p style={{ color: '#475569', fontSize: '13px', lineHeight: 1.8, margin: 0 }}>
              If you have any questions about this Risk Disclosure Statement or our platform policies,
              please contact our support team through the in-app support chat. We are committed to
              transparency and will respond to all enquiries promptly.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <p style={{ color: '#1e293b', fontSize: '12px', letterSpacing: '0.06em' }}>
            © 2026 TRADER5 · ALL RIGHTS RESERVED · THIS DOCUMENT MAY BE UPDATED AT ANY TIME
          </p>
        </div>

      </div>
    </div>
  );
}