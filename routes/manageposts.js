import express from "express";
import { ObjectId } from "mongodb";
import { getPosts, getSinglePost, addPost, editPost, deletePost, validatePost } from "../db/posts.js";
import { getUsers } from "../db/users.js";

export default function managePosts(db, upload, requireAdmin) {
  const router = express.Router();
  
  // Manage Posts
  router.get("/", requireAdmin, async (req, res) => {
    const posts = await getPosts(db);
    const users = await getUsers(db);
    res.render("admin/posts/list", { title: "Manage Posts", posts, users });
  });

  // Add posts
  router.get("/add", requireAdmin, async (req, res) => {
    const users = await getUsers(db);
    res.render("admin/posts/form", {
      title: "Add Post",
      post: {},
      users,
      formAction: "/admin/posts/add",
    });
  });

  // Form to add posts - save to db
  router.post("/add", requireAdmin, upload.single("photo"),
    async (req, res) => {
      const error = validatePost(req.body, req.file, false);
      if (error) {
        return res.render("admin/posts/form", {
            title: "Add Post",
            error,
            formAction: "/admin/posts/add",
            post: req.body,
            users: await getUsers(db),
        });
    }
    await addPost(db, req.body, req.file);
    res.redirect("/admin/posts");
  });

  // Edit post
  router.get("/edit", requireAdmin, async (req, res) => {
    if (!req.query.id) return res.redirect("/admin/posts");
    const post = await getSinglePost(db, req.query.id);
    const users = await getUsers(db);
    res.render("admin/posts/form", {
      title: "Edit Post",
      post,
      users,
      formAction: "/admin/posts/edit",
    });
  });

  // Form to edit post - save to db
  router.post("/edit", requireAdmin, upload.single("photo"),
    async (req, res) => {
        const error = validatePost(req.body, req.file, true);
        if (error) {
          const post = await getSinglePost(db, req.body.id);
          const users = await getUsers(db);
          return res.render("admin/posts/form", {
            title: "Edit Post",
            error,
            formAction: "/admin/posts/edit",
            post: { ...post, ...req.body },
            users,
            });
        }
    await editPost(db, req.body.id, req.body, req.file);
    res.redirect("/admin/posts");
  });

  // Delete Post
  router.get("/delete", requireAdmin, async (req, res) => {
    if (req.query.id) await deletePost(db, req.query.id);
    res.redirect("/admin/posts");
  });

  return router;
} 