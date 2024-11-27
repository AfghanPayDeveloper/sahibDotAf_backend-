import { signup, login, generateToken } from '../services/authService.js';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

export const loginController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {

      const data = await login(email, password);

 
      res.status(200).json({
          message: 'Login successful',
          token: data.token,
          user: {
              id: data.user._id,
              fullName: data.user.fullName,
              email: data.user.email,
              role: data.user.role,
              category: data.user.category,
              isActive: data.user.isActive,  
          },
      });
  } catch (error) {
   
      if (error.message === 'Invalid email or password') {
          return res.status(401).json({ error: 'Invalid credentials. Please try again.' });
      }
      if (error.message === 'Your account is deactivated. Please contact support.') {
          return res.status(403).json({ error: error.message });  
      }
      res.status(500).json({ error: 'An error occurred during login. Please try again.' });
  }
};


// Signup Controller
export const signupController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, role, category } = req.body;

    try {
        const user = await signup(fullName, email, password, role, category);
        const token = generateToken(user);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                category: user.category,
            },
        });
    } catch (error) {
        if (error.message.includes('duplicate key error')) {
            return res.status(409).json({ error: 'Email is already registered. Please use another email.' });
        }
        res.status(500).json({ error: 'An error occurred during registration. Please try again.' });
    }
};
export const getAllUsers = async (req, res) => {
  try {
    
      const users = await User.find({ role: { $ne: 'superadmin' } }, '-password');
      res.status(200).json(users);
  } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'An error occurred while fetching users.' });
  }
};
