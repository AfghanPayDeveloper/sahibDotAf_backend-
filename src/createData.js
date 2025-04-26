// createData.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Country from './models/Country.js';
import Province from './models/Province.js';
import District from './models/District.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB', err);
    process.exit(1);
  });

const createData = async () => {
  try {
    // Create or find the country
    let country = await Country.findOne({ code: 'AF' }); 
    if (!country) {
      country = new Country({
        name: 'Afghanistan',
        code: 'AF',
      });
      await country.save();
      console.log('Country added:', country.name);
    }


    let province = await Province.findOne({ code: 'KA' }); 
    if (!province) {
      province = new Province({
        name: 'Takhar',
        code: 'TK',
        country_id: country._id, 
      });
      await province.save();
      console.log('Province added:', province.name);
    }


    let district = await District.findOne({ code: 'DA' }); 
    if (!district) {
      district = new District({
        name: 'Taloqan',
        code: 'TL',
        country_id: country._id, 
        province_id: province._id, 
      });
      await district.save();
      console.log('District added:', district.name);
    }

  } catch (error) {
    console.error('Error creating data:', error);
  } finally {
    mongoose.connection.close();
  }
};

createData();
