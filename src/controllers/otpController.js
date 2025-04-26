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

      const user = await User.findOne({ email }).exec(); 
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
    
      const existingUserOtp = user.otpExpiresAt && new Date(user.otpExpiresAt) > new Date();
      if (existingUserOtp) {
        return res.status(400).json({ error: 'An OTP is already pending. Please wait for it to expire or request a new one.' });
      }
  
   
      const otp = generateOtp();
  
     
      const otpExpiresAt = new Date();
      otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);
  
      
      console.log('Generated OTP:', otp);
      console.log('OTP Expiry Time:', otpExpiresAt);
  
 
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
      
      console.log('OTP saved:', user.otp); 
      console.log('OTP Expiry Time saved:', user.otpExpiresAt);  
      

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
  