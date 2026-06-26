import { createContext, useContext, useEffect, useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp, enableNetwork } from "firebase/firestore"
import { auth, db } from "../services/firebase"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [subscription, setSubscription] = useState(null) // trial/plan status

  /* ───────────────── SIGNUP ───────────────── */

  async function signup(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)

    await updateProfile(cred.user, { displayName })

    await createUserDocIfMissing(cred.user)

    return cred
  }

  /* ───────────────── LOGIN ───────────────── */

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  /* ───────────────── LOGOUT ───────────────── */

  async function logout() {
    setProfile(null)
    await signOut(auth)
  }

  /* ───────────────── CREATE USER DOC ───────────────── */

 async function createUserDocIfMissing(firebaseUser) {

  const ref = doc(db, "users", firebaseUser.uid)
  const snap = await getDoc(ref)

  /* ───────── CREATE USER IF NOT EXISTS ───────── */

  if (!snap.exists()) {

    await setDoc(ref, {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || "",
      plan: "free",

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      google: {
        connected: false
      },

      settings: {
        businessName: "Your Business",
        replyTone: "friendly",
        autoReply: true   // default for semi-automated MVP
      }
    })

  }

  /* ───────── ENSURE SETTINGS EXIST (for older users) ───────── */

  else {

    const data = snap.data()

    if (!data.settings) {

      await setDoc(ref, {
        settings: {
          businessName: "Your Business",
          replyTone: "friendly",
          autoReply: true
        }
      }, { merge: true })

    }

  }

  return ref
}

  /* ───────────────── FETCH SUBSCRIPTION STATUS ───────────────── */

  async function fetchSubscription(firebaseUser) {
    try {
      const token = await firebaseUser.getIdToken()
      const res   = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/billing/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
        return data
      }
    } catch { /* non-blocking */ }
    return null
  }

  /* ───────────────── FETCH PROFILE FROM API ───────────────── */
  // Primary source — Railway API (works even when Firestore offline)
  async function fetchProfileFromAPI(firebaseUser) {
    try {
      const token = await firebaseUser.getIdToken()
      const res   = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        // Merge settings + profile fields into a unified profile object
        const merged = {
          ...(data.profile  || {}),
          ...(data.user     || {}),
          settings: data.settings || {},
          google:   data.google   || {},
          plan:     data.plan     || data.subscription?.plan || 'free',
          // Map common fields
          name:         data.profile?.displayName || data.user?.displayName || '',
          displayName:  data.profile?.displayName || data.user?.displayName || '',
          phone:        data.profile?.phone        || data.user?.phone       || '',
          city:         data.profile?.city         || data.user?.city        || '',
          state:        data.profile?.state        || data.user?.state       || '',
          businessType: data.profile?.businessType || data.user?.businessType || '',
        }
        setProfile(merged)
        return merged
      }
    } catch { /* non-blocking */ }
    return null
  }

  /* ───────────────── FETCH PROFILE (Firestore fallback) ───────────────── */

  async function fetchProfile(uid) {
    try {
      const snap = await getDoc(doc(db, "users", uid))
      if (snap.exists()) {
        const data = snap.data()
        setProfile(data)
        return data
      } else {
        setProfile(null)
        return null
      }
    } catch (err) {
      if (err.message?.includes('offline') || err.code === 'unavailable') {
        // Retry once after a short delay
        try {
          await enableNetwork(db)
          await new Promise(r => setTimeout(r, 600))
          const snap = await getDoc(doc(db, "users", uid))
          if (snap.exists()) {
            const data = snap.data()
            setProfile(data)
            return data
          }
        } catch (retryErr) {
          console.error("Profile fetch retry failed:", retryErr)
        }
      } else {
        console.error("Profile fetch failed:", err)
      }
      setProfile(null)
      return null
    }
  }

  /* ───────────────── AUTH LISTENER ───────────────── */

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {

      // Set user and release loading immediately — never block navigation on Firestore
      setUser(firebaseUser)

      if (!firebaseUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      // User is authenticated — release loading NOW so ProtectedRoute lets them through
      setLoading(false)

      // Handle Firestore in background — won't block login
      const setupFirestore = async () => {
        // Retry loop — attempt up to 5 times with increasing delays
        const delays = [1000, 2000, 4000, 6000, 8000]
        for (let i = 0; i < delays.length; i++) {
          try {
            await enableNetwork(db)
            await new Promise(r => setTimeout(r, 500)) // small settle time
            await createUserDocIfMissing(firebaseUser)
            // Try API first — faster and works offline from Firestore
            const apiProfile = await fetchProfileFromAPI(firebaseUser)
            if (!apiProfile) {
              // Fallback to Firestore only if API fails
              await fetchProfile(firebaseUser.uid)
            }
            fetchSubscription(firebaseUser) // non-blocking
            return // success — stop retrying
          } catch (err) {
            if (i < delays.length - 1) {
              await new Promise(r => setTimeout(r, delays[i]))
            } else {
              console.error('[AuthContext] Firestore setup failed after all retries:', err.message)
            }
          }
        }
      }

      setupFirestore()

    })

    return unsub
  }, [])

  /* ───────────────── CONTEXT VALUE ───────────────── */

  const value = {
    user,
    profile,
    loading,
    subscription,
    signup,
    login,
    logout,
    fetchProfile,
    fetchProfileFromAPI,
    fetchSubscription,
    // Check google connection from both Firestore profile and API profile
    isGoogleConnected: profile?.google?.connected === true,
    // Helpers derived from subscription
    isTrialActive: subscription?.status === 'trial',
    isExpired:     subscription?.status === 'expired' || subscription?.requiresUpgrade === true,
    trialDaysLeft: subscription?.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt) - Date.now()) / 86400000))
      : null,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

/* ───────────────── HOOK ───────────────── */

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
