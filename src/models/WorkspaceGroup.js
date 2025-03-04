import mongoose from 'mongoose';

const workspaceGroupSchema = new mongoose.Schema({
  workspaceName: {
    type: String,
    required: true,
  },
},
{timestamps: true}

);

const WorkspaceGroup = mongoose.model('WorkspaceGroup', workspaceGroupSchema);


export default WorkspaceGroup;
