import mongoose from 'mongoose';

const wholesalerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  fullName: { type: String },
  email: { type: String },
  business: { type: String },
  address: { type: String },
  city: { type: String },
  zip: { type: String },
  phone: { type: String },
  whatsapp: { type: String },
  profileImage: { type: String },

  brandProfile: {
    brandName: { type: String },
    brandEmail: { type: String },
    certificateNo: { type: String },
    brandAddress: { type: String },
    brandCity: { type: String },
    brandZipCode: { type: String },
    description: { type: String },
    brandProfileImage: { type: String },
    brandPhone: { type: String },
    brandWhatsapp: { type: String },
    certificate: { type: String }, 
    images: [{ type: String }],    
  }
}, { timestamps: true });

const Wholesaler = mongoose.model('Wholesaler', wholesalerSchema);
export default Wholesaler;
