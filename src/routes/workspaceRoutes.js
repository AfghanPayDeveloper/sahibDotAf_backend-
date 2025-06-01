import express from "express";
import multer from "multer";
import { authenticateToken, optionalAuthenticate } from "../middleware/auth.js";
import {
  createWorkspace,
  createWorkspaceGroup,
  deleteWorkspace,
  deleteWorkspaceGroup,
  updateWorkspaceGroup,
  getWorkspaceById,
  getWorkspaceGroupById,
  getWorkspaceGroups,
  getWorkspaces,
  updateWorkspace,
  getWorkspacesPublic,
} from "../controllers/workspaceController.js";
import { sanitizeDescription } from "../utils/sanitizer.js";

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

router.use(optionalAuthenticate);

router.get("/", getWorkspaces);
router.get("/Public", getWorkspacesPublic)

router.get("/workspaceGroups", getWorkspaceGroups);

router.get("/:id", getWorkspaceById);

router.get("/workspaceGroups/:id", getWorkspaceGroupById);

router.use(authenticateToken);

router.post("/workspaceGroups", createWorkspaceGroup);

router.put("/workspaceGroups/:id", updateWorkspaceGroup);

router.delete("/workspaceGroups/:id", deleteWorkspaceGroup);

router.delete("/:id", deleteWorkspace);

router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "certificationFile", maxCount: 1 },
  ]),
   sanitizeDescription,
  createWorkspace
);

router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "certificationFile", maxCount: 1 },
  ]),
  sanitizeDescription,
  updateWorkspace
);

export default router;
