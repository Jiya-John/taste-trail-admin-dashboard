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
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      streetName: data.streetName,
      city: data.city,
      province: data.province,
      country: data.country,
      postalCode: data.postalCode,
      updatedAt: new Date()
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );

    res.json(await getSingleUser(db, req.params.id));
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
        .find({ status: "active" })
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

  return router;
}