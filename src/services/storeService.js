import storeModel from '../models/store.js'; // Rename the import for clarity
import fs from 'fs';
import path from 'path';

const getProfile = async (userId) => {
    return await storeModel.findOne({ userId });
};

const updateProfile = async (userId, data, files, imagesToRemove = []) => {
    let store = await storeModel.findOne({ userId }); // Use the renamed model here

    if (!store) {
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

    store.fullName = fullName || store.fullName;
    store.email = email || store.email;
    store.business = business || store.business;
    store.address = address || store.address;
    store.city = city || store.city;
    store.zip = zip || store.zip;
    store.whatsapp = whatsapp || store.whatsapp;
    store.phone = phone || store.phone;

    store.brandProfile = {
        brandName: brandName || store.brandProfile?.brandName,
        brandEmail: brandEmail || store.brandProfile?.brandEmail,
        certificateNo: certificateNo || store.brandProfile?.certificateNo,
        brandAddress: brandAddress || store.brandProfile?.brandAddress,
        brandCity: brandCity || store.brandProfile?.brandCity,
        brandZipCode: brandZipCode || store.brandProfile?.brandZipCode,
        description: description || store.brandProfile?.description,
        brandPhone: brandPhone || store.brandProfile?.brandPhone,
        brandWhatsapp: brandWhatsapp || store.brandProfile?.brandWhatsapp,
    };

    store.brandProfile.images = store.brandProfile.images || [];

    if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
        const imagesToRemoveParsed = imagesToRemove.map(image => image);

        store.brandProfile.images = store.brandProfile.images.filter(image => !imagesToRemoveParsed.includes(image));

        imagesToRemoveParsed.forEach(imagePath => {
            try {
                const filePath = path.join(__dirname, '../uploads', imagePath.split('/uploads/')[1]);
                console.log(`Deleting image: ${filePath}`);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        });
    }

    if (files['profileImage'] && files['profileImage'][0]) {
        store.profileImage = `/uploads/${files['profileImage'][0].filename}`;
    }
    if (files['brandProfileImage'] && files['brandProfileImage'][0]) {
        store.brandProfile.brandProfileImage = `/uploads/${files['brandProfileImage'][0].filename}`;
    }
    if (files['brandCertificate'] && files['brandCertificate'][0]) {
        store.brandProfile.certificate = `/uploads/${files['brandCertificate'][0].filename}`;
    }

    if (files['images']) {
        const newImages = files['images'] ? files['images'].map(file => `/uploads/${file.filename}`) : [];
        store.brandProfile.images = store.brandProfile.images.concat(newImages);
    }

    const updatedStore = await store.save();
    return updatedStore;
};

export default {
    getProfile,
    updateProfile,
};
