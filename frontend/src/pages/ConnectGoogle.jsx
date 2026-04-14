// src/pages/ConnectGoogle.jsx
//
// OAuth flow:
//   1. User clicks "Connect Google Account"
//   2. Backend GET /auth/google/connect returns a Google OAuth URL
//   3. User is redirected there, approves scopes
//   4. Google redirects back to /auth/google/callback?code=…
//   5. Backend exchanges code, stores encrypted tokens
//   6. Frontend polls or catches the callback and shows the success card
//
// For local demo: simulated with a 1.8s loader then mock business data.
// Replace `handleConnect` and `useEffect` callback hook with real API calls.
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/* ──────────────────────────────────────────────────────────────────────────
   STYLES
────────────────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#0f1623; --navy2:#1e2a3a; --navyd:#080d14;
  --teal:#0ea5a0; --tealt:#14b8b3; --teald:rgba(14,165,160,.12);
  --tealg:rgba(14,165,160,.22);
  --slate:#4a5568; --slatelt:#718096;
  --white:#fff; --snow:#f7f8fa; --offwhite:#f0f2f5;
  --bdr:#e4e9f0; --bdrmid:#cbd5e1;
  --green:#10b981; --greend:rgba(16,185,129,.12);
  --red:#ef4444;
  --shsm:0 1px 3px rgba(15,22,35,.06);
  --shmd:0 4px 16px rgba(15,22,35,.09),0 2px 6px rgba(15,22,35,.05);
  --shlg:0 16px 48px rgba(15,22,35,.12),0 4px 14px rgba(15,22,35,.07);
  --shxl:0 24px 64px rgba(15,22,35,.16),0 6px 20px rgba(15,22,35,.08);
  --r:10px; --rl:16px; --rxl:24px;
}
body{
  font-family:'Figtree',sans-serif;
  -webkit-font-smoothing:antialiased;
  background:var(--offwhite);
  min-height:100vh;
}

/* ── Animations ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.55);opacity:0}}
@keyframes orbit{from{transform:rotate(0deg) translateX(52px) rotate(0deg)} to{transform:rotate(360deg) translateX(52px) rotate(-360deg)}}
@keyframes orbit2{from{transform:rotate(180deg) translateX(52px) rotate(-180deg)} to{transform:rotate(540deg) translateX(52px) rotate(-540deg)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes check-draw{from{stroke-dashoffset:56}to{stroke-dashoffset:0}}
@keyframes scale-in{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes slide-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes confetti-fall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(60px) rotate(720deg);opacity:0}}

.afu{animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both}
.afi{animation:fadeIn .4s ease both}
.d1{animation-delay:.07s}.d2{animation-delay:.14s}.d3{animation-delay:.21s}
.d4{animation-delay:.28s}.d5{animation-delay:.35s}.d6{animation-delay:.42s}

/* ── Top nav bar ── */
.top-nav{
  position:sticky;top:0;z-index:100;
  height:58px;
  background:rgba(255,255,255,.92);
  backdrop-filter:blur(12px);
  border-bottom:1px solid var(--bdr);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 32px;
}
.nav-brand{display:flex;align-items:center;gap:9px;font-weight:700;font-size:16px;color:var(--navy);text-decoration:none}
.nav-logo-box{width:30px;height:30px;background:var(--teal);border-radius:8px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nav-steps{display:flex;align-items:center;gap:6px}
.nav-step{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--slatelt)}
.nav-step.done{color:var(--green)}
.nav-step.active{color:var(--teal)}
.nav-step-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:10px;font-weight:700;border:1.5px solid var(--bdr);color:var(--slatelt)}
.nav-step.done .nav-step-dot{background:var(--green);border-color:var(--green);color:#fff}
.nav-step.active .nav-step-dot{background:var(--teal);border-color:var(--teal);color:#fff}
.nav-sep{width:24px;height:1px;background:var(--bdr)}
.nav-logout{font-size:13px;color:var(--slatelt);background:none;border:none;cursor:pointer;
  font-family:inherit;transition:color .14s}
.nav-logout:hover{color:var(--navy)}

/* ── Page shell ── */
.page-shell{
  min-height:calc(100vh - 58px);
  display:flex;align-items:center;justify-content:center;
  padding:48px 24px;
}

/* ── Connect card ── */
.connect-card{
  width:100%;max-width:480px;
  background:var(--white);
  border:1px solid var(--bdr);
  border-radius:var(--rxl);
  padding:48px 44px;
  box-shadow:var(--shlg);
  position:relative;overflow:hidden;
}
/* subtle teal top glow strip */
.connect-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,transparent,var(--teal),var(--tealt),transparent);
}
/* faint dot grid background */
.connect-card::after{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:radial-gradient(circle,rgba(14,165,160,.045) 1px,transparent 1px);
  background-size:20px 20px;
  mask-image:radial-gradient(ellipse 90% 80% at 50% 50%,#000 10%,transparent 75%);
  -webkit-mask-image:radial-gradient(ellipse 90% 80% at 50% 50%,#000 10%,transparent 75%);
}
.card-inner{position:relative;z-index:1}

/* ── PRE-CONNECT STATE ── */

/* connection illustration */
.conn-illustration{
  width:120px;height:120px;
  margin:0 auto 32px;
  position:relative;
  animation:float 4s ease-in-out infinite;
}
.conn-illustration .center-ring{
  position:absolute;inset:0;
  border-radius:50%;
  border:2px dashed rgba(14,165,160,.25);
  animation:spin 12s linear infinite;
}
.conn-illustration .inner-circle{
  position:absolute;inset:16px;
  border-radius:50%;
  background:linear-gradient(135deg,var(--teald),rgba(14,165,160,.06));
  border:1.5px solid rgba(14,165,160,.2);
  display:flex;align-items:center;justify-content:center;
}
/* orbiting Google dot */
.conn-illustration .orbit-dot{
  position:absolute;top:50%;left:50%;
  width:14px;height:14px;border-radius:50%;
  margin:-7px 0 0 -7px;
  background:#fff;
  box-shadow:0 2px 8px rgba(0,0,0,.15);
  display:flex;align-items:center;justify-content:center;
  animation:orbit 3.5s linear infinite;
}
.conn-illustration .orbit-dot2{
  position:absolute;top:50%;left:50%;
  width:10px;height:10px;border-radius:50%;
  margin:-5px 0 0 -5px;
  background:var(--teal);opacity:.7;
  animation:orbit2 5s linear infinite;
}
/* pulse ring behind center */
.pulse-bg{
  position:absolute;inset:28px;border-radius:50%;
  border:1.5px solid rgba(14,165,160,.3);
  animation:pulse-ring 2.2s ease-out infinite;
}
.pulse-bg2{
  position:absolute;inset:28px;border-radius:50%;
  border:1.5px solid rgba(14,165,160,.2);
  animation:pulse-ring 2.2s ease-out .8s infinite;
}

/* header text */
.card-eyebrow{
  font-size:11px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;
  color:var(--teal);margin-bottom:10px;text-align:center;
}
.card-title{
  font-family:'Instrument Serif',serif;
  font-size:30px;font-weight:400;line-height:1.18;letter-spacing:-.025em;
  color:var(--navy);margin-bottom:8px;text-align:center;
}
.card-sub{
  font-size:14px;color:var(--slatelt);text-align:center;
  line-height:1.6;margin-bottom:32px;
}

/* permission list */
.perms{
  background:var(--snow);border:1px solid var(--bdr);
  border-radius:var(--rl);padding:20px 22px;
  margin-bottom:28px;
}
.perms-label{
  font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--slatelt);margin-bottom:14px;
}
.perm-row{
  display:flex;align-items:center;gap:12px;
  padding:10px 0;
  border-bottom:1px solid var(--bdr);
}
.perm-row:last-child{border-bottom:none;padding-bottom:0}
.perm-row:first-of-type{padding-top:0}
.perm-icon{
  width:32px;height:32px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  background:var(--teald);border:1px solid rgba(14,165,160,.18);
  flex-shrink:0;color:var(--teal);
}
.perm-text{}
.perm-name{font-size:13.5px;font-weight:600;color:var(--navy);margin-bottom:1px}
.perm-desc{font-size:12px;color:var(--slatelt)}

/* security note */
.security-note{
  display:flex;align-items:flex-start;gap:9px;
  background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18);
  border-radius:var(--r);padding:11px 14px;margin-bottom:28px;
  font-size:12.5px;color:#065f46;line-height:1.5;
}
.security-note svg{flex-shrink:0;margin-top:1px}

