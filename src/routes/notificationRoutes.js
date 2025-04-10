import { Router } from "express";
import {
  getAllNotifications,
  readNotification,
  readUserAllNotification,
} from "../controllers/notificationController.js";
import { authenticateToken as authenticate } from "../middleware/auth.js";

const notificationRouter = Router();

// get user's notification by notifyId
notificationRouter.get("/", authenticate, getAllNotifications);

// update read field of user's notification by notifyId
notificationRouter.patch("/:notifyId", authenticate, readNotification);

// update read field of user's all notifications
notificationRouter.patch("/", authenticate, readUserAllNotification);

export default notificationRouter;
