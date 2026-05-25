import express from "express";
import { ObjectId } from "mongodb";
import { getUsers, getSingleUser, addUser, editUser, deleteUser, validateUser } from "../db/users.js";

export default function manageUsers(db, requireAdmin) {
  const router = express.Router();

  // Manage Users
  router.get("/", requireAdmin, async (req, res) => {
    const users = await getUsers(db);
    res.render("admin/users/list", { title: "Manage Users", users });
  });

  // Add User
  router.get("/add", requireAdmin, (req, res) => {
    res.render("admin/users/form", {
      title: "Add User",
      user: {},
      formAction: "/admin/users/add",
    });
  });

  // Form to add user - Post to db
  router.post("/add", requireAdmin, async (req, res) => {
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
  router.get("/edit", requireAdmin, async (req, res) => {
    if (!req.query.id) return res.redirect("/admin/users");
    const user = await getSingleUser(db, req.query.id);
    res.render("admin/users/form", {
      title: "Edit User",
      user,
      formAction: "/admin/users/edit",
    });
  });

  // Form to edit user - Post to db
  router.post("/edit", requireAdmin, async (req, res) => {
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
  router.get("/delete", requireAdmin, async (req, res) => {
    if (req.query.id) await deleteUser(db, req.query.id);
    res.redirect("/admin/users");
  });

  return router;
} 