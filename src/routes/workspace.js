import express from 'express';
import multer from 'multer';
import Workspace from '../models/Workspace.js';
import WorkspaceGroup from '../models/WorkspaceGroup.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });


router.get('/workspaceGroups', authenticateToken, async (req, res) => {
  try {
    const workspaceGroups = await WorkspaceGroup.find();
    if (!workspaceGroups || workspaceGroups.length === 0) {
      return res.status(404).json({ message: 'No workspace groups found' });
    }
    res.status(200).json(workspaceGroups);
  } catch (error) {
    console.error('Error fetching workspace groups:', error);
    res.status(500).json({ message: 'Error fetching workspace groups', error });
  }
});


router.get('/', authenticateToken, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ userId: req.user.id })
      .populate('workspaceGroupId userId provinceId districtId countryId');
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workspaces', error });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const workspaceId = req.params.id;
      const userId = req.user.id;
  
      const workspace = await Workspace.findOne({ _id: workspaceId, userId })
        .populate('workspaceGroupId userId provinceId districtId countryId');
  
      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found or access denied' });
      }
  
      res.status(200).json(workspace);
    } catch (error) {
      console.error('Error fetching workspace:', error);
      res.status(500).json({ message: 'Error fetching workspace', error });
    }
  });

router.post('/', authenticateToken, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'certificationFile', maxCount: 1 },
]), async (req, res) => {
  try {
    const { files, body } = req;

    const images = files.images ? files.images.map(file => file.path.replace('\\\\', '/')) : [];
    const certificationFile = files.certificationFile ? files.certificationFile[0].path.replace('\\\\', '/') : null;

    if (!body.workspaceGroupId) {
      return res.status(400).json({ message: 'Workspace group ID is required' });
    }

    const workspaceGroup = await WorkspaceGroup.findById(body.workspaceGroupId);
    if (!workspaceGroup) {
      return res.status(400).json({ message: 'Invalid workspace group ID' });
    }

    const workspace = new Workspace({
      ...body,
      images,
      certificationFile,
      userId: req.user.id,
    });

    await workspace.save();
    res.status(201).json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(400).json({ message: 'Error creating workspace', error: error.message || error });
  }
});

router.get('/workspaceGroups/:id', authenticateToken, async (req, res) => {
  try {
    const workspaceGroupId = req.params.id;

    if (!workspaceGroupId) {
      return res.status(400).json({ message: 'Workspace group ID is required' });
    }

    const workspaceGroup = await WorkspaceGroup.findById(workspaceGroupId);

    if (!workspaceGroup) {
      return res.status(404).json({ message: 'Workspace group not found' });
    }

    res.status(200).json(workspaceGroup);
  } catch (error) {
    console.error('Error fetching workspace group:', error);
    res.status(500).json({ message: 'Error fetching workspace group', error });
  }
});


router.put('/:id', authenticateToken, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'certificationFile', maxCount: 1 },
]), async (req, res) => {
  try {
    const { files, body } = req;

    const images = files.images ? files.images.map(file => file.path.replace('\\\\', '/')) : undefined;
    const certificationFile = files.certificationFile ? files.certificationFile[0].path.replace('\\\\', '/') : undefined;

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace || workspace.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Workspace not found or access denied' });
    }

    const updateData = { ...body };
    if (images) updateData.images = images;
    if (certificationFile) updateData.certificationFile = certificationFile;

    const updatedWorkspace = await Workspace.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.status(200).json(updatedWorkspace);
  } catch (error) {
    res.status(400).json({ message: 'Error updating workspace', error });
  }
});

router.post('/workspaceGroups', authenticateToken, async (req, res) => {
  try {
    const { workspaceName } = req.body;


    if (!workspaceName) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }


    const newGroup = new WorkspaceGroup({ workspaceName });
    await newGroup.save();

    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating workspace group:', error);
    res.status(500).json({ message: 'Error creating workspace group', error });
  }
});


router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace || workspace.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Workspace not found or access denied' });
    }

    await Workspace.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workspace', error });
  }
});



export default router;
