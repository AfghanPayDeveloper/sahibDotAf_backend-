import { Router } from "express";

import { authenticateToken } from "../middleware/auth.js";
import { getDashboardStats } from "../controllers/dashboardController.js";
const dashboardRouter = Router();
// Route to get dashboard dataq
dashboardRouter.get("/", authenticateToken, getDashboardStats);
export default dashboardRouter;
