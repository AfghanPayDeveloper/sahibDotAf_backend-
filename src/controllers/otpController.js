import { generateOtp, sendOtpEmail } from '../services/otpService.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

export const sendOtpController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { email } = req.body;
  
    try {
      // Find the user by email
      const user = await User.findOne({ email }).exec(); 
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      // Check if the user already has a pending OTP
      const existingUserOtp = user.otpExpiresAt && new Date(user.otpExpiresAt) > new Date();
      if (existingUserOtp) {
        return res.status(400).json({ error: 'An OTP is already pending. Please wait for it to expire or request a new one.' });
      }
  
      // Generate OTP
      const otp = generateOtp();
  
      // Set OTP expiration time (e.g., 10 minutes from now)
      const otpExpiresAt = new Date();
      otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);
  
      // Log the OTP and expiration time for debugging
      console.log('Generated OTP:', otp);
      console.log('OTP Expiry Time:', otpExpiresAt);
  
      // Temporarily store OTP in the user document along with expiration time
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
      
      console.log('OTP saved:', user.otp);  // Confirm the OTP is saved in the DB
      console.log('OTP Expiry Time saved:', user.otpExpiresAt);  // Confirm the expiration time is correct
      
      // Send OTP email
      const sendResult = await sendOtpEmail(email, otp);
      if (!sendResult || !sendResult.success) {
        console.error('Failed to send OTP email:', sendResult);
        return res.status(500).json({ error: 'Failed to send OTP. Please try again later.' });
      }
  
      return res.status(200).json({ message: 'OTP sent successfully.' });
    } catch (error) {
      console.error('Error sending OTP:', error);
      return res.status(500).json({ error: 'An error occurred while sending OTP.' });
    }
  };
  