import { Link } from 'react-router-dom'
import { Zap, Star, Clock, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import './Home.css'

const FEATURES = [
  { icon: Zap,       title: 'AI-Powered Replies',   desc: 'Claude generates contextual, on-brand responses in seconds — not hours.' },
  { icon: Star,      title: 'Tone Control',          desc: 'Choose Friendly, Professional, or Apologetic to match every situation.' },
  { icon: Clock,     title: 'Save Hours Weekly',     desc: 'Stop spending 20+ min per review. Reply to dozens in minutes.' },
  { icon: TrendingUp,title: 'Protect Your Rating',  desc: 'Respond faster, look more attentive, and win more customers.' },
]

const TESTIMONIALS = [
  { name: 'Maria S.', biz: 'Bloom Café', rating: 5, quote: 'We went from replying to 2 reviews a week to 40. Our rating jumped from 4.1 to 4.7.' },
  { name: 'James R.', biz: 'Riverside Auto', rating: 5, quote: 'The professional tone option is perfect for our dealership. Saves me 3 hours every Monday.' },
  { name: 'Priya K.', biz: 'Lotus Spa',  rating: 5, quote: 'I was skeptical about AI but the replies sound exactly like me. Customers can\'t tell the difference.' },
]

export default function Home() {
  return (
    <div className="home">

      {/* Hero */}
      <section className="hero container">
        
        <h1 className="hero__title animate-fade-up delay-1">
          Reply to every<br />
          <span className="hero__gradient">Google review</span><br />
          in seconds
        </h1>
        <p className="hero__sub animate-fade-up delay-2">
          ReviewPilot uses AI to generate personalized, on-brand replies to your
          Google reviews — so you can focus on running your business.
        </p>
        <div className="hero__actions animate-fade-up delay-3">
          <Link to="/signup">
            <Button size="lg">
              Start for free <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/pricing">
            <Button variant="ghost" size="lg">See pricing</Button>
          </Link>
        </div>
        <div className="hero__meta animate-fade-up delay-4">
          <span><CheckCircle size={13} /> No credit card required</span>
          <span><CheckCircle size={13} /> 10 free AI replies</span>
          <span><CheckCircle size={13} /> Setup in 2 minutes</span>
        </div>

        {/* Fake dashboard preview */}
        <div className="hero__preview animate-fade-up delay-5">
          <div className="preview-card">
            <div className="preview-card__header">
              <div className="preview-card__dot preview-card__dot--red" />
              <div className="preview-card__dot preview-card__dot--amber" />
              <div className="preview-card__dot preview-card__dot--green" />
              <span className="preview-card__title">ReviewPilot — Reviews Inbox</span>
            </div>
            <div className="preview-card__body">
              <div className="preview-row">
                <div className="preview-row__stars">★★★★★</div>
                <p className="preview-row__text">"Amazing food and service! Will definitely come back."</p>
                <span className="preview-row__badge preview-row__badge--replied">Replied ✓</span>
              </div>
              <div className="preview-row">
                <div className="preview-row__stars preview-row__stars--amber">★★★☆☆</div>
                <p className="preview-row__text">"Good place but parking was difficult to find."</p>
                <span className="preview-row__badge preview-row__badge--pending">AI Ready</span>
              </div>
              <div className="preview-row">
                <div className="preview-row__stars">★★★★★</div>
                <p className="preview-row__text">"Best coffee in the neighbourhood, highly recommend!"</p>
                <span className="preview-row__badge preview-row__badge--replied">Replied ✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features container">
        <h2 className="section-title">Everything you need to dominate your reviews</h2>
        <div className="features__grid">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div className="feature-card" key={title}>
              <div className="feature-card__icon">
                <Icon size={20} />
              </div>
              <h3 className="feature-card__title">{title}</h3>
              <p className="feature-card__desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials container">
        <h2 className="section-title">Loved by local businesses</h2>
        <div className="testimonials__grid">
          {TESTIMONIALS.map(({ name, biz, rating, quote }) => (
            <div className="testimonial-card" key={name}>
              <div className="testimonial-card__stars">
                {'★'.repeat(rating)}
              </div>
              <p className="testimonial-card__quote">"{quote}"</p>
              <div className="testimonial-card__author">
                <div className="testimonial-card__avatar">
                  {name[0]}
                </div>
                <div>
                  <p className="testimonial-card__name">{name}</p>
                  <p className="testimonial-card__biz">{biz}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner container">
        <div className="cta-banner__inner">
          <h2 className="cta-banner__title">Ready to reclaim your time?</h2>
          <p className="cta-banner__sub">Join hundreds of businesses replying smarter with ReviewPilot.</p>
          <Link to="/signup">
            <Button size="lg">Get started free <ArrowRight size={16} /></Button>
          </Link>
        </div>
      </section>

    </div>
  )
}
