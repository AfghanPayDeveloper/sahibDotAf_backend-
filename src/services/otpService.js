import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const generateOtp = () => Math.floor(100000 + Math.random() * 900000);


const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Profile Update',
    text: `Your OTP for updating your profile is: ${otp}. Please do not share this with anyone.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully.' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: 'Failed to send OTP.' };
  }
};

export { generateOtp, sendOtpEmail };
