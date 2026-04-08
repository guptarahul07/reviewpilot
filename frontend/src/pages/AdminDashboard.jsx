// frontend/src/pages/AdminDashboard.jsx
//
// Admin-only page to view beta analytics
// Add route: <Route path="/admin" element={<AdminDashboard />} />
//
// SECURITY: In production, add proper admin role checking!

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    setError(null);
    
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await res.json();
      setStats(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-banner">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="admin-dashboard">
      
      {/* Header */}
      <div className="admin-header">
        <h1 className="admin-title">📊 ReviewPilot Beta Analytics</h1>
        <p className="admin-subtitle">
          Last updated: {new Date(stats.generatedAt).toLocaleString()}
        </p>
        <button className="refresh-btn" onClick={loadAnalytics}>
          🔄 Refresh
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        
        <div className="metric-card">
          <div className="metric-label">Total Users</div>
          <div className="metric-value">{stats.totalUsers}</div>
          <div className="metric-detail">
            {stats.activeUsers} active (7d)
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Connected to Google</div>
          <div className="metric-value">{stats.connectedUsersCount}</div>
          <div className="metric-detail">
            {stats.connectionRate}% connection rate
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Reviews Synced</div>
          <div className="metric-value">{stats.totalReviewsSynced}</div>
          <div className="metric-detail">
            Avg {stats.avgReviewsPerUser} per user
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Replies Posted</div>
          <div className="metric-value">{stats.totalRepliesPosted}</div>
          <div className="metric-detail">
            {stats.autoPostRate}% auto-posted
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">AI Replies Generated</div>
          <div className="metric-value">{stats.totalRepliesGenerated}</div>
          <div className="metric-detail">
            {stats.avgRepliesPerUser} per user
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Sentiment Flags</div>
          <div className="metric-value">{stats.sentimentFlaggedCount}</div>
          <div className="metric-detail">
            Prevented auto-posting
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Auto-Posted</div>
          <div className="metric-value">{stats.autoPostedCount}</div>
          <div className="metric-detail">
            4-5 star reviews
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Manual Approvals</div>
          <div className="metric-value">{stats.manualApprovedCount}</div>
          <div className="metric-detail">
            Low ratings or flagged
          </div>
        </div>

      </div>

      {/* Feedback Section */}
      <div className="section">
        <h2 className="section-title">
          💬 User Feedback
          <span className="feedback-rating">
            Avg Rating: {stats.avgFeedbackRating}⭐ ({stats.totalFeedbackCount} total)
          </span>
        </h2>
        
        {stats.recentFeedback.length === 0 ? (
          <p className="empty-state">No feedback yet</p>
        ) : (
          <div className="feedback-list">
            {stats.recentFeedback.map((f) => (
              <div key={f.id} className="feedback-card">
                <div className="feedback-header">
                  <div className="feedback-rating">
                    {f.rating ? '⭐'.repeat(f.rating) : 'No rating'}
                  </div>
                  <div className="feedback-date">
                    {new Date(f.createdAt?.toDate?.() || f.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="feedback-comment">{f.comment || 'No comment'}</p>
                {f.feature && (
                  <span className="feedback-tag">Feature: {f.feature}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Users */}
      <div className="section">
        <h2 className="section-title">🏆 Most Active Users</h2>
        
        <div className="top-users-table">
          <div className="table-header">
            <div>Business</div>
            <div>Email</div>
            <div>Reviews</div>
            <div>Replies</div>
          </div>
          
          {stats.topUsers.map((u) => (
            <div key={u.id} className="table-row">
              <div className="user-business">{u.businessName}</div>
              <div className="user-email">{u.email}</div>
              <div className="user-stat">{u.totalReviewsSynced}</div>
              <div className="user-stat">{u.totalRepliesPosted}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="section">
        <button 
          className="export-btn"
          onClick={() => {
            const dataStr = JSON.stringify(stats, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reviewpilot-analytics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
          }}
        >
          📥 Export Data (JSON)
        </button>
      </div>

    </div>
  );
}
