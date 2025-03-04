import { validationResult } from 'express-validator';
import User from '../models/User.js';

export const verifyOtpController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { email, otp } = req.body;
  
    console.log('Received email:', email);  // Log the received email
    console.log('Received OTP:', otp);  // Log the received OTP
  
    try {
      // Find the user by email
      const user = await User.findOne({ email }).exec(); 
      console.log('User found:', user);
      console.log('User after verification:', user);

      if (!user) {
        console.log('User not found for email:', email);  // Log if user is not found
        return res.status(404).json({ error: 'User not found.' });
      }
  
      // Check if OTP is correct
      console.log('Stored OTP:', user.otp);
      console.log('Received OTP:', otp);  // Log the OTP received from the client
      
      if (user.otp !== otp) {
        console.log('Invalid OTP attempt.');
        return res.status(400).json({ error: 'Invalid OTP.' });
      }
      
      // Check if OTP has expired
      const currentTime = new Date();
      console.log('Current time:', currentTime);
      console.log('OTP Expiry Time:', user.otpExpiresAt);
      
      if (currentTime > user.otpExpiresAt) {
        console.log('OTP has expired.');
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      }
      
      
  
      // Mark user as verified and clear OTP
      user.isVerified = true;
      user.otp = null;  // Clear OTP after successful verification
      console.log('Stored OTP:', user.otp);
      console.log('Received OTP:', otp);  // Log OTP sent by client
      user.otpExpiresAt = null;  // Clear OTP expiration
      console.log('OTP Expiry Time:', user.otpExpiresAt);
      await user.save();
  
      console.log('OTP successfully verified for email:', email);  // Log successful OTP verification
  
      return res.status(200).json({ message: 'OTP verified successfully.' });
    } catch (error) {
      console.error('Error verifying OTP:', error);  // Log errors for debugging
      return res.status(500).json({ error: 'An error occurred during OTP verification.' });
    }
  };
  