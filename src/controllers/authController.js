import { signup, login, generateToken } from '../services/authService.js';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { generateOtp, sendOtpEmail } from '../services/otpService.js';

export const loginController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); 
    }

    const { email, password } = req.body;

    try {
        const data = await login(email, password);

    
        if (!data.user.isActive) {
            return res.status(403).json({ error: 'Your account is deactivated. Please contact support.' });
        }
        
        // Prevent login if the user's account is not verified
        // if (!data.user.isVerified) {
        //     return res.status(403).json({ error: 'Your account is not verified. Please verify your email.' });
        //   }
          
          

 
        console.log('Login Response:', {
            message: 'Login successful',
            token: data.token,
            user: {
                id: data.user.id,
                fullName: data.user.fullName,
                email: data.user.email,
                role: data.user.role,
                purpose: data.user.purpose,
                isActive: data.user.isActive,
                profileImage: data.user.profileImage,
                isVerified: data.user.isVerified,
            },
        });

        res.status(200).json({
            message: 'Login successful',
            token: data.token,
            user: {
                id: data.user.id,
                fullName: data.user.fullName,
                email: data.user.email,
                role: data.user.role,
                profileImage: data.user.profileImage,
                purpose: data.user.purpose,
                isActive: data.user.isActive,
                isVerified: data.user.isVerified, 
            },
        });

    } catch (error) {
        console.error('Login Error:', error);  

 
        if (error.message === 'Invalid email or password') {
            return res.status(401).json({ error: 'Invalid credentials. Please try again.' });
        }

        res.status(500).json({ error: 'An error occurred during login. Please try again.' });
    }
};


export const signupController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); 
    }

    const { fullName, email, password, role, purpose } = req.body;

    try {
  
        const otp = generateOtp();
        
       
        const user = await signup(fullName, email, password, role, purpose);
        user.isVerified = false; 
        user.otp = otp; 
        user.otpExpires = Date.now() + 10 * 60 * 1000;  
        
        await user.save();  


        const otpResult = await sendOtpEmail(email, otp);
        if (!otpResult.success) {
            console.error(`Failed to send OTP to ${email}:`, otpResult);  
            return res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
        }

       
        if (role === 'buyer') {
            const buyerCollection = new mongoose.Schema({}, { strict: false });
            const Buyer = mongoose.model('Buyer', buyerCollection);
            const newBuyer = new Buyer({ userId: user._id, fullName: user.fullName });
            await newBuyer.save();
        } else if (role === 'seller' && purpose) {
            const sellerCollection = new mongoose.Schema({}, { strict: false });
            const Seller = mongoose.model('Seller', sellerCollection);
            const newSeller = new Seller({
                userId: user._id,
                fullName: user.fullName,
                purpose,
            });
            await newSeller.save();
        }

      
        res.status(201).json({
            message: 'User registered successfully. Please verify your email with the OTP sent to you.',
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
       
        console.error('Registration error:', error); 
        
     
        if (error.message.includes('duplicate key error')) {
            return res.status(409).json({ error: 'Email is already registered. Please use another email.' });
        }

      
        res.status(500).json({ error: 'An error occurred during user registration. Please try again.' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find(
            { role: { $ne: 'superadmin' } },
            '-password' 
        );
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'An error occurred while fetching users.' });
    }
};
