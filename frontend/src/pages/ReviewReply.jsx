// src/pages/ReviewReply.jsx

import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import "./ReviewReply.css"

export default function ReviewReply() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Mock review data (replace later with Firestore)
  const review = {
    id,
    name: "Sarah M.",
    rating: 5,
    text: "Absolutely loved the experience! Staff was amazing.",
    date: "2 days ago",
  }

  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(false)
  const [tone, setTone] = useState("friendly")

  function generateReply() {
    setLoading(true)

    setTimeout(() => {
      const replies = {
        friendly:
          "Thank you so much for your kind words! We're thrilled you had a great experience and can't wait to welcome you back 😊",
        professional:
          "Thank you for your valuable feedback. We appreciate your support and look forward to serving you again.",
        apologetic:
          "We truly appreciate your feedback and are grateful for your support. Thank you for choosing us.",
      }

      setReply(replies[tone])
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="reply-page">

      {/* Header */}
      <button className="back-btn" onClick={() => navigate("/reviews")}>
        ← Back to Inbox
      </button>

      {/* Review Card */}
      <div className="review-card">
        <h2>{review.name}</h2>
        <p className="stars">{"★".repeat(review.rating)}</p>
        <p className="review-text">{review.text}</p>
        <span className="review-date">{review.date}</span>
      </div>

      {/* AI Reply Section */}
      <div className="reply-box">

        <div className="tone-selector">
          <label>Tone:</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="apologetic">Apologetic</option>
          </select>
        </div>

        <textarea
          placeholder="AI reply will appear here..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />

        <button onClick={generateReply} disabled={loading}>
          {loading ? "Generating..." : "Generate AI Reply"}
        </button>

        {reply && (
          <button className="post-btn">
            Post Reply to Google
          </button>
        )}
      </div>

    </div>
  )
}
