import { ObjectId } from "mongodb";

// Get Post function
export async function getPosts(db) {
  return await db.collection("posts").find({}).sort({ createdAt: -1 }).toArray();
}

// Get single user function
export async function getSinglePost(db, id) {
  return await db.collection("posts").findOne({ _id: new ObjectId(id) });
}

// Add post function
export async function addPost(db, data, file) {
  const postDoc = {
    userId: new ObjectId(String(data.userId)),
    photo: file.buffer,
    photoType: file.mimetype,
    restaurantName: data.restaurantName,
    restaurantStreetName: data.restaurantStreetName,
    restaurantCity: data.restaurantCity,
    restaurantProvince: data.restaurantProvince,
    restaurantCountry: data.restaurantCountry,
    restaurantPostalCode: data.restaurantPostalCode,
    dishName: data.dishName,
    comment: data.comment,
    rating: data.rating,
    likesCount: parseInt(data.likesCount) || 0,
    likedBy: [],
    status: data.status || "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("posts").insertOne(postDoc);
  return result.insertedId;
}

// Edit Post function
export async function editPost(db, id, data, file) {
  const update = {
    userId: new ObjectId(String(data.userId)), // only for initial phase for admin to add posts to platform.
    restaurantName: data.restaurantName,
    restaurantStreetName: data.restaurantStreetName,
    restaurantCity: data.restaurantCity,
    restaurantProvince: data.restaurantProvince,
    restaurantCountry: data.restaurantCountry,
    restaurantPostalCode: data.restaurantPostalCode,
    dishName: data.dishName,
    comment: data.comment,
    rating: data.rating,
    status: data.status || "active",
    updatedAt: new Date(),
  };

  // If new post uploaded, binary data of the image and the type of image is saved. 
  if (file) {
    update.photo = file.buffer;
    update.photoType = file.mimetype;
  }

  await db
    .collection("posts")
    .updateOne({ _id: new ObjectId(id) }, { $set: update });
}

// Delete Post function - set post to inactive
export async function deletePost(db, id) {
  await db
    .collection("posts")
    .updateOne({ _id: new ObjectId(id) },
    { $set: { status: "inactive", updatedAt: new Date() } 
  });
}

// Post Validation function
export function validatePost(data, file, isEdit = false) {
  // Required fields
  const required = [
    "userId",
    "restaurantName",
    "restaurantStreetName",
    "restaurantCity",
    "restaurantProvince",
    "restaurantCountry",
    "restaurantPostalCode",
    "dishName",
  ];

  // photo required only for add
  if (!isEdit && !file) {
    return "Photo is required.";
  }

  // Check if all mandatory fields are filled
  for (const field of required) {
    if (!data[field] || data[field].trim() === "") {
      return `${field} is required.`;
    }
  }

  return null; // No errors
}
