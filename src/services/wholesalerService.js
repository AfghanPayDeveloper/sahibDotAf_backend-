import Wholesaler from '../models/Wholesaler.js';
import fs from 'fs';
import path from 'path'; 

const getProfile = async (userId) => {
    return await Wholesaler.findOne({ userId });
};

const updateProfile = async (userId, data, files, imagesToRemove = []) => {
    let wholesaler = await Wholesaler.findOne({ userId });

    if (!wholesaler) {
        return null;
    }

  
    const {
        fullName,
        email,
        business,
        address,
        city,
        zip,
        whatsapp,
        phone,
        brandName,
        brandWhatsapp,
        brandPhone,
        brandEmail,
        certificateNo,
        brandAddress,
        brandCity,
        brandZipCode,
        description,
    } = data;


    wholesaler.fullName = fullName || wholesaler.fullName;
    wholesaler.email = email || wholesaler.email;
    wholesaler.business = business || wholesaler.business;
    wholesaler.address = address || wholesaler.address;
    wholesaler.city = city || wholesaler.city;
    wholesaler.zip = zip || wholesaler.zip;
    wholesaler.whatsapp = whatsapp || wholesaler.whatsapp;
    wholesaler.phone = phone || wholesaler.phone;


    wholesaler.brandProfile = {
        brandName: brandName || wholesaler.brandProfile?.brandName,
        brandEmail: brandEmail || wholesaler.brandProfile?.brandEmail,
        certificateNo: certificateNo || wholesaler.brandProfile?.certificateNo,
        brandAddress: brandAddress || wholesaler.brandProfile?.brandAddress,
        brandCity: brandCity || wholesaler.brandProfile?.brandCity,
        brandZipCode: brandZipCode || wholesaler.brandProfile?.brandZipCode,
        description: description || wholesaler.brandProfile?.description,
        brandPhone: brandPhone || wholesaler.brandProfile?.brandPhone,
        brandWhatsapp: brandWhatsapp || wholesaler.brandProfile?.brandWhatsapp,
    };


    wholesaler.brandProfile.images = wholesaler.brandProfile.images || [];


    if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
  
        const imagesToRemoveParsed = imagesToRemove.map(image => JSON.parse(image)[0]);

     
        wholesaler.brandProfile.images = wholesaler.brandProfile.images.filter(image => !imagesToRemoveParsed.includes(image));

    
        console.log('Images to be removed:', imagesToRemoveParsed);
        
      
        imagesToRemoveParsed.forEach(imagePath => {
            try {
                const filePath = path.join(__dirname, 'uploads', imagePath.split('/uploads/')[1]); 
                console.log(`Deleting image: ${filePath}`);
                fs.unlinkSync(filePath); 
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        });
    }


    if (files['profileImage'] && files['profileImage'][0]) {
        wholesaler.profileImage = `/uploads/${files['profileImage'][0].filename}`;
    }
    if (files['brandProfileImage'] && files['brandProfileImage'][0]) {
        wholesaler.brandProfile.brandProfileImage = `/uploads/${files['brandProfileImage'][0].filename}`;
    }

    if (files['brandCertificate'] && files['brandCertificate'][0]) {
        wholesaler.brandProfile.certificate = `/uploads/${files['brandCertificate'][0].filename}`;
    }

    if (files['images']) {

        const newImages = files['images'] ? files['images'].map(file => `/uploads/${file.filename}`) : [];

        wholesaler.brandProfile.images = wholesaler.brandProfile.images.concat(newImages);
    }


    const updatedWholesaler = await wholesaler.save();
    return updatedWholesaler;
};

export default {
    getProfile,
    updateProfile,
};
