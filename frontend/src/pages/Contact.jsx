// frontend/src/pages/Contact.jsx
//
// Contact Us page with multiple ways to reach you:
// - Gmail
// - WhatsApp
// - Optional contact form
//
// Add route: <Route path="/contact" element={<Contact />} />

import { useState } from 'react';
import './Contact.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Contact details
  const CONTACT_EMAIL = 'guptarahul07@gmail.com';
  const WHATSAPP_NUMBER = '+919810026181';
  const SHOW_CONTACT_FORM = true;

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);

    try {
      // Option 1: Send via your backend (recommended)
      // const res = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      // if (!res.ok) throw new Error('Failed to send');

      // Option 2: Just save to Firestore for you to review later
      // const res = await fetch('/api/contact/submit', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // Simulate for now
      await new Promise(r => setTimeout(r, 1000));
      
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });

    } catch (err) {
      alert('Failed to send message. Please email us directly.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="contact-page">
      
      {/* Header */}
      <div className="contact-header">
        <h1 className="contact-title">Get in Touch</h1>
        <p className="contact-subtitle">
          Have questions? We're here to help. Choose your preferred way to reach us.
        </p>
      </div>

      {/* Contact Methods Grid */}
      <div className="contact-methods">
        
        {/* Email */}
        <a 
          href={`mailto:${CONTACT_EMAIL}`}
          className="contact-card"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="contact-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="contact-method-label">Email Us</div>
          <div className="contact-method-value">{CONTACT_EMAIL}</div>
          <div className="contact-method-desc">
            We typically respond within 24 hours
          </div>
        </a>

        {/* WhatsApp */}
        <a 
          href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=Hi!%20I%20have%20a%20question%20about%20ReviewPilot`}
          className="contact-card"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="contact-icon whatsapp">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="contact-method-label">WhatsApp</div>
          <div className="contact-method-value">WhatsApp Us</div>
          <div className="contact-method-desc">
            Chat with us instantly
          </div>
        </a>

      </div>

      {/* Contact Form (Optional) */}
      {SHOW_CONTACT_FORM && (
        <div className="contact-form-section">
          <h2 className="form-title">Or Send Us a Message</h2>
          
          {submitted ? (
            <div className="success-message">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" fill="#10b981" fillOpacity="0.1"/>
                <path d="M16 24l6 6 10-12" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Message Sent!</h3>
              <p>We'll get back to you as soon as possible.</p>
              <button 
                className="reset-btn"
                onClick={() => setSubmitted(false)}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Your Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you?"
                  rows="5"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Send Message
                  </>
                )}
              </button>

            </form>
          )}
        </div>
      )}

      {/* FAQ Section */}
      <div className="faq-section">
        <h2 className="faq-title">Frequently Asked Questions</h2>
        
        <div className="faq-list">
          
          <div className="faq-item">
            <div className="faq-question">Is ReviewPilot free during beta?</div>
            <div className="faq-answer">
              Yes! We're currently in beta and offering free access to early users. 
              We'll notify you before any pricing changes.
            </div>
          </div>

          <div className="faq-item">
            <div className="faq-question">How do I connect my Google Business Profile?</div>
            <div className="faq-answer">
              After signing up, click "Connect Google Business" and authorize ReviewPilot 
              to access your Google Business Profile reviews. It takes less than 2 minutes.
            </div>
          </div>

          <div className="faq-item">
            <div className="faq-question">Will AI replies be posted automatically?</div>
            <div className="faq-answer">
              We auto-post replies to 4-5 star reviews. Reviews with 3 stars or lower 
              require your approval before posting. You always have final control.
            </div>
          </div>

          <div className="faq-item">
            <div className="faq-question">Can I edit AI-generated replies?</div>
            <div className="faq-answer">
              Absolutely! You can edit any reply before it's posted. We generate suggestions, 
              but you have complete control over what gets published.
            </div>
          </div>

          <div className="faq-item">
            <div className="faq-question">How do I provide feedback or report bugs?</div>
            <div className="faq-answer">
              Use the feedback form in your dashboard settings, or reach out to us via 
              email or WhatsApp. We'd love to hear from you!
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
