import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_online: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ['seller', 'buyer', 'superadmin'],
      default: 'buyer',
    },
    purpose: { type: String },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      validate: {
        validator: function (v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: props => `${props.value} is not a valid ObjectId!`
      }
    },
    province_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
      validate: {
        validator: function (v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: props => `${props.value} is not a valid ObjectId!`
      }
    },
    district_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      validate: {
        validator: function (v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: props => `${props.value} is not a valid ObjectId!`
      }
    },
    zipCode: { type: String },
    phone: { type: String },
    profileImage: { type: String },
    address: { type: String },
    city: { type: String },
    whatsapp: { type: String },
    date: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
    lastSeen: { type: Date },
  },
  { timestamps: true }
);


userSchema.pre('save', async function (next) {
  if (this.isModified('password') && !this.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});


userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
