import Workspace from "../models/Workspace.js";
import WorkspaceGroup from "../models/WorkspaceGroup.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import sendNotification from "../utils/sendNotification.js";
import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";
import Favorite from "../models/Favorite.js";

export const getWorkspaceGroupById = async (req, res) => {
  try {
    const workspaceGroupId = req.params.id;

    if (!workspaceGroupId) {
      return res
        .status(400)
        .json({ message: "Workspace group ID is required" });
    }

    const workspaceGroup = await WorkspaceGroup.findById(workspaceGroupId);

    if (!workspaceGroup) {
      return res.status(404).json({ message: "Workspace group not found" });
    }

    res.status(200).json(workspaceGroup);
  } catch (error) {
    console.error("Error fetching workspace group:", error);
    res.status(500).json({ message: "Error fetching workspace group", error });
  }
};

export const getWorkspaceGroups = async (req, res) => {
  const { query } = req.query;

  const filter = query ? { workspaceName: { $regex: query, $options: "i" } } : {};

  try {
    const workspaceGroups = await WorkspaceGroup.find(filter);
    if (!workspaceGroups || workspaceGroups.length === 0) {
      return res.status(404).json({ message: "No workspace groups found" });
    }
    res.status(200).json(workspaceGroups);
  } catch (error) {
    console.error("Error fetching workspace groups:", error);
    res.status(500).json({ message: "Error fetching workspace groups", error });
  }
};

export const getWorkspaces = async (req, res) => {
  const { workspaceGroupId, userId, query } = req.query;
  try {
    const filter =
      req.user.role === "superadmin" ? {} : { userId: req.user.id };
    if (workspaceGroupId) {
      filter.workspaceGroupId = workspaceGroupId;
    }
    if (userId) {
      filter.userId = userId;
    }
    if (query) {
      filter.name = { $regex: query, $options: "i" };
    }
    const workspaces = await Workspace.find(filter).populate(
      "workspaceGroupId userId provinceId districtId countryId"
    );
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: "Error fetching workspaces", error });
  }
};
export const getWorkspacesPublic = async (req, res) => {
  const { workspaceGroupId, userId, query } = req.query;
  try {
    const filter = {};
    if (workspaceGroupId) {
      filter.workspaceGroupId = workspaceGroupId;
    }
    if (userId) {
      filter.userId = userId;
    }
    if (query) {
      filter.name = { $regex: query, $options: "i" };
    }
    const workspaces = await Workspace.find(filter).populate(
      "workspaceGroupId userId provinceId districtId countryId"
    );
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: "Error fetching workspaces", error });
  }
};


export const getWorkspaceById = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    const query = { _id: workspaceId };

    if (req.user.role !== "superadmin") {
      query.userId = req.user.id;
    }

    const workspace = await Workspace.findOne(query).populate(
      "workspaceGroupId userId provinceId districtId countryId"
    );

    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Workspace not found or access denied" });
    }

    const workspaceObj = workspace.toObject();

    if (req.user) {
      const favorite = await Favorite.findOne({
        itemId: workspace._id,
        userId: req.user.id,
      });
      workspaceObj.isFavorite = !!favorite || false;
    }

    res.status(200).json(workspaceObj);
  } catch (error) {
    console.error("Error fetching workspace:", error);
    res.status(500).json({ message: "Error fetching workspace", error });
  }
};

export const getWorkspaceById1 = async (req, res) => {
  try {
    const workspaceId = req.params.id;

  
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ message: "Invalid workspace ID format" });
    }

    const query = { _id: workspaceId };

    if (req.user.role !== "superadmin") {
      query.userId = req.user._id;
    }

    const workspace = await Workspace.findById(workspaceId)
      .populate({
        path: "userId",
        model: "User",
        select: "fullName profileImage phoneNumber isActive",
        match: { isActive: true },
      })
      .populate("provinceId districtId countryId", "name")
      .lean();

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found or access denied",
        errorCode: "WORKSPACE_NOT_FOUND",
      });
    }

    const publicWorkspace = {
      ...workspace,
      certificationFile: undefined,
      userId: {
        fullName: workspace.userId?.fullName,
        profileImage: workspace.userId?.profileImage,
        phoneNumber: workspace.userId?.phoneNumber,
        whatsappNumber: workspace.userId?.whatsappNumber,
      },
    };

   
    delete workspace.__v;
    if (workspace.userId?.password) delete workspace.userId.password;

    res.status(200).json(publicWorkspace);
  } catch (error) {
    console.error("Error fetching workspace:", error);
    res.status(500).json({
      message: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
};

export const createWorkspace = async (req, res) => {
  try {
    const { files, body } = req;

    const images = files.images
      ? files.images.map((file) => file.path.replace("\\\\", "/"))
      : [];
    const certificationFile = files.certificationFile
      ? files.certificationFile[0].path.replace("\\\\", "/")
      : null;

    if (!body.workspaceGroupId) {
      return res
        .status(400)
        .json({ message: "Workspace group ID is required" });
    }

    const workspaceGroup = await WorkspaceGroup.findById(body.workspaceGroupId);
    if (!workspaceGroup) {
      return res.status(400).json({ message: "Invalid workspace group ID" });
    }

    const workspace = new Workspace({
      ...body,
      images,
      certificationFile,
      userId: req.user.id,
    });

    await workspace.save();

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `New workspace created`,
        content: `${req.user.fullName} created workspace (${workspace.name}).`,
        from: req.user.id,
      });
      await notification.save();

      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }

    res.status(201).json(workspace);
  } catch (error) {
    if (error.code === 11000) {
      const duplicateError = Object.entries(error.keyValue);
      const duplicateField = duplicateError[0][0];
      const duplicateValue = duplicateError[0][1];

      return res.status(409).json({
        message: `${duplicateField} ${duplicateValue} already exists`,
        duplicateField,
      });
    }
    console.error("Error creating workspace:", error);
    res.status(400).json({
      message: "Error creating workspace",
      error: error.message || error,
    });
  }
};

