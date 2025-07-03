import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  // console.log(token);

  if (!token) {
    console.error('Token missing in request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const user = await User.findById(decoded.id);

    if (user && !user.isActive) {
      return res.status(401).json({ error: 'Your account has been deactivated' });
    }

    req.user = {...req.user, ...user.toObject()}
    next();
  } catch (error) {
    console.error('Error verifying token:', error.message);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};


export const authorizeRole = (role) => (req, res, next) => {
  console.log('User in authorizeRole middleware:', req.user);
  if (!req.user || (req.user.role !== role && req.user.role !== 'superadmin')) {
    console.error('Access denied. User role:', req.user?.role);
    return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
  }
  next();
};


export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      console.error('Error verifying token:', error.message);
    }
  }
  next();
};