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

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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

  /* ───────────────── FETCH PROFILE ───────────────── */

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
        try { await enableNetwork(db) } catch (_) {
          await new Promise(r => setTimeout(r, 1000))
        }
        try {
          await createUserDocIfMissing(firebaseUser)
          await fetchProfile(firebaseUser.uid)
        } catch (err) {
          console.error('[AuthContext] Firestore setup failed, retrying in 2s:', err.message)
          setTimeout(async () => {
            try {
              await enableNetwork(db)
              await createUserDocIfMissing(firebaseUser)
              await fetchProfile(firebaseUser.uid)
            } catch (e) {
              console.error('[AuthContext] Firestore retry failed:', e.message)
            }
          }, 2000)
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
    signup,
    login,
    logout,
    fetchProfile,
    isGoogleConnected: profile?.google?.connected ?? false,
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
