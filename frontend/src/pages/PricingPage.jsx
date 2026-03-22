import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:       #0f1623;
    --navy-mid:   #1e2a3a;
    --navy-deep:  #0a101a;
    --slate:      #4a5568;
    --slate-lt:   #718096;
    --teal:       #0ea5a0;
    --teal-lt:    #14b8b3;
    --teal-dim:   rgba(14,165,160,0.12);
    --teal-glow:  rgba(14,165,160,0.20);
    --white:      #ffffff;
    --off-white:  #f7f8fa;
    --border:     #e4e9f0;
    --border-mid: #cbd5e1;
    --green:      #10b981;
    --amber:      #f59e0b;
    --shadow-sm:  0 1px 3px rgba(15,22,35,0.06), 0 1px 2px rgba(15,22,35,0.04);
    --shadow-md:  0 4px 16px rgba(15,22,35,0.08), 0 2px 6px rgba(15,22,35,0.05);
    --shadow-lg:  0 12px 48px rgba(15,22,35,0.13), 0 4px 14px rgba(15,22,35,0.07);
    --shadow-pro: 0 24px 72px rgba(14,165,160,0.18), 0 8px 28px rgba(15,22,35,0.25);
    --radius:     12px;
    --radius-lg:  20px;
    --radius-xl:  28px;
  }

  body {
    background: var(--off-white);
    color: var(--navy);
    font-family: 'Figtree', sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  /* ── Animations ──────────────────────────────────── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(220%) skewX(-12deg); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes check-draw {
    from { stroke-dashoffset: 20; }
    to   { stroke-dashoffset: 0; }
  }

  .afu  { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
  .afi  { animation: fadeIn 0.4s ease both; }
  .d1   { animation-delay: 0.06s; }
  .d2   { animation-delay: 0.14s; }
  .d3   { animation-delay: 0.22s; }
  .d4   { animation-delay: 0.30s; }
  .d5   { animation-delay: 0.38s; }

  /* ── Nav ─────────────────────────────────────────── */
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(247,248,250,0.92);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--border);
  }
  .nav-inner {
    max-width: 1120px; margin: 0 auto;
    padding: 0 32px; height: 64px;
    display: flex; align-items: center; gap: 40px;
  }
  .nav-logo {
    display: flex; align-items: center; gap: 9px;
    font-weight: 700; font-size: 17px; color: var(--navy);
    text-decoration: none; flex-shrink: 0;
  }
  .nav-logo-icon {
    width: 32px; height: 32px;
    background: var(--navy); border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .nav-links { display: flex; align-items: center; gap: 4px; flex: 1; }
  .nav-link {
    padding: 6px 13px; border-radius: 7px;
    font-size: 14px; font-weight: 500; color: var(--slate);
    cursor: pointer; transition: color .15s, background .15s;
    background: none; border: none; font-family: inherit;
  }
  .nav-link:hover   { color: var(--navy); background: rgba(15,22,35,0.05); }
  .nav-link.active  { color: var(--navy); font-weight: 600; }
  .nav-actions { display: flex; align-items: center; gap: 8px; }
  .btn-ghost {
    padding: 7px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;
    color: var(--slate); background: none; border: 1px solid var(--border-mid);
    cursor: pointer; transition: all .15s; font-family: inherit;
  }
  .btn-ghost:hover { color: var(--navy); border-color: var(--navy); background: rgba(15,22,35,0.04); }
  .btn-solid {
    padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
    color: #fff; background: var(--navy); border: none; cursor: pointer;
    transition: all .18s; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
  }
  .btn-solid:hover { background: var(--navy-mid); transform: translateY(-1px); box-shadow: var(--shadow-md); }

  /* ── Page wrapper ────────────────────────────────── */
  .pricing-page {
    min-height: calc(100vh - 64px);
    padding: 72px 24px 96px;
    position: relative;
    overflow: hidden;
  }

  /* Background mesh */
  .pricing-page::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 55% 45% at 20% 10%, rgba(14,165,160,0.06) 0%, transparent 65%),
      radial-gradient(ellipse 40% 35% at 85% 70%, rgba(14,165,160,0.05) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 50% 100%, rgba(15,22,35,0.03) 0%, transparent 55%);
  }

  /* Dot grid */
  .pricing-page::after {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(circle, rgba(15,22,35,0.07) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: radial-gradient(ellipse 90% 80% at 50% 40%, black 20%, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 40%, black 20%, transparent 80%);
  }

  .pricing-inner {
    max-width: 900px; margin: 0 auto;
    position: relative; z-index: 1;
  }

  /* ── Header ──────────────────────────────────────── */
  .pricing-header { text-align: center; margin-bottom: 64px; }

  .pricing-eyebrow {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: var(--teal);
    margin-bottom: 18px;
  }
  .eyebrow-line {
    width: 24px; height: 1.5px; background: var(--teal); border-radius: 2px;
  }

  .pricing-title {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(36px, 5vw, 54px);
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.025em;
    color: var(--navy);
    margin-bottom: 16px;
  }
  .pricing-title em {
    font-style: italic;
    color: var(--teal);
  }

  .pricing-sub {
    font-size: 17px; font-weight: 400;
    color: var(--slate); line-height: 1.65;
    max-width: 440px; margin: 0 auto 28px;
  }

  /* Toggle */
  .billing-toggle {
    display: inline-flex; align-items: center; gap: 10px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 5px 6px;
    box-shadow: var(--shadow-sm);
  }
  .toggle-option {
    padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 600;
    color: var(--slate-lt); cursor: pointer; transition: all .2s; border: none;
    background: none; font-family: inherit;
  }
  .toggle-option.active {
    background: var(--navy); color: #fff;
    box-shadow: 0 2px 8px rgba(15,22,35,0.18);
  }
  .toggle-badge {
    font-size: 11px; font-weight: 700; color: var(--green);
    background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
    border-radius: 100px; padding: 2px 8px; margin-left: -4px;
  }

  /* ── Cards grid ──────────────────────────────────── */
  .cards-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
  }

  /* ── Base card ───────────────────────────────────── */
  .plan-card {
    border-radius: var(--radius-xl);
    padding: 40px 36px 36px;
    position: relative;
    transition: transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s;
  }
  .plan-card:hover { transform: translateY(-4px); }

  /* ── Free card ───────────────────────────────────── */
  .card-free {
    background: var(--white);
    border: 1.5px solid var(--border);
    box-shadow: var(--shadow-md);
    margin-top: 24px; /* sits lower than Pro */
  }
  .card-free:hover { box-shadow: var(--shadow-lg); }

  /* ── Pro card ────────────────────────────────────── */
  .card-pro {
    background: var(--navy);
    border: 1.5px solid rgba(14,165,160,0.35);
    box-shadow: var(--shadow-pro);
    overflow: hidden;
  }
  .card-pro:hover {
    box-shadow: 0 32px 80px rgba(14,165,160,0.22), 0 12px 36px rgba(15,22,35,0.30);
  }

  /* Pro card inner shimmer effect */
  .card-pro::before {
    content: '';
    position: absolute; top: 0; left: 0;
    width: 45%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
    pointer-events: none;
    animation: shimmer 4s ease-in-out infinite 1s;
  }

  /* Pro card top glow strip */
  .card-pro::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--teal), var(--teal-lt), transparent);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  /* ── Badge ───────────────────────────────────────── */
  .plan-badge {
    position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
    display: inline-flex; align-items: center; gap: 5px;
    background: var(--teal); color: #fff;
    font-size: 11.5px; font-weight: 700; letter-spacing: 0.05em;
    text-transform: uppercase; padding: 5px 14px;
    border-radius: 100px; white-space: nowrap;
    box-shadow: 0 4px 14px rgba(14,165,160,0.4);
  }
  .badge-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(255,255,255,0.7);
    position: relative;
  }
  .badge-dot::after {
    content: '';
    position: absolute; inset: -3px;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.4);
    animation: pulse-ring 1.8s ease-out infinite;
  }

  /* ── Plan name ───────────────────────────────────── */
  .plan-name {
    font-family: 'Figtree', sans-serif;
    font-size: 13px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    margin-bottom: 20px;
  }
  .card-free .plan-name  { color: var(--slate-lt); }
  .card-pro  .plan-name  { color: var(--teal-lt); }

  /* ── Price block ─────────────────────────────────── */
  .price-block { margin-bottom: 28px; }

  .price-free-label {
    font-family: 'Instrument Serif', serif;
    font-size: 44px; font-weight: 400;
    letter-spacing: -0.03em; line-height: 1;
    color: var(--navy);
    margin-bottom: 6px;
  }

  .price-row {
    display: flex; align-items: flex-start; gap: 4px;
    line-height: 1;
  }
  .price-currency {
    font-size: 22px; font-weight: 700;
    color: #fff; margin-top: 8px;
    font-family: 'Figtree', sans-serif;
  }
  .price-amount {
    font-family: 'Instrument Serif', serif;
    font-size: 60px; font-weight: 400;
    letter-spacing: -0.04em; color: #fff;
    line-height: 1;
  }
  .price-period {
    font-size: 14px; font-weight: 500;
    align-self: flex-end; margin-bottom: 6px;
  }
  .card-free  .price-period { color: var(--slate-lt); }
  .card-pro   .price-period { color: rgba(255,255,255,0.5); }

  .price-tagline {
    font-size: 13px; margin-top: 6px;
  }
  .card-free .price-tagline { color: var(--slate-lt); }
  .card-pro  .price-tagline { color: rgba(255,255,255,0.55); }

  /* Annual saving badge */
  .annual-save {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25);
    color: var(--green); font-size: 12px; font-weight: 600;
    padding: 3px 9px; border-radius: 100px; margin-top: 8px;
  }

  /* ── Divider ─────────────────────────────────────── */
  .card-divider {
    height: 1px; margin: 0 0 24px;
  }
  .card-free .card-divider { background: var(--border); }
  .card-pro  .card-divider { background: rgba(255,255,255,0.1); }

  /* ── Features ────────────────────────────────────── */
  .features-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 14px;
  }
  .card-free .features-label { color: var(--slate-lt); }
  .card-pro  .features-label { color: rgba(255,255,255,0.45); }

  .feature-list {
    list-style: none;
    display: flex; flex-direction: column; gap: 12px;
    margin-bottom: 32px;
  }

  .feature-item {
    display: flex; align-items: flex-start; gap: 11px;
    font-size: 14.5px; font-weight: 500; line-height: 1.45;
  }
  .card-free .feature-item { color: var(--navy); }
  .card-pro  .feature-item { color: rgba(255,255,255,0.88); }

  .check-wrap {
    width: 20px; height: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }
  .card-free .check-wrap {
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.25);
  }
  .card-pro .check-wrap {
    background: rgba(14,165,160,0.2);
    border: 1px solid rgba(14,165,160,0.35);
  }
  .check-svg { display: block; }
  .check-path {
    stroke-dasharray: 20;
    stroke-dashoffset: 20;
    animation: check-draw 0.35s ease forwards;
  }
  .card-free .check-path { stroke: var(--green); }
  .card-pro  .check-path { stroke: var(--teal-lt); }

  /* ── CTA button ──────────────────────────────────── */
  .cta-btn {
    width: 100%;
    padding: 14px 24px;
    border-radius: 12px;
    font-family: 'Figtree', sans-serif;
    font-size: 15px; font-weight: 700;
    cursor: pointer; border: none;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.22s cubic-bezier(.22,1,.36,1);
    position: relative; overflow: hidden;
    letter-spacing: 0.01em;
  }
  .cta-btn:active { transform: scale(0.98); }

  .cta-free {
    background: var(--navy); color: #fff;
    box-shadow: 0 2px 8px rgba(15,22,35,0.15);
  }
  .cta-free:hover {
    background: var(--navy-mid);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(15,22,35,0.22);
  }

  .cta-pro {
    background: var(--teal);
    color: #fff;
    box-shadow: 0 4px 20px rgba(14,165,160,0.45);
  }
  .cta-pro:hover {
    background: var(--teal-lt);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(14,165,160,0.55);
  }

  /* Shimmer sweep on hover */
  .cta-btn::after {
    content: '';
    position: absolute; top: 0; left: -100%;
    width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg);
    transition: left 0.45s ease;
  }
  .cta-btn:hover::after { left: 160%; }

  /* ── Footer note ─────────────────────────────────── */
  .card-note {
    margin-top: 14px;
    font-size: 12.5px; text-align: center; line-height: 1.5;
  }
  .card-free .card-note { color: var(--slate-lt); }
  .card-pro  .card-note { color: rgba(255,255,255,0.4); }

  /* ── FAQ / trust strip ───────────────────────────── */
  .trust-strip {
    margin-top: 60px;
    display: flex; align-items: center; justify-content: center;
    gap: 36px; flex-wrap: wrap;
  }
  .trust-item {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 500; color: var(--slate-lt);
  }
  .trust-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--white); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
    box-shadow: var(--shadow-sm);
  }
  .trust-divider {
    width: 1px; height: 20px; background: var(--border-mid);
  }

  /* ── Responsive ──────────────────────────────────── */
  @media (max-width: 720px) {
    .cards-grid { grid-template-columns: 1fr; }
    .card-free  { margin-top: 0; }
    .pricing-page { padding: 56px 16px 80px; }
    .nav-links  { display: none; }
    .trust-strip{ gap: 20px; }
    .trust-divider { display: none; }
  }
