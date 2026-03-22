// src/pages/Login.jsx
import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "../services/firebase"


/* ─────────────────────────────────────────────────────────────────────────
   DESIGN: Split-panel – deep navy brand panel left, clean white form right.
   Typography: Instrument Serif (display) + Figtree (body).
   Matching the ReviewPilot design system exactly.
───────────────────────────────────────────────────────────────────────── */

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [shake, setShake]         = useState(false);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 420);
  }

  function mapError(code) {
    const MAP = {
      "auth/user-not-found":       "No account found with this email.",
      "auth/wrong-password":       "Incorrect password. Please try again.",
      "auth/invalid-credential":   "Invalid email or password.",
      "auth/invalid-email":        "Please enter a valid email address.",
      "auth/too-many-requests":    "Too many attempts. Please wait a moment.",
      "auth/network-request-failed":"Network error. Check your connection.",
      "auth/user-disabled":        "This account has been disabled.",
    };
    return MAP[code] ?? "Something went wrong. Please try again.";
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setResetSent(false);
    if (!email.trim()) { setError("Email is required."); triggerShake(); return; }
    if (!password)     { setError("Password is required."); triggerShake(); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(mapError(err.code));
      triggerShake();
    } finally { setLoading(false); }
  }

  async function handleForgotPassword() {
    setError(""); setResetSent(false);
    if (!email.trim()) { setError("Enter your email above, then click Forgot password."); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err) {
      setError(mapError(err.code));
    } finally { setResetLoading(false); }
  }
  
  async function handleGoogleLogin() {
  try {
    const res = await signInWithPopup(auth, googleProvider)

    const ref = doc(db, "users", res.user.uid)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: res.user.uid,
        email: res.user.email,
        name: res.user.displayName || "User",
        plan: "free",
        createdAt: serverTimestamp()
      })
    }

    navigate(redirectTo, { replace: true })
  } catch (err) {
    setError("Google sign-in failed. Please try again.")
  }
}



  return (
    <>
      <style>{STYLES}</style>
      <div className="auth-root">

        {/* ── Left brand panel ──────────────────────────── */}
        <BrandPanel />

        {/* ── Right form panel ──────────────────────────── */}
        <div className="panel-right">
          <div className="form-shell">

            <div className="mobile-logo">
              <LogoMark size={15} />
              ReviewPilot
            </div>

            <p className="eyebrow afu">Welcome back</p>
            <h1 className="form-title afu d1">Sign in to<br />your account</h1>
            <p className="form-sub afu d2">
              New here?{" "}
              <Link to="/signup" className="text-link">Create a free account</Link>
            </p>

            {/* Error / success banners */}
            {error && (
              <div className={`banner banner-error ${shake ? "shake" : ""} afu`}>
                <AlertCircleIcon /> <span>{error}</span>
              </div>
            )}
            {resetSent && (
              <div className="banner banner-success afu">
                <CheckCircleIcon /> <span>Reset link sent — check your inbox.</span>
              </div>
            )}

			<button
			  type="button"
			  className="cta-btn"
			  style={{ background: "#fff", color: "#0f1623", border: "1.5px solid #cbd5e1" }}
			  onClick={handleGoogleLogin}
			>
			  Continue with Google
			</button>

			<div className="divider">or</div>


			<form onSubmit={handleLogin} noValidate>


              {/* Email */}
              <Field
                label="Email address"
                error={error && !password ? error : ""}
                className="afu d2"
              >
                <FieldIcon><MailIcon /></FieldIcon>
                <input
                  className="field-input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  autoComplete="email"
                  autoFocus
                  onChange={e => { setEmail(e.target.value); setError(""); setResetSent(false); }}
                />
              </Field>

              {/* Password */}
              <Field
                label="Password"
                error={error && email ? error : ""}
                className="afu d3"
              >
                <FieldIcon><LockIcon /></FieldIcon>
                <input
                  className="field-input"
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPwd(s => !s)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showPwd} />
                </button>
              </Field>

              {/* Forgot + remember row */}
              <div className="field-row afu d3">
                <label className="remember">
                  <input type="checkbox" className="checkbox" />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-btn"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending…" : "Forgot password?"}
                </button>
              </div>

              <button type="submit" className="cta-btn afu d4" disabled={loading}>
                {loading
                  ? <><Spinner /> Signing in…</>
                  : <> Sign in <ArrowIcon /></>
                }
              </button>
            </form>

            <p className="terms afu d5">
              By signing in you agree to our{" "}
              <a href="#" className="terms-link">Terms</a> &amp;{" "}
              <a href="#" className="terms-link">Privacy Policy</a>.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────── */
