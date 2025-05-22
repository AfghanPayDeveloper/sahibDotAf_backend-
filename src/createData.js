

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Country from './models/Country.js';
import Province from './models/Province.js';
import District from './models/District.js';


dotenv.config();


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
    let country = await Country.findOne({ code: 'AF' }); 
    if (!country) {
      country = new Country({
      
      });
      await country.save();
      console.log('Country added:', country.name);
    }

   
    const provinces = [
      { name: 'Herat', code: 'HR' },
      { name: 'Kandahar', code: 'KD' },
      { name: 'Balkh', code: 'BK' },
      { name: 'Nangarhar', code: 'NG' }
    ];

    const districts = [
      { name: 'Guzara', code: 'GZ', provinceCode: 'HR' },
      { name: 'Spin Boldak', code: 'SB', provinceCode: 'KD' },
      { name: 'Mazar-i-Sharif', code: 'MZ', provinceCode: 'BK' },
      { name: 'Jalalabad', code: 'JL', provinceCode: 'NG' }
    ];


    for (let prov of provinces) {
      let province = await Province.findOne({ code: prov.code });
      if (!province) {
        province = new Province({
          name: prov.name,
          code: prov.code,
          country_id: country._id,
        });
        await province.save();
        console.log('Province added:', province.name);
      }
    }

    for (let dist of districts) {
      let province = await Province.findOne({ code: dist.provinceCode });
      let district = await District.findOne({ code: dist.code });
      if (!district && province) {
        district = new District({
          name: dist.name,
          code: dist.code,
          country_id: country._id,
          province_id: province._id,
        });
        await district.save();
        console.log('District added:', district.name);
      }
    }

  } catch (error) {
    console.error('Error creating data:', error);
  } finally {
    mongoose.connection.close();
  }
};

createData();


