import { getFirestore, collection, addDoc, serverTimestamp } from "firebase-admin/firestore";

const db = getFirestore();

export async function createNotification({
  userId,
  type,
  reviewId,
}) {

  const message =
    type === "auto_replied"
      ? "A positive review was auto-replied."
      : "A review needs your attention.";

  await addDoc(collection(db, "notifications"), {
    userId,
    type,
    reviewId,
    message,
    read: false,
    createdAt: serverTimestamp(),
  });
}