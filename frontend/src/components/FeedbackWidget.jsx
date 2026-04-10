// frontend/src/components/FeedbackWidget.jsx
//
// Reusable feedback component
// Can be embedded in Settings page, Dashboard, or anywhere
//
// Usage:
// import FeedbackWidget from '../components/FeedbackWidget';
// <FeedbackWidget />

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';  // Add at top
import './FeedbackWidget.css';

export default function FeedbackWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feature, setFeature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = await user.getIdToken();
      
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: rating || null,
          comment: comment.trim() || null,
          feature: feature || null
        })
      });

      if (!res.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
        setRating(0);
        setComment('');
        setFeature('');
      }, 3000);

    } catch (err) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="feedback-widget">
      
      {/* Trigger Button */}
      <button 
        className="feedback-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Give feedback"
      >
        💬 Feedback
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="feedback-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            
            <button 
              className="feedback-close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>

            {submitted ? (
              <div className="feedback-success">
                <div className="success-icon">✓</div>
                <h3>Thank You!</h3>
                <p>Your feedback helps us improve ReviewPilot.</p>
              </div>
            ) : (
              <>
                <h2 className="feedback-title">Share Your Feedback</h2>
                <p className="feedback-subtitle">
                  Help us make ReviewPilot better for you
                </p>

                <form onSubmit={handleSubmit}>
                  
                  {/* Star Rating */}
                  <div className="feedback-field">
                    <label>How's your experience so far?</label>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star ${(hoveredRating || rating) >= star ? 'active' : ''}`}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <div className="rating-label">
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                      </div>
                    )}
                  </div>

                  {/* Feature (Optional) */}
                  <div className="feedback-field">
                    <label>What feature are you using? (optional)</label>
                    <select 
                      value={feature}
                      onChange={(e) => setFeature(e.target.value)}
                    >
                      <option value="">Select a feature</option>
                      <option value="auto-post">Auto-posting replies</option>
                      <option value="ai-generation">AI reply generation</option>
                      <option value="manual-approval">Manual approval</option>
                      <option value="google-sync">Google sync</option>
                      <option value="settings">Settings</option>
                      <option value="dashboard">Dashboard</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Comment */}
                  <div className="feedback-field">
                    <label>Tell us more (optional)</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What's working well? What could be better?"
                      rows="4"
                      maxLength="1000"
                    />
                    <div className="char-count">{comment.length}/1000</div>
                  </div>

                  {/* Submit */}
                  <button 
                    type="submit"
                    className="feedback-submit"
                    disabled={submitting || (!rating && !comment.trim())}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner" />
                        Sending...
                      </>
                    ) : (
                      'Send Feedback'
                    )}
                  </button>

                </form>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
