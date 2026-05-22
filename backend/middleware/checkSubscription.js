import { db } from '../firebaseAdmin.js';

const ADMIN_EMAILS = ['guptarahul07@gmail.com'];

export function isAdmin(email) {
  return ADMIN_EMAILS.includes(email);
}

export async function checkSubscription(req, res, next) {
  const uid = req.uid;
  const email = req.email;

  // Admin bypass — no payment needed
  if (isAdmin(email)) {
    req.isAdmin = true;
    req.subscription = {
      plan: 'admin',
      status: 'active',
      features: 'unlimited',
      isLifetime: true
    };
    return next();
  }

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const subscription = userDoc.data()?.subscription;

    if (!subscription || subscription.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Please upgrade to a paid plan to access this feature',
        requiresUpgrade: true
      });
    }

    req.subscription = subscription;
    next();

  } catch (err) {
    console.error('❌ [checkSubscription] Error:', err.message);
    res.status(500).json({ success: false, error: 'Subscription check failed' });
  }
}