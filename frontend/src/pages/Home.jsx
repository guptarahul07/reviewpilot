// src/pages/Home.jsx
import { Link } from 'react-router-dom'
import { Zap, Star, ArrowRight, CheckCircle, RefreshCw, MessageSquare, BarChart2, Shield, Smartphone, Globe } from 'lucide-react'
import Button from '../components/ui/Button'
import DynamicBanner from '../components/DynamicBanner'
import './Home.css'
import SEOMeta from '../components/ui/SEOMeta'

const STATS = [
  { value: '5,000+', label: 'Reviews Managed' },
  { value: '98%',    label: 'Response Rate' },
  { value: '2 hrs',  label: 'Saved Per Week' },
  { value: '4.8★',   label: 'Avg Rating Lift' },
]

const FEATURES = [
  { icon: RefreshCw,     title: 'Automatic Review Syncing',  desc: 'Connect once. All Google Business reviews sync every 24 hours automatically. Never manually check Google again.' },
  { icon: MessageSquare, title: 'AI Reply Generation',       desc: 'Powered by Claude. Personalised, human-sounding replies for every review — positive or negative — in seconds.' },
  { icon: Zap,           title: 'One-Click Posting',         desc: 'Review the AI suggestion, edit if you want, post directly to Google. Customers see it instantly.' },
  { icon: RefreshCw,     title: 'Regenerate Options',        desc: "Don't like the suggestion? Regenerate for a completely different version. Unlimited tries." },
  { icon: BarChart2,     title: 'Sentiment Analysis',        desc: 'AI surfaces trends, common themes, and areas needing attention across all your reviews.' },
  { icon: Smartphone,    title: 'Mobile Optimised',          desc: 'Respond from your phone while running the floor. Full-featured on any device.' },
  { icon: Shield,        title: 'Bank-Level Security',       desc: 'Google OAuth 2.0. Your password is never stored. Disconnect anytime from Settings.' },
  { icon: Globe,         title: 'Made for India 🇮🇳',       desc: 'Built for Indian SMBs. English interface with Hindi, Tamil, Telugu support coming soon.' },
]

const INDUSTRIES = [
  { emoji: '☕', title: 'Cafés & Restaurants', desc: 'Handle food complaints, celebrate fans, and build a loyal customer base.' },
  { emoji: '💇', title: 'Salons & Spas',       desc: 'Show clients you care. Improve ratings with thoughtful responses.' },
  { emoji: '🏥', title: 'Clinics & Healthcare',desc: 'Build patient trust with professional, empathetic responses.' },
  { emoji: '💪', title: 'Gyms & Fitness',      desc: 'Engage members, address concerns, and grow your community.' },
  { emoji: '🏨', title: 'Hotels & Hospitality',desc: 'Turn guest feedback into 5-star ratings professionally.' },
  { emoji: '🛍️', title: 'Retail & Services',  desc: 'Manage feedback across locations. Build reputation one review at a time.' },
]

const TESTIMONIALS = [
  { name: 'Priya Sharma',     biz: 'Brew & Beans Café, Delhi',        quote: 'ReviewPilot transformed how we handle reviews. We now respond to every review within 24 hours. Our rating improved from 4.2 to 4.7 in 2 months!' },
  { name: 'Neha Patel',       biz: 'Glow Beauty Salon, Mumbai',       quote: "As a salon owner I don't have time to write replies. ReviewPilot's AI does it in seconds. I just review and post. Game changer!" },
  { name: 'Dr. Rajesh Kumar', biz: 'Kumar Dental Clinic, Bangalore',  quote: 'Managing 3 clinic locations was a nightmare. Now I see all reviews in one dashboard and respond from my phone. Worth every rupee!' },
]

const COMPARISON = [
  { feature: 'Manage existing reviews',  rp: true,  other: false },
  { feature: 'AI-powered replies',       rp: true,  other: false },
  { feature: 'Post replies to Google',   rp: true,  other: false },
  { feature: 'Sentiment analysis',       rp: true,  other: false },
  { feature: 'Multi-location support',   rp: true,  other: 'partial' },
  { feature: 'Full Google Business API', rp: true,  other: false },
]