/* connect button */
.google-btn{
  width:100%;padding:14px 20px;border-radius:var(--r);
  border:1.5px solid var(--bdr);background:var(--white);
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:11px;
  font-family:'Figtree',sans-serif;font-size:15px;font-weight:700;color:var(--navy);
  transition:all .2s cubic-bezier(.22,1,.36,1);
  position:relative;overflow:hidden;
  box-shadow:var(--shmd);
}
.google-btn:hover{
  border-color:var(--bdrmid);
  transform:translateY(-2px);
  box-shadow:var(--shlg);
}
.google-btn:active{transform:translateY(0);box-shadow:var(--shsm)}
.google-btn:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:none}
/* shimmer sweep on hover */
.google-btn::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(105deg,transparent 30%,rgba(14,165,160,.06) 50%,transparent 70%);
  background-size:200% 100%;background-position:-200% center;
  animation:shimmer 2.5s linear infinite;
}
.google-btn:disabled::after{display:none}

/* loading state in button */
.btn-spinner{width:16px;height:16px;border-radius:50%;border:2px solid rgba(15,22,35,.12);
  border-top-color:var(--teal);animation:spin .65s linear infinite;flex-shrink:0}

/* ── SUCCESS STATE ── */
.success-state{animation:slide-up .5s cubic-bezier(.22,1,.36,1) both}