export const updateWorkspace = async (req, res) => {
  try {
    const { files, body } = req;
    

    let deletedImages = [];
    if (Array.isArray(body.deletedImages)) {
      deletedImages = body.deletedImages;
    } else if (body.deletedImages) {
      deletedImages = [body.deletedImages];
    }

    const workspace = await Workspace.findById(req.params.id);

    if (
      !workspace ||
      (workspace.userId.toString() !== req.user.id &&
        req.user.role !== "superadmin")
    ) {
      return res
        .status(404)
        .json({ message: "Workspace not found or access denied." });
    }

    const normalizePath = (path) => path.replace(/\\/g, "/").toLowerCase();

    let updatedImages = workspace.images.filter((img) => {
      const normalizedImg = normalizePath(img);
      return !deletedImages.some(
        (deleted) => normalizePath(deleted) === normalizedImg
      );
    });

    if (files.images) {
      const newImages = files.images.map((file) =>
        file.path.replace(/\\/g, "/")
      );
      updatedImages = [...updatedImages, ...newImages];
    }

    const updateData = {
      ...body,
      images: updatedImages,
    };

    if (files.certificationFile) {
      updateData.certificationFile = files.certificationFile[0].path.replace(
        /\\/g,
        "/"
      );
    }

    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("workspaceGroupId userId provinceId districtId countryId");

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `Workspace Updated`,
        content: `${req.user.fullName} updated workspace (${workspace.name}).`,
        from: req.user.id,
      });
      await notification.save();

      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }
    res.status(200).json(updatedWorkspace);
  } catch (error) {
    console.error("Error updating workspace:", error);
    res.status(400).json({
      message: "Error updating workspace",
      error: error.message,
    });
  }
};

export const createWorkspaceGroup = async (req, res) => {
  try {
    const { workspaceName } = req.body;

    if (!workspaceName) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const existingWorkspaceGroup = await WorkspaceGroup.find({ workspaceName });
    if (existingWorkspaceGroup) {
      return res.status(409).json({
        message: `Workspace group (${workspaceName}) already exists`,
        duplicateField: workspaceName,
      });
    }

    const newGroup = new WorkspaceGroup({ workspaceName });
    await newGroup.save();

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `New Workspace Group Created`,
        content: `${req.user.fullName} created workspace group (${newGroup.name}).`,
        from: req.user.id,
      });
      await notification.save();

      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }

    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error creating workspace group:", error);
    res.status(500).json({ message: "Error creating workspace group", error });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (
      !workspace ||
      (req.user.role !== "superadmin" &&
        workspace.userId.toString() !== req.user.id)
    ) {
      return res
        .status(404)
        .json({ message: "Workspace not found or access denied" });
    }
    const deletedWorkspace = await Workspace.findByIdAndDelete(req.params.id);
    const to = await User.findOne({ role: "superadmin" });

    const notification = new Notification({
      to: to?._id,
      title: `Workspace (${deletedWorkspace.name}) deleted`,
      content: `${req.user.fullName} deleted workspace (${workspace.name}).`,
      from: req.user.id,
    });

    await notification.save();
    sendNotification(to?._id, { ...notification.toJSON(), from: req.user });
    res.status(200).json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.log("Error deleting workspace:", error);
    res.status(500).json({ message: "Error deleting workspace", error });
  }
};

export const updateWorkspaceGroup = async (req, res) => {
  try {
    const { workspaceName } = req.body;
    const { id } = req.params;

    if (!workspaceName) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const updatedGroup = await WorkspaceGroup.findByIdAndUpdate(
      id,
      { workspaceName },
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ message: "Workspace group not found" });
    }

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `Workspace Group Updated`,
        content: `${req.user.fullName} updated workspace group (${updatedGroup.workspaceName}).`,
        from: req.user.id,
      });
      await notification.save();
      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error updating workspace group:", error);
    res.status(500).json({ message: "Error updating workspace group", error });
  }
};

export const deleteWorkspaceGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await WorkspaceGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Workspace group not found" });
    }

 
    const relatedWorkspaces = await Workspace.find({ workspaceGroupId: id });
    if (relatedWorkspaces.length > 0) {
      return res.status(400).json({
        message: "Cannot delete workspace group with associated workspaces",
      });
    }

    await WorkspaceGroup.findByIdAndDelete(id);

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `Workspace Group Deleted`,
        content: `${req.user.fullName} deleted workspace group (${group.workspaceName}).`,
        from: req.user.id,
      });
      await notification.save();
      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }

    res.status(200).json({ message: "Workspace group deleted successfully" });
  } catch (error) {
    console.error("Error deleting workspace group:", error);
    res.status(500).json({ message: "Error deleting workspace group", error });
  }
};
