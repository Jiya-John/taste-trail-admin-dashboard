import express from "express";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";
import multer from "multer";
import dns from "node:dns/promises"; 
dns.setServers(["1.1.1.1"]);

import { MongoClient } from "mongodb";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const __dirname = import.meta.dirname;

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(process.env.MONGODB_DBNAME);

// Express setup
const app = express();
const port = process.env.PORT || 8888;

// Template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Static folder
app.use(express.static(path.join(__dirname, "public")));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions (admin login)
app.use(
  session({
    secret: "tastetrail-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Multer for photo uploads
const upload = multer({ storage: multer.memoryStorage() });

// Mount routes
app.use("/admin", adminRoutes(db, upload));

// Landing page
app.get("/", (req, res) => {
  res.render("admin/landing", { title: "Welcome", hideHeader: true });
});

// Start server
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
