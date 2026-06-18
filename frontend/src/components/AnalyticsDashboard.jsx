// src/components/AnalyticsDashboard.jsx
// Phase 4 — Sentiment Dashboard
// All charts built with SVG (no extra library needed)

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────────────── */
function Skeleton({ w = '100%', h = 16, mb = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: 'var(--border)',
      marginBottom: mb,
      animation: 'skeletonPulse 1.5s ease-in-out infinite',
    }} />
  )
}

function CardSkeleton() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
      <Skeleton w="40%" h={14} mb={16} />
      <Skeleton w="70%" h={32} mb={8} />
      <Skeleton w="50%" h={12} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   DONUT CHART (SVG)
───────────────────────────────────────────────────────────────── */
function DonutChart({ positive = 70, neutral = 20, negative = 10 }) {
  const total = positive + neutral + negative || 1
  const R = 52, cx = 64, cy = 64
  const circumference = 2 * Math.PI * R

  function arc(value, offset) {
    const dash = (value / total) * circumference
    return { strokeDasharray: `${dash} ${circumference}`, strokeDashoffset: -offset }
  }

  const pDash = arc(positive, 0)
  const nuDash = arc(neutral, (positive / total) * circumference)
  const neDash = arc(negative, ((positive + neutral) / total) * circumference)

  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" strokeWidth={14} />
      {positive > 0 && <circle cx={cx} cy={cy} r={R} fill="none" stroke="#10b981" strokeWidth={14} strokeLinecap="butt" style={pDash} transform="rotate(-90 64 64)" />}
      {neutral > 0  && <circle cx={cx} cy={cy} r={R} fill="none" stroke="#6b7280" strokeWidth={14} strokeLinecap="butt" style={nuDash} transform="rotate(-90 64 64)" />}
      {negative > 0 && <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ef4444" strokeWidth={14} strokeLinecap="butt" style={neDash} transform="rotate(-90 64 64)" />}
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 18, fontWeight: 800, fill: '#fff' }}>
        {Math.round((positive / total) * 100)}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 9, fill: 'rgba(255,255,255,0.6)' }}>
        Positive
      </text>
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────
   LINE CHART (SVG)
───────────────────────────────────────────────────────────────── */
function LineChart({ data = [] }) {
  if (!data.length) return null

  const W = 300, H = 120, PAD = { t: 10, r: 20, b: 30, l: 32 }
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b

  const ratings = data.map(d => d.avgRating || 0)
  const minR = Math.max(0, Math.min(...ratings) - 0.5)
  const maxR = Math.min(5, Math.max(...ratings) + 0.5)

  const xStep = innerW / Math.max(data.length - 1, 1)
  const yScale = v => innerH - ((v - minR) / (maxR - minR || 1)) * innerH

  const points = data.map((d, i) => ({
    x: PAD.l + i * xStep,
    y: PAD.t + yScale(d.avgRating || 0),
  }))

  // Smooth path
  const path = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = points[i - 1]
    const cpX = (prev.x + p.x) / 2
    return `${acc} C ${cpX} ${prev.y} ${cpX} ${p.y} ${p.x} ${p.y}`
  }, '')

  const yLabels = [minR, (minR + maxR) / 2, maxR].map(v => v.toFixed(1))

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* Y grid lines */}
      {yLabels.map((label, i) => {
        const y = PAD.t + (innerH / 2) * (2 - i)
        return (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
            <text x={PAD.l - 4} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: 8, fill: 'var(--ink-3)' }}>{label}</text>
          </g>
        )
      })}
      {/* Line */}
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" />
      {/* Area fill */}
      <path d={`${path} L ${points[points.length - 1].x} ${PAD.t + innerH} L ${PAD.l} ${PAD.t + innerH} Z`}
        fill="rgba(79,124,255,0.08)" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--accent)" stroke="var(--bg-card)" strokeWidth={1.5} />
      ))}
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={PAD.l + i * xStep} y={H - 6} textAnchor="middle" style={{ fontSize: 8, fill: 'var(--ink-3)' }}>
          {d.month}
        </text>
      ))}
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────
   KEYWORD BAR
───────────────────────────────────────────────────────────────── */
function KeywordBar({ word, count, maxCount, color }) {
  const pct = (count / (maxCount || 1)) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 72, fontSize: 12.5, color: 'var(--ink-2)', textAlign: 'right', flexShrink: 0 }}>{word}</div>
      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .5s ease' }} />
      </div>
      <div style={{ width: 24, fontSize: 12, color: 'var(--ink-3)', flexShrink: 0 }}>{count}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   COMPARISON BAR
