import express from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/auth.js";
import {


  getWorkspaceById1,

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


router.get("/:id", getWorkspaceById1);


export default router;
