import { ObjectId } from "mongodb";

// Get all favorites for a user
export async function getFavoritesByUser(db, userId) {
  return await db.collection("favorites")
    .find({ userId: new ObjectId(userId) })
    .toArray();
}

// Add a favorite
export async function addFavorite(db, userId, postId) {
  const existing = await db.collection("favorites").findOne({
    userId: new ObjectId(userId),
    postId: new ObjectId(postId)
  });

  if (existing) return false; // already favorited

  await db.collection("favorites").insertOne({
    userId: new ObjectId(userId),
    postId: new ObjectId(postId),
    createdAt: new Date()
  });

  return true;
}

// Remove a favorite
export async function removeFavorite(db, userId, postId) {
  await db.collection("favorites").deleteOne({
    userId: new ObjectId(userId),
    postId: new ObjectId(postId)
  });
}