/* confetti dots (pure CSS) */
.confetti-wrap{position:absolute;top:0;left:0;right:0;height:80px;overflow:hidden;pointer-events:none;z-index:2}
.c-dot{position:absolute;width:6px;height:6px;border-radius:2px;
  animation:confetti-fall .8s ease-out both;}
.c-dot:nth-child(1){left:15%;background:#0ea5a0;animation-delay:0s}
.c-dot:nth-child(2){left:30%;background:#f59e0b;animation-delay:.1s;border-radius:50%}
.c-dot:nth-child(3){left:45%;background:#10b981;animation-delay:.05s}
.c-dot:nth-child(4){left:60%;background:#3b82f6;animation-delay:.15s;border-radius:50%}
.c-dot:nth-child(5){left:75%;background:#0ea5a0;animation-delay:.08s}
.c-dot:nth-child(6){left:85%;background:#f59e0b;animation-delay:.18s}
.c-dot:nth-child(7){left:8%;background:#10b981;animation-delay:.12s;border-radius:50%}
.c-dot:nth-child(8){left:55%;background:#3b82f6;animation-delay:.03s}

/* success icon */
.success-icon{
  width:72px;height:72px;border-radius:50%;
  background:linear-gradient(135deg,var(--teal),#0891b2);
  display:flex;align-items:center;justify-content:center;
  margin:0 auto 24px;
  box-shadow:0 0 0 8px rgba(14,165,160,.1),0 0 0 16px rgba(14,165,160,.05);
  animation:scale-in .45s cubic-bezier(.22,1,.36,1) .1s both;
}
.check-svg{overflow:visible}
.check-path{
  stroke-dasharray:56;stroke-dashoffset:56;
  animation:check-draw .4s cubic-bezier(.22,1,.36,1) .4s forwards;
}

/* connected badge */
.connected-badge{
  display:inline-flex;align-items:center;gap:6px;
  background:var(--greend);border:1px solid rgba(16,185,129,.25);
  border-radius:100px;padding:4px 12px;
  font-size:12px;font-weight:700;color:var(--green);
  margin-bottom:16px;
}
.badge-dot{width:6px;height:6px;border-radius:50%;background:var(--green);
  box-shadow:0 0 0 0 rgba(16,185,129,.4);
  animation:pulse-ring 1.8s ease-out infinite}

/* business card */
.business-card{
  background:var(--snow);border:1.5px solid var(--bdr);
  border-radius:var(--rl);padding:20px 22px;
  margin:24px 0 28px;
  display:flex;align-items:center;gap:16px;
  text-align:left;
  animation:slide-up .45s cubic-bezier(.22,1,.36,1) .3s both;
}
.biz-avatar{
  width:48px;height:48px;border-radius:12px;
  background:linear-gradient(135deg,var(--teal),#0891b2);
  display:flex;align-items:center;justify-content:center;
  font-size:20px;font-weight:700;color:#fff;
  flex-shrink:0;letter-spacing:-.02em;
  box-shadow:0 4px 12px rgba(14,165,160,.3);
}
.biz-info{}
.biz-name{font-size:16px;font-weight:700;color:var(--navy);margin-bottom:3px;letter-spacing:-.015em}
.biz-address{font-size:12.5px;color:var(--slatelt);display:flex;align-items:center;gap:5px}
.biz-rating{display:flex;align-items:center;gap:5px;margin-top:5px}
.biz-stars{font-size:12px;color:#f59e0b;letter-spacing:.3px}
.biz-count{font-size:12px;color:var(--slatelt)}

/* scope badges */
.scope-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.scope-chip{font-size:11px;font-weight:600;padding:3px 9px;border-radius:100px;
  background:var(--teald);border:1px solid rgba(14,165,160,.2);color:var(--teal)}

/* continue button */
.continue-btn{
  width:100%;padding:14px 20px;border-radius:var(--r);
  font-family:'Figtree',sans-serif;font-size:15px;font-weight:700;
  color:#fff;background:var(--navy);border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;
  transition:all .2s cubic-bezier(.22,1,.36,1);
  position:relative;overflow:hidden;letter-spacing:.01em;
  animation:slide-up .45s cubic-bezier(.22,1,.36,1) .4s both;
}
.continue-btn:hover{background:var(--navy2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,22,35,.20)}
.continue-btn:active{transform:translateY(0)}
.continue-btn::after{
  content:'';position:absolute;top:0;left:-80%;width:55%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);
  transform:skewX(-18deg);transition:left .5s ease;
}
.continue-btn:hover::after{left:160%}

/* reconnect link */
.reconnect-link{
  font-size:13px;color:var(--slatelt);text-align:center;margin-top:14px;
  animation:slide-up .45s cubic-bezier(.22,1,.36,1) .5s both;
}
.reconnect-link button{background:none;border:none;cursor:pointer;
  font-family:inherit;font-size:inherit;color:var(--teal);font-weight:500;
  text-decoration:underline;text-underline-offset:2px;transition:color .14s}
.reconnect-link button:hover{color:var(--navy)}

/* error banner */
.error-banner{
  display:flex;align-items:flex-start;gap:9px;
  background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.18);
  border-radius:var(--r);padding:11px 14px;margin-bottom:18px;
  font-size:13px;color:#b91c1c;line-height:1.45;
}
.error-banner svg{flex-shrink:0;margin-top:1px}

/* step progress dots below card */
.step-dots{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:24px}
.step-dot-item{width:8px;height:8px;border-radius:50%;background:var(--bdrmid);transition:.3s}
.step-dot-item.done{background:var(--green)}
.step-dot-item.active{background:var(--teal);width:22px;border-radius:4px}

/* ── Responsive ── */
@media(max-width:540px){
  .connect-card{padding:36px 24px}
  .nav-steps{display:none}
  .card-title{font-size:26px}
}
`;

/* ──────────────────────────────────────────────────────────────────────────
   ICONS
────────────────────────────────────────────────────────────────────────── */
function GoogleColorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.41a4.63 4.63 0 01-2 3.04v2.52h3.24c1.9-1.75 3-4.33 3-7.35z" fill="#4285F4"/>
      <path d="M10 20c2.7 0 4.97-.9 6.63-2.42l-3.24-2.52c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H1.06v2.6A10 10 0 0010 20z" fill="#34A853"/>
      <path d="M4.4 11.9A6.02 6.02 0 014.08 10c0-.66.11-1.3.32-1.9V5.5H1.06A10 10 0 000 10c0 1.61.38 3.13 1.06 4.5l3.34-2.6z" fill="#FBBC05"/>
      <path d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.97.9 12.7 0 10 0A10 10 0 001.06 5.5l3.34 2.6C5.19 5.74 7.4 3.98 10 3.98z" fill="#EA4335"/>
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M2 10S5 4 10 4s8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H5l-3 3V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{flexShrink:0,marginTop:1}}>
      <path d="M10 2L3 5v5c0 4.1 3 7.9 7 9 4-1.1 7-4.9 7-9V5l-7-3z" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7 10l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5A4.5 4.5 0 018 10.5a4.5 4.5 0 010-9z" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M3.5 10.5c-.3.5-.5 1-.5 1.5 0 1.7 2.2 3 5 3s5-1.3 5-3c0-.5-.2-1-.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
function LogoMark({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white"/>
      <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.6"/>
      <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.6"/>
      <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white"/>
    </svg>
  );
}
function AlertCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{flexShrink:0}}>
      <circle cx="10" cy="10" r="8" stroke="#ef4444" strokeWidth="1.5"/>
      <path d="M10 6v4M10 14h.01" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────────────────── */
export default function ConnectGooglePage() {
  const { user, fetchProfile } = useAuth();
  console.log('👤 Current user:', user?.uid);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 'idle' | 'loading' | 'connected' | 'error'
  const [state, setState]       = useState("idle");
  const [business, setBusiness] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  /* ── Handle OAuth callback ──────────────────────────────────────────── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    
    if (error) {
      const errorMessages = {
        'auth_denied': 'You denied access to Google Business Profile',
        'connection_failed': 'Failed to connect. Please try again.',
        'missing_params': 'Invalid OAuth response',
        'rate_limit': 'Too many attempts. Please wait 1 minute and try again.'
      };
      
      setErrorMsg(errorMessages[error] || 'Connection failed');
      setState('error');
      
      // Clear URL params after showing error
      window.history.replaceState({}, '', '/connect');
      return;
    }
    
    if (connected === 'true') {
      console.log('✅ OAuth callback: connected=true');
      setState('loading');
      
      // Fetch user's updated profile
      if (user) {
        fetchProfile(user.uid)
          .then((profile) => {
            //console.log('✅ Profile fetched:', profile);
            
            // Set business data from profile
            setBusiness({
              name: profile?.settings?.businessName || 'Test Cafe (Pending API Sync)',
              address: profile?.businessAddress || 'Second Floor, E 3, East Ram Nagar, Mansarovar',
              rating: 0,
              reviews: 0,
              initials: getInitials(profile?.settings?.businessName || 'TC')
            });
            
            setState('connected');
            
            // Clear URL params
            window.history.replaceState({}, '', '/connect');
          })
          .catch(err => {
            console.error('❌ Failed to fetch profile:', err);
            
            // Even if profile fetch fails, show success with mock data
            setBusiness({
              name: 'Test Cafe (Pending API Sync)',
              address: 'Second Floor, E 3, East Ram Nagar, Mansarovar',
              rating: 0,
              reviews: 0,
              initials: 'TC'
            });
            
            setState('connected');
            window.history.replaceState({}, '', '/connect');
          });
      }
    }
  }, [user, fetchProfile]);

  /* ── Start OAuth flow ───────────────────────────────────────────────── */
  async function handleConnect() {
    setState("loading");
    setErrorMsg("");
    
    try {
      const token = await user.getIdToken();
      console.log('🔵 Calling backend OAuth endpoint...');
      // Get OAuth URL from backend
      const res = await fetch('${API_URL}/auth/google/connect', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔵 Backend response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get authorization URL');
      }
      
      const { url } = await res.json();
      console.log('🔵 Got OAuth URL, redirecting...');
      // Redirect user to Google OAuth
      window.location.href = url;
      
    } catch (err) {
      console.error('❌ OAuth error:', err);
      setErrorMsg(err.message || "Could not connect to Google");
      setState("error");
    }
  }

  /* ── Continue to dashboard ──────────────────────────────────────────── */
  function handleContinue() {
    navigate("/dashboard");
  }

  /* ── Reset (reconnect different account) ──────────────────────────── */
  function handleReconnect() {
    setState("idle");
    setBusiness(null);
    setErrorMsg("");
  }

  return (
    <>
      <style>{CSS}</style>

      {/* ── Top nav ── */}
      <nav className="top-nav">
        <a href="/" className="nav-brand">
          <div className="nav-logo-box"><LogoMark size={15} /></div>
          ReviewPilot
        </a>
        <div className="nav-steps">
          <div className="nav-step done">
            <div className="nav-step-dot">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            Account
          </div>
          <div className="nav-sep" />
          <div className={`nav-step ${state === "connected" ? "done" : "active"}`}>
            <div className="nav-step-dot">
              {state === "connected"
                ? <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : 2
              }
            </div>
            Connect
          </div>
          <div className="nav-sep" />
          <div className="nav-step">
            <div className="nav-step-dot">3</div>
            Dashboard
          </div>
        </div>
        <button className="nav-logout" onClick={() => navigate("/login")}>Sign out</button>
      </nav>

      {/* ── Page body ── */}
      <div className="page-shell">
        <div style={{width:"100%",maxWidth:480}}>
          <div className="connect-card">
            <div className="card-inner">

              {/* ═══════════════════════════════════
                  PRE-CONNECT + LOADING STATE
              ═══════════════════════════════════ */}
              {(state === "idle" || state === "loading" || state === "error") && (
                <>
                  {/* Illustration */}
                  <div className="conn-illustration afu">
                    <div className="pulse-bg" />
                    <div className="pulse-bg2" />
                    <div className="center-ring" />
                    <div className="inner-circle">
                      {state === "loading"
                        ? <div style={{width:24,height:24,borderRadius:"50%",border:"2.5px solid rgba(14,165,160,.25)",borderTopColor:"var(--teal)",animation:"spin .65s linear infinite"}} />
                        : <GoogleColorIcon />
                      }
                    </div>
                    <div className="orbit-dot">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <circle cx="4" cy="4" r="3" fill="var(--teal)" opacity=".7"/>
                      </svg>
                    </div>
                    <div className="orbit-dot2" />
                  </div>

                  {/* Heading */}
                  <p className="card-eyebrow afu d1">Step 2 of 3</p>
                  <h1 className="card-title afu d2">Connect Your Google Business</h1>
                  <p className="card-sub afu d3">
                    We'll ask Google to grant ReviewPilot read and reply access to your Business Profile.
                  </p>

                  {/* Permissions */}
                  <div className="perms afu d3">
                    <p className="perms-label">We need access to</p>

                    <div className="perm-row">
                      <div className="perm-icon"><EyeIcon /></div>
                      <div className="perm-text">
                        <div className="perm-name">View your reviews</div>
                        <div className="perm-desc">Read all public reviews on your Business Profile</div>
                      </div>
                    </div>

                    <div className="perm-row">
                      <div className="perm-icon"><MessageIcon /></div>
                      <div className="perm-text">
                        <div className="perm-name">Post replies</div>
                        <div className="perm-desc">Publish owner responses on your behalf</div>
                      </div>
                    </div>
                  </div>

                  {/* Security note */}
                  <div className="security-note afu d4">
                    <ShieldIcon />
                    <span>
                      Your Google credentials are never stored.
                      We use OAuth 2.0 — you can revoke access from your Google account at any time.
                    </span>
                  </div>

                  {/* Error banner */}
                  {state === "error" && (
                    <div className="error-banner afu">
                      <AlertCircleIcon />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* CTA button */}
                  <button
                    className="google-btn afu d5"
                    onClick={handleConnect}
                    disabled={state === "loading"}
                  >
                    {state === "loading" ? (
                      <><div className="btn-spinner" /> Connecting to Google…</>
                    ) : (
                      <><GoogleColorIcon /> Connect Google Account</>
                    )}
                  </button>
                </>
              )}

              {/* ═══════════════════════════════════
                  SUCCESS STATE
              ═══════════════════════════════════ */}
              {state === "connected" && business && (
                <div className="success-state">
                  {/* Confetti */}
                  <div className="confetti-wrap">
                    {[...Array(8)].map((_, i) => <div key={i} className="c-dot" />)}
                  </div>

                  {/* Check icon */}
                  <div className="success-icon">
                    <svg className="check-svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path
                        className="check-path"
                        d="M8 16l6 6 10-12"
                        stroke="white"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="56"
                        strokeDashoffset="56"
                        style={{animation:"check-draw .4s cubic-bezier(.22,1,.36,1) .4s forwards"}}
                      />
                    </svg>
                  </div>

                  {/* Connected badge */}
                  <div style={{textAlign:"center",marginBottom:6}}>
                    <span className="connected-badge">
                      <span className="badge-dot" />
                      Connected to Google
                    </span>
                  </div>

                  <h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:26,fontWeight:400,
                    letterSpacing:"-.02em",color:"var(--navy)",textAlign:"center",
                    lineHeight:1.2,marginBottom:6}}>
                    You're all set!
                  </h2>
                  <p style={{fontSize:14,color:"var(--slatelt)",textAlign:"center",lineHeight:1.6}}>
                    ReviewPilot is now linked to your Google Business Profile.
                  </p>

                  {/* Business details card */}
                  <div className="business-card">
                    <div className="biz-avatar">{business.initials}</div>
                    <div className="biz-info">
                      <div className="biz-name">{business.name}</div>
                      <div className="biz-address">
                        <PinIcon />
                        {business.address}
                      </div>
                      <div className="biz-rating">
                        <span className="biz-stars">
                          {"★".repeat(Math.round(business.rating))}{"☆".repeat(5 - Math.round(business.rating))}
                        </span>
                        <span className="biz-count">{business.rating} · {business.reviews} reviews</span>
                      </div>
                      <div className="scope-chips">
                        <span className="scope-chip">View reviews</span>
                        <span className="scope-chip">Post replies</span>
                      </div>
                    </div>
                  </div>

                  {/* Continue */}
                  <button className="continue-btn" onClick={handleContinue}>
                    Go to dashboard <ArrowIcon />
                  </button>

                  <p className="reconnect-link">
                    Wrong account?{" "}
                    <button onClick={handleReconnect}>Connect a different one</button>
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Step progress dots */}
          <div className="step-dots">
            <div className="step-dot-item done" title="Account created" />
            <div className={`step-dot-item ${state === "connected" ? "done" : "active"}`} title="Connect Google" />
            <div className="step-dot-item" title="Dashboard" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────────────────── */

/**
 * Exchange OAuth code for tokens via your backend.
 * Replace with a real fetch in production.
 *
 * @param {string|null} code - The code from Google's redirect
 * @returns {Promise<{name, address, rating, reviews, initials}>}
 */
async function exchangeCodeForTokens(code) {
  // Real implementation:
  // const res = await fetch("/auth/google/callback", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${await getIdToken()}`,
  //   },
  //   body: JSON.stringify({ code }),
  // });
  // if (!res.ok) throw new Error((await res.json()).error || "Failed to connect");
  // const { location } = await res.json();
  // return location;   // { name, address, rating, reviews, initials }

  // Simulated for demo:
  await new Promise(r => setTimeout(r, 1500));
  return {
    name:    "Bloom Café",
    address: "12 MG Road, Bengaluru, Karnataka 560001",
    rating:  4.8,
    reviews: 147,
    initials:"BC",
  };
}

// Add this helper function at the bottom of the file
function getInitials(name) {
  if (!name) return 'TC';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/*
 * ── ROUTE SETUP (add to your App.jsx) ────────────────────────────────────
 *
 * import ConnectGooglePage from "./pages/ConnectGoogle";
 *
 * <Route path="/connect"                element={<ProtectedRoute><ConnectGooglePage /></ProtectedRoute>} />
 * <Route path="/auth/google/callback"   element={<ProtectedRoute><ConnectGooglePage /></ProtectedRoute>} />
 *
 * ── BACKEND FLOW ──────────────────────────────────────────────────────────
 *
 * GET  /auth/google/connect
 *   → Returns { url: "https://accounts.google.com/o/oauth2/v2/auth?..." }
 *   → Client sets window.location.href = url
 *
 * GET  /auth/google/callback?code=...
 *   → Backend exchanges code for tokens
 *   → Stores encrypted refresh token in Firestore (users/{uid}.googleRefreshToken)
 *   → Fetches location name/address from Google My Business API
 *   → Redirects client to /connect?connected=1
 *
 * Required Google OAuth scopes:
 *   https://www.googleapis.com/auth/business.manage
 */