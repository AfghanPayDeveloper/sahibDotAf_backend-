import express from 'express';
import { loginController, signupController } from '../controllers/authController.js';
import { validateSignup, validateLogin } from '../validators/authValidator.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { getAllUsers } from '../controllers/authController.js'; 

const router = express.Router();


router.post('/login', validateLogin, loginController);


router.post('/signup', validateSignup, signupController);


router.get('/all', authenticateToken, authorizeRole('superadmin'), getAllUsers);

export default router;
