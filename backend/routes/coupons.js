import express from 'express';
import admin, { db } from '../firebaseAdmin.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { checkAdmin } from '../middleware/checkAdmin.js';

const router = express.Router();

const VALID_PLANS = ['starter', 'growth', 'professional'];
const VALID_TYPES = ['percentage', 'flat'];

// ─────────────────────────────────────────────
// ADMIN: POST /api/admin/coupons
// Create a new coupon
// ─────────────────────────────────────────────
router.post('/', verifyFirebaseToken, checkAdmin, async (req, res) => {
  const { code, type, value, maxUses, validFrom, validUntil, applicablePlans } = req.body;

  console.log(`🎟️ [POST /api/admin/coupons] Creating coupon: ${code}`);

  // Validate required fields
  if (!code || !type || value === undefined || !validUntil) {
    return res.status(400).json({ success: false, error: 'Missing required fields: code, type, value, validFrom, validUntil' });
  }

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ success: false, error: 'Invalid type. Must be: percentage or flat' });
  }

  if (type === 'percentage' && (value < 1 || value > 100)) {
    return res.status(400).json({ success: false, error: 'Percentage value must be between 1 and 100' });
  }

  if (type === 'flat' && value < 1) {
    return res.status(400).json({ success: false, error: 'Flat value must be greater than 0' });
  }

  if (applicablePlans && !applicablePlans.every(p => VALID_PLANS.includes(p))) {
    return res.status(400).json({ success: false, error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}` });
  }

  try {
    // Check if coupon code already exists
    const existing = await db.collection('coupons').doc(code.toUpperCase()).get();
    if (existing.exists) {
      return res.status(409).json({ success: false, error: 'Coupon code already exists' });
    }

    const couponData = {
      code: code.toUpperCase(),
      type,
      value: Number(value),
      maxUses: maxUses ? Number(maxUses) : null, // null = unlimited
      usedCount: 0,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: new Date(validUntil),
      applicablePlans: applicablePlans || VALID_PLANS,
      createdBy: req.email,
      createdAt: new Date(),
      active: true
    };

    await db.collection('coupons').doc(code.toUpperCase()).set(couponData);

    console.log(`✅ Coupon created: ${code.toUpperCase()}`);
    res.status(201).json({ success: true, coupon: couponData });

  } catch (err) {
    console.error('❌ [POST /api/admin/coupons] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create coupon' });
  }
});

// ─────────────────────────────────────────────
// ADMIN: GET /api/admin/coupons
// List all coupons with usage stats
// ─────────────────────────────────────────────
router.get('/', verifyFirebaseToken, checkAdmin, async (req, res) => {
  console.log(`🎟️ [GET /api/admin/coupons] Fetching all coupons`);

  try {
    const snapshot = await db.collection('coupons').orderBy('createdAt', 'desc').get();
    const coupons = snapshot.docs.map(doc => doc.data());

    console.log(`✅ Found ${coupons.length} coupons`);
    res.json({ success: true, coupons });

  } catch (err) {
    console.error('❌ [GET /api/admin/coupons] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch coupons' });
  }
});

// ─────────────────────────────────────────────
// ADMIN: DELETE /api/admin/coupons/:code
// Deactivate a coupon
// ─────────────────────────────────────────────
router.delete('/:code', verifyFirebaseToken, checkAdmin, async (req, res) => {
  const code = req.params.code.toUpperCase();
  console.log(`🎟️ [DELETE /api/admin/coupons/${code}] Deactivating`);

  try {
    const couponDoc = await db.collection('coupons').doc(code).get();
    if (!couponDoc.exists) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    await db.collection('coupons').doc(code).delete();

    console.log(`✅ Coupon deleted: ${code}`);
    res.json({ success: true, message: `Coupon ${code} deleted` });

  } catch (err) {
    console.error(`❌ [DELETE /api/admin/coupons/${code}] Error:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to deactivate coupon' });
  }
});

// ─────────────────────────────────────────────
// USER: POST /api/billing/apply-coupon
// Validate and apply a coupon to a plan
// ─────────────────────────────────────────────
export async function validateCoupon(couponCode, plan, billingCycle, basePrice) {
  const code = couponCode.toUpperCase();
  const couponDoc = await db.collection('coupons').doc(code).get();

  if (!couponDoc.exists) {
    return { valid: false, error: 'Coupon not found' };
  }

  const coupon = couponDoc.data();
  const now = new Date();

  if (!coupon.active) {
    return { valid: false, error: 'Coupon is no longer active' };
  }

  if (now < coupon.validFrom.toDate()) {
    return { valid: false, error: 'Coupon is not yet valid' };
  }

  if (now > coupon.validUntil.toDate()) {
    return { valid: false, error: 'Coupon has expired' };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }

  if (!coupon.applicablePlans.includes(plan)) {
    return { valid: false, error: `Coupon not applicable to ${plan} plan` };
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = Math.round((basePrice * coupon.value) / 100);
  } else {
    discount = Math.min(coupon.value, basePrice); // flat discount, can't exceed price
  }

  const finalPrice = basePrice - discount;

  return {
    valid: true,
    originalPrice: basePrice,
    discount,
    finalPrice,
    couponCode: code,
    couponType: coupon.type,
    couponValue: coupon.value
  };
}

// Increment coupon usage count — called after successful subscription
export async function markCouponUsed(couponCode) {
  const code = couponCode.toUpperCase();
  await db.collection('coupons').doc(code).update({
    usedCount: admin.firestore.FieldValue.increment(1)
  });
}

export default router;