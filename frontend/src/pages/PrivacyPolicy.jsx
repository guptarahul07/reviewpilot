// src/pages/PrivacyPolicy.jsx

export default function PrivacyPolicyPage() {
  return (
    <div style={{ 
      maxWidth: 800, 
      margin: "0 auto", 
      padding: "40px 20px",
      lineHeight: 1.8,
      color: "#1f2937"
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 8, color: "#111827" }}>
        Privacy Policy
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 32, fontSize: 14 }}>
        Last updated: {new Date().toLocaleDateString('en-IN')}
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          1. Introduction
        </h2>
        <p>
          ReviewPilot ("we", "us", or "our") is committed to protecting your privacy and 
          personal data. This Privacy Policy explains how we collect, use, store, and protect 
          your information in compliance with:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>The Information Technology Act, 2000</li>
          <li>The Information Technology (Reasonable Security Practices and Procedures and 
              Sensitive Personal Data or Information) Rules, 2011</li>
          <li>Digital Personal Data Protection Act, 2023</li>
          <li>Google API Services User Data Policy</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          By using ReviewPilot, you consent to the data practices described in this policy.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          2. Information We Collect
        </h2>
        
        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          2.1 Information You Provide
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li><strong>Account Information:</strong> Name, email address, phone number (optional)</li>
          <li><strong>Business Information:</strong> Business name, address, category</li>
          <li><strong>Payment Information:</strong> Billing details (when paid plans launch) - 
              processed securely through Razorpay, not stored by us</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          2.2 Information from Google Business Profile
        </h3>
        <p>When you connect your Google Business Profile, we collect:</p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>Customer reviews (reviewer name, rating, review text, date)</li>
          <li>Your business name and location</li>
          <li>OAuth access tokens (encrypted) to maintain connection</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          <strong>Important:</strong> We only access data necessary to provide our service and 
          comply with Google's{" "}
          <a 
            href="https://developers.google.com/terms/api-services-user-data-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: "#0ea5a0" }}
          >
            Limited Use Requirements
          </a>.
        </p>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          2.3 Automatically Collected Information
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
          <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
          <li><strong>Analytics:</strong> We use Firebase Analytics to improve our service</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          2.4 Sensitive Personal Data
        </h3>
        <p>
          We do <strong>NOT</strong> collect sensitive personal data as defined under Indian law, 
          including:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>Passwords (stored as encrypted hashes only)</li>
          <li>Financial information (credit card, bank account)</li>
          <li>Physical, physiological, or mental health condition</li>
          <li>Sexual orientation</li>
          <li>Medical records or history</li>
          <li>Biometric information</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          3. How We Use Your Information
        </h2>
        <p>We use your information for the following purposes:</p>
        
        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          3.1 To Provide Our Service
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li>Sync and display your customer reviews</li>
          <li>Generate AI-powered reply suggestions using Claude AI (Anthropic)</li>
          <li>Post your approved replies to Google Business Profile</li>
          <li>Provide customer insights and analytics</li>
          <li>Maintain your account and preferences</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          3.2 To Improve Our Service
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li>Analyze usage patterns to improve features</li>
          <li>Monitor service performance and fix bugs</li>
          <li>Develop new features based on user needs</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          3.3 To Communicate With You
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li>Send important service updates and notifications</li>
          <li>Respond to your support requests</li>
          <li>Send promotional emails (only with your consent, you can opt-out anytime)</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          3.4 Legal and Security
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li>Comply with legal obligations</li>
          <li>Protect against fraud and abuse</li>
          <li>Enforce our Terms of Service</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          4. How We Share Your Information
        </h2>
        <p>
          We do <strong>NOT</strong> sell your personal data to third parties. We only share 
          your information in the following limited circumstances:
        </p>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          4.1 Service Providers
        </h3>
        <p>We share data with trusted third-party service providers who help us operate:</p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li><strong>Google (Google Business API):</strong> To sync reviews and post replies</li>
          <li><strong>Anthropic (Claude AI):</strong> To generate reply suggestions - they do 
              NOT store or train on your data</li>
          <li><strong>Firebase (Google):</strong> Database, authentication, and analytics</li>
          <li><strong>Railway:</strong> Server hosting in Mumbai, India</li>
          <li><strong>Vercel:</strong> Frontend hosting with Indian edge nodes</li>
          <li><strong>Razorpay (future):</strong> Payment processing - PCI DSS compliant</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          All service providers are contractually obligated to protect your data and use it 
          only for the purposes we specify.
        </p>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          4.2 Legal Requirements
        </h3>
        <p>We may disclose your information if required by:</p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>Indian law or legal process</li>
          <li>Government or regulatory authorities</li>
          <li>Court orders or subpoenas</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          4.3 Business Transfers
        </h3>
        <p>
          If ReviewPilot is acquired or merged, your information may be transferred to the 
          new entity. You will be notified of any such change.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          5. Data Security
        </h2>
        <p>
          We implement industry-standard security measures to protect your data:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li><strong>Encryption:</strong> All data in transit uses HTTPS/TLS encryption</li>
          <li><strong>Token Storage:</strong> OAuth tokens encrypted using AES-256-GCM</li>
          <li><strong>Authentication:</strong> Firebase Authentication with secure password hashing</li>
          <li><strong>Access Controls:</strong> Role-based access, least privilege principle</li>
          <li><strong>Regular Backups:</strong> Automated daily backups of your data</li>
          <li><strong>Monitoring:</strong> 24/7 security monitoring and logging</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          <strong>Note:</strong> While we use best practices to protect your data, no method 
          of transmission or storage is 100% secure. You are responsible for maintaining the 
          confidentiality of your account credentials.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          6. Data Retention
        </h2>
        <p>We retain your data as follows:</p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
          <li><strong>Deleted Accounts:</strong> Data deleted within 30 days of account deletion</li>
          <li><strong>Legal Requirements:</strong> Some data may be retained longer if required 
              by law (e.g., GST records for 6 years)</li>
          <li><strong>Analytics:</strong> Anonymized analytics data may be retained indefinitely</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          You can request immediate deletion of your data at any time by contacting us.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          7. Your Rights Under Indian Law
        </h2>
        <p>
          Under the Digital Personal Data Protection Act, 2023 and IT Rules, 2011, you have 
          the following rights:
        </p>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          7.1 Access and Portability
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li>Request a copy of all personal data we hold about you</li>
          <li>Export your data in a machine-readable format</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          7.2 Correction
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li>Update incorrect or incomplete personal information</li>
          <li>Correct any inaccuracies in your account details</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          7.3 Deletion (Right to be Forgotten)
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li>Request deletion of your personal data</li>
          <li>Close your account permanently</li>
          <li>Revoke consent for data processing</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          7.4 Withdrawal of Consent
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li>Withdraw consent for marketing communications</li>
          <li>Disconnect Google Business Profile integration</li>
          <li>Opt-out of analytics tracking</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          7.5 Grievance Redressal
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li>File complaints about data privacy violations</li>
          <li>Contact our Grievance Officer (details below)</li>
        </ul>

        <p style={{ marginTop: 16 }}>
          To exercise any of these rights, contact us at <strong>privacy@reviewpilot.live</strong>. 
          We will respond within 30 days.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          8. Google API Services User Data Policy Compliance
        </h2>
        <p>
          ReviewPilot's use and transfer of information received from Google APIs adheres to the{" "}
          <a 
            href="https://developers.google.com/terms/api-services-user-data-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: "#0ea5a0" }}
          >
            Google API Services User Data Policy
          </a>, including the Limited Use requirements.
        </p>
        <p style={{ marginTop: 12 }}>
          Specifically:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>We only request access to Google Business Profile data necessary for our service</li>
          <li>We do NOT use Google user data for serving advertisements</li>
          <li>We do NOT sell Google user data to third parties</li>
          <li>We do NOT use Google user data for creditworthiness or lending purposes</li>
          <li>Google user data is encrypted in transit and at rest</li>
          <li>You can revoke our access to your Google data at any time via{" "}
              <a 
                href="https://myaccount.google.com/permissions" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: "#0ea5a0" }}
              >
                Google Account Permissions
              </a>
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          9. Cookies and Tracking Technologies
        </h2>
        <p>We use the following cookies and tracking technologies:</p>
        
        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          9.1 Essential Cookies
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li><strong>Authentication:</strong> To keep you logged in</li>
          <li><strong>Security:</strong> To prevent fraud and protect your account</li>
        </ul>

        <h3 style={{ fontSize: 18, marginTop: 24, marginBottom: 12, color: "#374151" }}>
          9.2 Analytics Cookies
        </h3>
        <ul style={{ marginLeft: 20 }}>
          <li><strong>Firebase Analytics:</strong> To understand how you use our service</li>
          <li>You can opt-out of analytics in your account settings</li>
        </ul>

        <p style={{ marginTop: 16 }}>
          Most browsers allow you to control cookies through settings. However, disabling 
          essential cookies may affect service functionality.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          10. Third-Party Links
        </h2>
        <p>
          Our service may contain links to third-party websites (e.g., Google Business Profile). 
          We are not responsible for the privacy practices of these sites. Please review their 
          privacy policies separately.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          11. Children's Privacy
        </h2>
        <p>
          ReviewPilot is not intended for individuals under 18 years of age. We do not knowingly 
          collect personal data from children. If you believe we have collected data from a 
          child, please contact us immediately.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          12. International Data Transfers
        </h2>
        <p>
          Your data is primarily stored on servers located in India (Railway Mumbai, Firebase). 
          However, some service providers (Anthropic for AI processing) may process data outside 
          India. We ensure adequate safeguards are in place for such transfers.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          13. Changes to This Privacy Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. We will:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>Notify you of material changes via email</li>
          <li>Update the "Last Updated" date at the top</li>
          <li>Provide at least 30 days notice before changes take effect</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Your continued use after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          14. Grievance Officer
        </h2>
        <p>
          In accordance with the Information Technology Act, 2000 and Digital Personal Data 
          Protection Act, 2023, we have appointed a Grievance Officer to address privacy concerns:
        </p>
        <div style={{ 
          marginTop: 16, 
          padding: 16, 
          background: "#f9fafb", 
          borderRadius: 8,
          border: "1px solid #e5e7eb"
        }}>
          <p><strong>Name:</strong> [Grievance Officer Name]</p>
          <p style={{ marginTop: 8 }}><strong>Email:</strong> grievance@reviewpilot.live</p>
          <p style={{ marginTop: 8 }}><strong>Phone:</strong> [Contact Number]</p>
          <p style={{ marginTop: 8 }}><strong>Address:</strong> [Registered Office Address]</p>
          <p style={{ marginTop: 8 }}><strong>Response Time:</strong> Within 30 days of receiving complaint</p>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          15. Contact Us
        </h2>
        <p>
          For any questions about this Privacy Policy or our data practices:
        </p>
        <div style={{ 
          marginTop: 16, 
          padding: 16, 
          background: "#f9fafb", 
          borderRadius: 8,
          border: "1px solid #e5e7eb"
        }}>
          <p><strong>Email:</strong> privacy@reviewpilot.live</p>
          <p style={{ marginTop: 8 }}><strong>Support:</strong> support@reviewpilot.live</p>
          <p style={{ marginTop: 8 }}><strong>Address:</strong> [Your Registered Business Address]</p>
        </div>
      </section>

      <div style={{ 
        marginTop: 48, 
        padding: 20, 
        background: "#dbeafe", 
        borderRadius: 8,
        border: "1px solid #3b82f6"
      }}>
        <p style={{ margin: 0, color: "#1e40af" }}>
          <strong>🔒 Your Privacy Matters:</strong> We are committed to transparency and 
          protecting your data. If you have any concerns about how we handle your information, 
          please don't hesitate to contact us. Your trust is our priority.
        </p>
      </div>
    </div>
  );
}
