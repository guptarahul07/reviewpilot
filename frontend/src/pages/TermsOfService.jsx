// src/pages/TermsOfService.jsx

export default function TermsOfServicePage() {
  return (
    <div style={{ 
      maxWidth: 800, 
      margin: "0 auto", 
      padding: "40px 20px",
      lineHeight: 1.8,
      color: "#1f2937"
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 8, color: "#111827" }}>
        Terms of Service
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 32, fontSize: 14 }}>
        Last updated: {new Date().toLocaleDateString('en-IN')}
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          1. Agreement to Terms
        </h2>
        <p>
          By accessing or using ReviewPilot ("Service"), you agree to be bound by these Terms of Service. 
          If you disagree with any part of these terms, you may not access the Service.
        </p>
        <p style={{ marginTop: 12 }}>
          ReviewPilot is operated by Nishu Gupta, a company registered in India 
          ("we", "us", or "our").
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          2. Service Description
        </h2>
        <p>
          ReviewPilot provides an automated review management service that:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>Syncs customer reviews from your Google Business Profile</li>
          <li>Generates AI-powered reply suggestions using Claude AI</li>
          <li>Allows you to review, edit, and post replies</li>
          <li>Provides customer insights and analytics</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          <strong>Important:</strong> All AI-generated replies are suggestions that require 
          your explicit approval before posting to Google Business Profile. ReviewPilot 
          categorizes reviews as "Ready to Post" (positive reviews) or "Needs Attention" 
          (low ratings or mixed sentiment) to help you prioritize, but nothing is published 
          without you clicking "Confirm & Post."
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          3. Eligibility and Account Registration
        </h2>
        <p>
          You must be at least 18 years old and capable of forming a binding contract under 
          the Indian Contract Act, 1872 to use this Service.
        </p>
        <p style={{ marginTop: 12 }}>
          You agree to:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>Provide accurate and complete registration information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Notify us immediately of any unauthorized access</li>
          <li>Be responsible for all activities under your account</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          4. Google Business Profile Integration
        </h2>
        <p>
          To use ReviewPilot, you must connect your Google Business Profile. By doing so, you:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>Represent that you are authorized to manage the connected Google Business Profile</li>
          <li>Grant us permission to access your reviews and post replies on your behalf</li>
          <li>Acknowledge that we store encrypted access tokens to maintain this connection</li>
          <li>Agree to comply with Google's Terms of Service and API policies</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          We use and store Google user data in accordance with the{" "}
          <a 
            href="https://developers.google.com/terms/api-services-user-data-policy" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: "#0ea5a0" }}
          >
            Google API Services User Data Policy
          </a>, including the Limited Use requirements.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          5. User Responsibilities
        </h2>
        <p>You agree to:</p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>Review all AI-generated replies before posting them</li>
          <li>Ensure all posted replies comply with applicable laws and regulations</li>
          <li>Not use the Service for any unlawful or fraudulent purpose</li>
          <li>Not post defamatory, offensive, or inappropriate content</li>
          <li>Not attempt to reverse engineer or copy the Service</li>
          <li>Not use the Service to spam or harass customers</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          6. AI-Generated Content Disclaimer
        </h2>
        <p>
          <strong>Important Notice:</strong> ReviewPilot uses artificial intelligence (Claude AI by Anthropic) 
          to generate reply suggestions. While we strive for accuracy and appropriateness:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>AI-generated replies are <strong>suggestions only</strong></li>
          <li>You are solely responsible for reviewing, editing, and approving all replies</li>
          <li>We do not guarantee the accuracy, appropriateness, or effectiveness of AI suggestions</li>
          <li>You bear full responsibility for all content you post using our Service</li>
          <li>ReviewPilot categorizes reviews but does not automatically post any replies without your explicit confirmation</li>
          <li>The "Ready to Post" status indicates our AI considers the review safe for quick approval, but you remain in full control</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          7. Pricing and Payment (When Applicable)
        </h2>
        <p>
          During the beta phase, ReviewPilot is provided free of charge. When we transition to 
          paid plans:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>You will be notified at least 30 days in advance</li>
          <li>Beta users may receive special pricing or grandfathered rates</li>
          <li>Payments will be processed through Razorpay in Indian Rupees (₹)</li>
          <li>All prices are inclusive of applicable GST</li>
          <li>Refunds will be provided as per our Refund Policy</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          8. Intellectual Property Rights
        </h2>
        <p>
          The Service, including its design, features, and code, is owned by us and protected 
          under Indian intellectual property laws including:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>The Copyright Act, 1957</li>
          <li>The Trade Marks Act, 1999</li>
          <li>The Information Technology Act, 2000</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          You retain ownership of your review data and business information. By using the Service, 
          you grant us a limited license to process this data to provide our services.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          9. Data Protection and Privacy
        </h2>
        <p>
          We are committed to protecting your data in accordance with:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>The Information Technology Act, 2000</li>
          <li>The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
          <li>Digital Personal Data Protection Act, 2023 (when enforced)</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Please read our{" "}
          <a href="/privacy-policy" style={{ color: "#0ea5a0" }}>Privacy Policy</a> for 
          detailed information about how we collect, use, and protect your data.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          10. Limitation of Liability
        </h2>
        <p>
          To the maximum extent permitted by Indian law:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>The Service is provided "as is" without warranties of any kind</li>
          <li>We are not liable for any indirect, incidental, or consequential damages</li>
          <li>Our total liability shall not exceed the amount you paid us in the last 12 months</li>
          <li>We are not responsible for the content of reviews or your replies to them</li>
          <li>We are not liable for any downtime, data loss, or service interruptions</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          <strong>Note:</strong> This limitation does not affect any statutory rights you may 
          have as a consumer under Indian law.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          11. Indemnification
        </h2>
        <p>
          You agree to indemnify and hold us harmless from any claims, damages, or expenses 
          arising from:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>Your use of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any third-party rights</li>
          <li>Content you post using our Service</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          12. Term and Termination
        </h2>
        <p>
          These Terms remain in effect until terminated by either party.
        </p>
        <p style={{ marginTop: 12 }}>
          <strong>Your rights:</strong>
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>You may terminate your account at any time</li>
          <li>You may request deletion of all your data</li>
          <li>You may revoke Google Business Profile access</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          <strong>Our rights:</strong>
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>We may suspend or terminate accounts for Terms violations</li>
          <li>We may discontinue the Service with 30 days notice</li>
          <li>We may modify features or pricing with advance notice</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          13. Dispute Resolution and Governing Law
        </h2>
        <p>
          These Terms are governed by the laws of India. Any disputes shall be resolved as follows:
        </p>
        <ol style={{ marginTop: 12, marginLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>
            <strong>Informal Resolution:</strong> We encourage you to contact us first to 
            resolve any disputes informally
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Mediation:</strong> If informal resolution fails, we agree to attempt 
            mediation before pursuing legal action
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Jurisdiction:</strong> If legal action is necessary, courts in [Your City], 
            India shall have exclusive jurisdiction
          </li>
        </ol>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          14. Changes to Terms
        </h2>
        <p>
          We may update these Terms from time to time. We will:
        </p>
        <ul style={{ marginTop: 12, marginLeft: 20 }}>
          <li>Notify you of material changes via email or in-app notification</li>
          <li>Provide at least 30 days notice before changes take effect</li>
          <li>Update the "Last Updated" date at the top of this page</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Your continued use of the Service after changes constitute acceptance of the new Terms.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          15. Contact Information
        </h2>
        <p>
          For questions about these Terms, please contact us:
        </p>
        <div style={{ 
          marginTop: 16, 
          padding: 16, 
          background: "#f9fafb", 
          borderRadius: 8,
          border: "1px solid #e5e7eb"
        }}>
          <p><strong>Email:</strong> guptarahul07@gmail.com</p>
          <p style={{ marginTop: 8 }}><strong>Address:</strong> E-3, Second Floor, Mansarovar Park, Shahdara, Delhi 110032</p>
          <p style={{ marginTop: 8 }}><strong>Phone:</strong> 9810026181</p>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, color: "#111827" }}>
          16. Miscellaneous
        </h2>
        <p>
          <strong>Entire Agreement:</strong> These Terms constitute the entire agreement 
          between you and ReviewPilot.
        </p>
        <p style={{ marginTop: 12 }}>
          <strong>Severability:</strong> If any provision is found unenforceable, the remaining 
          provisions remain in effect.
        </p>
        <p style={{ marginTop: 12 }}>
          <strong>Waiver:</strong> Our failure to enforce any right does not constitute a waiver 
          of that right.
        </p>
        <p style={{ marginTop: 12 }}>
          <strong>Assignment:</strong> You may not assign these Terms without our written consent.
        </p>
      </section>

      <div style={{ 
        marginTop: 48, 
        padding: 20, 
        background: "#fef3c7", 
        borderRadius: 8,
        border: "1px solid #fbbf24"
      }}>
        <p style={{ margin: 0, color: "#92400e" }}>
          <strong>⚠️ Beta Version Notice:</strong> ReviewPilot is currently in beta. 
          Features may change, and occasional service interruptions may occur. We appreciate 
          your patience and feedback as we improve the product.
        </p>
      </div>
    </div>
  );
}
