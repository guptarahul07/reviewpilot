import { useNavigate } from "react-router-dom"

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={styles.page}>

      {/* NAVBAR */}
      <header style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.logo}>ReviewPilot</div>

          <div style={styles.navActions}>
            <button style={styles.linkBtn} onClick={() => navigate("/login")}>
              Sign In
            </button>

            <button style={styles.primaryBtn} onClick={() => navigate("/signup")}>
              Start Free
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main style={styles.hero}>
        <h1 style={styles.title}>
          Reply to every Google review in seconds
        </h1>

        <p style={styles.subtitle}>
          Connect your Google Business Profile, generate AI replies,
          and publish them with one click.
        </p>

        <div style={styles.ctaRow}>
          <button style={styles.primaryBtnLarge} onClick={() => navigate("/signup")}>
            Start Free Trial
          </button>

          <button style={styles.secondaryBtnLarge} onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>

        {/* STEPS */}
        <div style={styles.steps}>
          <div>1. Connect Google Business</div>
          <div>2. Generate AI reply</div>
          <div>3. Approve & publish</div>
        </div>
      </main>

    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
    background: "#ffffff",
    color: "#0f172a"
  },

  nav: {
    borderBottom: "1px solid #e5e7eb",
    padding: "14px 24px"
  },

  navInner: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  logo: {
    fontSize: "20px",
    fontWeight: "700"
  },

  navActions: {
    display: "flex",
    gap: "12px"
  },

  linkBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px"
  },

  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
  },

  hero: {
    maxWidth: "700px",
    margin: "120px auto 0",
    textAlign: "center",
    padding: "0 20px"
  },

  title: {
    fontSize: "42px",
    fontWeight: "700",
    lineHeight: "1.2"
  },

  subtitle: {
    fontSize: "18px",
    color: "#475569",
    marginTop: "16px"
  },

  ctaRow: {
    marginTop: "32px",
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    flexWrap: "wrap"
  },

  primaryBtnLarge: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "14px 24px",
    borderRadius: "8px",
    fontSize: "15px",
    cursor: "pointer"
  },

  secondaryBtnLarge: {
    background: "#f1f5f9",
    border: "1px solid #cbd5f5",
    padding: "14px 24px",
    borderRadius: "8px",
    fontSize: "15px",
    cursor: "pointer"
  },

  steps: {
    marginTop: "48px",
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    color: "#334155",
    fontSize: "14px"
  }
}
