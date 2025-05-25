import express from "express";
import path from "path";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import productRoutes from "./productRoutes.js";
import locationRoutes from "./locationRoutes.js";
import workspaceRoutes from "./workspaceRoutes.js";
import foodRoutes from "./foodRoutes.js";
import serviceRoutes from "./serviceRoutes.js";
import roomRoutes from "./roomRoutes.js";
import hallRoutes from "./hallRoutes.js";
import viewRoutes from "./viewRoutes.js";
import mainSLiderRoutes from "./mainSliderRoutes.js";
import notificationRouter from "./notificationRoutes.js";
import workspaceRoutes1 from "./workspaceRoutes1.js";
import chatRouter from "./chatRoutes.js";
import mainSlider from "./mainSlider.js";
import favoritesRouter from "./favoriteRoutes.js";
import dashboardRouter from "./dashboard.js";
const router = express.Router();

router.use("/auth", authRoutes);

router.use("/user", userRoutes);
router.use("/products", productRoutes);
router.use("/food", foodRoutes);
router.use("/location", locationRoutes);
router.use("/workspace", workspaceRoutes);
router.use("./workspace1", workspaceRoutes1);
router.use("/service", serviceRoutes);
router.use("/room", roomRoutes);
router.use("/hall", hallRoutes);
router.use("/views", viewRoutes);
router.use("/", mainSLiderRoutes);
router.use("/mainSlider", mainSlider);
router.use("/chat", chatRouter);
router.use("/notifications", notificationRouter);

router.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

router.get("/", async (req, res) => {
  res.status(200).json({ message: "Welcome  to the Backend of Sahib.af" });
});

router.use("/favorites", favoritesRouter);
router.use("/dashboard", dashboardRouter);

export default router;
