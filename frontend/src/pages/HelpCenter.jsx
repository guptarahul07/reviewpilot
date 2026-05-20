// src/pages/HelpCenter.jsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEOMeta from '../components/ui/SEOMeta'

/* ─────────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:wght@400;500;600;700;800&display=swap');

:root {
  --navy: #0f1623; --navy2: #1e2a3a;
  --teal: #0ea5a0; --tealt: #14b8b3; --teald: rgba(14,165,160,.12);
  --slatelt: #718096;
  --white: #fff; --snow: #f7f8fa; --offwhite: #f0f2f5;
  --bdr: #e4e9f0; --bdrmid: #cbd5e1;
  --green: #10b981; --amber: #f59e0b;
  --shmd: 0 4px 16px rgba(15,22,35,.08),0 2px 6px rgba(15,22,35,.04);
  --shlg: 0 16px 48px rgba(15,22,35,.10),0 4px 14px rgba(15,22,35,.06);
  --r: 10px; --rl: 16px; --rxl: 24px;
}

/* ── Animations ── */
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }

.hc-afu { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both }
.hc-d1  { animation-delay:.06s }
.hc-d2  { animation-delay:.12s }
.hc-d3  { animation-delay:.18s }
.hc-d4  { animation-delay:.24s }
.hc-d5  { animation-delay:.30s }

/* ── Page shell ── */
.hc-page {
  font-family: 'Figtree', sans-serif;
  -webkit-font-smoothing: antialiased;
  background: var(--offwhite);
  min-height: 100vh;
  color: var(--navy);
}

/* ── Hero ── */
.hc-hero {
  background: var(--white);
  border-bottom: 1px solid var(--bdr);
  padding: 64px 24px 56px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.hc-hero::before {
  content: '';
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image: radial-gradient(circle, rgba(14,165,160,.04) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse 80% 90% at 50% 50%, #000 20%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 90% at 50% 50%, #000 20%, transparent 80%);
}
.hc-hero::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--teal), var(--tealt), transparent);
}
.hc-hero-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }

.hc-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.25);
  border-radius: 100px; padding: 5px 14px;
  font-size: 12px; font-weight: 700; color: #b45309;
  letter-spacing: .04em; text-transform: uppercase;
  margin-bottom: 20px;
}

.hc-hero-title {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(32px, 6vw, 52px);
  font-weight: 400; line-height: 1.1;
  letter-spacing: -.03em; color: var(--navy);
  margin-bottom: 14px;
}

.hc-hero-sub {
  font-size: 16px; color: var(--slatelt); line-height: 1.65;
  margin-bottom: 32px;
}

/* Search bar */
.hc-search-wrap {
  position: relative; max-width: 420px; margin: 0 auto;
}
.hc-search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--slatelt); pointer-events: none;
}
.hc-search {
  width: 100%; padding: 13px 16px 13px 42px;
  font-family: 'Figtree', sans-serif; font-size: 14px; font-weight: 500;
  background: var(--white); border: 1.5px solid var(--bdrmid);
  border-radius: var(--r); color: var(--navy);
  box-shadow: var(--shmd);
  outline: none; transition: border-color .2s, box-shadow .2s;
}
.hc-search:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(14,165,160,.1); }
.hc-search::placeholder { color: var(--slatelt); }
.hc-search-clear {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: var(--slatelt); font-size: 16px; padding: 2px 6px;
  border-radius: 4px; transition: color .15s;
}
.hc-search-clear:hover { color: var(--navy); }

/* ── Main content ── */
.hc-body { max-width: 900px; margin: 0 auto; padding: 48px 24px 80px; }

/* ── Section label ── */
.hc-section-label {
  display: flex; align-items: center; gap: 10px;
  font-size: 11px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--teal);
  margin-bottom: 20px;
}
.hc-section-label::after {
  content: ''; flex: 1; height: 1px; background: var(--bdr);
}

