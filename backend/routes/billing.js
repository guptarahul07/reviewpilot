import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../firebaseAdmin.js';
import admin from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { validateCoupon, markCouponUsed } from './coupons.js';

const router = express.Router();

// ─────────────────────────────────────────────
// Razorpay client
// ─────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ─────────────────────────────────────────────
// Plan config — prices in paise (INR * 100)
// Full plan config lives in config/plans.js
// Below is billing-specific shorthand for Razorpay
// ─────────────────────────────────────────────
export const PLANS = {
  starter: {
    monthly: { amount: 49900, period: 'monthly', interval: 1 },
    annual:  { amount: 479000, period: 'yearly', interval: 1 }
  },
  growth: {
    monthly: { amount: 99900, period: 'monthly', interval: 1 },
    annual:  { amount: 899100, period: 'yearly', interval: 1 }
  },
  professional: {
    monthly: { amount: 199900, period: 'monthly', interval: 1 },
    annual:  { amount: 1679200, period: 'yearly', interval: 1 }
  }
};

const BETA_USER_LIMIT = 50;
const BETA_TRIAL_DAYS = 60;
const DEFAULT_TRIAL_DAYS = 15;

// ─────────────────────────────────────────────
// Helper: get trial days for this user
// First 50 users get 60 days, rest get 15
// ─────────────────────────────────────────────
async function getTrialDays() {
  const snapshot = await db.collection('users').get();
  const totalUsers = snapshot.size;
  console.log(`[billing] Total users: ${totalUsers}`);
  return totalUsers <= BETA_USER_LIMIT ? BETA_TRIAL_DAYS : DEFAULT_TRIAL_DAYS;
}

// ─────────────────────────────────────────────
// Helper: calculate trial end date
// ─────────────────────────────────────────────
function getTrialEndDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// ─────────────────────────────────────────────
// POST /api/billing/activate-trial
// Called when user clicks "Start Free Trial" or "Connect Google Business"
// ─────────────────────────────────────────────
router.post('/activate-trial', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`⏳ [POST /api/billing/activate-trial] User: ${uid}`);

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const subscription = userDoc.data()?.subscription;

    // Already has a subscription of any kind
    if (subscription) {
      const status = subscription.status;

      // Trial already active
      if (status === 'trial') {
        const trialEnd = subscription.trialEndsAt?.toDate
          ? subscription.trialEndsAt.toDate()
          : new Date(subscription.trialEndsAt);

        if (new Date() < trialEnd) {
          console.log(`[activate-trial] Trial already active for user: ${uid}`);
          return res.json({
            success: true,
            alreadyActivated: true,
            trialActive: true,
            trialEndsAt: subscription.trialEndsAt,
            trialDays: subscription.trialDays,
            isBetaUser: subscription.isBetaUser || false
          });
        } else {
          // Trial expired
          console.log(`[activate-trial] Trial expired for user: ${uid}`);
          return res.json({
            success: false,
            alreadyActivated: true,
            trialActive: false,
            trialExpired: true,
            message: 'Your free trial has ended. Please select a plan to continue.'
          });
        }
      }

      // Already on paid plan
      if (status === 'active') {
        return res.json({
          success: true,
          alreadyActivated: true,
          trialActive: false,
          paidPlan: true,
          plan: subscription.plan
        });
      }

      // Cancelled or expired paid plan
      return res.json({
        success: false,
        alreadyActivated: true,
        trialActive: false,
        trialExpired: true,
        message: 'Your free trial has ended. Please select a plan to continue.'
      });
    }

    // First time — activate trial
    const trialDays = await getTrialDays();
    const trialEndsAt = getTrialEndDate(trialDays);
    const isBetaUser = trialDays === BETA_TRIAL_DAYS;

    await db.collection('users').doc(uid).set({
      subscription: {
        plan: 'trial',
        status: 'trial',
        trialDays,
        trialEndsAt,
        isBetaUser,
        cancelAtPeriodEnd: false,
        createdAt: new Date()
      }
    }, { merge: true });

    console.log(`✅ [activate-trial] Trial activated for user: ${uid} — ${trialDays} days (beta: ${isBetaUser})`);


    // Send welcome email
    try {
      const userDoc2 = await db.collection('users').doc(uid).get();
      const userData2 = userDoc2.data() || {};
      if (userData2.email) {
        const { sendWelcomeEmail } = await import('../services/emailService.js');
        const name = userData2.profile?.displayName || userData2.displayName || 'there';
        await sendWelcomeEmail({ to: userData2.email, name, trialDays, isBetaUser });
      }
    } catch (emailErr) {
      console.warn('[activate-trial] Welcome email failed:', emailErr.message);
    }

    res.json({
      success: true,
      alreadyActivated: false,
      trialActive: true,
      trialDays,
      trialEndsAt,
      isBetaUser,
      message: isBetaUser
        ? `🎉 Welcome! You get ${trialDays} days free as one of our first users!`
        : `Your ${trialDays} day free trial has started!`
    });

  } catch (err) {
    console.error('❌ [activate-trial] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to activate trial' });
  }
});

