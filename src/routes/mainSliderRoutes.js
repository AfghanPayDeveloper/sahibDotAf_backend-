import express from "express";
import multer from "multer";
import Food from "../models/Food.js";
import MainSlider from "../models/mainSlider.js";
import { authenticateToken as authenticate } from "../middleware/auth.js";
import path from "path";
import fs from "fs";
import MainSLider from "../models/mainSlider.js";

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

const deleteFiles = (files) => {
  files.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};



router.post("/mainSlider", authenticate, upload.single("image"), async (req, res) => {
  const { name } = req.body;

  if (!name || !req.file) {
    return res.status(400).json({ error: "Menu name and image are required" });
  }

  try {
    const newMainSlider = new MainSLider({
      imageName,
      image: `/uploads/${req.file.filename}`,
    });

    await newMainSlider.save();
    res
      .status(201)
      .json({ message: "Main Slider created successfully", mainSlider: newMainSlider });
  } catch (error) {
    console.error("Error creating mainSlider:", error);
    res.status(500).json({ error: "Failed to create mainSlider" });
  }
});

router.get("/mainSlider", authenticate, async (req, res) => {
  try {
    const mainSLiders = await MainSlider.find();
    res.json({ mainSLiders });
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ error: "Failed to retrieve menus" });
  }
});



router.delete("/mainSlider/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const mainSlider = await MainSlider.findById(id);

    if (!mainSlider) {
      return res.status(404).json({ error: "Main SLider not found" });
    }

    deleteFiles([mainSlider.image]);

    await MainSLider.deleteMany({ mainSlider_id: id });
    await mainSlider.remove();

    res.status(200).json({ message: "Main SLider deleted successfully" });
  } catch (error) {
    console.error("Error deleting main Slider:", error);
    res.status(500).json({ error: "Failed to delete main SLider" });
  }
});

export default router;