/* ── Section card wrapper ── */
.hc-section {
  background: var(--white); border: 1px solid var(--bdr);
  border-radius: var(--rxl); overflow: hidden;
  box-shadow: var(--shmd); margin-bottom: 32px;
}
.hc-section-header {
  display: flex; align-items: center; gap: 14px;
  padding: 24px 28px; border-bottom: 1px solid var(--bdr);
}
.hc-section-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.hc-section-icon--teal { background: var(--teald); border: 1px solid rgba(14,165,160,.2); }
.hc-section-icon--amber { background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.2); }
.hc-section-icon--blue { background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2); }
.hc-section-title { font-size: 17px; font-weight: 700; color: var(--navy); margin-bottom: 2px; }
.hc-section-desc { font-size: 13px; color: var(--slatelt); }

/* ── Quick Start steps ── */
.hc-steps { padding: 8px 0; }

.hc-step {
  display: flex; gap: 20px;
  padding: 20px 28px;
  border-bottom: 1px solid var(--bdr);
  transition: background .15s;
}
.hc-step:last-child { border-bottom: none; }
.hc-step:hover { background: var(--snow); }

.hc-step-num {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--teald); border: 1.5px solid rgba(14,165,160,.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: var(--teal);
  flex-shrink: 0; margin-top: 2px;
}
.hc-step-body {}
.hc-step-title {
  font-size: 15px; font-weight: 700; color: var(--navy);
  margin-bottom: 6px; display: flex; align-items: center; gap: 8px;
}
.hc-step-time {
  font-size: 11px; font-weight: 600; padding: 2px 8px;
  background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.2);
  border-radius: 100px; color: var(--green);
}
.hc-step-content { font-size: 13.5px; color: var(--slatelt); line-height: 1.65; }
.hc-step-content ol { padding-left: 18px; margin: 8px 0; }
.hc-step-content ol li { margin-bottom: 4px; }
.hc-step-note {
  display: inline-flex; align-items: flex-start; gap: 7px;
  margin-top: 10px; padding: 8px 12px;
  background: var(--snow); border: 1px solid var(--bdr);
  border-radius: 8px; font-size: 12px; color: var(--slatelt);
  line-height: 1.5;
}

/* ── FAQ categories ── */
.hc-faq-cats {
  display: flex; gap: 6px; flex-wrap: wrap;
  padding: 16px 28px; border-bottom: 1px solid var(--bdr);
  background: var(--snow);
}
.hc-faq-cat {
  padding: 5px 13px; border-radius: 100px;
  font-size: 12.5px; font-weight: 600;
  background: var(--white); border: 1.5px solid var(--bdr);
  color: var(--slatelt); cursor: pointer;
  transition: all .15s;
}
.hc-faq-cat:hover { border-color: var(--teal); color: var(--teal); }
.hc-faq-cat--active {
  background: var(--teald); border-color: rgba(14,165,160,.3);
  color: var(--teal);
}

/* ── FAQ search result count ── */
.hc-faq-count {
  padding: 10px 28px; font-size: 12px; color: var(--slatelt);
  border-bottom: 1px solid var(--bdr); background: var(--snow);
}

/* ── FAQ accordion items ── */
.hc-faq-item {
  border-bottom: 1px solid var(--bdr);
}
.hc-faq-item:last-child { border-bottom: none; }

.hc-faq-q {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 18px 28px; cursor: pointer;
  background: none; border: none; width: 100%; text-align: left;
  font-family: 'Figtree', sans-serif;
  transition: background .15s;
}
.hc-faq-q:hover { background: var(--snow); }

.hc-faq-q-text {
  font-size: 14px; font-weight: 600; color: var(--navy);
  line-height: 1.45; flex: 1;
}
.hc-faq-chevron {
  width: 20px; height: 20px; flex-shrink: 0;
  color: var(--slatelt); transition: transform .25s cubic-bezier(.22,1,.36,1);
  margin-top: 1px;
}
.hc-faq-chevron--open { transform: rotate(180deg); color: var(--teal); }

