import express from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/auth.js";
import {
  createWorkspace,
  createWorkspaceGroup,
  deleteWorkspace,
  getWorkspaceById,
  getWorkspaceGroupById,
  getWorkspaceGroups,
  getWorkspaces,
  updateWorkspace,
} from "../controllers/workspaceController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.use(authenticateToken);

router.get("/", getWorkspaces);

router.get("/workspaceGroups", getWorkspaceGroups);

router.post("/workspaceGroups", createWorkspaceGroup);

router.get("/:id", getWorkspaceById);

router.delete("/:id", deleteWorkspace);

router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "certificationFile", maxCount: 1 },
  ]),
  createWorkspace
);

router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "certificationFile", maxCount: 1 },
  ]),
  updateWorkspace
);

router.get("/workspaceGroups/:id", getWorkspaceGroupById);

export default router;