export default function Home() {
  return (
    <div className="home">
      <SEOMeta
        title="ReviewPilot - AI Review Management for Indian Businesses"
        description="Manage Google Business reviews with AI. Auto-sync reviews, generate professional replies, and improve ratings. Built for Indian SMBs. Start free trial."
        keywords="review management, google business reviews, AI review replies, Indian SMB, restaurant reviews, salon reviews, clinic reviews"
        ogTitle="ReviewPilot - AI Review Management"
        ogDescription="Manage Google Business reviews with AI. Auto-sync reviews, generate professional replies, improve ratings."
        ogUrl="https://reviewpilot.live/"
        canonical="https://reviewpilot.live/"
      />

      {/* ── Hero ── */}
      <DynamicBanner location="homepage-banner" />
      <section className="hero container">
        <div className="hero__badge animate-fade-up delay-1">
          <Star size={11} fill="currentColor" />
          Beta Offer · First 50 users get 6 months FREE
        </div>
        <h1 className="hero__title animate-fade-up delay-2">
          Never miss a review again —<br />
          <span className="hero__gradient">AI replies in seconds</span>
        </h1>
        <p className="hero__sub animate-fade-up delay-3">
          Manage all your Google Business reviews with AI. Respond faster, build stronger
          customer relationships, and improve your online reputation — all from one dashboard.
        </p>
        <div className="hero__actions animate-fade-up delay-4">
          <Link to="/signup"><Button size="lg">Start Free Trial <ArrowRight size={16} /></Button></Link>
          <Link to="/free-audit"><Button variant="ghost" size="lg">Free Review Audit →</Button></Link>
        </div>
        <div className="hero__meta animate-fade-up delay-5">
          <span><CheckCircle size={13} /> No credit card required</span>
          <span><CheckCircle size={13} /> 15-day free trial</span>
          <span><CheckCircle size={13} /> Setup in 2 minutes</span>
        </div>
        <div className="hero__trust animate-fade-up delay-5">
          ✅ Google Verified &nbsp;·&nbsp; ✅ 100+ Businesses Trust Us &nbsp;·&nbsp; ✅ Made in India 🇮🇳
        </div>
        <div className="hero__preview animate-fade-up delay-5">
          <div className="preview-card">
            <div className="preview-card__header">
              <div className="preview-card__dot preview-card__dot--red" />
              <div className="preview-card__dot preview-card__dot--amber" />
              <div className="preview-card__dot preview-card__dot--green" />
              <span className="preview-card__title">Reviews Inbox — ReviewPilot</span>
            </div>
            <div className="preview-card__body">
              {[
                { stars: 5, text: 'Best butter chicken in Delhi! Amazing ambiance too!', status: 'replied' },
                { stars: 2, text: 'Food was good but waited 45 minutes. Very disappointed.', status: 'pending' },
                { stars: 4, text: 'Loved the dal makhani but the naan was a bit cold.', status: 'replied' },
              ].map((r, i) => (
                <div className="preview-row" key={i}>
                  <span className={`preview-row__stars${r.stars < 4 ? ' preview-row__stars--amber' : ''}`}>
                    {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
                  </span>
                  <span className="preview-row__text">{r.text}</span>
                  <span className={`preview-row__badge preview-row__badge--${r.status}`}>
                    {r.status === 'replied' ? '✓ Replied' : '⏳ Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats">
        <div className="container stats__grid">
          {STATS.map(({ value, label }) => (
            <div className="stat-card" key={label}>
              <div className="stat-card__value">{value}</div>
              <div className="stat-card__label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="problem container">
        <h2 className="section-title">You're getting reviews.<br />But are you responding?</h2>
        <p className="section-sub">Every day customers leave reviews on your Google Business Profile. Some are glowing 5-stars. Others need immediate attention. Responding to each one takes time you don't have.</p>
        <div className="problem__grid">
          {[
            'Unanswered reviews signal you don\'t care',
            'Slow responses hurt your local search ranking',
            'Generic replies feel robotic and insincere',
            'Missed opportunities to turn critics into fans',
          ].map(t => (
            <div className="problem__item" key={t}><span className="problem__x">✗</span><span>{t}</span></div>
          ))}
        </div>
        <div className="problem__stats">
          {[
            { num: '89%', text: 'of customers read owner responses before choosing a business' },
            { num: '35%', text: 'more revenue for businesses that respond to all reviews' },
            { num: '#1',  text: 'factor Google uses to rank local businesses in search' },
          ].map(({ num, text }) => (
            <div className="problem__stat" key={num}>
              <div className="problem__stat-num">{num}</div>
              <div className="problem__stat-text">{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">From reviews to responses<br />in 4 simple steps</h2>
          <div className="steps__grid">
            {[
              { emoji: '🔗', step: '01', title: 'Connect Google Business', time: '60 sec',  desc: 'Secure OAuth 2.0 — same security as Gmail. Your password is never stored.' },
              { emoji: '⭐', step: '02', title: 'Reviews Auto-Sync',       time: 'Instant', desc: 'All existing and new reviews sync automatically, organised by rating and urgency.' },
              { emoji: '✨', step: '03', title: 'AI Generates Replies',    time: '2 sec',   desc: "Personalised reply for each review referencing the customer's specific feedback." },
              { emoji: '🚀', step: '04', title: 'Review & Post',           time: '10 sec',  desc: 'Edit if you want, regenerate for a different version, or post as-is with one click.' },
            ].map(({ emoji, step, title, time, desc }) => (
              <div className="step-card" key={step}>
                <div className="step-card__num">{step}</div>
                <div className="step-card__emoji">{emoji}</div>
                <div className="step-card__time">⏱ {time}</div>
                <h3 className="step-card__title">{title}</h3>
                <p className="step-card__desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features container">
        <h2 className="section-title">Everything you need to manage<br />reviews like a pro</h2>
        <div className="features__grid">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div className="feature-card" key={title}>
              <div className="feature-card__icon"><Icon size={18} /></div>
              <h3 className="feature-card__title">{title}</h3>
              <p className="feature-card__desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why different ── */}
      <section className="difference container">
        <h2 className="section-title">Why ReviewPilot is different</h2>
        <p className="section-sub">Review collection tools help you <strong>get</strong> reviews. ReviewPilot helps you <strong>manage</strong> them. Different problems. Different solutions. Many businesses use both!</p>
        <div className="comparison-table">
          <div className="comparison-table__header">
            <div className="comparison-table__feat">Feature</div>
            <div className="comparison-table__rp">ReviewPilot ✅</div>
            <div className="comparison-table__other">Review Collection Tools</div>
          </div>
          {COMPARISON.map(({ feature, rp, other }) => (
            <div className="comparison-table__row" key={feature}>
              <div className="comparison-table__feat">{feature}</div>
              <div className="comparison-table__rp"><span className="cmp cmp--yes">✓</span></div>
              <div className="comparison-table__other">
                {other === 'partial' ? <span className="cmp cmp--partial">⚠ Limited</span> : <span className="cmp cmp--no">✗</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Industries ── */}
      <section className="industries container">
        <h2 className="section-title">Trusted by Indian businesses<br />across industries</h2>
        <div className="industries__grid">
          {INDUSTRIES.map(({ emoji, title, desc }) => (
            <div className="industry-card" key={title}>
              <div className="industry-card__emoji">{emoji}</div>
              <h3 className="industry-card__title">{title}</h3>
              <p className="industry-card__desc">{desc}</p>
            </div>
          ))}
        </div>
        <div className="industries__links">
          {[['Restaurants', '/restaurants'], ['Salons', '/salons'], ['Gyms', '/gyms'], ['Clinics', '/clinics']].map(([label, path]) => (
            <Link key={label} to={path} className="industry-link">{label} →</Link>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials container">
        <h2 className="section-title">Join 100+ Indian businesses<br />managing reviews better</h2>
        <div className="testimonials__grid">
          {TESTIMONIALS.map(({ name, biz, quote }) => (
            <div className="testimonial-card" key={name}>
              <div className="testimonial-card__stars">★★★★★</div>
              <p className="testimonial-card__quote">"{quote}"</p>
              <div className="testimonial-card__author">
                <div className="testimonial-card__avatar">{name[0]}</div>
                <div>
                  <div className="testimonial-card__name">{name}</div>
                  <div className="testimonial-card__biz">{biz}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing preview ── */}
      <section className="pricing-preview container">
        <h2 className="section-title">Simple, transparent pricing</h2>
        <p className="section-sub">All plans include AI reply generation, auto-sync, and insights. Save 17% with annual billing.</p>
        <div className="pricing-preview__grid">
          {[
            { name: 'Starter',    price: '₹2,999', sub: '₹250/mo', features: ['1 Business Location', 'Unlimited Reviews', 'AI Reply Generation', 'Auto-Sync (24 hrs)', 'Mobile Access'],        cta: 'Start Free Trial', popular: false, link: '/signup' },
            { name: 'Growth',     price: '₹5,999', sub: '₹500/mo', features: ['Up to 3 Locations', 'Everything in Starter', 'Priority Support', 'Advanced Analytics', 'Custom Templates'],      cta: 'Start Free Trial', popular: true,  link: '/signup' },
            { name: 'Enterprise', price: '₹9,999', sub: '₹833/mo', features: ['Unlimited Locations', 'Everything in Growth', 'WhatsApp Integration', 'Dedicated Manager', 'API Access'],         cta: 'Contact Sales',  popular: false, link: '/contact' },
          ].map(({ name, price, sub, features, cta, popular, link }) => (
            <div className={`pp-card${popular ? ' pp-card--popular' : ''}`} key={name}>
              {popular && <div className="pp-card__badge">Most Popular 🔥</div>}
              <div className="pp-card__name">{name}</div>
              <div className="pp-card__price">{price}<span className="pp-card__period">/year</span></div>
              <div className="pp-card__sub">{sub}</div>
              <ul className="pp-card__features">
                {features.map(f => <li key={f}><CheckCircle size={12} />{f}</li>)}
              </ul>
              <Link to={link}>
                <Button size="md" variant={popular ? 'primary' : 'ghost'} style={{ width: '100%' }}>
                  {cta} <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <div className="pricing-preview__footer">
          <Link to="/pricing" className="pricing-preview__link">See full pricing details →</Link>
        </div>
      </section>

      {/* ── Audit CTA ── */}
      <section className="audit-cta container">
        <div className="audit-cta__inner">
          <div className="audit-cta__left">
            <div className="audit-cta__eyebrow">🔍 Free Tool</div>
            <h2 className="audit-cta__title">How healthy are your reviews?</h2>
            <p className="audit-cta__sub">Get a free Review Health Score in 60 seconds. See exactly where you're losing customers.</p>
            <div className="audit-cta__meta">
              <span>✅ No signup required</span>
              <span>✅ 100% free</span>
              <span>✅ Instant results</span>
            </div>
          </div>
          <Link to="/free-audit"><Button size="lg">Get My Free Audit →</Button></Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="cta-banner container">
        <div className="cta-banner__inner">
          <h2 className="cta-banner__title">Ready to never miss a review again?</h2>
          <p className="cta-banner__sub">Join 100+ Indian businesses already saving time and improving their online reputation with ReviewPilot.</p>
          <div className="cta-banner__actions">
            <Link to="/signup"><Button size="lg"><Zap size={15} fill="currentColor" />Start Your Free Trial</Button></Link>
            <Link to="/contact"><Button variant="ghost" size="lg">Schedule a Demo →</Button></Link>
          </div>
          <div className="cta-banner__trust">🔒 Bank-level security &nbsp;·&nbsp; 🇮🇳 Made in India &nbsp;·&nbsp; ⭐ Google Verified</div>
        </div>
      </section>

    </div>
  )
}