.hc-faq-a {
  overflow: hidden;
  max-height: 0;
  transition: max-height .3s cubic-bezier(.22,1,.36,1);
}
.hc-faq-a--open { max-height: 600px; }

.hc-faq-a-inner {
  padding: 0 28px 20px 28px;
  font-size: 13.5px; color: var(--slatelt); line-height: 1.7;
  border-left: 3px solid var(--teald);
  margin-left: 28px;
}
.hc-faq-a-inner ul, .hc-faq-a-inner ol {
  padding-left: 18px; margin: 8px 0;
}
.hc-faq-a-inner li { margin-bottom: 5px; }
.hc-faq-a-inner strong { color: var(--navy); }

/* no results */
.hc-faq-empty {
  padding: 40px 28px; text-align: center;
  font-size: 14px; color: var(--slatelt);
}
.hc-faq-empty span { font-size: 28px; display: block; margin-bottom: 10px; }

/* ── Video section ── */
.hc-video-wrap { padding: 28px; }
.hc-video-placeholder {
  aspect-ratio: 16/9; background: var(--navy);
  border-radius: var(--rl); border: 1px solid rgba(255,255,255,.08);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; position: relative; overflow: hidden;
}
.hc-video-placeholder::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(14,165,160,.12), transparent);
}
.hc-video-play {
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--teal); border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative; z-index: 1;
  box-shadow: 0 0 0 8px rgba(14,165,160,.15), 0 0 0 16px rgba(14,165,160,.07);
  transition: transform .2s, box-shadow .2s;
}
.hc-video-play:hover {
  transform: scale(1.08);
  box-shadow: 0 0 0 10px rgba(14,165,160,.2), 0 0 0 20px rgba(14,165,160,.08);
}
.hc-video-label {
  font-size: 15px; font-weight: 600; color: rgba(255,255,255,.8);
  position: relative; z-index: 1;
}
.hc-video-sub {
  font-size: 12.5px; color: rgba(255,255,255,.4);
  position: relative; z-index: 1;
}

/* ── Contact / CTA section ── */
.hc-contact {
  background: var(--white); border: 1px solid var(--bdr);
  border-radius: var(--rxl); overflow: hidden;
  box-shadow: var(--shmd); margin-bottom: 32px;
}
.hc-contact-inner {
  padding: 36px 28px;
  display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
}
.hc-contact-text { flex: 1; min-width: 220px; }
.hc-contact-title {
  font-family: 'Instrument Serif', serif;
  font-size: 22px; font-weight: 400; color: var(--navy);
  margin-bottom: 6px; letter-spacing: -.02em;
}
.hc-contact-sub { font-size: 13.5px; color: var(--slatelt); line-height: 1.55; }
.hc-contact-cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 22px; border-radius: var(--r);
  font-family: 'Figtree', sans-serif; font-size: 14px; font-weight: 700;
  background: var(--navy); color: var(--white); border: none; cursor: pointer;
  text-decoration: none; transition: all .2s cubic-bezier(.22,1,.36,1);
  position: relative; overflow: hidden;
}
.hc-contact-cta:hover { background: var(--navy2); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,22,35,.18); }
.hc-contact-cta::after {
  content: ''; position: absolute; top: 0; left: -80%; width: 55%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent);
  transform: skewX(-18deg); transition: left .5s ease;
}
.hc-contact-cta:hover::after { left: 160%; }

