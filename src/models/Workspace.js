import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  workspaceGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceGroup',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'], 
  },
  whatsappNumber: {
    type: String,
    validate: {
      validator: (v) => /^[0-9]{10,15}$/.test(v), 
      message: 'Invalid WhatsApp number format',
    },
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: (v) => /^[0-9]{10,15}$/.test(v), 
      message: 'Invalid phone number format',
    },
  },
  certificateNo: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    validate: {
      validator: (v) => /^[0-9]{5,6}$/.test(v), 
      message: 'Invalid zip code format',
    },
  },
  provinceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Province',
  },
  districtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
  },
  countryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  },
  description: {
    type: String,
    validate: {
      validator: function(value) {
        const stripped = value.replace(/<[^>]+>/g, '').trim();
        return stripped.length >= 2 && stripped.length <= 5000;
      },
      message: 'Description must contain between 20 and 5000 characters (after removing HTML tags)'
    }
  },

  certificationFile: {
    type: String,
  },
  
  images: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now, 
  },
  updatedAt: {
    type: Date,
    default: Date.now,  
  },
});


workspaceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Workspace = mongoose.model('Workspace', workspaceSchema);

export default Workspace;
