import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { getUsers, getSingleUser, addUser, editUser, deleteUser, validateUser } from "../db/users.js";
import { getPosts, getSinglePost, addPost, editPost, deletePost, validatePost } from "../db/posts.js";

export default function apiRoutes(db, upload) {
  const router = express.Router();

  // GET all users
  router.get("/users", async (req, res) => {
    res.json(await getUsers(db));
  });

  // GET single user
  router.get("/users/:id", async (req, res) => {
    res.json(await getSingleUser(db, req.params.id));
  });

  // UPDATE user
  router.put("/users/:id", async (req, res) => {
    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
      streetName: req.body.streetName,
      city: req.body.city,
      province: req.body.province,
      country: req.body.country,
      postalCode: req.body.postalCode,
      status: req.body.status, 
      updatedAt: new Date()
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    res.json(await getSingleUser(db, req.params.id));
  });

  // SIGNUP
  router.post("/signup", async (req, res) => {
    const { firstName, lastName, username, email, password, streetName, city, province, country, postalCode } = req.body;

    //checking if existing user
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userDoc = { firstName, lastName, username, email, streetName, city, province, country, postalCode, passwordHash: hashedPassword, favorites: [], status: "active", createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection("users").insertOne(userDoc);

    res.json({
      _id: result.insertedId,
      firstName,
      lastName,
      username,
      email,
      streetName,
      city,
      province,
      country,
      postalCode,
      favorites: []
    });
  });

  // LOGIN
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    if (user.status === "inactive") {
      return res.status(403).json({ error: "Your account is inactive." });
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      streetName: user.streetName,
      city: user.city,
      province: user.province,
      country: user.country,
      postalCode: user.postalCode,
      favorites: user.favorites
    });
  }); 

  // GET all posts with search
  router.get("/posts", async (req, res) => {
    try {
      const skip = parseInt(req.query.skip) || 0;
      const limit = parseInt(req.query.limit) || 8;
      const q = req.query.q?.trim() || "";
      const filter = q
        ? {
            $or: [
              { restaurantName: { $regex: q, $options: "i" } },
              { restaurantCity: { $regex: q, $options: "i" } },
              { dishName: { $regex: q, $options: "i" } },
            ],
          }
        : {};
      const posts = await db
        .collection("posts")
        .find({ status: "active", ...filter })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray();
      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET single post
  router.get("/posts/:id", async (req, res) => {
    res.json(await getSinglePost(db, req.params.id));
  });

  // Get photo
  router.get("/posts/:id/photo", async (req, res) => {
    const post = await getSinglePost(db, req.params.id);
    res.set("Content-Type", post.photoType);
    res.send(post.photo.buffer);
  });

  // CREATE post
  router.post("/posts", upload.single("photo"), async (req, res) => {
    const result = await addPost(db, req.body, req.file);
    res.json({ success: true, id: result });
  });

  // UPDATE post
  router.put("/posts/:id", upload.single("photo"), async (req, res) => {
    await editPost(db, req.params.id, req.body, req.file);
    res.json({ success: true });
  });

  // DELETE post
  router.delete("/posts/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await deletePost(db, id); 
      res.json({ success: true, message: "Post set to inactive" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to deactivate post" });
    }
  });

  
  // Like or unlike post
  router.post("/posts/:id/like", async (req, res) => {
    const { userId } = req.body;
    const postId = req.params.id;

    const post = await db.collection("posts").findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ error: "Post not found" });

    const alreadyLiked = post.likedBy?.includes(userId);

    if (alreadyLiked) {
      // Unlike
      await db.collection("posts").updateOne(
        { _id: new ObjectId(postId) },
        {
          $pull: { likedBy: userId },
          $inc: { likesCount: -1 }
        }
      );
      return res.json({ liked: false });
    } else {
      // Like
      await db.collection("posts").updateOne(
        { _id: new ObjectId(postId) },
        {
          $addToSet: { likedBy: userId },
          $inc: { likesCount: 1 }
        }
      );
      return res.json({ liked: true });
    }
  });

  // Toggle favourite
  router.post("/users/:id/favorites", async (req, res) => {
    const userId = req.params.id;
    const { postId } = req.body;

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    const alreadyFav = user.favorites?.includes(postId);

    if (alreadyFav) {
      // Remove from favorites
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { favorites: postId } }
      );
      return res.json({ favorited: false });
    } else {
      // Add to favorites
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $addToSet: { favorites: postId } }
      );
      return res.json({ favorited: true });
    }
  });

  return router;
}
