import express from "express";
import multer from "multer";
import Service from "../models/Service.js";
import {
  authenticateToken as authenticate,
  optionalAuthenticate,
} from "../middleware/auth.js";
import path from "path";
import fs from "fs";
import { sanitizeDescription } from "../utils/sanitizer.js";

const router = express.Router();
const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(
      /[^a-zA-Z0-9.]/g,
      "_"
    )}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const deleteFiles = (files) => {
  files.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

router.use(optionalAuthenticate);

router.post(
  "/",
  authenticate,
  sanitizeDescription,
  upload.fields([
    { name: "serviceThumbnailImage", maxCount: 1 },
    { name: "serviceImages", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const { workspaceId, serviceName, serviceDescription, status } = req.body;

      const serviceThumbnailImage = req.files[
        "serviceThumbnailImage"
      ]?.[0]?.path.replace(process.cwd(), "");
      const serviceImages = req.files["serviceImages"]?.map((file) =>
        file.path.replace(process.cwd(), "")
      );

      const newService = new Service({
        workspaceId,
        serviceName,
        serviceDescription,
        serviceThumbnailImage,
        serviceImages,
        status,
      });

      const savedService = await newService.save();
      res.status(201).json({ success: true, data: savedService });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to create service",
        error: error.message,
      });
    }
  }
);

router.get("/", authenticate, async (req, res) => {
  try {
    const { workspaceId, approved } = req.query;

    const query = { isDeleted: false };
    if (workspaceId) query.workspaceId = workspaceId;
    if (approved) query.isApproved = approved === "true";

    const services = await Service.find(query);
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error.message,
    });
  }
});

router.patch(
  "/:id",
  authenticate,
  upload.fields([
    { name: "serviceThumbnailImage", maxCount: 1 },
    { name: "serviceImages", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { serviceName, serviceDescription, status } = req.body;

      const service = await Service.findById(id);
      if (!service || service.isDeleted) {
        return res
          .status(404)
          .json({ success: false, message: "Service not found" });
      }

      if (req.files["serviceThumbnailImage"]) {
        if (service.serviceThumbnailImage)
          deleteFiles([service.serviceThumbnailImage]);
        service.serviceThumbnailImage = req.files[
          "serviceThumbnailImage"
        ][0]?.path.replace(process.cwd(), "");
      }

      if (req.files["serviceImages"]) {
        deleteFiles(service.serviceImages);
        service.serviceImages = req.files["serviceImages"]?.map((file) =>
          file.path.replace(process.cwd(), "")
        );
      }

      service.serviceName = serviceName || service.serviceName;
      service.serviceDescription = serviceDescription
        ? JSON.parse(serviceDescription)
        : service.serviceDescription;
      service.status = status !== undefined ? status : service.status;

      const updatedService = await service.save();
      res.status(200).json({ success: true, data: updatedService });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to update service",
        error: error.message,
      });
    }
  }
);

router.patch("/:id/approve", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service || service.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    const updatedService = await service.approve();
    res.status(200).json({ success: true, data: updatedService });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to approve service",
      error: error.message,
    });
  }
});

router.put(
  "/:id",
  authenticate,
  sanitizeDescription,
  upload.fields([
    { name: "serviceThumbnailImage", maxCount: 1 },
    { name: "serviceImages", maxCount: 5 },
  ]),
  async (req, res) => {
    const { id } = req.params;
    const {
      workspaceId,
      serviceName,
      serviceDescription,
      deletedServiceImages,
    } = req.body;

    if (!workspaceId || !serviceName) {
      return res.status(400).json({
        error: "Required fields are missing: workspaceId, serviceName",
      });
    }

    try {
      const service = await Service.findById(id);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      if (req.files["serviceThumbnailImage"]) {
        if (service.serviceThumbnailImage) {
          const oldServiceThumbnailImagePath = path.join(
            process.cwd(),
            service.serviceThumbnailImage
          );
          if (fs.existsSync(oldServiceThumbnailImagePath)) {
            fs.unlinkSync(oldServiceThumbnailImagePath);
          }
        }
        service.serviceThumbnailImage = `/uploads/${req.files["serviceThumbnailImage"][0].filename}`;
      }

      if (deletedServiceImages && Array.isArray(deletedServiceImages)) {
        deletedServiceImages.forEach((ServiceImagesPath) => {
          const oldServiceImagesPath = path.join(
            process.cwd(),
            ServiceImagesPath
          );
          if (fs.existsSync(oldServiceImagesPath)) {
            fs.unlinkSync(oldServiceImagesPath);
          }
        });
        service.serviceImages = service.serviceImages.filter(
          (img) => !deletedServiceImages.includes(img)
        );
      }

      if (req.files["serviceImages"]) {
        const newServiceImages = req.files["serviceImages"].map(
          (file) => `/uploads/${file.filename}`
        );
        service.serviceImages = [...service.serviceImages, ...newServiceImages];
      }

      service.workspaceId = workspaceId;
      service.serviceName = serviceName;
      service.serviceDescription = serviceDescription;

      await service.save();

      res
        .status(200)
        .json({ message: "Service updated successfully", service });
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  }
);

router.patch("/:id/unapprove", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service || service.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    service.isApproved = false;
    const updatedService = await service.save();
    res.status(200).json({ success: true, data: updatedService });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to unapprove service",
      error: error.message,
    });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service || service.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    service.isDeleted = true;
    await service.save();

    res
      .status(200)
      .json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete service",
      error: error.message,
    });
  }
});

export default router;
