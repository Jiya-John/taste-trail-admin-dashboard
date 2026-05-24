import express from "express";
import { ObjectId } from "mongodb";
import { getUsers, getSingleUser, addUser, editUser, deleteUser, validateUser } from "../db/users.js";
import manageUsers from "./manageusers.js";

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

  router.use("/users", requireAdmin, manageUsers(db, requireAdmin));

  return router;
}
