import express from "express";
import multer from "multer";
import { validateObjectId } from "../middleware/ValidateObjectId.js";
import {
  authenticateToken as authenticate,
  authorizeRole,
  optionalAuthenticate,
} from "../middleware/auth.js";
import path from "path";
import fs from "fs";
import {
  activateProduct,
  approveProduct,
  createProduct,
  createProductCategory,
  createProductSubCategory,
  deleteProduct,
  updateCategory,
  getAllProducts,
  searchProducts,
  deleteSubCategory,
  getProductById,
  getProductCategories,
  updateSubCategory,
  getProducts,
  deactivateProduct,
  deleteCategory,
  getProductSubCategories,
  unApproveProduct,
  updateProduct,
  getMinMaxPrice,
  getTopViewedProducts,
} from "../controllers/productController.js";
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

router.get("/min-max-price", getMinMaxPrice)
router.get("/category", optionalAuthenticate, getProductCategories);
router.get("/", optionalAuthenticate, getProducts);
router.get('/search',  optionalAuthenticate, searchProducts);
router.get("/subcategory", optionalAuthenticate, getProductSubCategories);
router.get("/all", optionalAuthenticate,   getAllProducts);
router.get('/most-viewed', getTopViewedProducts);
router.get('/:id', optionalAuthenticate, validateObjectId, getProductById);
router.use(authenticate);

router.post(
  "/",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 5 },
  ]),
  sanitizeDescription,
  createProduct
);



router.patch("/:id/approve", authorizeRole("superadmin"), approveProduct);

router.patch("/:id/unapprove", authorizeRole("superadmin"), unApproveProduct);

router.delete("/:id", deleteProduct);



router.put(
  "/:id",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 5 },
  ]),
  sanitizeDescription,
  updateProduct
);

router.post(
  "/category", 
  upload.single('image'),
  createProductCategory
);
router.put('/category/:id', 
  upload.single('image'), 
  updateCategory
);

router.delete('/category/:id', 
  authorizeRole('superadmin'),
  deleteCategory
);

router.delete("/subcategory/:id", deleteSubCategory);
router.put(
  "/subcategory/:id",
  upload.single('image'),
  updateSubCategory
);


router.post(
  "/subcategory",
  upload.single('image'), 
  createProductSubCategory
);




// router.get("/all", authorizeRole("superadmin"), getAllProducts);

router.patch("/:id/activate",  activateProduct);
router.patch("/:id/deactivate",  deactivateProduct);


export default router;
