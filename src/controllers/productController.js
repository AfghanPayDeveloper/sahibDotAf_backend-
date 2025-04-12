// const Product = require("../src/schemas/product.schema");

import Notification from "../models/Notification.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import sendNotification from "../utils/sendNotification.js";

import express from "express";
import multer from "multer";
import Category from "../models/Category.js";
import SubCategory from "../models/SubCategory.js";
import {
  authenticateToken as authenticate,
  authorizeRole,
} from "../middleware/auth.js";
import path from "path";
import fs from "fs";

export const getProducts = async (req, res) => {
  const { workspaceId, approved } = req.query;
  const userRole = req.user.role;

  try {
    const filter = { workspaceId };
    if (userRole !== "superadmin") {
      if (!workspaceId) {
        return res
          .status(400)
          .json({ error: "Workspace ID is required for non-superadmin users" });
      }
      filter.workspaceId = workspaceId;
    }
    if (approved === "true") {
      filter.isApproved = true;
    }

    const products = await Product.find(filter);

    const formattedProducts = products.map((product) => ({
      ...product.toObject(),
      status: product.isApproved ? "approved" : "pending",
    }));

    res.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to retrieve products" });
  }
};

const deleteFiles = (files) => {
  files.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
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

  if (!workspaceId || !categoryId || !productName || !newPrice) {
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

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `New Product created`,
        content: `${req.user.fullName} created product (${newProduct.productName}).`,
      });
      await notification.save();

      sendNotification(admin._id, notification.toJSON());
    }
    res.status(201).json({
      message: "Product created successfully, awaiting approval",
      product: newProduct,
    });
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
          content: `(${product.productName}) has been Approved by Our Team`,
        });
        await notification.save();

        sendNotification(toUser, notification.toJSON());
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
          content: `(${product.productName}) has been Unapproved by Our Team`,
        });
        await notification.save();

        sendNotification(toUser, notification.toJSON());
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

    if (req.user.role === "superadmin") {
      const toUser = product.workspaceId.userId;
      if (toUser) {
        const notification = new Notification({
          to: toUser,
          title: `Product Deleted`,
          profileImage: req.user.profileImage,
          content: `(${product.productName}) has been Deleted by Our Team`,
        });
        await notification.save();

        sendNotification(toUser, notification.toJSON());
      }
    } else {
      const admin = await User.findOne({ role: "superadmin" });
      if (admin) {
        const notification = new Notification({
          to: admin._id,
          title: `Product Deleted`,
          profileImage: req.user.profileImage,
          content: `${req.user.fullName} deleted product (${product.productName}).`,
        });
        await notification.save();

        sendNotification(admin._id, notification.toJSON());
      }
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
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

    await product.save();

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `Product updated`,
        content: `${req.user.fullName} updated (${product.productName}).`,
      });
      await notification.save();

      sendNotification(admin._id, notification.toJSON());
    }

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

export const createProductCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    const newCategory = new Category({ name });
    await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

export const getProductCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to retrieve categories" });
  }
};

export const createProductSubCategory = async (req, res) => {
  const { name, categoryId } = req.body;

  if (!name || !categoryId) {
    return res
      .status(400)
      .json({ error: "SubCategory name and categoryId are required" });
  }

  try {
    const newSubCategory = new SubCategory({ name, categoryId });
    await newSubCategory.save();

    res.status(201).json({
      message: "SubCategory created successfully",
      subcategory: newSubCategory,
    });
  } catch (error) {
    console.error("Error creating subcategory:", error);
    res.status(500).json({ error: "Failed to create subcategory" });
  }
};

export const getProductSubCategories = async (req, res) => {
  const { categoryId } = req.query;

  try {
    const filter = categoryId ? { categoryId } : {};
    const subcategories = await SubCategory.find(filter);

    res.json({ subcategories });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ error: "Failed to retrieve subcategories" });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    const formattedProducts = products.map((product) => ({
      ...product.toObject(),
      status: product.isApproved ? "approved" : "pending",
    }));

    res.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({ error: "Failed to retrieve all products" });
  }
};

export const activateProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.isActive = true;
    await product.save();

    res
      .status(200)
      .json({ message: "Product activated successfully", product });
  } catch (error) {
    console.error("Error activating product:", error);
    res.status(500).json({ error: "Failed to activate product" });
  }
};
