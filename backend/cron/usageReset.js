import cron from 'node-cron';
import { db } from '../firebaseAdmin.js';
import { getCurrentMonth } from '../utils/planLimits.js';

// Reset all users' usage counters on 1st of every month at midnight IST (18:30 UTC)
async function resetAllUsersMonthly() {
  console.log('[CRON] Starting monthly usage reset...');

  const newMonth = getCurrentMonth();

  try {
    const usersSnapshot = await db.collection('users').get();
    console.log(`[CRON] Resetting usage for ${usersSnapshot.size} users — month: ${newMonth}`);

    let successCount = 0;
    let failCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      try {
        await userDoc.ref.set({
          usage: {
            currentMonth: newMonth,
            reviewsGenerated: 0,
            repliesPosted: 0,
            locationsConnected: userDoc.data()?.usage?.locationsConnected || 0
            // locationsConnected is NOT reset — it's a persistent count not monthly
          }
        }, { merge: true });

        successCount++;
      } catch (err) {
        console.error(`[CRON] Reset failed for user ${userDoc.id}:`, err.message);
        failCount++;
      }
    }

    console.log(`[CRON] Monthly reset complete — ${successCount} success, ${failCount} failed`);

  } catch (err) {
    console.error('[CRON] Monthly usage reset error:', err);
  }
}

// 1st of every month at 12:00 AM IST = 18:30 UTC previous day
// Using '30 18 28-31 * *' with day check to handle month boundaries cleanly
cron.schedule('0 0 1 * *', resetAllUsersMonthly, { timezone: 'Asia/Kolkata' });

console.log('[CRON] Monthly usage reset scheduled — runs on 1st of every month at 12:00 AM IST');

export { resetAllUsersMonthly };
