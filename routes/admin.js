import express from "express";
import { ObjectId } from "mongodb";
import { getUsers, getSingleUser, addUser, editUser, deleteUser, validateUser } from "../db/users.js";

export default function adminRoutes(db, upload) {
  const router = express.Router();

  // Middleware
  function requireAdmin(req, res, next) {
    if (req.session.isAdmin) return next();
    res.redirect("/admin/login");
  }

  // Login Page 
  router.get("/login", (req, res) => {
    res.render("admin/login", { title: "Admin Login", hideHeader: true });
  });

  // Login Submit
  router.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (
      username === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASS
    ) {
      req.session.isAdmin = true;
      return res.redirect("/admin");
    }
    res.render("admin/login", {
      title: "Admin Login",
      error: "Invalid username or password",
      hideHeader: true,
    });
  });

  // Logout
  router.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/admin/login");
    });
  });

  // Dashboard
  router.get("/", requireAdmin, async (req, res) => {
    const userCount = await db.collection("users").countDocuments();
    const postCount = await db.collection("posts").countDocuments();
    res.render("admin/dashboard", { title: "Dashboard", userCount, postCount });
  });

  // Manage Users
  router.get("/users", requireAdmin, async (req, res) => {
    const users = await getUsers(db);
    res.render("admin/users/list", { title: "Manage Users", users });
  });

  // Add User
  router.get("/users/add", requireAdmin, (req, res) => {
    res.render("admin/users/form", {
      title: "Add User",
      user: {},
      formAction: "/admin/users/add",
    });
  });

  // Form to add user - Post to db
  router.post("/users/add", requireAdmin, async (req, res) => {
    const error = await validateUser(db, req.body, false);
    if (error) {
      return res.render("admin/users/form", {
        title: "Add User",
        error,
        formAction: "/admin/users/add",
        user: req.body,
      });
    }
    await addUser(db, req.body);
    res.redirect("/admin/users");
  });

  // Edit User
  router.get("/users/edit", requireAdmin, async (req, res) => {
    if (!req.query.id) return res.redirect("/admin/users");
    const user = await getSingleUser(db, req.query.id);
    res.render("admin/users/form", {
      title: "Edit User",
      user,
      formAction: "/admin/users/edit",
    });
  });

  // Form to edit user - Post to db
  router.post("/users/edit", requireAdmin, async (req, res) => {
    const error = await validateUser(db, req.body, true, req.body.id);
    if (error) {
      const user = await getSingleUser(db, req.body.id);
      return res.render("admin/users/form", {
        title: "Edit User",
        error,
        formAction: "/admin/users/edit",
        user: { ...user, ...req.body },
      });
    }
    await editUser(db, req.body.id, req.body);
    res.redirect("/admin/users");
  });

  // Delete user
  router.get("/users/delete", requireAdmin, async (req, res) => {
    if (req.query.id) await deleteUser(db, req.query.id);
    res.redirect("/admin/users");
  });

  return router;
}
