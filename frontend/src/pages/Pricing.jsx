// src/pages/Pricing.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, X, Zap, Star } from 'lucide-react'
import Button from '../components/ui/Button'
import './Pricing.css'
import DynamicBanner from '../components/DynamicBanner'
import SEOMeta from '../components/ui/SEOMeta'

/* ─────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 499,
    annualPrice: 4790,
    annualMonthly: 399,
    desc: 'Perfect for single-location businesses just getting started.',
    cta: 'Start Free Trial',
    ctaLink: '/signup',
    popular: false,
    features: [
      { text: '1 Business Location', yes: true },
      { text: 'Unlimited Review Management', yes: true },
      { text: 'Unlimited AI Reply Generation', yes: true },
      { text: 'Auto-Sync every 24 hours', yes: true },
      { text: 'Manual Sync anytime', yes: true },
      { text: 'Edit & Regenerate Replies', yes: true },
      { text: 'One-Click Google Posting', yes: true },
      { text: 'Basic Sentiment Analysis', yes: true },
      { text: 'Review Trends (30 days)', yes: true },
      { text: 'Mobile-Optimised Dashboard', yes: true },
      { text: 'Email Support (2 business days)', yes: true },
      { text: 'WhatsApp / Phone Support', yes: false },
      { text: 'Custom Reply Templates', yes: false },
      { text: 'Multi-language Replies', yes: false },
      { text: 'Team Members', yes: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 999,
    annualPrice: 8991,
    annualMonthly: 749,
    desc: 'For growing businesses with 2–3 locations and a team.',
    cta: 'Start Free Trial',
    ctaLink: '/signup',
    popular: true,
    features: [
      { text: 'Up to 3 Business Locations', yes: true },
      { text: 'Unlimited Review Management', yes: true },
      { text: 'Unlimited AI Reply Generation', yes: true },
      { text: 'Faster Sync (every 12 hours)', yes: true },
      { text: 'Manual Sync anytime', yes: true },
      { text: 'Edit & Regenerate Replies', yes: true },
      { text: 'One-Click Google Posting', yes: true },
      { text: 'Advanced Sentiment Analysis', yes: true },
      { text: 'Review Trends (90 days)', yes: true },
      { text: 'Mobile-Optimised Dashboard', yes: true },
      { text: 'Email Support (1 business day)', yes: true },
      { text: 'WhatsApp / Phone Support', yes: true },
      { text: 'Custom Reply Templates (10)', yes: true },
      { text: 'English + Hindi Replies', yes: true },
      { text: 'Up to 3 Team Members', yes: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 1999,
    annualPrice: 16792,
    annualMonthly: 1399,
    desc: 'For large chains, franchises, and hospital networks.',
    cta: 'Contact Sales',
    ctaLink: '/contact',
    popular: false,
    features: [
      { text: 'Unlimited Business Locations', yes: true },
      { text: 'Unlimited Review Management', yes: true },
      { text: 'Unlimited AI Reply Generation', yes: true },
      { text: 'Real-Time Sync', yes: true },
      { text: 'Manual Sync anytime', yes: true },
      { text: 'Edit & Regenerate Replies', yes: true },
      { text: 'One-Click Google Posting', yes: true },
      { text: 'Premium Insights Dashboard', yes: true },
      { text: 'Custom Date Range Analytics', yes: true },
      { text: 'Mobile-Optimised Dashboard', yes: true },
      { text: 'Same-Day Email Support', yes: true },
      { text: 'Priority WhatsApp / Phone', yes: true },
      { text: 'Unlimited Custom Templates', yes: true },
      { text: 'All Indian Languages', yes: true },
      { text: 'Unlimited Team Members + Roles', yes: true },
    ],
  },
]

const BETA_FEATURES = [
  'Full access to ALL Pro features',
  'Unlimited reviews fetched & replied',
  'Priority support + free onboarding call',
  'Direct WhatsApp access to the founder',
  'Lock in current pricing forever',
  'Beta badge on your profile',
]

const FAQS = [
  { q: 'Do I need a credit card for the beta offer?',    a: 'No credit card required to start your 15-day free trial. You only pay after the trial ends if you choose to continue.' },
  { q: 'What happens after the 15-day trial?',           a: "After the trial, your account pauses until you add a payment method. No surprise charges — you'll always be asked to confirm before billing starts." },
  { q: 'Can I switch plans later?',                      a: 'Yes! Upgrade anytime. Downgrade at renewal.' },
  { q: 'What payment methods do you accept?',            a: 'Credit/Debit cards, UPI, and Net Banking via Razorpay.' },
  { q: 'Is there a setup fee?',                          a: 'No setup fees. Ever.' },
  { q: 'Do you offer a money-back guarantee?',           a: "Yes — 30-day money-back guarantee if you're not satisfied on a paid plan." },
  { q: 'Can I pay monthly instead of annually?',         a: 'Yes, but annual saves you 17% (2 months free). Monthly pricing available on all plans.' },
  { q: 'Do you offer discounts for NGOs or startups?',   a: 'Yes! Email support@reviewpilot.live for special pricing.' },
  { q: 'What happens if I need more than 3 locations?',  a: 'Upgrade to Enterprise for unlimited locations.' },
]

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */
export default function Pricing() {
  const [billing, setBilling]   = useState('annual')
  const [pricingTab, setPricingTab] = useState('individual') // 'individual' | 'bundles'
  const [openFaq, setOpenFaq]   = useState(null)
  const { user, isTrialActive, isExpired } = useAuth()
  const navigate = useNavigate()

  function handlePlanCTA(plan) {
    if (plan.id === 'professional') { navigate('/contact'); return }
    if (!user) {
      navigate(`/signup?plan=${plan.id}&billing=${billing}`)
      return
    }
    navigate(`/checkout?plan=${plan.id}&billing=${billing}`)
  }

  function getPlanCTA(plan) {
    if (plan.id === 'professional') return 'Contact Sales'
    if (!user) return 'Start Free Trial'
    if (isExpired) return 'Choose This Plan →'
    if (isTrialActive) return 'Upgrade Now →'
    return 'Switch to This Plan →'
  }

  // ROI calculator state
  const [rating, setRating]     = useState('4.2')
  const [reviews, setReviews]   = useState('25')
  const [responseRate, setResponseRate] = useState('30')
  const [avgTxn, setAvgTxn]     = useState('500')

  function calcROI() {
    const r = parseFloat(rating) || 4.2
    const m = parseFloat(reviews) || 25
    const txn = parseFloat(avgTxn) || 500
    const ratingImprovement = 0.4
    const newCustomers = Math.round(m * 0.6)
    const addRevenue = Math.round(newCustomers * txn * 12)
    const cost = 2999
    const roi = Math.round(((addRevenue - cost) / cost) * 100)
    const payback = Math.round((cost / (addRevenue / 365)))
    return { ratingImprovement, newCustomers, addRevenue, cost, roi, payback }
  }

  const roi = calcROI()

  return (
    <div className="pricing-page">
      <SEOMeta
        title="Pricing - ReviewPilot | Plans from ₹2,999/year"
        description="ReviewPilot pricing: ₹2,999/year Starter, ₹5,999/year Growth, ₹9,999/year Enterprise. 15-day free trial. No credit card. AI review management for Indian businesses."
        keywords="ReviewPilot pricing, review management cost, AI review management India, Google Business review tool price"
        ogTitle="ReviewPilot Pricing - Simple, Transparent Plans"
        ogDescription="Plans from ₹2,999/year. 15-day free trial. AI-powered Google Business review management for Indian SMBs."
        ogUrl="https://reviewpilot.live/pricing"
        canonical="https://reviewpilot.live/pricing"
      />

      {/* ── Hero ── */}
      <div className="pricing-hero">
        <div className="pricing-hero__badge">
          <Star size={11} fill="currentColor" />
          Special Offer · Annual plans
        </div>
        <h1 className="pricing-title">Simple, transparent pricing</h1>
        <p className="pricing-sub">
          Choose the plan that fits your business. All plans include AI reply generation,
          automatic syncing, and insights. Save 17% with annual billing.
        </p>
        <div className="pricing-toggle">
          <button
            className={`pricing-toggle__btn${billing === 'monthly' ? ' pricing-toggle__btn--active' : ''}`}
            onClick={() => setBilling('monthly')}
          >Monthly</button>
          <button
            className={`pricing-toggle__btn${billing === 'annual' ? ' pricing-toggle__btn--active' : ''}`}
            onClick={() => setBilling('annual')}
          >
            Annual
            <span className="pricing-toggle__save">Save up to 30%</span>
          </button>
        </div>
      </div>

      <DynamicBanner location="pricing-banner" />

      {/* Product/Bundle tab selector */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 0' }}>
        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, gap: 4 }}>
          {[{ id: 'individual', label: 'Individual Products' }, { id: 'bundles', label: '🔥 Bundles — Save more' }].map(({ id, label }) => (
            <button key={id} onClick={() => setPricingTab(id)} style={{
              padding: '9px 18px', border: 'none', borderRadius: 9,
              background: pricingTab === id ? 'var(--accent)' : 'none',
              color: pricingTab === id ? '#fff' : 'var(--ink-3)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-body)', transition: 'all .15s', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div className="pricing-body">

        {/* ── Beta banner ── */}
        <div className="beta-banner">
          <div className="beta-banner__left">
            <div className="beta-banner__eyebrow">🎁 Special Offer</div>
            <div className="beta-banner__title">Get 2 months FREE with annual billing</div>
            <p className="beta-banner__sub">Help us shape the product and lock in free access. No credit card. No auto-billing.</p>
            <div className="beta-banner__spots">
              <div className="beta-banner__bar"><div className="beta-banner__fill" style={{ width: '62%' }} /></div>
              <span>~31 of 50 spots taken</span>
            </div>
          </div>
          <div className="beta-banner__right">
            <ul className="beta-banner__features">
              {BETA_FEATURES.map(f => (
                <li key={f}><CheckCircle size={13} />{f}</li>
              ))}
            </ul>
            <Link to="/signup" className="beta-banner__cta">
              <Zap size={14} fill="currentColor" />
              Grab Your Free Spot
            </Link>
            <div className="beta-banner__note">No credit card · No auto-billing · Cancel anytime</div>
          </div>
        </div>

        {pricingTab === 'individual' && (
          <>
        {/* ── Plan cards ── */}
        <div className="plans-label">Or choose a paid plan — starts with a 15-day free trial</div>
        <div className="plans-grid">
          {PLANS.map(plan => {
            const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice * 12
            const monthly = billing === 'annual' ? plan.annualMonthly : plan.monthlyPrice
            const saving = (plan.monthlyPrice * 12) - plan.annualPrice

            return (
              <div className={`plan-card${plan.popular ? ' plan-card--popular' : ''}`} key={plan.id}>
                {plan.popular && <div className="plan-card__badge"><Zap size={10} fill="currentColor" />Most Popular</div>}

                <div className="plan-card__head">
                  <div className="plan-card__name">{plan.name}</div>
                  <div className="plan-card__price-row">
                    <span className="plan-card__currency">₹</span>
                    <span className="plan-card__amount">{monthly.toLocaleString('en-IN')}</span>
                    <span className="plan-card__mo">/mo</span>
                  </div>
                  {billing === 'annual' && (
                    <div className="plan-card__annual">
                      Billed ₹{price.toLocaleString('en-IN')}/year ·{' '}
                      <span className="plan-card__saving">Save ₹{saving.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <p className="plan-card__desc">{plan.desc}</p>
                </div>

                <Button
                  size="md"
                  variant={plan.popular ? 'primary' : 'ghost'}
                  style={{ width: '100%' }}
                  onClick={() => handlePlanCTA(plan)}
                >
                  {getPlanCTA(plan)}
                </Button>
                <div className="plan-card__trial">
                  {!user
                    ? '15-day free trial · No credit card to start'
                    : isTrialActive
                      ? `Trial active · Upgrade anytime`
                      : isExpired
                        ? 'Trial ended · Choose a plan to continue'
                        : ''}
                </div>

                <ul className="plan-card__features">
                  {plan.features.map(({ text, yes }) => (
                    <li key={text} className={yes ? '' : 'plan-card__feature--no'}>
                      {yes
                        ? <CheckCircle size={13} className="plan-card__check--yes" />
                        : <X size={13} className="plan-card__check--no" />
                      }
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* ── What's included in all plans ── */}
        <div className="all-include">
          <div className="all-include__title">✅ All plans include</div>
          <div className="all-include__grid">
            {[
              '15-day free trial (no credit card)',
              'Unlimited review management',
              'Unlimited AI reply generation',
              'Mobile-optimised dashboard',
              'Bank-level security (OAuth 2.0)',
              'Cancel anytime',
              '30-day money-back guarantee',
              'Free feature updates',
            ].map(f => (
              <div className="all-include__item" key={f}>
                <CheckCircle size={13} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* ── ROI Calculator ── */}
        <div className="roi-section">
          <h2 className="pricing-section-title">Calculate your ROI</h2>
          <p className="pricing-section-sub">See how much additional revenue ReviewPilot can generate for your business.</p>
          <div className="roi-card">
            <div className="roi-inputs">
              <div className="roi-input">
                <label>Current Google Rating</label>
                <input type="number" min="1" max="5" step="0.1" value={rating} onChange={e => setRating(e.target.value)} />
              </div>
              <div className="roi-input">
                <label>Monthly Reviews</label>
                <input type="number" min="1" value={reviews} onChange={e => setReviews(e.target.value)} />
              </div>
              <div className="roi-input">
                <label>Current Response Rate (%)</label>
                <input type="number" min="0" max="100" value={responseRate} onChange={e => setResponseRate(e.target.value)} />
              </div>
              <div className="roi-input">
                <label>Avg. Transaction Value (₹)</label>
                <input type="number" min="1" value={avgTxn} onChange={e => setAvgTxn(e.target.value)} />
              </div>
            </div>
            <div className="roi-results">
              <div className="roi-result">
                <div className="roi-result__value">+{roi.ratingImprovement} ⭐</div>
                <div className="roi-result__label">Rating Improvement</div>
              </div>
              <div className="roi-result">
                <div className="roi-result__value">+{roi.newCustomers}/mo</div>
                <div className="roi-result__label">New Customers</div>
              </div>
              <div className="roi-result roi-result--highlight">
                <div className="roi-result__value">₹{roi.addRevenue.toLocaleString('en-IN')}</div>
                <div className="roi-result__label">Additional Revenue / Year</div>
              </div>
              <div className="roi-result">
                <div className="roi-result__value">{roi.roi.toLocaleString('en-IN')}%</div>
                <div className="roi-result__label">ROI</div>
              </div>
              <div className="roi-result">
                <div className="roi-result__value">{roi.payback} days</div>
                <div className="roi-result__label">Payback Period</div>
              </div>
              <div className="roi-result">
                <div className="roi-result__value">₹2,999</div>
                <div className="roi-result__label">Annual Cost</div>
              </div>
            </div>
            <div className="roi-cta">
              <Link to="/signup">
                <Button size="md">Start Free Trial — Get This ROI →</Button>
              </Link>
            </div>
          </div>
        </div>

          </>
        )}

        {/* ── Why free ── */}
        <div className="why-free">
          <h2 className="pricing-section-title">Why is the beta free?</h2>
          <div className="why-free__grid">
            {[
              { icon: '🛠️', title: "We're building together",     desc: "Beta users shape the product. Your feedback directly decides what we build next." },
              { icon: '🤝', title: 'You take the risk with us',    desc: "Early adopters trust us before we're perfect. That deserves real appreciation." },
              { icon: '🚀', title: "We want your success story",  desc: "We'd rather prove value first and earn your business long-term." },
            ].map(({ icon, title, desc }) => (
              <div className="why-free__card" key={title}>
                <div className="why-free__icon">{icon}</div>
                <div className="why-free__title">{title}</div>
                <div className="why-free__desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── App Store Coming Soon card (Individual tab only) ── */}
        {pricingTab === 'individual' && (
          <div style={{ marginTop: 24, background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: 20, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, opacity: 0.85 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 36 }}>🍎</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>App Store Reviews</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(245,166,35,.1)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,.2)' }}>COMING SOON</span>
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--ink-3)', margin: 0, lineHeight: 1.55 }}>
                  AI-powered replies for Apple App Store reviews. Unified inbox with Play Store. Pricing TBD.
                </p>
              </div>
            </div>
            <a href="/products/app-store-reviews" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink-3)', textDecoration: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Notify Me →
            </a>
          </div>
        )}

        {/* ── Bundles Tab ── */}
        {pricingTab === 'bundles' && (
          <div style={{ marginBottom: 48 }}>
            <p style={{ textAlign: 'center', fontSize: 15, color: 'var(--ink-3)', marginBottom: 36 }}>
              Get more products at a discounted rate.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              {[
                { name: 'Starter Bundle', price: 799, savings: 199, badge: null, includes: ['GBP Starter + Play Starter', '1 location + 1 app', 'AI replies', 'Email support'] },
                { name: 'Growth Bundle', price: 1799, savings: 899, badge: 'Most Popular 🔥', includes: ['GBP Growth + Play Growth', '3 locations + 3 apps', 'InsightPilot Basic (free)', 'Advanced analytics', 'WhatsApp support'] },
                { name: 'Business Suite', price: 3499, savings: 1498, badge: 'Best Value', includes: ['All Pro plans', 'Unlimited locations & apps', 'InsightPilot Pro', 'Dedicated manager', 'API access'] },
              ].map(({ name, price, savings, badge, includes }) => (
                <div key={name} style={{ background: 'var(--bg-card)', border: badge === 'Most Popular 🔥' ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius: 20, padding: 24, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {badge && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 700, background: badge.includes('Popular') ? 'var(--accent)' : 'var(--green)', color: '#fff', padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap' }}>{badge}</div>}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>{name}</h3>
                  <div style={{ marginBottom: 4 }}><span style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>₹{price.toLocaleString('en-IN')}</span><span style={{ fontSize: 13, color: 'var(--ink-3)' }}>/mo</span></div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 16 }}>Save ₹{savings.toLocaleString('en-IN')}/mo</div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20, flex: 1 }}>
                    {includes.map(f => <li key={f} style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', gap: 7 }}><span style={{ color: 'var(--green)' }}>✓</span>{f}</li>)}
                  </ul>
                  <a href={'/checkout?plan=' + name.toLowerCase().replace(/\s+/g, '_') + '&billing=monthly'} style={{ display: 'block', background: badge === 'Most Popular 🔥' ? 'var(--accent)' : 'var(--bg)', border: badge === 'Most Popular 🔥' ? 'none' : '1px solid var(--border)', color: badge === 'Most Popular 🔥' ? '#fff' : 'var(--ink)', borderRadius: 10, padding: '10px 0', textAlign: 'center', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                    Get Started
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        <div className="pricing-faq">
          <h2 className="pricing-section-title">Pricing FAQs</h2>
          <div className="pricing-faq__list">
            {FAQS.map((faq, i) => (
              <div className="pricing-faq__item" key={i}>
                <button
                  className="pricing-faq__q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <span className={`pricing-faq__chevron${openFaq === i ? ' open' : ''}`}>›</span>
                </button>
                {openFaq === i && <div className="pricing-faq__a">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        {/* Trust signals */}
        <div className="pricing-trust">
          <div className="pricing-trust__item">✅ 100+ Indian businesses trust ReviewPilot</div>
          <div className="pricing-trust__item">🇮🇳 Made in India, built for India</div>
          <div className="pricing-trust__item">⭐ Google Verified OAuth App</div>
          <div className="pricing-trust__item">🔒 AES-256 encrypted · Data stored in India</div>
          <div className="pricing-trust__item">💳 Pay via UPI, Cards, Net Banking</div>
        </div>

        <div className="pricing-cta-bottom">
          <h2 className="pricing-section-title">Still have questions?</h2>
          <p className="pricing-section-sub">
            WhatsApp us at <strong>+91 98100 26181</strong> or email <strong>support@reviewpilot.live</strong>.
            We respond within 1 business day.
          </p>
          <div className="pricing-cta-bottom__actions">
            <Link to="/signup">
              <Button size="lg"><Zap size={15} fill="currentColor" />Grab Your Free Spot</Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost" size="lg">Contact Us</Button>
            </Link>
          </div>
          <div className="pricing-cta-bottom__note">
            All prices in Indian Rupees (₹). Prices exclude applicable GST.
            Annual plans billed once per year. Monthly plans billed monthly.
          </div>
        </div>

      </div>
    </div>
  )
}
