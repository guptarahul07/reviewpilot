// src/pages/ReviewsInbox.jsx

import { useAuth } from "../context/AuthContext";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config/api';
import PendingApprovalsWidget from '../components/PendingApprovalsWidget';
import PauseResumeToggle from '../components/PauseResumeToggle';
import DynamicBanner from '../components/DynamicBanner';
import TrialBanner from '../components/TrialBanner';
import { ReviewCardSkeleton, InsightsCardSkeleton } from '../components/ReviewSkeleton';
import ReplyHistory from '../components/ReplyHistory';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ReplyTextarea from '../components/ReplyTextarea';
import Toast from '../components/ui/Toast';

/* ─────────────────────────────────────────────────────────────
   STAR RATING
───────────────────────────────────────────────────────────── */
function Stars({ rating }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= rating ? "#f59e0b" : "#e2e8f0" }}>
          ★
        </span>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DONUT CHART
───────────────────────────────────────────────────────────── */
function DonutChart({ positive, negative, mixed }) {
  const total = positive + negative + mixed;
  if (total === 0) return null;

  const positivePercent = (positive / total) * 100;
  const negativePercent = (negative / total) * 100;
  const mixedPercent = (mixed / total) * 100;

  // SVG donut chart
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  const positiveOffset = 0;
  const mixedOffset = (positivePercent / 100) * circumference;
  const negativeOffset = mixedOffset + (mixedPercent / 100) * circumference;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
        />
        
        {/* Positive segment */}
        {positive > 0 && (
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="20"
            strokeDasharray={`${(positivePercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-positiveOffset}
            transform="rotate(-90 60 60)"
          />
        )}
        
        {/* Mixed segment */}
        {mixed > 0 && (
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="20"
            strokeDasharray={`${(mixedPercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-mixedOffset}
            transform="rotate(-90 60 60)"
          />
        )}
        
        {/* Negative segment */}
        {negative > 0 && (
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth="20"
            strokeDasharray={`${(negativePercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-negativeOffset}
            transform="rotate(-90 60 60)"
          />
        )}
        
        {/* Center text — white so visible on dark bg */}
        <text
          x="60"
          y="57"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 18, fontWeight: 800, fill: "#ffffff" }}
        >
          {positivePercent.toFixed(0)}%
        </text>
        <text
          x="60"
          y="73"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }}
        >
          Positive
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: "#10b981" }} />
          <span style={{ fontSize: 13, color: "#374151" }}>
            Positive ({positive})
          </span>
        </div>
        {mixed > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#f59e0b" }} />
            <span style={{ fontSize: 13, color: "#374151" }}>
              Mixed ({mixed})
            </span>
          </div>
        )}
        {negative > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#ef4444" }} />
            <span style={{ fontSize: 13, color: "#374151" }}>
              Needs Attention ({negative})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   INSIGHTS MODAL
───────────────────────────────────────────────────────────── */
function InsightsModal({ insights, reviews, onClose, plan }) {
  const positiveCount  = reviews.filter(r => r.rating >= 4).length;
  const mixedCount     = reviews.filter(r => r.hasMixedSentiment).length;
  // Needs attention = pending approval/attention status OR mixed sentiment reviews
  const needsAttention = reviews.filter(r =>
    r.status === "needs_attention" ||
    r.status === "pending_approval" ||
    r.hasMixedSentiment
  ).length;
  const avgRating      = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Plan gating — basic plans only get limited insights from backend
  // Backend returns tier: 'basic' or tier: 'advanced'
  // If tier is missing, fall back to checking plan from auth context
  const isAdvanced = insights?.tier === 'advanced' ||
                     (['growth', 'professional', 'admin'].includes(plan) && insights?.tier !== 'basic')
  const isLocked   = insights?.tier === 'basic' || (!insights?.tier && !['growth', 'professional', 'admin'].includes(plan))

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16, maxWidth: 700, width: "100%",
        maxHeight: "90vh", overflow: "auto", padding: 32,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--ink)" }}>
            📊 Detailed Insights
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--ink-3)", padding: 0, lineHeight: 1 }}>×</button>
        </div>

        {/* Basic stats — available on all plans */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 14, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>
            Review Distribution
          </h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <DonutChart
              positive={positiveCount}
              negative={reviews.filter(r => r.rating <= 2 && !r.hasMixedSentiment).length}
              mixed={mixedCount}
            />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{avgRating}★</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>from {reviews.length} reviews</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "Positive", value: positiveCount, color: "var(--green)" },
              { label: "Needs Attention", value: needsAttention, color: "var(--amber)" },
              { label: "Total", value: reviews.length, color: "var(--ink-2)" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis — Growth+ only */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, position: "relative", minHeight: 220 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>
              AI Analysis
            </h3>
            {!isAdvanced && (
              <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(79,124,255,.1)", color: "var(--accent)", border: "1px solid rgba(79,124,255,.2)", padding: "2px 8px", borderRadius: 100 }}>
                Growth+ only
              </span>
            )}
          </div>

          {isAdvanced ? (
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: 14, color: "var(--ink-2)" }}>
              {typeof insights === "string" ? insights : insights?.insights || insights?.text || insights?.analysis || ""}
            </div>
          ) : (
            /* Locked state for Starter/Free plan */
            <div>
              {/* Blurred preview */}
              <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.5, fontSize: 14, lineHeight: 1.8, color: "var(--ink-2)" }}>
                ✅ Strong points: Your response time is excellent and customers appreciate the friendly staff...
                ⚠️ Areas to improve: Several customers mentioned parking and wait times during peak hours...
                💡 Recommended actions: Consider adding more staff on weekends and improving signage for parking...
              </div>
              {/* Upgrade prompt */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: "rgba(10,12,15,.85)", backdropFilter: "blur(3px)",
                borderRadius: 12, padding: "20px 20px 24px", textAlign: "center",
                zIndex: 2,
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                  Advanced AI Analysis
                </div>
                <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginBottom: 20, maxWidth: 280, lineHeight: 1.6 }}>
                  Unlock detailed sentiment analysis, theme detection, and actionable recommendations with Growth plan.
                </div>
                <a href="/checkout?plan=growth" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "var(--accent)", color: "#fff",
                  textDecoration: "none", borderRadius: 8, padding: "10px 22px",
                  fontSize: 14, fontWeight: 600,
                  boxShadow: "0 4px 16px rgba(79,124,255,.4)",
                  marginBottom: 8,
                }}>
                  ⚡ Upgrade to Growth — ₹999/mo
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   REVIEW CARD (WITH REGENERATE & EDIT)
───────────────────────────────────────────────────────────── */
const REGEN_LIMIT = 5;

function ReviewCard({ review, onStatusChange, onRegenerateReply }) {
  const { user } = useAuth();
  const [posting, setPosting]         = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editing, setEditing]         = useState(false);
  const [editedReply, setEditedReply] = useState(review.aiReply);
  const [regenCount, setRegenCount]   = useState(0);
  const [regenError, setRegenError]   = useState('');

  async function handleRegenerate() {
    // Enforce limit on frontend
    if (regenCount >= REGEN_LIMIT) {
      setRegenError(`You've reached the limit of ${REGEN_LIMIT} regenerations for this review. Post the current reply or move to the next review.`);
      return;
    }

    setRegenerating(true);
    setRegenError('');
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/reviews/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reviewId: review.id }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        // Backend may return its own limit error
        if (response.status === 429 || errData?.message?.toLowerCase().includes('limit')) {
          setRegenError(`Regeneration limit reached. Please post the current reply.`);
          setRegenCount(REGEN_LIMIT); // cap locally too
          return;
        }
        throw new Error(errData?.message || 'Regenerate failed');
      }

      const data = await response.json();
      onRegenerateReply(review.id, data.newReply);
      setEditedReply(data.newReply);
      setRegenCount(prev => prev + 1);

    } catch (err) {
      console.error('Regenerate error:', err);
      setRegenError('Failed to regenerate reply. Please try again.');
    } finally {
      setRegenerating(false);
    }
  }

  async function handleConfirm() {
    setPosting(true);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/api/reviews/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reviewId: review.id,
          replyText: editedReply
        }),
      });

      if (!response.ok) {
        throw new Error("Post failed");
      }

      onStatusChange(review.id, "posted", editedReply);
      setEditing(false);
      
    } catch (err) {
      console.error("Post error:", err);
      alert("Failed to post reply");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e4e9f0",
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,.04)",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Platform badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
          background: review.platform === 'google_play' ? 'rgba(124,92,252,.1)' : 'rgba(79,124,255,.1)',
          color: review.platform === 'google_play' ? '#a78bfa' : 'var(--accent)',
          border: `1px solid ${review.platform === 'google_play' ? 'rgba(124,92,252,.2)' : 'rgba(79,124,255,.2)'}`,
        }}>
          {review.platform === 'google_play' ? '🎮 Google Play' : '⭐ Google Business'}
        </span>
        <span style={{ fontSize: 12, color: "#718096" }}>
          {review.date || new Date(review.createTime).toLocaleDateString()}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: 4 }}>
        <strong style={{ color: "var(--ink)" }}>{review.reviewer}</strong>
        <Stars rating={review.rating} />
      </div>
      {review.platform === 'google_play' && (review.device || review.appVersion) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          {review.device && <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>📱 {review.device}</span>}
          {review.appVersion && <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>v{review.appVersion}</span>}
          {review.thumbsUpCount > 0 && <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>👍 {review.thumbsUpCount}</span>}
        </div>
      )}
      <p style={{ marginTop: 4, color: "var(--ink-2)" }}>
        {review.text}
      </p>

      {(review.aiReply || review.status === "needs_attention" || review.status === "auto_replied" || review.status === "draft_ready") && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#f7f8fa",
            borderLeft: "4px solid #0ea5a0",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <strong style={{ fontSize: 12, color: "#0ea5a0" }}>
              AI Suggested Reply
            </strong>
            
            {(review.status === "needs_attention" || review.status === "auto_replied" || review.status === "draft_ready") && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating || regenCount >= REGEN_LIMIT}
                  disabled={regenerating}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#64748b",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: regenerating ? "not-allowed" : "pointer",
                    opacity: regenerating ? 0.6 : 1,
                  }}
                >
                  {regenerating ? '🔄 Regenerating...' : `🔄 Regenerate${regenCount > 0 ? ` (${regenCount}/${REGEN_LIMIT})` : ''}`}
                </button>
                
                <button
                  onClick={() => setEditing(!editing)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: editing ? "#0ea5a0" : "#fff",
                    color: editing ? "#fff" : "#64748b",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ✏️ {editing ? "Done" : "Edit"}
                </button>
              </div>
            )}
          </div>
          
          {/* Regenerate limit error */}
          {regenError && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.3)',
              borderRadius: 8, padding: '10px 14px', marginTop: 10,
              fontSize: 13, color: 'var(--amber)', lineHeight: 1.5,
            }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{regenError}</span>
            </div>
          )}

          {editing ? (
            <div style={{ marginTop: 6 }}>
              <ReplyTextarea
                value={editedReply}
                onChange={setEditedReply}
                rows={4}
              />
            </div>
          ) : (
            <p style={{ marginTop: 6, color: "#1f2937" }}>
              {editedReply}
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        {(review.status === "auto_replied" || review.status === "draft_ready") && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span
              style={{
                background: "rgba(16,185,129,.1)",
                color: "#10b981",
                padding: "4px 10px",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ✓ Ready to Post
            </span>

            <button
              onClick={handleConfirm}
              disabled={posting}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#10b981",
                color: "#fff",
                fontWeight: 600,
                cursor: posting ? "not-allowed" : "pointer",
                fontSize: 13,
                opacity: posting ? 0.6 : 1,
              }}
            >
              {posting ? "Posting..." : "✓ Confirm & Post"}
            </button>
          </div>
        )}

        {(review.status === "needs_attention" || review.status === "pending_approval") && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span
              style={{
                background: "rgba(239,68,68,.1)",
                color: "#ef4444",
                padding: "4px 10px",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ⚠ Needs attention
            </span>

            <button
              onClick={handleConfirm}
              disabled={posting}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#0ea5a0",
                color: "#fff",
                fontWeight: 600,
                cursor: posting ? "not-allowed" : "pointer",
                fontSize: 13,
                opacity: posting ? 0.6 : 1,
              }}
            >
              {posting ? "Posting..." : "✓ Confirm & Post"}
            </button>
          </div>
        )}

        {review.status === "posted" && (
          <span
            style={{
              background: "rgba(16,185,129,.1)",
              color: "#10b981",
              padding: "4px 10px",
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            ✓ Posted
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function ReviewsInboxPage() {
  const navigate = useNavigate();
  const { profile, user, subscription } = useAuth();

  const [reviews, setReviews]               = useState([]);
  const [tab, setTab]                       = useState("all");
  const [syncing, setSyncing]               = useState(false);
  const [loading, setLoading]               = useState(true);
  const [insights, setInsights]             = useState(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [lastSyncAt, setLastSyncAt]         = useState(null);
  const [ratingFilter, setRatingFilter]     = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [bulkPosting, setBulkPosting]       = useState(false);
  const [bulkProgress, setBulkProgress]     = useState({ current: 0, total: 0 });
  const [replyMode, setReplyMode]           = useState('semi-auto');
  const [activeTab, setActiveTab]           = useState('reviews');
  const [toast, setToast]                   = useState(null);

  /* ── On mount: load cached reviews only, no sync ───────────── */
  useEffect(() => {
    handleLoad();
  }, []);

  /* ── Compute "last synced X ago" label ─────────────────────── */
  /* ── Safely convert Firestore Timestamp OR ISO string to JS Date ── */
  function toJsDate(val) {
    if (!val) return null;
    // Firestore Timestamp object has .toDate()
    if (typeof val.toDate === 'function') return val.toDate();
    // ISO string or number
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  function getLastSyncLabel() {
    const date = toJsDate(lastSyncAt);
    if (!date) return null;
    const diffMs  = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    if (diffMin < 1)  return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  }

  /* ── Is data stale (>24 hrs since last sync)? ───────────────── */
  function isStale() {
    const date = toJsDate(lastSyncAt);
    if (!date) return false;
    return Date.now() - date.getTime() > 24 * 60 * 60 * 1000;
  }

  /* ── Load cached reviews from Firestore (no sync) ───────────── */
  async function handleLoad() {
    setLoading(true);
    try {
      const token = await user.getIdToken();

      const [reviewsRes, insightsRes] = await Promise.all([
        fetch(`${API_URL}/api/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/reviews/insights`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      const reviewsData  = await reviewsRes.json();
      const insightsData = await insightsRes.json();

      setReviews(reviewsData.reviews  || []);
      setInsights(insightsData || null); // store full object {tier, insights}
      if (reviewsData.lastSyncAt) setLastSyncAt(reviewsData.lastSyncAt);
      // Debug — remove after confirming field names
      console.log('[ReviewsInbox] lastSyncAt value:', reviewsData.lastSyncAt, '| type:', typeof reviewsData.lastSyncAt)
      if (reviewsData.reviews?.length) console.log('[ReviewsInbox] first review keys:', Object.keys(reviewsData.reviews[0]), '| reviewer:', reviewsData.reviews[0].reviewer, '| authorName:', reviewsData.reviews[0].authorName, '| name:', reviewsData.reviews[0].name)

    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  /* ── Manual sync: hit the sync endpoint then reload ─────────── */
  async function handleSync() {
    setSyncing(true);
    try {
      const token = await user.getIdToken();

      await fetch(`${API_URL}/api/reviews/sync`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Reload fresh data after sync
      const [reviewsRes, insightsRes] = await Promise.all([
        fetch(`${API_URL}/api/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/reviews/insights`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      const reviewsData  = await reviewsRes.json();
      const insightsData = await insightsRes.json();

      setReviews(reviewsData.reviews  || []);
      setInsights(insightsData || null); // store full object {tier, insights}
      if (reviewsData.lastSyncAt) setLastSyncAt(reviewsData.lastSyncAt);

    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  }

  function handleStatusChange(id, newStatus, newReply) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: newStatus, aiReply: newReply || r.aiReply } : r
      )
    );
  }

  function handleRegenerateReply(id, newReply) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, aiReply: newReply } : r
      )
    );
  }

  const counts = useMemo(() => ({
    all: reviews.length,
    needs_attention: reviews.filter(r => r.status === "needs_attention").length,
    replied: reviews.filter(r => r.status === "auto_replied" || r.status === "posted").length,
  }), [reviews]);

  const filtered = useMemo(() => {
    let list;
    if (tab === "all") list = reviews;
    else if (tab === "needs_attention") list = reviews.filter(r => r.status === "needs_attention");
    else list = reviews.filter(r => r.status !== "needs_attention");

    if (platformFilter !== 'all') {
      list = list.filter(r => (r.platform || 'google_business') === platformFilter)
    }
    if (ratingFilter !== 'all') {
      list = list.filter(r => r.rating === parseInt(ratingFilter))
    }
    return list
  }, [reviews, tab, ratingFilter, platformFilter]);

  // Alias for bulk operations
  const filteredReviews = filtered || [];

  // Calculate quick stats
  // Positive = 4★ or 5★ reviews (by rating, not status)
  const positiveCount = reviews.filter(r => r.rating >= 4).length;
  const needsAttentionCount = reviews.filter(r => r.status === "needs_attention" || r.status === "pending_approval").length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Extract top strengths and focus areas from insights
  const getQuickInsights = () => {
    if (!insights || insights?.tier === 'basic') return { strengths: "", focusAreas: "" };
    const insightText = typeof insights === 'string' ? insights : insights?.insights || ''
    if (!insightText) return { strengths: "", focusAreas: "" };
    const lines = insightText.split('\n');
    let strengths = [];
    let focusAreas = [];
    let section = '';
    
    lines.forEach(line => {
      if (line.includes('Working Well') || line.includes('Strengths')) {
        section = 'strengths';
      } else if (line.includes('Focus Areas') || line.includes('Opportunities')) {
        section = 'focus';
      } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const text = line.replace(/^[-•]\s*/, '').trim();
        if (text && section === 'strengths' && strengths.length < 2) {
          strengths.push(text.split(':')[0]);
        } else if (text && section === 'focus' && focusAreas.length < 2) {
          focusAreas.push(text.split(':')[0]);
        }
      }
    });
    
    return {
      strengths: strengths.join(', ') || 'Processing...',
      focusAreas: focusAreas.join(', ') || 'None identified'
    };
  };

  useEffect(() => {
    async function loadMode() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch(`${API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setReplyMode(data.settings?.replyMode || 'semi-auto')
        }
      } catch { /* use default */ }
    }
    loadMode()
  }, [user])

  const quickInsights = getQuickInsights();

  /* ── Load reply mode from settings ─────────────────────────── */
  useEffect(() => {
    async function loadReplyMode() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch(`${API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setReplyMode(data.settings?.replyMode || 'semi-auto')
        }
      } catch { /* use default semi-auto */ }
    }
    loadReplyMode()
  }, [user])

  function toggleSelect(id) {
    setSelectedReviews(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    setSelectedReviews(
      selectedReviews.length === filteredReviews.length
        ? []
        : filteredReviews.map(r => r.id)
    )
  }

  async function handleBulkReply() {
    if (!selectedReviews.length) return
    const total = selectedReviews.length
    setBulkPosting(true)
    setBulkProgress({ current: 0, total })
    try {
      const token = await user.getIdToken()
      const res = await fetch(`${API_URL}/api/reviews/bulk-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewIds: selectedReviews }),
      })
      const data = await res.json()
      const successful = data.successful ?? total
      const failed     = data.failed ?? 0
      setBulkProgress({ current: successful, total })

      // Re-fetch reviews from backend so posted status + reply text are accurate
      // This ensures the UI is correct when switching filters
      const reviewsRes = await fetch(`${API_URL}/api/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json()
        setReviews(reviewsData.reviews || [])
      } else {
        // Fallback: update local state optimistically
        setReviews(prev => prev.map(r =>
          selectedReviews.includes(r.id) && !data.errors?.find(e => e.reviewId === r.id)
            ? { ...r, status: 'posted' } : r
        ))
      }

      setSelectedReviews([])

      // Success toast
      if (failed === 0) {
        setToast({ type: 'success', message: `✓ ${successful} ${successful === 1 ? 'reply' : 'replies'} posted successfully!` })
      } else {
        setToast({ type: 'error', message: `Posted ${successful}, failed ${failed}. Check individual reviews.` })
      }
    } catch (err) {
      console.error('Bulk reply error:', err)
      setToast({ type: 'error', message: 'Bulk post failed. Please try again.' })
    } finally {
      setBulkPosting(false)
      setBulkProgress({ current: 0, total: 0 })
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 28 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ height: 24, width: 160, background: 'var(--border)', borderRadius: 8, marginBottom: 8, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 14, width: 260, background: 'var(--border)', borderRadius: 6, animation: 'skeletonPulse 1.5s ease-in-out infinite' }} />
        </div>
        <InsightsCardSkeleton />
        {[1, 2, 3].map(i => <ReviewCardSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div style={{ padding: 28 }}>
      <TrialBanner />
      <DynamicBanner location="dashboard-announcement" requiresAuth={true} />
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Reviews Inbox</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Automatically monitor and respond to your customer reviews.
            </p>
          </div>
          <PauseResumeToggle replyMode={replyMode} />
        </div>
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' }}>
          {[{ id: 'reviews', label: '📥 Reviews' }, { id: 'history', label: '📋 Reply History' }, { id: 'analytics', label: '📊 Analytics' }].map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              padding: '8px 16px', border: 'none', background: 'none',
              fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600,
              color: activeTab === id ? 'var(--accent)' : 'var(--ink-3)',
              borderBottom: activeTab === id ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', transition: 'all .15s', marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {activeTab === 'history'   && <ReplyHistory />}
      {activeTab === 'analytics' && <AnalyticsDashboard />}

      {activeTab === 'reviews' && <>
      
      {/* Quick Insights Card — compact strip */}
      {reviews.length > 0 && insights && (
        <div style={{
          background: "linear-gradient(135deg, #0ea5a0 0%, #0d9488 100%)",
          borderRadius: 12,
          padding: "14px 20px",
          marginBottom: 20,
          boxShadow: "0 4px 16px rgba(14,165,160,0.2)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}>
          {/* Stats — compact inline */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{avgRating}★</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>Avg Rating</div>
            </div>
            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.25)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{positiveCount}/{reviews.length}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>Positive</div>
            </div>
            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.25)" }} />
          </div>

          {/* Strengths — truncated single line — only for advanced tier */}
          {insights?.tier !== 'basic' && quickInsights.strengths ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ✅ Working Well
              </div>
              <div style={{
                fontSize: 13, fontWeight: 500,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {quickInsights.strengths}
              </div>
            </div>
          ) : insights?.tier === 'basic' ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🔒 Advanced Insights
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>
                Upgrade to Growth plan for AI-powered analysis
              </div>
            </div>
          ) : null}

          {/* View full report button */}
          <button
            onClick={() => setShowInsightsModal(true)}
            style={{
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.28)",
              color: "#fff",
              padding: "7px 16px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.28)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
          >
            {['growth','professional','admin'].includes(subscription?.plan || profile?.plan)
              ? 'Full Report' : '🔒 Full Report'} →
          </button>
        </div>
      )}

      {/* Pending Approvals Widget */}
      <PendingApprovalsWidget
        reviews={reviews}
        replyMode={replyMode}
        onFilterPending={() => { setTab("needs_attention"); setRatingFilter("all"); }}
      />

      {/* Bulk posting progress */}
      {bulkPosting && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "rgba(79,124,255,.1)", border: "1px solid rgba(79,124,255,.25)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%",
            border: "2.5px solid rgba(79,124,255,.3)", borderTopColor: "var(--accent)",
            animation: "spin .7s linear infinite", flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
              Posting replies… {bulkProgress.current}/{bulkProgress.total}
            </div>
            <div style={{
              height: 5, background: "var(--border)", borderRadius: 10, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 10, background: "var(--accent)",
                width: bulkProgress.total ? `${(bulkProgress.current / bulkProgress.total) * 100}%` : "0%",
                transition: "width .3s ease",
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Rating filter + bulk controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {/* Platform filter */}
        <select
          value={platformFilter}
          onChange={e => { setPlatformFilter(e.target.value); setSelectedReviews([]); }}
          style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "7px 12px",
            fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)",
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="all">All Platforms</option>
          <option value="google_business">⭐ Google Business</option>
          <option value="google_play">🎮 Google Play</option>
        </select>

        {/* Rating filter */}
        <select
          value={ratingFilter}
          onChange={e => { setRatingFilter(e.target.value); setSelectedReviews([]); }}
          style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "7px 12px",
            fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink)",
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="all">All Ratings</option>
          <option value="5">★★★★★ 5 stars</option>
          <option value="4">★★★★☆ 4 stars</option>
          <option value="3">★★★☆☆ 3 stars</option>
          <option value="2">★★☆☆☆ 2 stars</option>
          <option value="1">★☆☆☆☆ 1 star</option>
        </select>

        {/* Select all */}
        {filteredReviews.length > 0 && (
          <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13.5, color: "var(--ink-2)" }}>
            <input
              type="checkbox"
              checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0}
              onChange={toggleSelectAll}
              style={{ accentColor: "var(--accent)", width: 15, height: 15 }}
            />
            Select all ({filteredReviews.length})
          </label>
        )}

        {/* Bulk post button */}
        {selectedReviews.length > 0 && !bulkPosting && (
          <button
            onClick={handleBulkReply}
            style={{
              background: "var(--accent)", color: "#fff", border: "none",
              borderRadius: 8, padding: "7px 16px",
              fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📤 Post Selected ({selectedReviews.length})
          </button>
        )}

        {selectedReviews.length > 0 && (
          <button
            onClick={() => setSelectedReviews([])}
            style={{
              background: "none", border: "1px solid var(--border)",
              borderRadius: 8, padding: "7px 12px",
              fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-3)",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Stale data banner */}
      {isStale() && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(245,166,35,0.08)",
          border: "1px solid rgba(245,166,35,0.25)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
          fontSize: 13, color: "#b45309",
        }}>
          <span>⚠️</span>
          <span>Reviews haven't synced in over 24 hours.</span>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              marginLeft: "auto", background: "#f59e0b", color: "#fff",
              border: "none", padding: "4px 12px", borderRadius: 6,
              fontWeight: 600, fontSize: 12, cursor: syncing ? "not-allowed" : "pointer",
              opacity: syncing ? 0.6 : 1,
            }}
          >
            Sync now
          </button>
        </div>
      )}

      {/* Sync row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, marginBottom: 20 }}>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            background: "#1e2a3a", color: "white", border: "1px solid #2d3f55",
            padding: "7px 16px", borderRadius: 8, fontWeight: 600,
            cursor: syncing ? "not-allowed" : "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            opacity: syncing ? 0.6 : 1,
            fontSize: 13,
          }}
        >
          {syncing ? "⏳ Syncing..." : "🔄 Sync Now"}
        </button>
        {/* Last synced — always show when available, regardless of loading state */}
        {lastSyncAt && !syncing && (
          <span style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ opacity: 0.5 }}>🕐</span>
            Last synced: {getLastSyncLabel()}
          </span>
        )}
        {syncing && (
          <span style={{ fontSize: 12, color: "#9ca3af" }}>Syncing your reviews…</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button 
          onClick={() => setTab("all")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: tab === "all" ? "2px solid #0ea5a0" : "1px solid #e4e9f0",
            background: tab === "all" ? "#e6f7f6" : "#fff",
            color: tab === "all" ? "#0ea5a0" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 13
          }}
        >
          All ({counts.all})
        </button>
        <button 
          onClick={() => setTab("needs_attention")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: tab === "needs_attention" ? "2px solid #0ea5a0" : "1px solid #e4e9f0",
            background: tab === "needs_attention" ? "#e6f7f6" : "#fff",
            color: tab === "needs_attention" ? "#0ea5a0" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 13
          }}
        >
          Needs attention ({counts.needs_attention})
        </button>
        <button 
          onClick={() => setTab("replied")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: tab === "replied" ? "2px solid #0ea5a0" : "1px solid #e4e9f0",
            background: tab === "replied" ? "#e6f7f6" : "#fff",
            color: tab === "replied" ? "#0ea5a0" : "#64748b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 13
          }}
        >
          Replied ({counts.replied})
        </button>
      </div>

      {filtered?.map((review) => (
        <div key={review.id} style={{ position: "relative" }}>
          {/* Bulk select checkbox */}
          <label style={{
            position: "absolute", top: 14, left: -28, zIndex: 1,
            cursor: "pointer", display: "flex", alignItems: "center",
          }}>
            <input
              type="checkbox"
              checked={selectedReviews.includes(review.id)}
              onChange={() => toggleSelect(review.id)}
              style={{ accentColor: "var(--accent)", width: 15, height: 15 }}
            />
          </label>
          <ReviewCard
            review={review}
            onStatusChange={handleStatusChange}
            onRegenerateReply={handleRegenerateReply}
            replyMode={replyMode}
          />
        </div>
      ))}

      {filtered?.length === 0 && (
        <p style={{ marginTop: 20, color: "#718096" }}>
          No reviews in this category.
        </p>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      </> /* end reviews tab */}

      {/* Insights Modal */}
      {showInsightsModal && (
        <InsightsModal
          insights={insights}
          reviews={reviews}
          onClose={() => setShowInsightsModal(false)}
          plan={subscription?.plan || profile?.plan || 'free'}
        />
      )}
    </div>
  );
}