function Field({ label, children, error, className = "" }) {
  return (
    <div className={`field ${error ? "field--err" : ""} ${className}`}>
      <label className="field-label">{label}</label>
      <div className="field-wrap">{children}</div>
      {error && <p className="field-error-msg">{error}</p>}
    </div>
  );
}
function FieldIcon({ children }) {
  return <span className="field-icon" aria-hidden="true">{children}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────
   SHARED BRAND PANEL  (used by both Login and Signup)
───────────────────────────────────────────────────────────────────────── */
export function BrandPanel() {
  return (
    <div className="panel-left">
      <span className="teal-bar" />

      <a href="/" className="brand-logo">
        <div className="brand-icon"><LogoMark size={18} /></div>
        ReviewPilot
      </a>

      <div className="panel-center">
        <p className="panel-eyebrow">Live dashboard preview</p>
        <div className="mockup">
          <div className="mockup-chrome">
            <span className="dot dot-r"/><span className="dot dot-y"/><span className="dot dot-g"/>
            <span className="mockup-url">app.reviewpilot.com/reviews</span>
          </div>
          <div className="mockup-body">
            <div className="mockup-hdr">
              <span className="mockup-ttl">Reviews Inbox</span>
              <span className="live-pill"><span className="live-dot"/>3 pending</span>
            </div>
            {[
              { i:"S", c:"#0ea5a0", n:"Sarah M.", s:"★★★★★", t:"Absolutely loved the experience!", st:"replied" },
              { i:"T", c:"#f59e0b", n:"Tom H.",   s:"★★★☆☆", t:"Good place, parking was tricky.",  st:"ai"     },
              { i:"P", c:"#8b5cf6", n:"Priya L.", s:"★★★★★", t:"Best in the neighbourhood!",       st:"pending"},
            ].map(r => (
              <div className="m-row" key={r.n}>
                <div className="m-av" style={{background:r.c}}>{r.i}</div>
                <div className="m-body">
                  <div className="m-top">
                    <div>
                      <div className="m-name">{r.n}</div>
                      <div className="m-stars">{r.s}</div>
                    </div>
                    <span className={`m-pill ${r.st}`}>
                      {r.st==="replied"?"✓ Replied":r.st==="ai"?"AI Ready":"Needs reply"}
                    </span>
                  </div>
                  <div className="m-text">{r.t}</div>
                </div>
              </div>
            ))}
            <div className="m-stats">
              {[["47","Reviews"],["4.8★","Rating"],["94%","Replied"]].map(([n,l])=>(
                <div key={l} className="m-stat">
                  <div className="m-stat-n">{n}</div>
                  <div className="m-stat-l">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel-quote">
        <p className="q-text">
          "ReviewPilot cut our reply time from 40 minutes to under 5.
          Our Google rating jumped from 4.2 to 4.8 in two months."
        </p>
        <div className="q-author">
          <div className="q-av">M</div>
          <div>
            <div className="q-name">Maria Santos</div>
            <div className="q-biz">Bloom Café, Mumbai</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────────────────── */
function MailIcon() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function LockIcon() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function EyeIcon({ off }) {
  return off
    ? <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 3l14 14M8.5 8.6A3 3 0 0011.4 11.5M5 6.1A9.5 9.5 0 002 10s3 6 8 6a8 8 0 003.9-1.1M8 4.1A8.5 8.5 0 0110 4c5 0 8 6 8 6a9.7 9.7 0 01-2.1 2.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    : <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M2 10S5 4 10 4s8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.4"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4"/></svg>;
}
function AlertCircleIcon() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{flexShrink:0}}><circle cx="10" cy="10" r="8" stroke="#ef4444" strokeWidth="1.5"/><path d="M10 6v4M10 14h.01" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function CheckCircleIcon() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{flexShrink:0}}><circle cx="10" cy="10" r="8" stroke="#10b981" strokeWidth="1.5"/><path d="M6.5 10l2.5 2.5L13.5 7" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ArrowIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}
function LogoMark({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.5" fill="white"/><rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.6"/><rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.6"/><rect x="9" y="9" width="5" height="5" rx="1.5" fill="white"/></svg>;
}

/* ─────────────────────────────────────────────────────────────────────────
   STYLES  (shared by Login + Signup via same CSS string)
───────────────────────────────────────────────────────────────────────── */
export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#0f1623; --navy2:#1e2a3a; --navyd:#080d14;
  --teal:#0ea5a0; --tealt:#14b8b3; --teald:rgba(14,165,160,.12);
  --slate:#4a5568; --slatelt:#718096;
  --white:#fff; --snow:#f7f8fa;
  --bdr:#e4e9f0; --bdrmid:#cbd5e1;
  --green:#10b981; --red:#ef4444;
  --shsm:0 1px 3px rgba(15,22,35,.06),0 1px 2px rgba(15,22,35,.04);
  --shmd:0 4px 16px rgba(15,22,35,.10),0 2px 6px rgba(15,22,35,.06);
  --shlg:0 14px 44px rgba(15,22,35,.14),0 4px 14px rgba(15,22,35,.08);
  --r:10px; --rl:16px;
}
body{font-family:'Figtree',sans-serif;-webkit-font-smoothing:antialiased}

/* ── animations ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes shimmer{0%{left:-80%}100%{left:160%}}

.afu{animation:fadeUp .48s cubic-bezier(.22,1,.36,1) both}
.shake{animation:shake .38s cubic-bezier(.36,.07,.19,.97)}
.d1{animation-delay:.06s} .d2{animation-delay:.13s} .d3{animation-delay:.20s}
.d4{animation-delay:.27s} .d5{animation-delay:.34s}

/* ── layout ── */
.auth-root{display:grid;grid-template-columns:1fr 1fr;min-height:100vh}

/* ── left panel ── */
.panel-left{
  background:var(--navyd);position:relative;overflow:hidden;
  display:flex;flex-direction:column;justify-content:space-between;
  padding:36px 44px;
}
.panel-left::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(ellipse 65% 55% at 25% 15%,rgba(14,165,160,.10) 0%,transparent 60%),
    radial-gradient(ellipse 55% 65% at 82% 82%,rgba(14,165,160,.07) 0%,transparent 60%);
}
.panel-left::after{
  content:'';position:absolute;inset:0;pointer-events:none;
  background-image:radial-gradient(circle,rgba(255,255,255,.055) 1px,transparent 1px);
  background-size:22px 22px;
  mask-image:radial-gradient(ellipse 85% 75% at 50% 45%,#000 15%,transparent 75%);
  -webkit-mask-image:radial-gradient(ellipse 85% 75% at 50% 45%,#000 15%,transparent 75%);
}
.teal-bar{position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent 0%,var(--teal) 40%,var(--tealt) 60%,transparent 100%)}

.brand-logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:17px;
  color:#fff;text-decoration:none;position:relative;z-index:1}
.brand-icon{width:34px;height:34px;background:var(--teal);border-radius:9px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 0 0 rgba(14,165,160,.5);flex-shrink:0}

/* mockup */
.panel-center{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;
  justify-content:center;padding:36px 0 28px}
.panel-eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;
  color:rgba(14,165,160,.75);margin-bottom:16px;display:flex;align-items:center;gap:8px}
.panel-eyebrow::after{content:'';flex:1;height:1px;background:rgba(14,165,160,.18)}

.mockup{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);
  border-radius:14px;overflow:hidden;box-shadow:0 20px 56px rgba(0,0,0,.45)}
.mockup-chrome{display:flex;align-items:center;gap:5px;padding:10px 14px;
  background:rgba(0,0,0,.25);border-bottom:1px solid rgba(255,255,255,.06)}
.dot{width:8px;height:8px;border-radius:50%}
.dot-r{background:#ff5f57}.dot-y{background:#ffbd2e}.dot-g{background:#28c840}
.mockup-url{margin-left:7px;font-size:10px;color:rgba(255,255,255,.3);font-family:monospace}
.mockup-body{padding:16px}
.mockup-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.mockup-ttl{font-size:12px;font-weight:700;color:rgba(255,255,255,.88)}
.live-pill{display:flex;align-items:center;gap:4px;font-size:9.5px;font-weight:700;
  color:var(--tealt);background:rgba(14,165,160,.12);border:1px solid rgba(14,165,160,.22);
  border-radius:100px;padding:2px 8px}
.live-dot{width:5px;height:5px;border-radius:50%;background:var(--tealt);
  animation:blink 1.6s ease-in-out infinite;flex-shrink:0}

.m-row{display:flex;align-items:flex-start;gap:9px;padding:10px;
  border-radius:8px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);
  margin-bottom:7px;transition:.2s}
.m-row:last-of-type{margin-bottom:0}
.m-row:hover{background:rgba(255,255,255,.05)}
.m-av{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0}
.m-body{flex:1;min-width:0}
.m-top{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:3px}
.m-name{font-size:11px;font-weight:600;color:rgba(255,255,255,.82)}
.m-stars{font-size:9.5px;color:#f59e0b;letter-spacing:.5px}
.m-text{font-size:10.5px;color:rgba(255,255,255,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-pill{font-size:9px;font-weight:700;padding:2px 6px;border-radius:100px;white-space:nowrap;flex-shrink:0}
.m-pill.replied{background:rgba(16,185,129,.12);color:#34d399;border:1px solid rgba(16,185,129,.2)}
.m-pill.ai{background:rgba(14,165,160,.12);color:var(--tealt);border:1px solid rgba(14,165,160,.2)}
.m-pill.pending{background:rgba(245,158,11,.1);color:#fbbf24;border:1px solid rgba(245,158,11,.2)}
.m-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;
  border-top:1px solid rgba(255,255,255,.06);margin-top:12px;padding-top:12px}
.m-stat{text-align:center}
.m-stat-n{font-size:14px;font-weight:700;color:#fff;letter-spacing:-.03em}
.m-stat-l{font-size:9px;color:rgba(255,255,255,.38);margin-top:1px}

/* quote */
.panel-quote{position:relative;z-index:1}
.q-text{font-family:'Instrument Serif',serif;font-style:italic;font-size:14px;
  color:rgba(255,255,255,.48);line-height:1.7;margin-bottom:14px}
.q-author{display:flex;align-items:center;gap:10px}
.q-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--teal),#3b82f6);
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
.q-name{font-size:13px;font-weight:600;color:rgba(255,255,255,.68)}
.q-biz{font-size:11px;color:rgba(255,255,255,.32)}

/* ── right panel ── */
.panel-right{background:var(--white);display:flex;align-items:center;justify-content:center;
  padding:40px 32px;position:relative;overflow-y:auto}
.form-shell{width:100%;max-width:376px}

/* mobile brand */
.mobile-logo{display:none;align-items:center;gap:8px;font-weight:700;font-size:15px;
  color:var(--navy);margin-bottom:32px;
  background:var(--teal);color:#fff;width:fit-content;
  padding:6px 14px 6px 8px;border-radius:100px}
.mobile-logo svg rect{} /* inherits white fill */

/* form header */
.eyebrow{font-size:11px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;
  color:var(--teal);margin-bottom:10px}
.form-title{font-family:'Figtree',sans-serif;font-size:32px;font-weight:700;
  line-height:1.2;letter-spacing:-.02em;color:var(--navy);margin-bottom:6px}
.form-sub{font-size:13.5px;color:var(--slatelt);margin-bottom:30px;line-height:1.55}
.text-link{color:var(--teal);font-weight:600;text-decoration:underline;
  text-underline-offset:2px;transition:color .14s}
.text-link:hover{color:var(--navy)}

/* banners */
.banner{display:flex;align-items:flex-start;gap:9px;border-radius:var(--r);
  padding:11px 14px;margin-bottom:18px;font-size:13px;line-height:1.45}
.banner-error{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.18);color:#b91c1c}
.banner-success{background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.22);color:#065f46}
.banner svg{flex-shrink:0;margin-top:1px}

/* field */
.field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.field-label{font-size:12.5px;font-weight:600;color:var(--slate);letter-spacing:.01em}
.field-wrap{position:relative}
.field-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);
  color:var(--slatelt);pointer-events:none;display:flex;align-items:center}
.field-input{width:100%;background:var(--snow);border:1.5px solid var(--bdr);
  border-radius:var(--r);color:var(--navy);
  padding:11px 14px 11px 37px;
  font-family:'Figtree',sans-serif;font-size:14.5px;
  outline:none;transition:border-color .15s,box-shadow .15s,background .15s}
.field-input::placeholder{color:var(--bdrmid)}
.field-input:hover{border-color:var(--bdrmid)}
.field-input:focus{border-color:var(--teal);background:var(--white);
  box-shadow:0 0 0 3px var(--teald)}
.field--err .field-input{border-color:var(--red);box-shadow:0 0 0 3px rgba(239,68,68,.10)}
.field-error-msg{font-size:11.5px;color:var(--red)}
.eye-btn{position:absolute;right:11px;top:50%;transform:translateY(-50%);
  background:none;border:none;cursor:pointer;color:var(--slatelt);
  display:flex;align-items:center;padding:4px;border-radius:5px;transition:color .14s}
.eye-btn:hover{color:var(--navy)}

/* field row */
.field-row{display:flex;align-items:center;justify-content:space-between;
  margin-bottom:22px}
.remember{display:flex;align-items:center;gap:7px;font-size:13px;
  color:var(--slatelt);cursor:pointer;user-select:none}
.checkbox{width:14px;height:14px;accent-color:var(--teal);cursor:pointer}
.text-btn{background:none;border:none;cursor:pointer;font-family:inherit;
  font-size:13px;font-weight:500;color:var(--teal);
  text-decoration:underline;text-underline-offset:2px;
  transition:color .14s;padding:0}
.text-btn:hover{color:var(--navy)}
.text-btn:disabled{opacity:.55;cursor:wait}

/* cta */
.cta-btn{width:100%;padding:13px 20px;border-radius:var(--r);
  font-family:'Figtree',sans-serif;font-size:15px;font-weight:700;
  color:#fff;background:var(--navy);border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;gap:8px;
  transition:all .2s cubic-bezier(.22,1,.36,1);
  position:relative;overflow:hidden;letter-spacing:.01em;margin-bottom:18px}
.cta-btn:not(:disabled):hover{background:var(--navy2);transform:translateY(-2px);
  box-shadow:0 8px 24px rgba(15,22,35,.20)}
.cta-btn:disabled{opacity:.58;cursor:not-allowed}
.cta-btn::after{content:'';position:absolute;top:0;left:-80%;width:55%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);
  transform:skewX(-18deg);transition:left .5s ease}
.cta-btn:not(:disabled):hover::after{left:160%}

/* password strength bar */
.pwd-bar-wrap{margin-top:6px}
.pwd-bar{height:3px;background:var(--bdr);border-radius:2px;overflow:hidden;margin-bottom:6px}
.pwd-fill{height:100%;border-radius:2px;transition:width .35s ease,background .35s ease}
.pwd-meta{display:flex;align-items:center;justify-content:space-between}
.pwd-chips{display:flex;flex-wrap:wrap;gap:4px}
.pwd-chip{font-size:10.5px;padding:2px 7px;border-radius:100px;
  border:1px solid var(--bdr);color:var(--slatelt);
  display:flex;align-items:center;gap:3px;transition:.2s}
.pwd-chip.met{background:rgba(16,185,129,.07);border-color:rgba(16,185,129,.22);color:var(--green)}
.pwd-level{font-size:11px;font-weight:600;white-space:nowrap;margin-left:8px}

/* spinner */
.spinner{display:inline-block;width:15px;height:15px;border-radius:50%;
  border:2px solid rgba(255,255,255,.28);border-top-color:#fff;
  animation:spin .65s linear infinite;flex-shrink:0}

/* terms */
.terms{font-size:11.5px;color:var(--bdrmid);line-height:1.6;text-align:center;margin-top:6px}
.terms-link{color:var(--slatelt);text-decoration:underline;text-underline-offset:2px;transition:color .14s}
.terms-link:hover{color:var(--navy)}

/* divider */
.divider{display:flex;align-items:center;gap:12px;font-size:12px;
  color:var(--bdrmid);margin:18px 0}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--bdr)}