`;

function CheckIcon({ color }) {
  return (
    <svg className="check-svg" width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path
        className="check-path"
        d="M2 5.5l2.5 2.5L9 3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon({ color = "currentColor" }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" />
      <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.6" />
      <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.6" />
      <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" />
    </svg>
  );
}

const FREE_FEATURES = [
  "Connect Google Business Profile",
  "Generate AI replies",
  "Post replies to Google",
];

const PRO_FEATURES = [
  "Unlimited review replies",
  "Priority AI processing",
  "Email support",
];

const TRUST_ITEMS = [
  { icon: "🔒", text: "Secure OAuth connection" },
  { icon: "↩️", text: "Cancel anytime" },
  { icon: "⚡", text: "Instant activation" },
  { icon: "🇮🇳", text: "INR billing" },
];

export default function PricingPage() {
  const [billing, setBilling] = useState("monthly");

  const proPrice    = billing === "monthly" ? "999" : "799";
  const annualTotal = billing === "annual"  ? "₹9,588 / year" : null;

  return (
    <>
      <style>{styles}</style>

      {/* ── Nav ────────────────────────────────────── */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <div className="nav-logo-icon"><LogoMark /></div>
            ReviewPilot
          </a>
          <div className="nav-links">
            <button className="nav-link">Features</button>
            <button className="nav-link active">Pricing</button>
            <button className="nav-link">How it works</button>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost">Login</button>
            <button className="btn-solid">
              Get started <ArrowIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page ───────────────────────────────────── */}
      <div className="pricing-page">
        <div className="pricing-inner">

          {/* Header */}
          <div className="pricing-header">
            <div className="pricing-eyebrow afu">
              <span className="eyebrow-line" />
              Simple pricing
              <span className="eyebrow-line" />
            </div>

            <h1 className="pricing-title afu d1">
              One plan. <em>Everything</em> included.
            </h1>

            <p className="pricing-sub afu d2">
              Start free, upgrade when you're ready.
              No hidden fees, no long-term contracts.
            </p>

            {/* Billing toggle */}
            <div className="afu d3">
              <div className="billing-toggle">
                <button
                  className={`toggle-option ${billing === "monthly" ? "active" : ""}`}
                  onClick={() => setBilling("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={`toggle-option ${billing === "annual" ? "active" : ""}`}
                  onClick={() => setBilling("annual")}
                >
                  Annual
                </button>
                {billing === "monthly" && (
                  <span className="toggle-badge">Save 20%</span>
                )}
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="cards-grid">

            {/* ── Free Trial Card ──────────────────── */}
            <div className="plan-card card-free afu d3">

              <div className="plan-name">Free Trial</div>

              <div className="price-block">
                <div className="price-free-label">₹0</div>
                <div className="price-period">forever free</div>
                <div className="price-tagline">10 AI replies included</div>
              </div>

              <div className="card-divider" />

              <div className="features-label">What's included</div>

              <ul className="feature-list">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="feature-item">
                    <span className="check-wrap">
                      <CheckIcon color="#10b981" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <button className="cta-btn cta-free">
                Start Free Trial
                <ArrowIcon color="#fff" />
              </button>

              <p className="card-note">No credit card required</p>
            </div>

            {/* ── Pro Plan Card ────────────────────── */}
            <div className="plan-card card-pro afu d4">

              <div className="plan-badge">
                <span className="badge-dot" />
                Most popular
              </div>

              <div className="plan-name">Pro</div>

              <div className="price-block">
                <div className="price-row">
                  <span className="price-currency">₹</span>
                  <span className="price-amount">{proPrice}</span>
                </div>
                <div className="price-period">per month</div>
                {billing === "annual" ? (
                  <div className="annual-save">
                    💰 You save ₹2,400 / year
                  </div>
                ) : (
                  <div className="price-tagline">Billed monthly · Cancel anytime</div>
                )}
              </div>

              <div className="card-divider" />

              <div className="features-label">Everything in Free, plus</div>

              <ul className="feature-list">
                {PRO_FEATURES.map((f, i) => (
                  <li key={i} className="feature-item">
                    <span className="check-wrap">
                      <CheckIcon color="#14b8b3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <button className="cta-btn cta-pro">
                Upgrade to Pro
                <ArrowIcon color="#fff" />
              </button>

              <p className="card-note">
                {billing === "annual"
                  ? `${annualTotal} · Billed once per year`
                  : "Switch to annual and save ₹200/mo"}
              </p>
            </div>

          </div>

          {/* Trust strip */}
          <div className="trust-strip afu d5">
            {TRUST_ITEMS.map((item, i) => (
              <>
                {i > 0 && <div key={`d-${i}`} className="trust-divider" />}
                <div key={item.text} className="trust-item">
                  <div className="trust-icon">{item.icon}</div>
                  {item.text}
                </div>
              </>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
