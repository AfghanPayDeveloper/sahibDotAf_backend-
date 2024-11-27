import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js'; 
import dotenv from 'dotenv';

dotenv.config();

const seedSuperAdmin = async () => {
    try {
    
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const email = 'superadmin@gmail.com';
        const password = 'Afghan@12';

   
        const existingSuperAdmin = await User.findOne({ email, role: 'superadmin' });
        if (existingSuperAdmin) {
            console.log('Super Admin already exists');
            return;
        }

    
        const hashedPassword = await bcrypt.hash(password, 10);

    
        const superAdmin = new User({
            fullName: 'Super Admin',
            email,
            password: hashedPassword,
            role: 'superadmin',
        });

        await superAdmin.save();
        console.log('Super Admin created successfully with email:', email);
    } catch (error) {
        console.error('Error seeding Super Admin:', error.message);
    } finally {
    
        mongoose.disconnect();
    }
};


seedSuperAdmin();