/* sign-in steps (signup panel) */
.steps-wrap{flex:1;display:flex;flex-direction:column;justify-content:center;
  position:relative;z-index:1;padding:32px 0 24px}
.steps-title{font-family:'Instrument Serif',serif;font-size:26px;font-weight:400;
  color:#fff;line-height:1.25;letter-spacing:-.02em;margin-bottom:6px}
.steps-title em{font-style:italic;color:var(--tealt)}
.steps-sub{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:32px;line-height:1.6}
.steps{display:flex;flex-direction:column;gap:0}
.step{display:flex;align-items:flex-start;gap:14px;padding:15px 0;
  border-bottom:1px solid rgba(255,255,255,.06)}
.step:last-child{border-bottom:none}
.step-num{width:30px;height:30px;border-radius:50%;flex-shrink:0;margin-top:2px;
  display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;
  transition:.3s}
.step-num.active{background:var(--teal);color:#fff;box-shadow:0 0 14px rgba(14,165,160,.45)}
.step-num.upcoming{background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.12);
  color:rgba(255,255,255,.3)}
.step-info{}
.step-name{font-size:13px;font-weight:600;color:rgba(255,255,255,.82);margin-bottom:2px}
.step-desc{font-size:11.5px;color:rgba(255,255,255,.38);line-height:1.5}
.perks{position:relative;z-index:1}
.perk{display:flex;align-items:center;gap:8px;font-size:12.5px;
  color:rgba(255,255,255,.42);margin-bottom:8px}
.perk:last-child{margin-bottom:0}
.perk-dot{width:4px;height:4px;border-radius:50%;background:var(--teal);flex-shrink:0}

/* ── responsive ── */
@media(max-width:820px){
  .auth-root{grid-template-columns:1fr}
  .panel-left{display:none}
  .panel-right{align-items:flex-start;padding:56px 24px 40px}
  .mobile-logo{display:flex}
  .form-sub{margin-bottom:24px}
}
`;
