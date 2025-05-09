import express from "express";
import multer from "multer";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import SubCategory from "../models/SubCategory.js";
import { sanitizeDescription } from '../controllers/productController.js';
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
} from "../controllers/productController.js";

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

router.get("/category", optionalAuthenticate, getProductCategories);
router.get("/", optionalAuthenticate, getProducts);
router.get('/search',  optionalAuthenticate, searchProducts);
router.get("/subcategory", optionalAuthenticate, getProductSubCategories);
router.get("/all", optionalAuthenticate,  getAllProducts);
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

// router.delete("/:id", authorizeRole("superadmin"), async (req, res) => {
//   const { id } = req.params;

//   try {
//     const product = await Product.findById(id);
//     if (!product) {
//       return res.status(404).json({ error: "Product not found" });
//     }

//     const filesToDelete = [product.mainImage, ...product.galleryImages].filter(
//       Boolean
//     );
//     deleteFiles(filesToDelete);

//     await product.remove();

//     res.status(200).json({ message: "Product deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting product:", error);
//     res.status(500).json({ error: "Failed to delete product" });
//   }
// });

export default router;
