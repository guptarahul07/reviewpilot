import { createContext, useContext, useEffect, useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  getRedirectResult,
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

    // Process Google OAuth redirect result first
    // Must run inside AuthProvider so Firebase SDK is fully initialised
    getRedirectResult(auth)
      .then(async (result) => {
        console.log('[AuthContext] getRedirectResult:', result ? 'GOT USER — ' + result.user.email : 'null (normal load)')
        if (!result) return
        // onAuthStateChanged will fire automatically with the user
        // Firestore profile creation handled there
      })
      .catch((err) => {
        console.error('[AuthContext] getRedirectResult error:', err)
      })

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {

      console.log('[AuthContext] onAuthStateChanged fired — user:', firebaseUser?.email ?? 'null')

      try {
        setUser(firebaseUser)

        if (firebaseUser) {
          console.log('[AuthContext] User found, enabling network...')
          try {
            await enableNetwork(db)
            console.log('[AuthContext] Network enabled')
          } catch (_) {
            console.log('[AuthContext] enableNetwork failed, waiting 800ms...')
            await new Promise(r => setTimeout(r, 800))
          }

          console.log('[AuthContext] Calling createUserDocIfMissing...')
          await createUserDocIfMissing(firebaseUser)
          console.log('[AuthContext] Calling fetchProfile...')
          await fetchProfile(firebaseUser.uid)
          console.log('[AuthContext] Done — setting loading=false')
        } else {
          console.log('[AuthContext] No user — setting loading=false')
          setProfile(null)
        }

      } catch (err) {
        console.error('[AuthContext] Auth init error:', err)
      } finally {
        setLoading(false)
      }

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
