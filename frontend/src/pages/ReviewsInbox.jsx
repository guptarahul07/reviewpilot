// src/pages/ReviewsInbox.jsx

import { useAuth } from "../context/AuthContext";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config/api';

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
        
        {/* Center text */}
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 20, fontWeight: 700, fill: "#111827" }}
        >
          {positivePercent.toFixed(0)}%
        </text>
        <text
          x="60"
          y="75"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 10, fill: "#6b7280" }}
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
function InsightsModal({ insights, reviews, onClose }) {
  const positiveCount = reviews.filter(r => r.status === "auto_replied").length;
  const needsAttention = reviews.filter(r => r.status === "needs_attention").length;
  const mixedCount = reviews.filter(r => r.hasMixedSentiment).length;
  
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          maxWidth: 700,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: 32,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, color: "#111827" }}>
            📊 Detailed Insights
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 28,
              cursor: "pointer",
              color: "#6b7280",
              padding: 0,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Review Distribution */}
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
            marginBottom: 20
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: "#374151" }}>
            Review Distribution
          </h3>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <DonutChart
              positive={positiveCount}
              negative={needsAttention - mixedCount}
              mixed={mixedCount}
            />
            
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#111827" }}>
                {avgRating}★
              </div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                from {reviews.length} reviews
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: "#374151" }}>
            AI Analysis
          </h3>
          
          <div style={{ 
            whiteSpace: "pre-wrap", 
            lineHeight: "1.8",
            fontSize: 14,
            color: "#1f2937"
          }}>
            {insights}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   REVIEW CARD (WITH REGENERATE & EDIT)
───────────────────────────────────────────────────────────── */
function ReviewCard({ review, onStatusChange, onRegenerateReply }) {
  const { user } = useAuth();
  const [posting, setPosting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedReply, setEditedReply] = useState(review.aiReply);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch("${API_URL}/api/reviews/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reviewId: review.id }),
      });

      if (!response.ok) {
        throw new Error("Regenerate failed");
      }

      const data = await response.json();
      onRegenerateReply(review.id, data.newReply);
      setEditedReply(data.newReply);
      
    } catch (err) {
      console.error("Regenerate error:", err);
      alert("Failed to regenerate reply");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleConfirm() {
    setPosting(true);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch("${API_URL}/api/reviews/post", {
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
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong style={{ color: "#111827" }}>{review.reviewer}</strong>
        <span style={{ fontSize: 12, color: "#718096" }}>
          {review.date || new Date(review.createTime).toLocaleDateString()}
        </span>
      </div>

      <Stars rating={review.rating} />

      <p style={{ marginTop: 8, color: "#1f2937" }}>
        {review.text}
      </p>

      {review.aiReply && (
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
            
            {review.status === "needs_attention" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleRegenerate}
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
                  {regenerating ? "🔄 Regenerating..." : "🔄 Regenerate"}
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
          
          {editing ? (
            <textarea
              value={editedReply}
              onChange={(e) => setEditedReply(e.target.value)}
              style={{
                width: "100%",
                minHeight: 60,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontFamily: "inherit",
                fontSize: 14,
                resize: "vertical",
                marginTop: 6
              }}
            />
          ) : (
            <p style={{ marginTop: 6, color: "#1f2937" }}>
              {editedReply}
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        {review.status === "auto_replied" && (
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

        {review.status === "needs_attention" && (
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
  const { profile, user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [insights, setInsights] = useState(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  useEffect(() => {
    if (reviews.length === 0) {
      handleSync();
    }
  }, []);

  async function handleSync() {
    setSyncing(true);

    try {
      const token = await user.getIdToken();

      // 1️⃣ Sync reviews
      await fetch("${API_URL}/api/reviews/sync", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // 2️⃣ Load reviews
      const response = await fetch("${API_URL}/api/reviews", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setReviews(data.reviews);

      // 3️⃣ Load insights
      const insightsRes = await fetch("${API_URL}/api/reviews/insights", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const insightsData = await insightsRes.json();

      setInsights(insightsData.insights);

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
    if (tab === "all") return reviews;
    if (tab === "needs_attention")
      return reviews.filter(r => r.status === "needs_attention");
    if (tab === "replied")
      return reviews.filter(r => r.status !== "needs_attention");
  }, [reviews, tab]);

  // Calculate quick stats
  const positiveCount = reviews.filter(r => r.status === "auto_replied").length;
  const needsAttentionCount = reviews.filter(r => r.status === "needs_attention").length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Extract top strengths and focus areas from insights
  const getQuickInsights = () => {
    if (!insights) return { strengths: "", focusAreas: "" };
    
    const lines = insights.split('\n');
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

  const quickInsights = getQuickInsights();

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ marginBottom: 4 }}>Reviews Inbox</h2>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          Automatically monitor and respond to your customer reviews.
        </p>
      </div>
      
      {/* Quick Insights Card */}
      {reviews.length > 0 && insights && (
        <div
          style={{
            background: "linear-gradient(135deg, #0ea5a0 0%, #0d9488 100%)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
            boxShadow: "0 4px 16px rgba(14,165,160,0.2)",
            color: "#fff"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, marginBottom: 12, fontSize: 18, fontWeight: 600 }}>
                📊 Quick Insights
              </h3>
              
              <div style={{ display: "flex", gap: 32, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>{avgRating}★</div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>Average Rating</div>
                </div>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>{positiveCount}/{reviews.length}</div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>Positive</div>
                </div>
              </div>
              
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>✅ Working Well</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{quickInsights.strengths}</div>
              </div>
              
              {needsAttentionCount > 0 && (
                <div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>🎯 Focus Areas</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{quickInsights.focusAreas}</div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowInsightsModal(true)}
              style={{
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
            >
              View Detailed Report →
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, marginBottom: 20 }}>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            background: "#0ea5a0",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontWeight: 600,
            cursor: syncing ? "not-allowed" : "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            opacity: syncing ? 0.6 : 1,
          }}
        >
          {syncing ? "Syncing..." : "🔄 Sync Reviews"}
        </button>
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
        <ReviewCard
          key={review.id}
          review={review}
          onStatusChange={handleStatusChange}
          onRegenerateReply={handleRegenerateReply}
        />
      ))}

      {filtered?.length === 0 && (
        <p style={{ marginTop: 20, color: "#718096" }}>
          No reviews in this category.
        </p>
      )}

      {/* Insights Modal */}
      {showInsightsModal && (
        <InsightsModal
          insights={insights}
          reviews={reviews}
          onClose={() => setShowInsightsModal(false)}
        />
      )}
    </div>
  );
}