// ─────────────────────────────────────────────
// POST /api/billing/create-subscription
// ─────────────────────────────────────────────
router.post('/create-subscription', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  const { plan, billingCycle, couponCode } = req.body;

  console.log(`💳 [POST /api/billing/create-subscription] User: ${uid}, Plan: ${plan}, Cycle: ${billingCycle}`);

  // Validate inputs
  if (!plan || !PLANS[plan]) {
    return res.status(400).json({ success: false, error: 'Invalid plan. Must be: starter, growth, or professional' });
  }

  if (!billingCycle || !['monthly', 'annual'].includes(billingCycle)) {
    return res.status(400).json({ success: false, error: 'Invalid billingCycle. Must be: monthly or annual' });
  }

  try {
    const planConfig = PLANS[plan][billingCycle];
    let finalAmount = planConfig.amount;
    let appliedCoupon = null;

    // Apply coupon if provided
    if (couponCode) {
      const couponResult = await validateCoupon(
        couponCode,
        plan,
        billingCycle,
        planConfig.amount
      );

      if (!couponResult.valid) {
        return res.status(400).json({ success: false, error: couponResult.error });
      }

      finalAmount = couponResult.finalPrice;
      appliedCoupon = couponCode.toUpperCase();
      console.log(`🎟️ Coupon applied: ${appliedCoupon}, discount: ₹${couponResult.discount / 100}`);
    }

    // Get trial days
    const trialDays = await getTrialDays();
    const trialEndsAt = getTrialEndDate(trialDays);

    console.log(`⏳ Trial period: ${trialDays} days (ends: ${trialEndsAt.toDateString()})`);

    // Create Razorpay subscription plan (dynamic)
    const razorpayPlan = await razorpay.plans.create({
      period: planConfig.period,
      interval: planConfig.interval,
      item: {
        name: `ReviewPilot ${plan.charAt(0).toUpperCase() + plan.slice(1)} - ${billingCycle}`,
        amount: finalAmount,
        currency: 'INR',
        description: `ReviewPilot ${plan} plan - ${billingCycle} billing`
      }
    });

    console.log(`✅ Razorpay plan created: ${razorpayPlan.id}`);

    // Create Razorpay subscription with trial
    const razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlan.id,
      total_count: billingCycle === 'annual' ? 12 : 120, // max billing cycles
      quantity: 1,
      start_at: Math.floor(trialEndsAt.getTime() / 1000), // start after trial
      notes: {
        uid,
        plan,
        billingCycle,
        couponCode: appliedCoupon || ''
      }
    });

    console.log(`✅ Razorpay subscription created: ${razorpaySubscription.id}`);

    // Save pending subscription to Firestore
    await db.collection('users').doc(uid).set({
      subscription: {
        plan,
        billingCycle,
        status: 'trial',
        razorpaySubscriptionId: razorpaySubscription.id,
        razorpayPlanId: razorpayPlan.id,
        trialEndsAt,
        trialDays,
        isBetaUser: trialDays === BETA_TRIAL_DAYS,
        cancelAtPeriodEnd: false,
        appliedCoupon: appliedCoupon || null,
        lockedInPrice: finalAmount,
        createdAt: new Date()
      }
    }, { merge: true });

    console.log(`✅ Subscription saved to Firestore for user: ${uid}`);

    // Mark coupon as used
    if (appliedCoupon) {
      await markCouponUsed(appliedCoupon);
    }

    res.json({
      success: true,
      subscriptionId: razorpaySubscription.id,
      trialDays,
      trialEndsAt,
      isBetaUser: trialDays === BETA_TRIAL_DAYS,
      keyId: process.env.RAZORPAY_KEY_ID // frontend needs this for checkout
    });

  } catch (err) {
    console.error('❌ [create-subscription] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create subscription' });
  }
});