───────────────────────────────────────────────────────────────── */
function ComparisonBar({ label, value, maxValue, color, suffix = '' }) {
  const pct = (value / (maxValue || 1)) * 100
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{label}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .5s ease' }} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function AnalyticsDashboard() {
  const { user, subscription, isTrialActive } = useAuth()
  const plan = subscription?.plan || 'free'
  const isGrowthPlus = ['growth', 'pro', 'bundle_growth', 'bundle_suite', 'admin'].includes(plan)
  const isStarterPlus = isGrowthPlus || ['starter'].includes(plan)
  const [data, setData]         = useState(null)
  const [days, setDays]         = useState(30)
  const [platform, setPlatform] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => { fetchAnalytics(days) }, [days, user, platform])

  async function fetchAnalytics(d) {
    if (!user) return
    setLoading(true)
    setError(false)
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API_URL}/api/analytics/summary?days=${d}&platform=${platform}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      if (json.success) setData(json.data)
      else throw new Error('No data')
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  /* ── Error state ── */
  if (error) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Unable to load analytics</div>
      <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 20 }}>Please try again</div>
      <button onClick={() => fetchAnalytics(days)} style={{
        background: 'var(--accent)', color: '#fff', border: 'none',
        borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'var(--font-body)',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  )

  /* ── Empty state ── */
  if (!loading && data && !data.totalReviews) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No analytics yet!</div>
      <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 24, maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.6 }}>
        {platform === 'google_play'
          ? 'Connect your Play Console and import historical reviews to see full analytics.'
          : 'Connect your Google Business Profile to start seeing insights.'}
      </div>
      <Link to="/connect" style={{
        background: 'var(--accent)', color: '#fff', textDecoration: 'none',
        borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600,
      }}>
        {platform === 'google_play' ? 'Connect Play Console' : 'Connect Google Business'}
      </Link>
    </div>
  )

  // FE-CSV-05: Thin data empty state for Play (few recent reviews, no historical import yet)
  if (!loading && data && data.totalReviews > 0 && data.totalReviews < 20 && platform === 'google_play' && !hasHistoricalData) {
    // Show thin-data nudge ABOVE the dashboard (not instead of it) — rendered inline below
  }

  const sentiment    = data?.sentiment        || {}
  const ratingTrend  = data?.ratingTrend      || []
  const keywords     = data?.keywords         || {}
  const responseRate = data?.responseRate     || {}
  const responseSpeed= data?.responseSpeed    || {}
  const insight      = data?.aiInsight        || null
  const isMockData        = data?.isMockData           || false
  const hasHistoricalData = data?.hasHistoricalData    || false

  const posCount = sentiment.positive || 0
  const neuCount = sentiment.neutral  || 0
  const negCount = sentiment.negative || 0
  const total    = posCount + neuCount + negCount || 1

  const lastMonth     = ratingTrend[ratingTrend.length - 1]?.avgRating || 0
  const prevMonth     = ratingTrend[ratingTrend.length - 2]?.avgRating || 0
  const trendDiff     = (lastMonth - prevMonth).toFixed(2)
  const trendUp       = trendDiff > 0
  const trendFlat     = trendDiff == 0

  const posKeywords   = keywords.positive || []
  const negKeywords   = keywords.negative || []
  const maxPosCount   = posKeywords[0]?.count || 1
  const maxNegCount   = negKeywords[0]?.count || 1

  const myRate        = responseRate.yours    || 0
  const industryRate  = responseRate.industry || 65
  const mySpeed       = responseSpeed.yours   || 0
  const industrySpeed = responseSpeed.industry|| 4

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Analytics</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '3px 0 0' }}>Sentiment and performance overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '7px 12px',
              fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 3 months</option>
            <option value={180}>Last 6 months</option>
          </select>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
            {[{ value: 'all', label: 'All' }, { value: 'google_business', label: '⭐ Business' }, { value: 'google_play', label: '🎮 Play' }].map(({ value, label }) => (
              <button key={value} onClick={() => setPlatform(value)} style={{
                background: platform === value ? 'var(--accent)' : 'none',
                color: platform === value ? '#fff' : 'var(--ink-3)',
                border: 'none', borderRadius: 6, padding: '5px 10px',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all .15s',
              }}>{label}</button>
            ))}
          </div>
          <button onClick={() => fetchAnalytics(days)} title="Refresh" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', color: 'var(--ink-3)',
          }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Mock data banner */}
      {/* FE-CSV-05: Thin data nudge for Play with <20 reviews */}
      {platform === 'google_play' && !hasHistoricalData && data?.totalReviews > 0 && data.totalReviews < 20 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          background: 'rgba(79,124,255,.06)', border: '1px solid rgba(79,124,255,.15)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📂</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>You have more reviews than this!</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Play Store API only shows last 7 days. Import your full history for complete insights.</div>
            </div>
          </div>
          <a href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
            Import Historical Reviews →
          </a>
        </div>
      )}

      {isMockData && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.25)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
        }}>
          <AlertTriangle size={15} style={{ color: 'var(--amber)', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>
            Showing sample data. <Link to="/connect" style={{ color: 'var(--accent)', fontWeight: 600 }}>Connect your Google Business Profile</Link> to see real analytics.
          </p>
        </div>
      )}

      {/* Loading skeletons */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CardSkeleton />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <CardSkeleton /><CardSkeleton />
          </div>
          <CardSkeleton />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <CardSkeleton /><CardSkeleton />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Widget 1: AI Insight ── */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Your Business Insight</span>
            </div>
            {insight ? (
              <>
                <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.65, margin: '0 0 10px', fontStyle: 'italic' }}>
                  "{insight.text || insight}"
                </p>
                {insight.generatedAt && (
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    Generated {new Date(insight.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>
                Unable to generate insight. Check back once more reviews are available.
              </p>
            )}
          </div>

          {/* ── Row 2: Sentiment + Rating Trend ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Widget 2: Sentiment Breakdown */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
                Sentiment Breakdown
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                <DonutChart positive={posCount} neutral={neuCount} negative={negCount} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {[
                    { emoji: '😊', label: 'Positive', count: posCount, color: '#10b981' },
                    { emoji: '😐', label: 'Neutral',  count: neuCount, color: '#6b7280' },
                    { emoji: '😞', label: 'Negative', count: negCount, color: '#ef4444' },
                  ].map(({ emoji, label, count, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: 'var(--ink-2)', flex: 1 }}>{label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color }}>{Math.round((count / total) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
                Based on {total} reviews
              </div>
            </div>

            {/* Widget 3: Rating Trend */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Rating Trend
                </div>
                {!trendFlat && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: trendUp ? '#10b981' : '#ef4444' }}>
                    {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {trendUp ? '+' : ''}{trendDiff} vs last month
                  </div>
                )}
                {trendFlat && <Minus size={13} style={{ color: 'var(--ink-3)' }} />}
              </div>
              {ratingTrend.length > 0 ? (
                <LineChart data={ratingTrend} />
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-3)', fontSize: 13 }}>
                  Not enough data yet
                </div>
              )}
              {lastMonth > 0 && (
                <div style={{ marginTop: 8, textAlign: 'center', fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 500 }}>
                  Current avg: <strong style={{ color: 'var(--ink)' }}>{lastMonth.toFixed(1)}★</strong>
                </div>
              )}
            </div>
          </div>

          {/* Play: Version Rating Trend */}
          {platform === 'google_play' && data?.versionRatings?.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Version vs Rating</div>
                {hasHistoricalData && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: 'var(--accent)', background: 'rgba(79,124,255,.08)', border: '1px solid rgba(79,124,255,.2)', padding: '3px 9px', borderRadius: 100 }}>
                    📂 Includes historical data
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.versionRatings.map(({ version, rating, count }) => (
                  <div key={version} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 50, fontSize: 12, fontFamily: 'monospace', color: 'var(--ink-3)', flexShrink: 0 }}>v{version}</div>
                    <div style={{ flex: 1, height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${(rating/5)*100}%`, height: '100%', borderRadius: 5, background: rating >= 4 ? '#10b981' : rating >= 3 ? '#f59e0b' : '#ef4444', transition: 'width .5s' }} />
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', width: 30, textAlign: 'right' }}>{rating.toFixed(1)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', width: 40 }}>{count} rev</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Widget 4: Keywords (Growth+ only) ── */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                What Customers Say
              </div>
              {!isGrowthPlus && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(79,124,255,.1)', color: 'var(--accent)', border: '1px solid rgba(79,124,255,.2)' }}>
                  🔒 Growth+
                </span>
              )}
            </div>

            {isGrowthPlus ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 14 }}>👍</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Customers love</span>
                  </div>
                  {posKeywords.length > 0
                    ? posKeywords.slice(0, 8).map(k => (
                        <KeywordBar key={k.word} word={k.word} count={k.count} maxCount={maxPosCount} color="#10b981" />
                      ))
                    : <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>No data yet</div>
                  }
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 14 }}>👎</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Needs attention</span>
                  </div>
                  {negKeywords.length > 0
                    ? negKeywords.slice(0, 8).map(k => (
                        <KeywordBar key={k.word} word={k.word} count={k.count} maxCount={maxNegCount} color="#ef4444" />
                      ))
                    : <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>No data yet</div>
                  }
                </div>
              </div>
            ) : (
              /* Blurred preview + upgrade prompt */
              <div style={{ position: 'relative' }}>
                <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                      {[{word:'food',count:34},{word:'service',count:28},{word:'taste',count:19},{word:'staff',count:15}].map(k => (
                        <KeywordBar key={k.word} word={k.word} count={k.count} maxCount={34} color="#10b981" />
                      ))}
                    </div>
                    <div>
                      {[{word:'wait',count:12},{word:'slow',count:9},{word:'price',count:7},{word:'cold',count:5}].map(k => (
                        <KeywordBar key={k.word} word={k.word} count={k.count} maxCount={12} color="#ef4444" />
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,12,15,.75)', backdropFilter: 'blur(2px)', borderRadius: 8, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Keyword Analysis</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16, lineHeight: 1.55, maxWidth: 260 }}>
                    Unlock keyword trends, sentiment breakdown & more with Growth plan.
                  </div>
                  <a href="/checkout?plan=growth" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600 }}>
                    ⚡ Upgrade to Growth — ₹999/mo
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ── Row 4: Response Rate + Response Speed ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Widget 5: Response Rate (Starter+ only) */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Response Rate</div>
                {!isStarterPlus && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(79,124,255,.1)', color: 'var(--accent)', border: '1px solid rgba(79,124,255,.2)' }}>🔒 Starter+</span>}
              </div>
              {isStarterPlus ? (
                <>
                  <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>{myRate}%</div>
                  <ComparisonBar label="You" value={myRate} maxValue={100} color="var(--accent)" suffix="%" />
                  <ComparisonBar label="Industry avg" value={industryRate} maxValue={100} color="var(--border-lit)" suffix="%" />
                  <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: myRate >= industryRate ? '#10b981' : 'var(--amber)' }}>
                    {myRate >= industryRate ? '✅ You\'re above industry average!' : myRate === industryRate ? '📊 You match the industry average' : '⚠️ Room to improve response rate'}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Response Rate</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 14, lineHeight: 1.55 }}>See how your response rate compares to industry average.</div>
                  <a href="/checkout?plan=starter" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Upgrade to Starter →</a>
                </div>
              )}
            </div>

            {/* Widget 6: Response Speed (Starter+ only) */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Response Speed</div>
                {!isStarterPlus && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(79,124,255,.1)', color: 'var(--accent)', border: '1px solid rgba(79,124,255,.2)' }}>🔒 Starter+</span>}
              </div>
              {isStarterPlus ? (
                <>
                  <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                    {mySpeed}<span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-3)', marginLeft: 4 }}>hrs avg</span>
                  </div>
                  <div style={{ marginBottom: 16 }} />
                  <ComparisonBar label="You" value={mySpeed} maxValue={Math.max(mySpeed, industrySpeed) * 1.2} color="var(--accent)" suffix=" hrs" />
                  <ComparisonBar label="Industry avg" value={industrySpeed} maxValue={Math.max(mySpeed, industrySpeed) * 1.2} color="var(--border-lit)" suffix=" hrs" />
                  <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: mySpeed <= industrySpeed ? '#10b981' : 'var(--amber)' }}>
                    {mySpeed === 0 ? '—' : mySpeed < industrySpeed ? `⚡ You respond ${(industrySpeed / mySpeed).toFixed(1)}x faster than average!` : mySpeed === industrySpeed ? '📊 You match the industry average' : '⏱️ Try to respond within 2 hours'}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Response Speed</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 14, lineHeight: 1.55 }}>Track your average reply time vs industry average.</div>
                  <a href="/checkout?plan=starter" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Upgrade to Starter →</a>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
