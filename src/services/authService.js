import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

/**
 * Signs up a new user.
 * @param {string} fullName - Full name of the user.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {string} role - Role of the user (buyer, seller, superadmin).
 * @param {string|null} purpose - Purpose field for sellers.
 * @returns {Object} Saved user object.
 */
export const signup = async (fullName, email, password, role, purpose = null) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    fullName,
    email,
    password: hashedPassword,
    role,
    purpose: role === 'seller' ? purpose : null, // Include purpose only for sellers
    isVerified: false, // Ensure users are not verified initially
  });
  return await user.save();
};

/**
 * Logs in an existing user.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Object} Token and user details.
 * @throws Will throw an error if authentication fails.
 */
export const login = async (email, password) => {
  const user = await User.findOne({ email }).exec(); 
  if (!user) throw new Error('Invalid email or password');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid email or password');


  if (user.role !== 'superadmin' && !user.isActive) {
    throw new Error('Your account is deactivated. Please contact support.');
  }

  // if (!user.isVerified) {
  //   throw new Error('Your account is not verified. Please verify your email.');
  // }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      purpose: user.purpose, 
      profileImage: user.profileImage,
      isActive: user.isActive,
      isVerified: user.isVerified, 
    },
  };
};


/**

  @param {Object} user 
  @returns {string} 
 */
export const generateToken = (user) => {
  console.log("Generating token for user1: 💌💌💌", user);
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
    { expiresIn: '24h' }
  );
};
