import express from "express";
import {
  changePassword,
  loginController,
  signupController,
} from "../controllers/authController.js";
import { validateSignup, validateLogin } from "../validators/authValidator.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import { getAllUsers } from "../controllers/authController.js";
import { verifyOtpController } from "../controllers/verifyOtpController.js";
import { sendOtpController } from "../controllers/otpController.js";

const router = express.Router();

router.post("/login", validateLogin, loginController);
router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.post("/signup", validateSignup, signupController);
router.post("/change-password", authenticateToken, changePassword);

router.get("/all", authenticateToken, authorizeRole("superadmin"), getAllUsers);

export default router;
