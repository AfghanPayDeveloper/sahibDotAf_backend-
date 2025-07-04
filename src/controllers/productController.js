// const Product = require("../src/schemas/product.schema");

import Notification from "../models/Notification.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import sendNotification from "../utils/sendNotification.js";
import sanitizeHtml from "sanitize-html";
import Category from "../models/Category.js";
import SubCategory from "../models/SubCategory.js";
import path from "path";
import fs from "fs";
import Favorite from "../models/Favorite.js";
import removeFavoriteForDeletedItem from "../utils/removeFavorite.js";

const deleteFiles = (files) => {
  files.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

export const getProducts = async (req, res) => {
  const {
    workspaceId,
    approved,
    categoryId,
    subcategoryId,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
    search,
  } = req.query;
  const userRole = req.user?.role;

  try {
    const filter = { workspaceId };

    if (!userRole) {
      filter.isApproved = true;
      filter.isActive = true;
    } else {
      if (userRole !== "superadmin" && !workspaceId) {
        return res.status(400).json({
          error: "Workspace ID is required for non-superadmin users",
        });
      }
      if (workspaceId) filter.workspaceId = workspaceId;
      if (approved === "true") filter.isApproved = true;
    }

    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (categoryId) filter.categoryId = categoryId;
    if (subcategoryId) filter.subcategoryId = subcategoryId;

    if (minPrice || maxPrice) {
      filter.newPrice = {};
      if (minPrice) filter.newPrice.$gte = Number(minPrice);
      if (maxPrice) filter.newPrice.$lte = Number(maxPrice);
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);
    const productIds = products.map((p) => p._id);

    const myFavorites = await Favorite.find({
      itemId: { $in: productIds },
      userId: req.user?.id,
    });
    const favItemsIds = myFavorites.map((f) => f.itemId);

    const formattedProducts = products.map((product) => ({
      ...product.toObject(),
      status: product.isApproved ? "approved" : "pending",
      isFavorite: favItemsIds.includes(product._id),
    }));

    res.json({
      products: formattedProducts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to retrieve products" });
  }
};

export const createProduct = async (req, res) => {
  const {
    workspaceId,
    categoryId,
    subcategoryId,
    productName,
    oldPrice,
    newPrice,
    description,
  } = req.body;

  if (!workspaceId || !categoryId || !productName) {
    return res.status(400).json({
      error:
        "Required fields are missing: workspaceId, categoryId, productName, or newPrice.",
    });
  }

  if (!req.files["mainImage"]) {
    return res.status(400).json({ error: "Main image is required" });
  }

  try {
    const newProduct = new Product({
      workspaceId,
      categoryId,
      subcategoryId,
      productName,
      description,
      oldPrice,
      newPrice,
      mainImage: `/uploads/${req.files["mainImage"][0].filename}`,
      galleryImages: req.files["galleryImages"]
        ? req.files["galleryImages"].map((file) => `/uploads/${file.filename}`)
        : [],
      isApproved: false,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
};

export const approveProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id).populate("workspaceId");
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.isApproved = true;
    await product.save();

    if (product.workspaceId) {
      const toUser = product.workspaceId.userId;
      if (toUser) {
        const notification = new Notification({
          to: toUser,
          title: `Product Approved`,
          content: `(${product.productName}) has been Approved by Sahib's Team`,
          from: req.user.id,
        });
        await notification.save();

        sendNotification(toUser, { ...notification.toJSON(), from: req.user });
      }
    }

    res.status(200).json({ message: "Product approved successfully", product });
  } catch (error) {
    console.error("Error approving product:", error);
    res.status(500).json({ error: "Failed to approve product" });
  }
};

export const unApproveProduct = async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;

  if (userRole !== "superadmin") {
    return res
      .status(403)
      .json({ error: "Only superadmins can unapprove products" });
  }

  try {
    const product = await Product.findById(id).populate("workspaceId");
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.isApproved = false;
    await product.save();

    if (product.workspaceId) {
      const toUser = product.workspaceId.userId;
      if (toUser) {
        const notification = new Notification({
          to: toUser,
          title: `Product Unapproved`,
          content: `(${product.productName}) has been Unapproved by Sahib's Team`,
          from: req.user.id,
        });
        await notification.save();

        sendNotification(toUser, { ...notification.toJSON(), from: req.user });
      }
    }

    res
      .status(200)
      .json({ message: "Product unapproved successfully", product });
  } catch (error) {
    console.error("Error unapproving product:", error);
    res.status(500).json({ error: "Failed to unapprove product" });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const { workspaceId } = req.body;
  const userRole = req.user.role;

  try {
    let product;

    if (userRole === "superadmin") {
      product = await Product.findById(id).populate("workspaceId");
    } else {
      product = await Product.findOne({ _id: id, workspaceId }).populate(
        "workspaceId"
      );
    }

    if (!product) {
      return res
        .status(404)
        .json({ error: "Product not found or access denied" });
    }

    const filesToDelete = [product.mainImage, ...product.galleryImages].filter(
      Boolean
    );
    deleteFiles(filesToDelete);

    await product.remove();

    await removeFavoriteForDeletedItem(product._id);

    if (req.user.role === "superadmin") {
      const toUser = product.workspaceId.userId;
      if (toUser) {
        const notification = new Notification({
          to: toUser,
          title: `Product Deleted`,
          from: req.user.id,
          content: `(${product.productName}) has been Deleted by Sahib's Team`,
          from: req.user.id,
        });
        await notification.save();

        sendNotification(toUser, { ...notification.toJSON(), from: req.user });
      }
    } else {
      const admin = await User.findOne({ role: "superadmin" });
      if (admin) {
        const notification = new Notification({
          to: admin._id,
          title: `Product Deleted`,
          from: req.user.id,
          content: `${req.user.fullName} deleted product (${product.productName}).`,
          from: req.user.id,
        });
        await notification.save();

        sendNotification(admin._id, {
          ...notification.toJSON(),
          from: req.user,
        });
      }
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate({
        path: "workspaceId",
        select: "name address userId whatsappNumber",
      });

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { query, category } = req.query;
    const searchFilter = {};

    if (query) {
      searchFilter.$or = [
        { productName: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (category) {
      // const categoryObj = await Category.findOne({
      //   name: { $regex: new RegExp(`^${category}$`, "i") },
      // });
      // if (!categoryObj) {
      //   return res.json({ products: [] });
      // }

      // searchFilter.categoryId = categoryObj._id;
      searchFilter.categoryId = category;
    }

    // Step 1: Get latest 20
    let latestProducts = await Product.find(searchFilter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("categoryId", "_id name")
      .populate("subcategoryId", "_id name");

    const latestIds = latestProducts.map((p) => p._id.toString());

    // Step 2: If less than 20, get more (excluding already fetched)
    let additionalProducts = [];
    if (latestProducts.length < 10) {
      additionalProducts = await Product.find({
        ...searchFilter,
        _id: { $nin: latestIds },
      })
        .limit(20 - latestProducts.length)
        .populate("categoryId", "_id name")
        .populate("subcategoryId", "_id name");
    }

    // Combine both
    const allProducts = [...latestProducts, ...additionalProducts];

    const formattedProducts = allProducts.map((product) => {
      const obj = product.toObject();
      return {
        ...obj,
        category: obj.categoryId?.name || null,
        subcategory: obj.subcategoryId?.name || null,
        status: obj.isApproved ? "approved" : "pending",
      };
    });

    res.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    workspaceId,
    categoryId,
    subcategoryId,
    productName,
    oldPrice,
    newPrice,
    description,
    deletedGalleryImages,
  } = req.body;

  if (!workspaceId || !categoryId || !productName || !newPrice) {
    return res.status(400).json({
      error:
        "Required fields are missing: workspaceId, categoryId, productName, or newPrice.",
    });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (req.files["mainImage"]) {
      const oldMainImagePath = path.join(process.cwd(), product.mainImage);
      if (fs.existsSync(oldMainImagePath)) {
        fs.unlinkSync(oldMainImagePath);
      }
      product.mainImage = `/uploads/${req.files["mainImage"][0].filename}`;
    }

    if (deletedGalleryImages && Array.isArray(deletedGalleryImages)) {
      deletedGalleryImages.forEach((imagePath) => {
        const oldImagePath = path.join(process.cwd(), imagePath);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      });
      product.galleryImages = product.galleryImages.filter(
        (img) => !deletedGalleryImages.includes(img)
      );
    }

    if (req.files["galleryImages"]) {
      const newGalleryImages = req.files["galleryImages"].map(
        (file) => `/uploads/${file.filename}`
      );
      product.galleryImages = [...product.galleryImages, ...newGalleryImages];
    }

    product.workspaceId = workspaceId;
    product.categoryId = categoryId;
    product.subcategoryId = subcategoryId;
    product.productName = productName;
    product.oldPrice = oldPrice;
    product.newPrice = newPrice;
    product.description = description;
    product.isApproved = false;
    await product.save();

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `Product updated`,
        content: `${req.user.fullName} updated (${product.productName}).`,
        from: req.user.id,
      });
      await notification.save();

      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

export const createProductCategory = async (req, res) => {
  const { name } = req.body;

  if (!name || !req.file) {
    return res.status(400).json({ error: "Name and image are required" });
  }

  try {
    const newCategory = new Category({
      name,
      image: `/uploads/${req.file.filename}`,
    });
    await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    if (req.file) {
      const filePath = path.join(process.cwd(), "uploads", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ error: "Failed to create category" });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const subcategories = await SubCategory.find({
      categoryId: id,
    });

    if (subcategories.length > 0) {
      return res.status(400).json({
        error: "Cannot delete category with existing subcategories",
      });
    } 

    if (category.image) {
      const filePath = path.join(process.cwd(), category.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await category.remove();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (req.file) {
      if (category.image) {
        const oldImagePath = path.join(process.cwd(), category.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      category.image = `/uploads/${req.file.filename}`;
    }

    category.name = name || category.name;
    await category.save();

    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

export const getProductCategories = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { query } = req.query;
  const filter = query
    ? {
        name: { $regex: query, $options: "i" },
      }
    : {};

  try {
    const categories = await Category.find(filter)
      .skip((page - 1) * page)
      .limit(limit);
    const total = await Product.countDocuments(filter);

    res.json({ categories, total });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to retrieve categories" });
  }
};

export const createProductSubCategory = async (req, res) => {
  console.log("Received files:", req.file);
  console.log("Received body:", req.body);
  const { name, categoryId } = req.body;

  if (!name || !categoryId || !req.file) {
    return res.status(400).json({
      error: "Name, category ID, and image are required",
    });
  }

  try {
    const newSubCategory = new SubCategory({
      name,
      categoryId,
      image: `/uploads/${req.file.filename}`,
    });
    await newSubCategory.save();

    res.status(201).json({
      message: "SubCategory created successfully",
      subcategory: newSubCategory,
    });
  } catch (error) {
    console.error("Error creating subcategory:", error);
    if (req.file) {
      const filePath = path.join(process.cwd(), "uploads", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ error: "Failed to create subcategory" });
  }
};

export const updateSubCategory = async (req, res) => {
  const { id } = req.params;
  const { name, categoryId } = req.body;

  try {
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({ error: "SubCategory not found" });
    }

    if (req.file) {
      if (subCategory.image) {
        const oldImagePath = path.join(process.cwd(), subCategory.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      subCategory.image = `/uploads/${req.file.filename}`;
    }

    subCategory.name = name || subCategory.name;
    subCategory.categoryId = categoryId || subCategory.categoryId;
    await subCategory.save();

    res.status(200).json({
      message: "SubCategory updated successfully",
      subcategory: subCategory,
    });
  } catch (error) {
    console.error("Error updating subcategory:", error);
    res.status(500).json({ error: "Failed to update subcategory" });
  }
};

export const deleteSubCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({ error: "SubCategory not found" });
    }

    if (subCategory.image) {
      const imagePath = path.join(process.cwd(), subCategory.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await subCategory.remove();
    res.status(200).json({ message: "SubCategory deleted successfully" });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    res.status(500).json({ error: "Failed to delete subcategory" });
  }
};

export const getProductSubCategories = async (req, res) => {
  const { categoryId, query } = req.query;

  try {
    const filter = categoryId ? { categoryId } : {};
    if (query) {
      filter.name = { $regex: query, $options: "i" };
    }
    const subcategories = await SubCategory.find(filter);

    res.json({ subcategories });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ error: "Failed to retrieve subcategories" });
  }
};

export const getAllProducts = async (req, res) => {
  const { page = 1, limit = 10, query } = req.query;
  try {
    const filter = {};

    if (query) {
      filter.$or = [
        { productName: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name")
        .populate("subcategoryId", "name")
        .populate("workspaceId")
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    const productIds = products.map((p) => p._id);

    const myFavorites = await Favorite.find({
      itemId: { $in: productIds },
      userId: req.user?.id,
    });
    const favItemsIds = myFavorites.map((f) => f.itemId.toString());

    const formattedProducts = products.map((product) => {
      return {
        ...product.toObject(),
        isFavorite: favItemsIds.includes(product._id.toString()),
      };
    });

    res.json({
      products: formattedProducts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const activateProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      message: "Product activated successfully",
      product,
    });
  } catch (error) {
    console.error("Error activating product:", error);
    res.status(500).json({ error: "Failed to activate product" });
  }
};

export const deactivateProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.isActive = false;
    await product.save();

    res.status(200).json({
      message: "Product deactivated successfully",
      product,
    });
  } catch (error) {
    console.error("Error deactivating product:", error);
    res.status(500).json({ error: "Failed to deactivate product" });
  }
};

export const getMinMaxPrice = async (req, res) => {
  try {
    const result = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$newPrice" },
          maxPrice: { $max: "$newPrice" },
        },
      },
    ]);

    if (result.length === 0) {
      return res.json({ minPrice: null, maxPrice: null });
    }

    res.json({
      minPrice: result[0].minPrice,
      maxPrice: result[0].maxPrice,
    });
  } catch (error) {
    console.error("Error getting min/max price:", error);
    res.status(500).json({ error: "Failed to get min/max price" });
  }
}

export const getTopViewedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isApproved: true, isActive: true })
      .sort({ viewCount: -1 })  // descending order
      .limit(20);

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching top viewed products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
