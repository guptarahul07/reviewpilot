// src/pages/FreeAudit.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, Zap } from 'lucide-react'
import Button from '../components/ui/Button'
import './FreeAudit.css'

function calcScore({ responseRate, avgResponseDays, avgResponseWords, totalReviews }) {
  const rateScore    = Math.round((responseRate / 100) * 40)
  const speedScore   = avgResponseDays <= 1 ? 25 : avgResponseDays <= 2 ? 20 : avgResponseDays <= 5 ? 12 : 5
  const qualityScore = avgResponseWords >= 40 ? 20 : avgResponseWords >= 20 ? 14 : avgResponseWords >= 8 ? 8 : 3
  const volScore     = totalReviews >= 50 ? 15 : totalReviews >= 20 ? 10 : totalReviews >= 5 ? 7 : 4
  return Math.min(rateScore + speedScore + qualityScore + volScore, 100)
}

function getLabel(score) {
  if (score >= 80) return { label: 'Excellent 🏆',          color: '#22d08a' }
  if (score >= 60) return { label: 'Good ✅',               color: '#4f7cff' }
  if (score >= 40) return { label: 'Needs Improvement ⚠️',  color: '#f5a623' }
  return            { label: 'Critical 🚨',                  color: '#ff5c5c' }
}

export default function FreeAudit() {
  const [step, setStep] = useState('form')
  const [businessName,       setBusinessName]       = useState('')
  const [totalReviews,       setTotalReviews]       = useState('')
  const [reviewsWithReplies, setReviewsWithReplies] = useState('')
  const [avgResponseDays,    setAvgResponseDays]    = useState('')
  const [avgResponseWords,   setAvgResponseWords]   = useState('')
  const [avgRating,          setAvgRating]          = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setStep('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const total    = parseFloat(totalReviews) || 50
  const replied  = parseFloat(reviewsWithReplies) || 12
  const days     = parseFloat(avgResponseDays) || 4
  const words    = parseFloat(avgResponseWords) || 10
  const name     = businessName || 'Your Business'

  const responseRate = Math.round((replied / total) * 100)
  const unanswered   = total - replied
  const score        = calcScore({ responseRate, avgResponseDays: days, avgResponseWords: words, totalReviews: total })
  const { label: scoreLabel, color: scoreColor } = getLabel(score)
  const estRevLoss   = Math.round(unanswered * 800)

  return (
    <div className="audit-page">
      <div className="audit-hero">
        <div className="audit-hero__eyebrow">🔍 Free Tool</div>
        <h1 className="audit-hero__title">Free Google Business<br />Review Health Check</h1>
        <p className="audit-hero__sub">See how your response rate compares to competitors. Get a detailed report in 60 seconds — completely free.</p>
        <div className="audit-hero__trust">
          <span><CheckCircle size={13} /> No signup required</span>
          <span><CheckCircle size={13} /> 100% free</span>
          <span><CheckCircle size={13} /> Instant results</span>
        </div>
      </div>

      <div className="audit-body">

        {step === 'form' && (
          <div className="audit-form-wrap">
            <div className="audit-metrics">
              {[
                { icon: '📊', title: 'Response Rate Score',  desc: 'How many of your reviews have responses vs competitors' },
                { icon: '⚡', title: 'Response Speed',       desc: 'Average time to respond to reviews' },
                { icon: '✨', title: 'Response Quality',     desc: 'Length and personalisation of your responses' },
                { icon: '💰', title: 'Opportunity Cost',     desc: 'Estimated revenue lost from unanswered reviews' },
              ].map(({ icon, title, desc }) => (
                <div className="audit-metric" key={title}>
                  <span className="audit-metric__icon">{icon}</span>
                  <div><div className="audit-metric__title">{title}</div><div className="audit-metric__desc">{desc}</div></div>
                </div>
              ))}
            </div>

            <form className="audit-form" onSubmit={handleSubmit}>
              <h2 className="audit-form__title">Enter your review data</h2>
              <p className="audit-form__sub">Find this info on your Google Business Profile dashboard.</p>
              <div className="audit-form__grid">
                <div className="audit-field">
                  <label>Business Name</label>
                  <input type="text" placeholder="e.g. Brew & Beans Café" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                </div>
                <div className="audit-field">
                  <label>Average Google Rating ⭐</label>
                  <input type="number" min="1" max="5" step="0.1" placeholder="e.g. 4.2" value={avgRating} onChange={e => setAvgRating(e.target.value)} required />
                </div>
                <div className="audit-field">
                  <label>Total Reviews</label>
                  <input type="number" min="1" placeholder="e.g. 127" value={totalReviews} onChange={e => setTotalReviews(e.target.value)} required />
                </div>
                <div className="audit-field">
                  <label>Reviews You've Replied To</label>
                  <input type="number" min="0" placeholder="e.g. 29" value={reviewsWithReplies} onChange={e => setReviewsWithReplies(e.target.value)} required />
                </div>
                <div className="audit-field">
                  <label>Avg. Days to Respond</label>
                  <input type="number" min="0" step="0.5" placeholder="e.g. 3" value={avgResponseDays} onChange={e => setAvgResponseDays(e.target.value)} required />
                </div>
                <div className="audit-field">
                  <label>Avg. Words in Your Responses</label>
                  <input type="number" min="0" placeholder="e.g. 12" value={avgResponseWords} onChange={e => setAvgResponseWords(e.target.value)} required />
                </div>
              </div>
              <div className="audit-form__privacy">🔒 We only use this data to calculate your score. Nothing is stored or shared.</div>
              <Button type="submit" size="lg" style={{ width: '100%' }}>Get My Free Health Report <ArrowRight size={16} /></Button>
            </form>
          </div>
        )}

        {step === 'results' && (
          <div className="audit-results">

            <div className="score-card">
              <div className="score-card__name">{name}</div>
              <div className="score-card__label">Review Health Score</div>
              <div className="score-card__score" style={{ color: scoreColor }}>{score}<span>/100</span></div>
              <div className="score-card__bar"><div className="score-card__fill" style={{ width: `${score}%`, background: scoreColor }} /></div>
              <div className="score-card__status" style={{ color: scoreColor }}>{scoreLabel}</div>
            </div>

            <div className="audit-comparison">
              <h2 className="audit-section-title">How you compare</h2>
              <div className="audit-table">
                <div className="audit-table__head">
                  <div>Metric</div><div>Your Score</div><div>Industry Avg</div><div>Gap</div>
                </div>
                {[
                  { m: 'Response Rate',    y: `${responseRate}%`, a: '78%', gap: responseRate >= 78 ? '✓ Above avg' : `-${78 - responseRate}%`, good: responseRate >= 78 },
                  { m: 'Response Time',    y: `${days}d`,         a: '1.3d', gap: days <= 1.3 ? '✓ Fast' : `+${(days - 1.3).toFixed(1)}d slow`, good: days <= 1.3 },
                  { m: 'Response Quality', y: `${words} words`,   a: '45 words', gap: words >= 45 ? '✓ Good' : `-${45 - words} words`, good: words >= 45 },
                ].map(({ m, y, a, gap, good }) => (
                  <div className="audit-table__row" key={m}>
                    <div className="audit-table__metric">{m}</div>
                    <div>{y}</div>
                    <div className="audit-table__avg">{a}</div>
                    <div className={`audit-table__gap ${good ? 'good' : 'bad'}`}>{gap}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="audit-opp-cards">
              <div className="audit-opp audit-opp--warn">
                <div className="audit-opp__num">{unanswered}</div>
                <div className="audit-opp__label">Unanswered Reviews</div>
                <div className="audit-opp__sub">Customers who felt ignored</div>
              </div>
              <div className="audit-opp audit-opp--warn">
                <div className="audit-opp__num">{responseRate}%</div>
                <div className="audit-opp__label">Your Response Rate</div>
                <div className="audit-opp__sub">Industry average is 78%</div>
              </div>
              <div className="audit-opp audit-opp--red">
                <div className="audit-opp__num">₹{estRevLoss.toLocaleString('en-IN')}</div>
                <div className="audit-opp__label">Est. Annual Revenue Loss</div>
                <div className="audit-opp__sub">From unanswered reviews</div>
              </div>
            </div>

            <div className="audit-samples">
              <h2 className="audit-section-title">See what ReviewPilot's AI generates</h2>
              {[
                { stars: 5, review: "Amazing food and great service! Definitely coming back!", reply: "Thank you so much for the wonderful review! 😊 We're thrilled you loved the food and service — our team works really hard to make every visit special. Looking forward to welcoming you back soon!", label: '5-star · builds loyalty' },
                { stars: 2, review: "Service was slow during lunch rush. Food was good though.", reply: "Thank you for your honest feedback! We're glad you enjoyed the food. You're right about the lunch rush — we've added more staff to improve speed during peak hours. We'd love to make it right on your next visit!", label: '2-star · turns critic into fan' },
              ].map(({ stars, review, reply, label }) => (
                <div className="audit-sample" key={label}>
                  <div className="audit-sample__badge">{label}</div>
                  <div className="audit-sample__review">
                    <span className="audit-sample__stars">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                    "{review}"
                  </div>
                  <div className="audit-sample__arrow">↓ AI Reply — generated in 2 seconds</div>
                  <div className="audit-sample__reply">"{reply}"</div>
                </div>
              ))}
            </div>

            <div className="audit-before-after">
              <div className="audit-ba audit-ba--before">
                <div className="audit-ba__label">Your score today</div>
                <div className="audit-ba__score" style={{ color: scoreColor }}>{score}/100</div>
                <div className="audit-ba__stat">Response Rate: {responseRate}%</div>
                <div className="audit-ba__stat">Response Time: {days} days</div>
              </div>
              <div className="audit-ba__arrow">→</div>
              <div className="audit-ba audit-ba--after">
                <div className="audit-ba__label">With ReviewPilot (30 days)</div>
                <div className="audit-ba__score" style={{ color: '#22d08a' }}>92/100</div>
                <div className="audit-ba__stat">Response Rate: 100%</div>
                <div className="audit-ba__stat">Response Time: &lt;24 hours</div>
              </div>
            </div>

            <div className="audit-cta-box">
              <h2 className="audit-cta-box__title">Fix your review health — risk free</h2>
              <div className="audit-cta-box__roi">
                <span>Cost: ₹2,999/year</span>
                <span>Est. Gain: ₹{estRevLoss.toLocaleString('en-IN')}/year</span>
                <span>ROI: {Math.round(((estRevLoss - 2999) / 2999) * 100)}%</span>
              </div>
              <div className="audit-cta-box__actions">
                <Link to="/signup"><Button size="lg"><Zap size={15} fill="currentColor" />Start Free Trial — No Credit Card</Button></Link>
                <Link to="/contact"><Button variant="ghost" size="lg">Schedule a Demo →</Button></Link>
              </div>
              <div className="audit-cta-box__note">✅ 15-day free trial &nbsp;·&nbsp; ✅ Cancel anytime &nbsp;·&nbsp; ✅ 30-day money-back guarantee</div>
              <button className="audit-retry" onClick={() => { setStep('form'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                ← Run audit for a different business
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
