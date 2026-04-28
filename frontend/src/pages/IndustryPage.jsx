// src/pages/IndustryPage.jsx
// Shared component for all industry-specific landing pages
import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, Zap } from 'lucide-react'
import Button from '../components/ui/Button'
import './IndustryPage.css'

export default function IndustryPage({
  emoji, title, subtitle, trustLine,
  problems, scenarioIntro,
  scenarios, results,
  faqs,
}) {
  return (
    <div className="industry-page">

      {/* Hero */}
      <div className="ind-hero">
        <div className="ind-hero__inner">
          <div className="ind-hero__emoji">{emoji}</div>
          <h1 className="ind-hero__title">{title}</h1>
          <p className="ind-hero__sub">{subtitle}</p>
          <div className="ind-hero__trust">{trustLine}</div>
          <div className="ind-hero__actions">
            <Link to="/signup"><Button size="lg">Start Free Trial <ArrowRight size={16} /></Button></Link>
            <Link to="/free-audit"><Button variant="ghost" size="lg">Free Review Audit →</Button></Link>
          </div>
        </div>
      </div>

      <div className="ind-body">

        {/* Problems */}
        <div className="ind-problems">
          <h2 className="ind-section-title">The challenge you face every day</h2>
          <div className="ind-problems__grid">
            {problems.map(({ icon, title: t, desc }) => (
              <div className="ind-problem-card" key={t}>
                <div className="ind-problem-card__icon">{icon}</div>
                <h3 className="ind-problem-card__title">{t}</h3>
                <p className="ind-problem-card__desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How ReviewPilot helps */}
        <div className="ind-solution">
          <h2 className="ind-section-title">AI does the writing. You do the posting.</h2>
          <div className="ind-steps">
            {[
              { num: '01', title: 'Sync All Your Reviews',     desc: 'Connect your Google Business Profile once. All reviews sync automatically.' },
              { num: '02', title: 'Get AI Reply Suggestions',  desc: 'For each review, AI generates a personalised, professional response in 2 seconds.' },
              { num: '03', title: 'Review, Edit & Post',       desc: 'Read the suggestion. Edit if you want. Post to Google with one click.' },
            ].map(({ num, title: t, desc }) => (
              <div className="ind-step" key={num}>
                <div className="ind-step__num">{num}</div>
                <div>
                  <div className="ind-step__title">{t}</div>
                  <div className="ind-step__desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scenarios */}
        <div className="ind-scenarios">
          <h2 className="ind-section-title">See how it handles real reviews</h2>
          {scenarioIntro && <p className="ind-scenario-intro">{scenarioIntro}</p>}
          {scenarios.map(({ stars, review, reply, why }, i) => (
            <div className="ind-scenario" key={i}>
              <div className="ind-scenario__review">
                <span className="ind-scenario__stars">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
                <span className="ind-scenario__text">"{review}"</span>
              </div>
              <div className="ind-scenario__arrow">↓ AI Reply — generated in 2 seconds</div>
              <div className="ind-scenario__reply">"{reply}"</div>
              {why && (
                <div className="ind-scenario__why">
                  {why.map(w => <span key={w}><CheckCircle size={12} />{w}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Results */}
        {results && results.length > 0 && (
          <div className="ind-results">
            <h2 className="ind-section-title">Real results from Indian businesses</h2>
            <div className="ind-results__grid">
              {results.map(({ biz, before, after, quote, name }) => (
                <div className="ind-result-card" key={biz}>
                  <div className="ind-result-card__biz">{biz}</div>
                  <div className="ind-result-card__stats">
                    <div className="ind-result-card__stat ind-result-card__stat--before">
                      <div className="ind-result-card__stat-label">Before</div>
                      {before.map(b => <div key={b}>{b}</div>)}
                    </div>
                    <div className="ind-result-card__arrow">→</div>
                    <div className="ind-result-card__stat ind-result-card__stat--after">
                      <div className="ind-result-card__stat-label">After</div>
                      {after.map(a => <div key={a}>{a}</div>)}
                    </div>
                  </div>
                  {quote && <p className="ind-result-card__quote">"{quote}" — {name}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="ind-pricing">
          <h2 className="ind-section-title">Simple pricing, huge ROI</h2>
          <div className="ind-pricing__grid">
            {[
              { name: 'Starter', price: '₹2,999', sub: '/year · ₹250/mo', desc: 'Single location', link: '/signup', primary: false },
              { name: 'Growth',  price: '₹5,999', sub: '/year · ₹500/mo', desc: 'Up to 3 locations', link: '/signup', primary: true, badge: 'Most Popular 🔥' },
              { name: 'Enterprise', price: '₹9,999', sub: '/year · ₹833/mo', desc: 'Unlimited locations', link: '/contact', primary: false },
            ].map(({ name, price, sub, desc, link, primary, badge }) => (
              <div className={`ind-plan${primary ? ' ind-plan--popular' : ''}`} key={name}>
                {badge && <div className="ind-plan__badge">{badge}</div>}
                <div className="ind-plan__name">{name}</div>
                <div className="ind-plan__price">{price}<span>{sub}</span></div>
                <div className="ind-plan__desc">{desc}</div>
                <Link to={link}>
                  <Button size="md" variant={primary ? 'primary' : 'ghost'} style={{ width: '100%' }}>
                    {name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'} <ArrowRight size={13} />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="ind-pricing__note">
            ✅ 15-day free trial · No credit card · Cancel anytime · 30-day money-back guarantee
          </div>
        </div>

        {/* FAQ */}
        {faqs && faqs.length > 0 && (
          <div className="ind-faq">
            <h2 className="ind-section-title">Quick questions</h2>
            {faqs.map(({ q, a }) => (
              <div className="ind-faq__item" key={q}>
                <div className="ind-faq__q">Q: {q}</div>
                <div className="ind-faq__a">A: {a}</div>
              </div>
            ))}
          </div>
        )}

        {/* Final CTA */}
        <div className="ind-final-cta">
          <div className="ind-final-cta__inner">
            <h2 className="ind-final-cta__title">Start turning reviews into revenue</h2>
            <p className="ind-final-cta__sub">Join 100+ Indian businesses already managing reviews better with ReviewPilot.</p>
            <div className="ind-final-cta__actions">
              <Link to="/signup"><Button size="lg"><Zap size={15} fill="currentColor" />Start 15-Day Free Trial</Button></Link>
              <Link to="/contact"><Button variant="ghost" size="lg">Schedule a Demo →</Button></Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
