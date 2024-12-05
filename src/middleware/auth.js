import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log(token);

  if (!token) {
      console.error('Token missing in request');
      return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded Token:', decoded); 
      req.user = decoded;
      next();
  } catch (error) {
      console.error('Error verifying token:', error.message); 
      res.status(403).json({ error: 'Forbidden: Invalid token' });
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