// ─────────────────────────────────────────────
// POST /api/billing/apply-coupon
// Validate coupon and return pricing breakdown
// ─────────────────────────────────────────────
router.post('/apply-coupon', verifyFirebaseToken, async (req, res) => {
  const { couponCode, plan, billingCycle } = req.body;

  console.log(`🎟️ [POST /api/billing/apply-coupon] Code: ${couponCode}, Plan: ${plan}, Cycle: ${billingCycle}`);

  if (!couponCode || !plan || !billingCycle) {
    return res.status(400).json({ success: false, error: 'Missing couponCode, plan, or billingCycle' });
  }

  if (!PLANS[plan]) {
    return res.status(400).json({ success: false, error: 'Invalid plan' });
  }

  if (!['monthly', 'annual'].includes(billingCycle)) {
    return res.status(400).json({ success: false, error: 'Invalid billingCycle' });
  }

  try {
    const basePrice = PLANS[plan][billingCycle].amount;
    const result = await validateCoupon(couponCode, plan, billingCycle, basePrice);

    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, ...result });

  } catch (err) {
    console.error('❌ [apply-coupon] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
});

// ─────────────────────────────────────────────
// GET /api/billing/subscription-status
// ─────────────────────────────────────────────
router.get('/subscription-status', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`📊 [GET /api/billing/subscription-status] User: ${uid}`);

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const subscription = userDoc.data()?.subscription;

    if (!subscription) {
      // No subscription yet — check if beta user
      const trialDays = await getTrialDays();
      return res.json({
        success: true,
        plan: 'free',
        status: 'none',
        isBetaUser: trialDays === BETA_TRIAL_DAYS,
        trialDaysAvailable: trialDays
      });
    }

    // Check if trial has ended
    if (subscription.status === 'trial' && subscription.trialEndsAt) {
      const trialEnd = subscription.trialEndsAt.toDate
        ? subscription.trialEndsAt.toDate()
        : new Date(subscription.trialEndsAt);

      if (new Date() > trialEnd) {
        // Trial expired — update status
        await db.collection('users').doc(uid).set({
          subscription: { status: 'expired' }
        }, { merge: true });
        subscription.status = 'expired';
      }
    }

    res.json({
      success: true,
      plan: subscription.plan,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      trialEndsAt: subscription.trialEndsAt,
      isBetaUser: subscription.isBetaUser || false,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      currentPeriodEnd: subscription.currentPeriodEnd || null
    });

  } catch (err) {
    console.error('❌ [subscription-status] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch subscription status' });
  }
});

// ─────────────────────────────────────────────
// POST /api/billing/cancel-subscription
// ─────────────────────────────────────────────
router.post('/cancel-subscription', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`❌ [POST /api/billing/cancel-subscription] User: ${uid}`);

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const subscription = userDoc.data()?.subscription;

    if (!subscription?.razorpaySubscriptionId) {
      return res.status(400).json({ success: false, error: 'No active subscription found' });
    }

    // Cancel on Razorpay — cancel_at_cycle_end = true means user keeps access till period ends
    await razorpay.subscriptions.cancel(
      subscription.razorpaySubscriptionId,
      { cancel_at_cycle_end: 1 }
    );

    // Update Firestore
    await db.collection('users').doc(uid).set({
      subscription: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date()
      }
    }, { merge: true });

    console.log(`✅ Subscription cancelled for user: ${uid}`);
    res.json({
      success: true,
      message: 'Subscription cancelled. You will retain access until the end of your billing period.'
    });

  } catch (err) {
    console.error('❌ [cancel-subscription] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
});

