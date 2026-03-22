import { Link } from 'react-router-dom'
import { CheckCircle, Zap } from 'lucide-react'
import Button from '../components/ui/Button'
import './Pricing.css'

const PLANS = [
  {
    name:     'Free',
    price:    '$0',
    period:   'forever',
    desc:     'Perfect for trying ReviewPilot with your first location.',
    cta:      'Get started free',
    ctaTo:    '/signup',
    variant:  'secondary',
    features: [
      '1 business location',
      '25 reviews fetched / month',
      '10 AI replies generated / month',
      'Friendly tone only',
      'Manual posting',
    ],
  },
  {
    name:     'Pro',
    price:    '$29',
    period:   'per month',
    desc:     'For businesses serious about their online reputation.',
    cta:      'Start Pro free for 7 days',
    ctaTo:    '/signup?plan=pro',
    variant:  'primary',
    highlight: true,
    badge:    'Most Popular',
    features: [
      'Up to 3 business locations',
      'Unlimited reviews fetched',
      '200 AI replies / month',
      'All 3 tones (Friendly, Professional, Apologetic)',
      'Manual + auto-post replies',
      'Priority support',
    ],
  },
]

export default function Pricing() {
  return (
    <div className="pricing container">
      <div className="pricing__header">
        <h1 className="pricing__title">Simple, honest pricing</h1>
        <p className="pricing__sub">
          Start free. Upgrade when you need more. No hidden fees.
        </p>
      </div>

      <div className="pricing__grid">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`plan-card ${plan.highlight ? 'plan-card--highlight' : ''}`}
          >
            {plan.badge && (
              <span className="plan-card__badge">
                <Zap size={11} fill="currentColor" />
                {plan.badge}
              </span>
            )}

            <div className="plan-card__header">
              <h2 className="plan-card__name">{plan.name}</h2>
              <div className="plan-card__price">
                <span className="plan-card__amount">{plan.price}</span>
                <span className="plan-card__period">/{plan.period}</span>
              </div>
              <p className="plan-card__desc">{plan.desc}</p>
            </div>

            <Link to={plan.ctaTo}>
              <Button variant={plan.variant} fullWidth size="md">
                {plan.cta}
              </Button>
            </Link>

            <ul className="plan-card__features">
              {plan.features.map((f) => (
                <li key={f} className="plan-card__feature">
                  <CheckCircle size={14} className="plan-card__check" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="pricing__note">
        All plans include a 7-day money-back guarantee. Questions?{' '}
        <a href="mailto:hello@reviewpilot.app" className="pricing__link">Contact us</a>.
      </p>
    </div>
  )
}
