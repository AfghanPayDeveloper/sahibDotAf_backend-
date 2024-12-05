import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  fullName: { type: String },
  email: { type: String },
  position: { type: String },
  address: { type: String },
  city: { type: String },
  zip: { type: String },
  phone: { type: String },
  whatsapp: { type: String },
  profileImage: { type: String },

  hotelProfile: {
    hotelName: { type: String },
    hotelEmail: { type: String },
    hotelCertificateNo: { type: String },
    hotelAddress: { type: String },
    hotelCity: { type: String },
    hotelZipCode: { type: String },
    hotelDescription: { type: String },
    hotelProfileImage: { type: String },
    hotelPhone: { type: String },
    hotelWhatsapp: { type: String },
    hotelCertificate: { type: String }, 
    hotelImages: [{ type: String }],    
  },
  hotelHalls: {
    hallName: { type: String },
    hallDescription: { type: String },
    hallPrice: { type: String },
    hallImages: [{ type: String }],    
  },
  hotelRooms: {
    roomName: { type: String },
    roomType: { type: String },
    roomDescription: { type: String },
    roomPrice: { type: String },
    roomImages: [{ type: String }],    
  }
}, { timestamps: true });

const hotel = mongoose.model('hotel', hotelSchema);
export default hotel;
