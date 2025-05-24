import { validationResult } from "express-validator";
import User from "../models/User.js";
import mongoose from "mongoose";
import { generateOtp, sendOtpEmail } from "../services/otpService.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const loginController = async (req, res) => {
  console.log("Login request body:", req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).exec();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ error: "Invalid credentials. Please try again." });
    }

    if (user.role !== "superadmin" && !user.isActive) {
      return res.status(403).json({
        error: "Your account is deactivated. Please contact support.",
      });
    }

    const token = generateToken(user);
    console.log("Generating token for user2: 💌💌💌", user);

    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      purpose: user.purpose,
      profileImage: user.profileImage,
      isActive: user.isActive,
      isVerified: user.isVerified,
    };

    if (!userData.isActive) {
      return res.status(403).json({
        error: "Your account is deactivated. Please contact support.",
      });
    }

    // Uncomment the following block to enforce email verification
    // if (!userData.isVerified) {
    //     return res.status(403).json({ error: 'Your account is not verified. Please verify your email.' });
    // }

    console.log("Login Response:", {
      message: "Login successful",
      token,
      user: userData,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred during login. Please try again." });
  }
};

export const signupController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, email, password, role, purpose, termsAccepted } = req.body;

  try {
    const otp = generateOtp();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      role,
      purpose: role === "seller" ? purpose : null,
      isVerified: false,
      termsAccepted,
    });
    await user.save();
    user.isVerified = false;
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const otpResult = await sendOtpEmail(email, otp);
    if (!otpResult.success) {
      console.error(`Failed to send OTP to ${email}:`, otpResult);
      return res
        .status(500)
        .json({ error: "Failed to send OTP. Please try again." });
    }

    if (role === "buyer") {
      const buyerCollection = new mongoose.Schema({}, { strict: false });
      const Buyer = mongoose.model("Buyer", buyerCollection);
      const newBuyer = new Buyer({ userId: user._id, fullName: user.fullName });
      await newBuyer.save();
    } else if (role === "seller" && purpose) {
      const sellerCollection = new mongoose.Schema({}, { strict: false });
      const Seller = mongoose.model("Seller", sellerCollection);
      const newSeller = new Seller({
        userId: user._id,
        fullName: user.fullName,
        purpose,
      });
      await newSeller.save();
    }

    res.status(201).json({
      message:
        "User registered successfully. Please verify your email with the OTP sent to you.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        purpose: user.purpose,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.message.includes("duplicate key error")) {
      return res.status(409).json({
        error: "Email is already registered. Please use another email.",
      });
    }

    res.status(500).json({
      error: "An error occurred during user registration. Please try again.",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "superadmin" } }, "-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "An error occurred while fetching users." });
  }
};

function generateToken(user) {
  console.log("Generating token for user: 💌💌💌", user);
  return jwt.sign(
    {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      purpose: user.purpose,
      profileImage: user.profileImage,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7days" }
  );
}

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const { id } = req.user;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "New passwords do not match." });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
};