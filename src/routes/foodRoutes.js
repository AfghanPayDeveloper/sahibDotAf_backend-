import express from "express";
import multer from "multer";
import { authenticateToken as authenticate } from "../middleware/auth.js";
import path from "path";
import fs from "fs";

import {
  approveFood,
  createFood,
  createMenu,
  deleteFood,
  deleteMenu,
  getFoods,
  getMenus,
  unapproveFood,
  updateFood,
  updateMenu,
} from "../controllers/foodController.js";

const router = express.Router();
const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(
      /[^a-zA-Z0-9.]/g,
      "_"
    )}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate);

router.post("/", upload.single("image"), createFood);

router.get("/", getFoods);

router.patch("/:id", upload.single("image"), updateFood);

router.patch("/:id/approve", approveFood);

router.patch("/:id/unapprove", unapproveFood);

router.delete("/:id", deleteFood);

router.post("/menu", upload.single("image"), createMenu);

router.get("/menu", getMenus);

router.patch("/menu/:id", upload.single("image"), updateMenu);

router.delete("/menu/:id", deleteMenu);

export default router;
