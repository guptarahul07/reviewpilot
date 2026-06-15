// backend/services/emailService.js
// Email service using Resend
// Handles all transactional emails for ReviewPilot

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'ReviewPilot <noreply@reviewpilot.live>';
const SUPPORT_EMAIL = 'support@reviewpilot.live';
const APP_URL = 'https://reviewpilot.live';

// ─────────────────────────────────────────────
// Base send function with error handling
// Email failures should never crash the app
// ─────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html
    });
    console.log(`✅ [Email] Sent "${subject}" to ${to}`);
    return result;
  } catch (err) {
    console.error(`❌ [Email] Failed to send "${subject}" to ${to}:`, err.message);
    // Don't throw — email failures are non-critical
    return null;
  }
}

// ─────────────────────────────────────────────
// T1 — Welcome email (on signup / trial activation)
// ─────────────────────────────────────────────
export async function sendWelcomeEmail({ to, name, trialDays, isBetaUser }) {
  const subject = `Welcome to ReviewPilot, ${name}! 🎉`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #0a84ff;">Welcome to ReviewPilot! 🎉</h2>
      <p>Hi ${name},</p>
      <p>You've started your <strong>${trialDays}-day free trial</strong>${isBetaUser ? ' — as one of our first users, you get extra time on us!' : ''}.</p>
      
      <p><strong>Your next step:</strong></p>
      <p>Connect your Google Business or Play Store account to start managing reviews.</p>
      
      <a href="${APP_URL}/connect" style="display:inline-block;background:#0a84ff;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Connect Now →</a>
      
      <p style="margin-top:24px;"><strong>What you can do:</strong></p>
      <ul>
        <li>View all your reviews in one inbox</li>
        <li>Generate AI replies in seconds</li>
        <li>Track your response rate</li>
        <li>Analyse sentiment and keywords</li>
      </ul>
      
      <p>Need help? Reply to this email or WhatsApp us: <a href="https://wa.me/919810026181">+919810026181</a></p>
      
      <p style="margin-top:32px;">— Rahul, Founder ReviewPilot</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="font-size:12px;color:#999;">ReviewPilot · <a href="${APP_URL}/privacy" style="color:#999;">Privacy Policy</a> · <a href="${APP_URL}/terms" style="color:#999;">Terms of Service</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// ─────────────────────────────────────────────
// T2 — Platform connected confirmation
// ─────────────────────────────────────────────
export async function sendPlatformConnectedEmail({ to, name, platform }) {
  const platformName = platform === 'gbp' ? 'Google Business Profile' : 'Google Play Console';
  const subject = `✅ ${platformName} connected!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #22c55e;">✅ ${platformName} Connected!</h2>
      <p>Hi ${name},</p>
      <p>Your <strong>${platformName}</strong> is now connected. Your reviews are syncing and will appear in your inbox shortly.</p>
      
      <a href="${APP_URL}/reviews" style="display:inline-block;background:#0a84ff;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Open ReviewPilot →</a>
      
      <p style="margin-top:24px;font-size:12px;color:#999;">ReviewPilot · <a href="${APP_URL}" style="color:#999;">reviewpilot.live</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// ─────────────────────────────────────────────
// T3 — Token disconnected / expired
// ─────────────────────────────────────────────
export async function sendTokenExpiredEmail({ to, name, platform }) {
  const platformName = platform === 'gbp' ? 'Google Business Profile' : 'Google Play Console';
  const subject = `⚠️ Action needed — reconnect your ${platformName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #f59e0b;">⚠️ Reconnection Required</h2>
      <p>Hi ${name},</p>
      <p>Your <strong>${platformName}</strong> connection has expired and needs to be reconnected.</p>
      <p>Until reconnected, new reviews won't sync to your inbox.</p>
      
      <a href="${APP_URL}/connect" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Reconnect Now →</a>
      
      <p style="margin-top:24px;">If you need help: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
      <p style="font-size:12px;color:#999;margin-top:24px;">ReviewPilot · <a href="${APP_URL}" style="color:#999;">reviewpilot.live</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// ─────────────────────────────────────────────
// T4 — Trial half over (Day 7)
// ─────────────────────────────────────────────
export async function sendTrialHalfOverEmail({ to, name, daysLeft, reviewsSynced, repliesGenerated, responseRate }) {
  const subject = `Your ReviewPilot trial is halfway through`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #0a84ff;">Your Trial is Halfway Through</h2>
      <p>Hi ${name},</p>
      <p>You have <strong>${daysLeft} days left</strong> in your free trial.</p>
      
      <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-weight:bold;">So far:</p>
        <ul style="margin:8px 0;">
          <li>${reviewsSynced} reviews synced</li>
          <li>${repliesGenerated} AI replies generated</li>
          <li>Your response rate: ${responseRate}%</li>
        </ul>
      </div>
      
      <p>Continue with a paid plan from <strong>₹499/month</strong>.</p>
      
      <a href="${APP_URL}/pricing" style="display:inline-block;background:#0a84ff;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">See Plans →</a>
      
      <p style="font-size:12px;color:#999;margin-top:24px;">ReviewPilot · <a href="${APP_URL}" style="color:#999;">reviewpilot.live</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// ─────────────────────────────────────────────
// T5 — Trial ending tomorrow (Day 13/14)
// ─────────────────────────────────────────────
export async function sendTrialEndingSoonEmail({ to, name }) {
  const subject = `⏰ Your trial ends tomorrow`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #ef4444;">⏰ Your Trial Ends Tomorrow</h2>
      <p>Hi ${name},</p>
      <p>Your free trial ends tomorrow. Don't lose access to your review inbox.</p>
      <p>Upgrade today from <strong>₹499/month</strong> — no setup fee.</p>
      
      <a href="${APP_URL}/pricing" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Upgrade Now →</a>
      
      <p style="margin-top:24px;">Questions? Reply to this email — we respond within 2 hours.</p>
      <p style="font-size:12px;color:#999;margin-top:24px;">ReviewPilot · <a href="${APP_URL}" style="color:#999;">reviewpilot.live</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// ─────────────────────────────────────────────
// T6 — Trial expired
// ─────────────────────────────────────────────
export async function sendTrialExpiredEmail({ to, name }) {
  const subject = `Your ReviewPilot trial has ended`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #6b7280;">Your Trial Has Ended</h2>
      <p>Hi ${name},</p>
      <p>Your trial has ended. Your account is paused — your data is safe for 30 days.</p>
      <p>Resume anytime from <strong>₹499/month</strong>.</p>
      
      <a href="${APP_URL}/pricing" style="display:inline-block;background:#0a84ff;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Reactivate Account →</a>
      
      <p style="margin-top:24px;">Not ready to upgrade? Reply and tell us why — we'd love your feedback.</p>
      <p style="font-size:12px;color:#999;margin-top:24px;">ReviewPilot · <a href="${APP_URL}" style="color:#999;">reviewpilot.live</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// ─────────────────────────────────────────────
// T7 — Payment failed (triggered by Razorpay webhook)
// ─────────────────────────────────────────────
export async function sendPaymentFailedEmail({ to, name, amount, planName }) {
  const subject = `⚠️ Payment failed — action required`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #ef4444;">⚠️ Payment Failed</h2>
      <p>Hi ${name},</p>
      <p>Your payment of <strong>₹${(amount / 100).toLocaleString('en-IN')}</strong> for <strong>${planName}</strong> failed.</p>
      <p>Please update your payment method to avoid service interruption.</p>
      
      <a href="${APP_URL}/billing" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Update Payment Method →</a>
      
      <p style="margin-top:24px;">We'll retry in 3 days. If you need help, reply to this email.</p>
      <p style="font-size:12px;color:#999;margin-top:24px;">ReviewPilot · <a href="${APP_URL}" style="color:#999;">reviewpilot.live</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// ─────────────────────────────────────────────
// T8 — Payment success (triggered by Razorpay webhook)
// ─────────────────────────────────────────────
export async function sendPaymentSuccessEmail({ to, name, amount, planName, nextBillingDate }) {
  const subject = `Payment confirmed — ₹${(amount / 100).toLocaleString('en-IN')}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #22c55e;">✅ Payment Confirmed</h2>
      <p>Hi ${name},</p>
      <p>Payment of <strong>₹${(amount / 100).toLocaleString('en-IN')}</strong> received for <strong>${planName}</strong>.</p>
      <p>Next billing: <strong>${nextBillingDate}</strong></p>
      
      <div style="margin:16px 0;">
        <a href="${APP_URL}/billing" style="display:inline-block;background:#f3f4f6;color:#333;padding:10px 20px;border-radius:6px;text-decoration:none;margin-right:8px;">View Invoice →</a>
        <a href="${APP_URL}/reviews" style="display:inline-block;background:#0a84ff;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Go to Dashboard →</a>
      </div>
      
      <p style="font-size:12px;color:#999;margin-top:24px;">ReviewPilot · <a href="${APP_URL}" style="color:#999;">reviewpilot.live</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// ─────────────────────────────────────────────
// T9 — InsightPilot waitlist confirmation
// ─────────────────────────────────────────────
export async function sendWaitlistConfirmationEmail({ to }) {
  const subject = `You're on the InsightPilot waitlist! 📊`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #0a84ff;">You're on the Waitlist! 📊</h2>
      <p>You're on the list! We'll notify you the moment InsightPilot launches.</p>
      
      <p><strong>InsightPilot will show you:</strong></p>
      <ul>
        <li>Zomato/Swiggy review analysis</li>
        <li>Competitor comparison</li>
        <li>Menu item performance insights</li>
      </ul>
      
      <p>While you wait, try ReviewPilot free for 15 days:</p>
      <a href="${APP_URL}" style="display:inline-block;background:#0a84ff;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Start Free Trial →</a>
      
      <p style="font-size:12px;color:#999;margin-top:24px;">ReviewPilot · <a href="${APP_URL}" style="color:#999;">reviewpilot.live</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// ─────────────────────────────────────────────
// Data deletion warning (Day 30 after trial expired)
// ─────────────────────────────────────────────
export async function sendDataDeletionWarningEmail({ to, name, deletionDate }) {
  const subject = `⚠️ Your ReviewPilot data will be deleted on ${deletionDate}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #ef4444;">⚠️ Data Deletion Warning</h2>
      <p>Hi ${name},</p>
      <p>Your ReviewPilot account has been inactive. Your data (reviews, replies, settings) will be permanently deleted on <strong>${deletionDate}</strong>.</p>
      <p>Reactivate your account to keep your data.</p>
      
      <a href="${APP_URL}/pricing" style="display:inline-block;background:#0a84ff;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Reactivate Account →</a>
      
      <p style="margin-top:24px;font-size:12px;color:#999;">If you don't want to reactivate, no action needed — your data will be automatically deleted. ReviewPilot · <a href="${APP_URL}" style="color:#999;">reviewpilot.live</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
