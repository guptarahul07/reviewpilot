1. Folder Structure
A clean monorepo split into frontend/ (Vite+React → Vercel) and backend/ (Express → Render), each self-contained with their own package.json and .env. Key structure inside each:
Frontend: pages/ for routes, components/ (layout / reviews / ui), hooks/, services/ (axios + Firebase SDK), context/AuthContext, and router/ProtectedRoute.
Backend: routes/ → controllers/ → services/ layering, with dedicated service files for googleBusiness.js, claude.js, firestore.js, and tokenEncryption.js.

2. Database Schema (Firestore)
Three collections, all scoped under users/{uid}:

users/{uid} — profile, plan, encrypted Google OAuth tokens (accessToken, refreshToken), and reply settings (businessName, replyTone).
users/{uid}/reviews/{reviewId} — mirrored Google review with status: pending|replied|skipped and a nested reply object holding both the AI-generated draft and the final posted text.
users/{uid}/usage/{monthYear} — monthly counters for plan enforcement (replies generated, reviews fetched). Write-only by Admin SDK — users can read, never write.


3. API Routes (/api/v1)
GroupKey RoutesAuthPOST /auth/verify, POST /auth/google/connect, DELETE /auth/google/disconnectReviewsGET /reviews (paginated from Firestore), POST /reviews/sync (pull from Google), GET /reviews/:idRepliesPOST /replies/generate (Claude draft), POST /replies/post (push to Google + update DB)SettingsGET /settings, PUT /settings
All routes except /auth/verify require Authorization: Bearer <firebase_id_token>.

4. Auth Flow
Email/Password: Firebase SDK on frontend → ID token stored in React state only (never localStorage) → attached as Bearer token on every backend call → firebase-admin.auth().verifyIdToken() middleware validates it.
Google OAuth: Frontend redirects to Google consent → Google posts code to backend callback → backend exchanges for access/refresh tokens → AES-256-GCM encrypts both tokens → stored in Firestore. On subsequent calls, backend decrypts and auto-refreshes if expired.
Route protection: <ProtectedRoute> wraps all dashboard pages; uses onAuthStateChanged to gate rendering.

5. Security Best Practices

No tokens in localStorage — ID tokens in memory only; OAuth tokens AES-256 encrypted in Firestore.
Claude API key is server-side only — never exposed to frontend.
Helmet.js for HTTP security headers, CORS whitelisted to Vercel domain only.
Rate limiting — express-rate-limit on all routes.
Firestore rules — users can only access users/{their-uid}/**; usage subcollection is backend write-only.
Input validation — zod schemas on all request bodies.
Firebase App Check (reCAPTCHA v3) to block non-app API traffic.
max_tokens: 300 on Claude calls to cap cost exposure.