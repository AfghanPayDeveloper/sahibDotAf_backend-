import mongoose from 'mongoose';

const workspaceGroupSchema = new mongoose.Schema({
  workspaceName: {
    type: String,
    required: true,
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
},
{timestamps: true}

);

const WorkspaceGroup = mongoose.model('WorkspaceGroup', workspaceGroupSchema);


export default WorkspaceGroup;