/* ── Tips strip ── */
.hc-tips {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px; margin-bottom: 32px;
}
.hc-tip {
  background: var(--white); border: 1px solid var(--bdr);
  border-radius: var(--rl); padding: 18px 20px;
  box-shadow: var(--shmd);
}
.hc-tip-icon { font-size: 22px; margin-bottom: 8px; }
.hc-tip-title { font-size: 13.5px; font-weight: 700; color: var(--navy); margin-bottom: 4px; }
.hc-tip-desc { font-size: 12.5px; color: var(--slatelt); line-height: 1.55; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .hc-hero { padding: 44px 16px 40px; }
  .hc-body { padding: 28px 16px 60px; }
  .hc-step { padding: 16px 18px; gap: 14px; }
  .hc-faq-q { padding: 15px 18px; }
  .hc-faq-a-inner { padding: 0 18px 16px; margin-left: 18px; }
  .hc-faq-cats { padding: 12px 18px; }
  .hc-faq-count { padding: 8px 18px; }
  .hc-section-header { padding: 18px 20px; }
  .hc-video-wrap { padding: 18px; }
  .hc-contact-inner { padding: 24px 20px; }
  .hc-tips { grid-template-columns: 1fr 1fr; }
}
`;

/* ─────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    emoji: '🔐',
    title: 'Create Your Account',
    time: '2 min',
    content: (
      <>
        <ol>
          <li>Go to <strong>reviewpilot.live</strong></li>
          <li>Click <strong>"Sign Up"</strong></li>
          <li>Enter your email and create a password</li>
          <li>Verify your email — you're in!</li>
        </ol>
        <div className="hc-step-note">
          🎁 Start free — no credit card required!
        </div>
      </>
    ),
  },
  {
    emoji: '🔗',
    title: 'Connect Your Google Business',
    time: '1 min',
    content: (
      <>
        <ol>
          <li>Click <strong>"Connect Google Business"</strong> on your dashboard</li>
          <li>Sign in with your Google account (the one managing your business)</li>
          <li>Grant ReviewPilot permission to read reviews and post replies</li>
          <li>Click <strong>"Allow"</strong> — done!</li>
        </ol>
        <div className="hc-step-note">
          🔒 We use Google OAuth 2.0 (bank-level security). Your password is <strong>never</strong> stored.
        </div>
      </>
    ),
  },
  {
    emoji: '⭐',
    title: 'View Your Reviews',
    time: 'Instant',
    content: (
      <>
        <p>Go to the <strong>Reviews</strong> page. All your Google Business reviews are now synced and organized by:</p>
        <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
          <li>⚠️ <strong>Needs Attention</strong> (1–3 stars)</li>
          <li>✅ <strong>Positive</strong> (4–5 stars)</li>
        </ul>
        <div className="hc-step-note">
          🔄 Reviews sync every 24 hours automatically. Click <strong>"Sync Now"</strong> anytime for a manual refresh.
        </div>
      </>
    ),
  },
  {
    emoji: '🤖',
    title: 'Use AI-Generated Replies',
    time: '10 sec/review',
    content: (
      <>
        <p>For each review you get:</p>
        <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
          <li><strong>AI Suggested Reply</strong> — personalized response in English</li>
          <li><strong>🔄 Regenerate</strong> — get a different reply</li>
          <li><strong>✏️ Edit</strong> — customize the reply</li>
          <li><strong>📤 Post</strong> — publish directly to Google</li>
        </ul>
        <div className="hc-step-note">
          🌐 AI understands Hindi &amp; English reviews, but currently replies in English only. Multi-language coming soon!
        </div>
      </>
    ),
  },
  {
    emoji: '📊',
    title: 'Monitor Insights',
    time: '1 min',
    content: (
      <>
        <p>Visit the <strong>Insights</strong> section to see AI-powered analysis:</p>
        <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
          <li>Overall sentiment (Positive / Neutral / Negative)</li>
          <li>Common themes mentioned by customers</li>
          <li>Areas of improvement</li>
          <li>Top compliments from your customers</li>
        </ul>
        <p style={{ marginTop: 8 }}>Use these insights to improve your business every week!</p>
      </>
    ),
  },
];

const FAQ_CATEGORIES = ['All', 'General', 'Technical', 'Features', 'Billing', 'Support'];

const FAQS = [
  {
    category: 'General',
    q: 'What is ReviewPilot?',
    a: 'ReviewPilot is an AI-powered platform that helps small and medium businesses manage their Google Business Profile reviews. It automatically syncs reviews, generates personalized AI replies (powered by Claude by Anthropic), and provides insights to improve your business.',
  },
  {
    category: 'Billing',
    q: 'How much does it cost?',
    a: (
      <>
        <p>We're currently in beta with a special offer!</p>
        <p><strong>🎁 Special Offer:</strong></p>
        <ul>
          <li>2 months FREE with annual billing</li>
          <li>No credit card required</li>
          <li>Full access to all features</li>
        </ul>
        <p><strong>After Beta Launch:</strong></p>
        <ul>
          <li>15-day free trial for new users</li>
          <li>Then ₹299/month</li>
          <li>Cancel anytime, no questions asked</li>
        </ul>
      </>
    ),
  },
  {
    category: 'General',
    q: 'Which businesses is this for?',
    a: 'ReviewPilot is perfect for Indian SMBs with a Google Business Profile — cafes, restaurants, salons, spas, clinics, dental offices, hotels, gyms, retail stores, and any business where customers leave Google reviews.',
  },
  {
    category: 'Technical',
    q: 'How does ReviewPilot work?',
    a: (
      <ol>
        <li>You <strong>connect</strong> your Google Business account (secure OAuth 2.0)</li>
        <li>We <strong>sync</strong> your reviews every 24 hours automatically</li>
        <li><strong>AI generates</strong> personalized replies using Claude by Anthropic</li>
        <li>You <strong>review and edit</strong> if needed (you're always in control)</li>
        <li>You <strong>post with one click</strong> — reply goes directly to Google</li>
      </ol>
    ),
  },
  {
    category: 'Technical',
    q: 'Is my data safe?',
    a: (
      <ul>
        <li>✅ <strong>Google OAuth 2.0</strong> — bank-level security (same as Gmail)</li>
        <li>✅ <strong>Your password is NEVER stored</strong> — Google handles authentication</li>
        <li>✅ <strong>Encrypted tokens</strong> — all OAuth tokens encrypted with AES-256-GCM</li>
        <li>✅ <strong>You control access</strong> — disconnect anytime from settings</li>
        <li>✅ <strong>No data sharing</strong> — we NEVER share your data with third parties</li>
        <li>✅ <strong>Secure servers</strong> — hosted on Google Firebase in India</li>
      </ul>
    ),
  },
  {
    category: 'Technical',
    q: 'Can I use this on my phone?',
    a: 'Yes! ReviewPilot is fully mobile-optimized. It works on any smartphone (iPhone/Android), tablets, and desktop/laptop — same features across all devices with a touch-friendly interface.',
  },
  {
    category: 'Technical',
    q: 'Do I need technical knowledge?',
    a: 'Not at all! If you can use WhatsApp, you can use ReviewPilot. No coding required, no technical setup, simple intuitive interface. Takes 2 minutes to get started. Free onboarding support is available.',
  },
  {
    category: 'Features',
    q: 'Can I edit the AI-generated replies?',
    a: (
      <>
        <p>Yes! You have <strong>complete control</strong> over every reply:</p>
        <ul>
          <li>✏️ <strong>Edit</strong> — customize any reply to match your brand voice</li>
          <li>🔄 <strong>Regenerate</strong> — get a completely different version</li>
          <li>📤 <strong>Post as-is</strong> — if you love the AI suggestion</li>
        </ul>
        <p>AI provides suggestions — YOU make the final decision!</p>
      </>
    ),
  },
  {
    category: 'Features',
    q: 'Will AI reply to ALL my reviews automatically?',
    a: 'No — you\'re always in control. AI generates suggested replies, but YOU review and approve before anything is posted. Nothing goes live without your permission. An optional auto-post mode for positive reviews is coming soon.',
  },
  {
    category: 'Features',
    q: 'What languages does it support?',
    a: (
      <>
        <p>ReviewPilot currently generates replies in <strong>English only</strong>. However, the AI understands reviews written in Hindi and responds appropriately in English.</p>
        <p><strong>Coming soon:</strong> Reply generation in Hindi, Tamil, Telugu, Marathi, and Bengali — auto-detecting review language.</p>
      </>
    ),
  },
  {
    category: 'Features',
    q: 'Can I manage multiple business locations?',
    a: 'Currently ReviewPilot supports one location per account. Multi-location dashboard is coming in Phase 2. For now, create separate accounts for each location — all will get the same plan benefits!',
  },
  {
    category: 'Features',
    q: 'How often do reviews sync?',
    a: 'Reviews sync automatically every 24 hours. You can also click "Sync Now" anytime for an instant manual sync. The last sync time is displayed on the Reviews page.',
  },
  {
    category: 'Billing',
    q: 'Is there a free trial?',
    a: (
      <>
        <p><strong>15-day free trial</strong> — no credit card required, full access. Annual plans include 2 months free.</p>
        <p><strong>After Beta Launch:</strong> 15-day free trial for new users, then ₹299/month. Cancel anytime during trial — no charges.</p>
      </>
    ),
  },
  {
    category: 'Billing',
    q: 'How do I cancel?',
    a: (
      <ol>
        <li>Go to <strong>Settings</strong> in ReviewPilot</li>
        <li>Click <strong>"Disconnect Google Business"</strong></li>
        <li>Confirm disconnection</li>
        <li>Done — no fees, no questions asked</li>
      </ol>
    ),
  },
  {
    category: 'Billing',
    q: 'Can I export my data?',
    a: 'Yes! Email guptarahul07@gmail.com with "Please export my ReviewPilot data" and we\'ll send you all your reviews, AI replies, insights, and account information within 24 hours in JSON or CSV format.',
  },
  {
    category: 'Support',
    q: "I'm stuck! How do I get help?",
    a: (
      <>
        <p><strong>Contact us:</strong></p>
        <ul>
          <li>📧 Email: guptarahul07@gmail.com</li>
          <li>📱 WhatsApp: +919810026181</li>
          <li>🕐 Response time: within 1 business day</li>
          <li>🎥 Free video onboarding calls available!</li>
        </ul>
        <p>For beta users we offer priority support and direct WhatsApp access to the founder.</p>
      </>
    ),
  },
  {
    category: 'Support',
    q: 'Can you help me set it up?',
    a: 'Absolutely! Free onboarding includes a screen-sharing walkthrough, personalized setup for your business, best practices for your industry, and a Q&A session. Just WhatsApp us at +919810026181 to schedule — average setup call is 15–20 minutes.',
  },
  {
    category: 'General',
    q: 'Do you read my reviews?',
    a: 'No. Reviews are processed automatically by AI (Claude API) to generate replies — no human ever manually reads your data. We take privacy seriously: no data sharing, no selling, no marketing use of your reviews.',
  },
  {
    category: 'Support',
    q: "Why aren't my reviews syncing?",
    a: (
      <>
        <p><strong>Common reasons:</strong></p>
        <ul>
          <li><strong>Google API pending approval</strong> — you'll see test data in the meantime (3–7 days)</li>
          <li><strong>Google connection expired</strong> — disconnect and reconnect from Settings</li>
          <li><strong>No reviews yet</strong> — make sure your Google Business Profile has reviews visible on Google Maps</li>
        </ul>
        <p>Still stuck? Contact support!</p>
      </>
    ),
  },
  {
    category: 'Support',
    q: 'Can I undo a posted reply?',
    a: 'Unfortunately, once a reply is posted to Google it cannot be deleted through ReviewPilot. You can edit or delete it manually from your Google Business Profile. Best practice: always review AI replies before posting!',
  },
  {
    category: 'General',
    q: "What's coming next?",
    a: (
      <>
        <p><strong>Phase 2 (next 2–3 months):</strong> Multi-language replies, WhatsApp notifications, auto-reply mode, multi-location support, custom brand voice training.</p>
        <p><strong>Phase 3 (3–6 months):</strong> Advanced analytics, Zomato/Swiggy integration, QR code review collection, team collaboration, mobile app.</p>
        <p>Your feedback shapes our roadmap!</p>
      </>
    ),
  },
];

const TIPS = [
  { icon: '✨', title: 'Review before posting', desc: 'Always read AI suggestions and add your personal touch before hitting Post.' },
  { icon: '⚡', title: 'Respond within 24h', desc: 'Google rewards fast responses. Use ReviewPilot daily for the best results.' },
  { icon: '🔄', title: 'Use Regenerate freely', desc: "If the tone doesn't feel right, regenerate 2–3 times to find the perfect reply." },
  { icon: '📊', title: 'Check Insights weekly', desc: 'Spot trends and improvement areas to take action before they become problems.' },
];

/* ─────────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function ChevronIcon({ open }) {
  return (
    <svg
      className={`hc-faq-chevron${open ? ' hc-faq-chevron--open' : ''}`}
      viewBox="0 0 20 20" fill="none"
    >
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M8 5.5L18.5 12 8 18.5V5.5z" fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
      <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function HelpCenter() {
  const [search, setSearch]       = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [openFaq, setOpenFaq]     = useState(null);
  const [openStep, setOpenStep]   = useState(0); // first step open by default

  /* ── Filtered FAQs ── */
  const filteredFaqs = useMemo(() => {
    let list = FAQS;
    if (activeCat !== 'All') list = list.filter(f => f.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.q.toLowerCase().includes(q) ||
        (typeof f.a === 'string' && f.a.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, activeCat]);

  return (
    <div className="hc-page">
      <SEOMeta
        title="Help Center - ReviewPilot | Guides, FAQs & Support"
        description="Find answers to all your ReviewPilot questions. Quick start guide, FAQs, video tutorials, and direct support for Indian businesses managing Google reviews."
        keywords="ReviewPilot help, review management guide, FAQ, how to manage Google reviews, review reply tutorial India"
        ogTitle="ReviewPilot Help Center"
        ogDescription="Quick start guides, FAQs, and support for managing Google Business reviews with AI."
        ogUrl="https://reviewpilot.live/help-center"
        canonical="https://reviewpilot.live/help-center"
      />
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <div className="hc-hero">
        <div className="hc-hero-inner">
          <div className="hc-badge hc-afu">🎁 Annual plans — 2 months FREE!</div>
          <h1 className="hc-hero-title hc-afu hc-d1">Help Center</h1>
          <p className="hc-hero-sub hc-afu hc-d2">
            Everything you need to succeed with ReviewPilot — guides, FAQs, and video walkthroughs.
          </p>

          {/* Global search */}
          <div className="hc-search-wrap hc-afu hc-d3">
            <span className="hc-search-icon"><SearchIcon /></span>
            <input
              className="hc-search"
              type="text"
              placeholder="Search FAQs… e.g. 'sync', 'billing', 'language'"
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveCat('All'); }}
            />
            {search && (
              <button className="hc-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="hc-body">

        {/* ── Quick Tips strip ── */}
        <div className="hc-tips hc-afu hc-d1">
          {TIPS.map((t, i) => (
            <div className="hc-tip" key={i}>
              <div className="hc-tip-icon">{t.icon}</div>
              <div className="hc-tip-title">{t.title}</div>
              <div className="hc-tip-desc">{t.desc}</div>
            </div>
          ))}
        </div>

        {/* ── Quick Start Guide ── */}
        <div className="hc-section-label hc-afu hc-d2">📖 Quick Start Guide</div>
        <div className="hc-section hc-afu hc-d2">
          <div className="hc-section-header">
            <div className="hc-section-icon hc-section-icon--teal">📖</div>
            <div>
              <div className="hc-section-title">Get up and running in 5 steps</div>
              <div className="hc-section-desc">From signup to your first AI reply in under 10 minutes</div>
            </div>
          </div>

          <div className="hc-steps">
            {STEPS.map((step, i) => (
              <div
                className="hc-step"
                key={i}
                style={{ cursor: 'pointer' }}
                onClick={() => setOpenStep(openStep === i ? null : i)}
              >
                <div className="hc-step-num">{i + 1}</div>
                <div className="hc-step-body" style={{ flex: 1 }}>
                  <div className="hc-step-title">
                    {step.emoji} {step.title}
                    <span className="hc-step-time">⏱ {step.time}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--slatelt)', fontSize: 13 }}>
                      {openStep === i ? '▲' : '▼'}
                    </span>
                  </div>
                  {openStep === i && (
                    <div className="hc-step-content">{step.content}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Video Tutorial ── */}
        <div className="hc-section-label hc-afu hc-d3">🎥 Video Tutorial</div>
        <div className="hc-section hc-afu hc-d3">
          <div className="hc-section-header">
            <div className="hc-section-icon hc-section-icon--blue">🎥</div>
            <div>
              <div className="hc-section-title">Watch our 3-minute walkthrough</div>
              <div className="hc-section-desc">See ReviewPilot in action from signup to posting your first reply</div>
            </div>
          </div>
          <div className="hc-video-wrap">
            <div className="hc-video-placeholder">
              <button className="hc-video-play" disabled>
                <PlayIcon />
              </button>
              <div className="hc-video-label">Video tutorial coming soon</div>
              <div className="hc-video-sub">We're recording a 3-minute walkthrough for you</div>
            </div>
          </div>
        </div>

        {/* ── FAQs ── */}
        <div className="hc-section-label hc-afu hc-d4">❓ Frequently Asked Questions</div>
        <div className="hc-section hc-afu hc-d4">
          <div className="hc-section-header">
            <div className="hc-section-icon hc-section-icon--amber">❓</div>
            <div>
              <div className="hc-section-title">Frequently Asked Questions</div>
              <div className="hc-section-desc">{FAQS.length} questions answered — search or filter by category</div>
            </div>
          </div>

          {/* Category filters */}
          <div className="hc-faq-cats">
            {FAQ_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`hc-faq-cat${activeCat === cat ? ' hc-faq-cat--active' : ''}`}
                onClick={() => { setActiveCat(cat); setSearch(''); }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Result count when searching */}
          {(search || activeCat !== 'All') && (
            <div className="hc-faq-count">
              {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''}
              {search ? ` for "${search}"` : ''}
              {activeCat !== 'All' ? ` in ${activeCat}` : ''}
            </div>
          )}

          {/* FAQ items */}
          {filteredFaqs.length === 0 ? (
            <div className="hc-faq-empty">
              <span>🤔</span>
              No FAQs match your search. Try different keywords or{' '}
              <button
                style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                onClick={() => { setSearch(''); setActiveCat('All'); }}
              >
                clear filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq, i) => {
              const isOpen = openFaq === `${faq.category}-${i}`;
              return (
                <div className="hc-faq-item" key={i}>
                  <button
                    className="hc-faq-q"
                    onClick={() => setOpenFaq(isOpen ? null : `${faq.category}-${i}`)}
                  >
                    <span className="hc-faq-q-text">{faq.q}</span>
                    <ChevronIcon open={isOpen} />
                  </button>
                  <div className={`hc-faq-a${isOpen ? ' hc-faq-a--open' : ''}`}>
                    <div className="hc-faq-a-inner">{faq.a}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Contact CTA ── */}
        <div className="hc-section-label hc-afu hc-d5">💬 Still need help?</div>
        <div className="hc-contact hc-afu hc-d5">
          <div className="hc-contact-inner">
            <div className="hc-contact-text">
              <div className="hc-contact-title">We're here for you 🤝</div>
              <div className="hc-contact-sub">
                Can't find what you need? Our team responds within 1 business day.
                Beta users get priority support and free onboarding calls!
              </div>
            </div>
            <Link to="/contact" className="hc-contact-cta">
              Go to Contact Page <ArrowIcon />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