// ─────────────────────────────────────────────
// GET /api/billing/invoices
// ─────────────────────────────────────────────
router.get('/invoices', verifyFirebaseToken, async (req, res) => {
  const uid = req.uid;
  console.log(`🧾 [GET /api/billing/invoices] User: ${uid}`);

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const razorpaySubscriptionId = userDoc.data()?.subscription?.razorpaySubscriptionId;

    if (!razorpaySubscriptionId) {
      return res.json({ success: true, invoices: [] });
    }

    // Fetch invoices from Razorpay
    const invoices = await razorpay.invoices.all({
      subscription_id: razorpaySubscriptionId
    });

    const formattedInvoices = (invoices.items || []).map(inv => ({
      id: inv.id,
      amount: inv.amount / 100, // convert paise to rupees
      currency: inv.currency,
      status: inv.status,
      date: new Date(inv.date * 1000).toISOString(),
      pdfUrl: inv.short_url || null
    }));

    res.json({ success: true, invoices: formattedInvoices });

  } catch (err) {
    console.error('❌ [invoices] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// ─────────────────────────────────────────────
// POST /api/billing/webhook
// Razorpay webhook handler
// ─────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  console.log(`🔔 [POST /api/billing/webhook] Event received`);

  // Verify webhook signature
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Signature verification failed' });
  }

  const event = JSON.parse(req.body);
  const eventType = event.event;
  const payload = event.payload;

  console.log(`🔔 Webhook event: ${eventType}`);

  try {
    switch (eventType) {

      case 'subscription.activated': {
        const sub = payload.subscription.entity;
        const uid = sub.notes?.uid;
        if (!uid) break;

        await db.collection('users').doc(uid).set({
          subscription: {
            status: 'active',
            razorpaySubscriptionId: sub.id,
            currentPeriodStart: new Date(sub.current_start * 1000),
            currentPeriodEnd: new Date(sub.current_end * 1000),
            activatedAt: new Date()
          }
        }, { merge: true });

        console.log(`✅ Subscription activated for user: ${uid}`);
        break;
      }

      case 'subscription.charged': {
        const sub = payload.subscription.entity;
        const payment = payload.payment?.entity;
        const uid = sub.notes?.uid;
        if (!uid) break;

        // Save invoice to billing history
        await db.collection('users').doc(uid).set({
          subscription: {
            status: 'active',
            currentPeriodStart: new Date(sub.current_start * 1000),
            currentPeriodEnd: new Date(sub.current_end * 1000),
            lastPaymentAt: new Date()
          }
        }, { merge: true });

        // Save to billing history subcollection
        if (payment) {
          await db.collection('users').doc(uid)
            .collection('billing_history')
            .doc(payment.id)
            .set({
              paymentId: payment.id,
              amount: payment.amount / 100,
              currency: payment.currency,
              status: payment.status,
              paidAt: new Date(payment.created_at * 1000)
            });
        }

        // Send payment success email
        if (uid) {
          const chargedUserDoc = await db.collection('users').doc(uid).get();
          const chargedUserData = chargedUserDoc.data() || {};
          if (chargedUserData.email) {
            const name = chargedUserData.profile?.displayName || chargedUserData.displayName || 'there';
            const nextBillingDate = new Date(sub.current_end * 1000).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            });
            await sendPaymentSuccessEmail({
              to: chargedUserData.email,
              name,
              amount: payment?.amount || 0,
              planName: chargedUserData.subscription?.plan || 'your plan',
              nextBillingDate
            });
          }
        }
        console.log(`✅ Payment charged for user: ${uid}`);
        break;
      }

      case 'subscription.cancelled': {
        const sub = payload.subscription.entity;
        const uid = sub.notes?.uid;
        if (!uid) break;

        await db.collection('users').doc(uid).set({
          subscription: {
            status: 'cancelled',
            cancelledAt: new Date()
          }
        }, { merge: true });

        console.log(`✅ Subscription cancelled for user: ${uid}`);
        break;
      }

      case 'subscription.completed': {
        const sub = payload.subscription.entity;
        const uid = sub.notes?.uid;
        if (!uid) break;

        await db.collection('users').doc(uid).set({
          subscription: {
            status: 'expired',
            expiredAt: new Date()
          }
        }, { merge: true });

        console.log(`✅ Subscription completed/expired for user: ${uid}`);
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity;
        const subscriptionId = payment?.subscription_id;
        if (!subscriptionId) break;

        // Find user by subscription ID
        const usersSnapshot = await db.collection('users')
          .where('subscription.razorpaySubscriptionId', '==', subscriptionId)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const uid = usersSnapshot.docs[0].id;
          const userData = usersSnapshot.docs[0].data();
          await db.collection('users').doc(uid).set({
            subscription: { lastPaymentFailed: true, lastPaymentFailedAt: new Date() }
          }, { merge: true });

          // Send payment failed email
          if (userData.email) {
            const name = userData.profile?.displayName || userData.displayName || 'there';
            await sendPaymentFailedEmail({
              to: userData.email,
              name,
              amount: payment?.amount || 0,
              planName: userData.subscription?.plan || 'your plan'
            });
          }
          console.log(`⚠️ Payment failed for user: ${uid}`);
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event: ${eventType}`);
    }

    res.json({ status: 'ok' });

  } catch (err) {
    console.error('❌ Webhook processing error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;