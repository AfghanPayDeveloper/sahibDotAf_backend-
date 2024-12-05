import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

/**

 * @param {string} fullName 
 * @param {string} email
 * @param {string} password
 * @param {string} role
 * @param {string|null} category 
 * @returns {Object} 
 */
export const signup = async (fullName, email, password, role, category) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ fullName, email, password: hashedPassword, role, category });
  return await user.save();
};

/**

 
 * @param {string} email 
 * @param {string} password 
 * @returns {Object} 
 * @throws
 */

export const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid email or password');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid email or password');


  if (user.role !== 'superadmin' && !user.isActive) {
    throw new Error('Your account is deactivated. Please contact support.');
  }

  const token = generateToken(user);
  console.log(token);


  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      category: user.category,
      isActive: user.isActive,  
    },
  };
};




/**

 * @param {Object} user 
 * @returns {string} 
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        category: user.category,  
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
);
};
