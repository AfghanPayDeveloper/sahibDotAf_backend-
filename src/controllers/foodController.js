import fs from "fs";
import path from "path";
import Food from "../models/Food.js";
import Menu from "../models/Menu.js";
import sendNotification from "../utils/sendNotification.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const deleteFiles = (files) => {
  files.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

export const createFood = async (req, res) => {
  const { name, description, menuId, workspaceId } = req.body;
  console.log("Received data:", {
    name,
    description,
    menuId,
    workspaceId,
    image: req.file,
  });
  if (!name || !description || !menuId || !workspaceId) {
    return res.status(400).json({
      error:
        "Required fields are missing: name, description, menuId, or workSpaceId.",
    });
  }

  try {
    const newFood = new Food({
      name,
      description,
      menuId,
      workspaceId,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await newFood.save();

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `New Food created`,
        content: `${req.user.fullName} created Food (${newFood.name}).`,
        from: req.user.id,
      });
      await notification.save();

      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }

    res
      .status(201)
      .json({ message: "Food item created successfully", food: newFood });
  } catch (error) {
    console.error("Error creating food item:", error);
    res.status(500).json({ error: "Failed to create food item" });
  }
};

export const getFoods = async (req, res) => {
  const { query } = req.query;
  const { page = 1, limit = 10, active } = req.query;

  try {
    let filter = {};
    if (query) {
      filter.name = { $regex: query, $options: "i" };
    }

    if (req.user.role !== "superadmin") {
      if (!req.query.menuId && !req.query.workspaceId) {
        return res.status(400).json({
          error: "Either menuId or workspaceId is required",
        });
      }
    }

    if (active === "false") filter.isActive = false;
    if (req.query.menuId) filter.menuId = req.query.menuId;
    if (req.query.workspaceId) filter.workspaceId = req.query.workspaceId;

    const foods = await Food.find(filter)
      .populate("menuId", "name")
      .populate("workspaceId", "name");

    res.json({ foods });
  } catch (error) {
    console.error("Error fetching food items:", error);
    res.status(500).json({ error: "Failed to retrieve food items" });
  }
};

export const updateFood = async (req, res) => {
  const { id } = req.params;
  const { name, description, menuId, workspaceId } = req.body;

  console.log("Update Request:", req.body);

  try {
    const food = await Food.findById(id);

    if (!food) {
      return res.status(404).json({ error: "Food item not found" });
    }

    if (name) food.name = name;
    if (description) food.description = description;
    if (menuId) food.menuId = menuId;
    if (workspaceId) food.workspaceId = workspaceId;

    if (req.file) {
      console.log("New image uploaded:", req.file);
      if (food.image) {
        deleteFiles([food.image]);
      }
      food.image = `/uploads/${req.file.filename}`;
    }

    await food.save();

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `Food updated`,
        content: `${req.user.fullName} updated Food (${food.name}).`,
        from: req.user.id,
      });
      await notification.save();

      console.log("Notification sent to admin: ⬆️", notification);

      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }

    res.status(200).json({ message: "Food item updated successfully", food });
  } catch (error) {
    console.error("Error updating food item:", error);
    res.status(500).json({ error: "Failed to update food item" });
  }
};

export const approveFood = async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;

  if (userRole !== "superadmin") {
    return res
      .status(403)
      .json({ error: "Only superadmins can approve food items" });
  }

  try {
    const food = await Food.findById(id).populate("workspaceId");
    if (!food) {
      return res.status(404).json({ error: "Food item not found" });
    }

    food.isApproved = true;
    await food.save();

    const notification = new Notification({
      to: food.workspaceId.userId,
      title: `Food Approved`,
      content: `(${food.name}) Food has been Approved by our Admin.`,
      from: req.user.id,
    });
    await notification.save();

    sendNotification(food.workspaceId.userId, {
      ...notification.toJSON(),
      from: req.user,
    });

    res.status(200).json({ message: "Food item approved successfully", food });
  } catch (error) {
    console.error("Error approving food item:", error);
    res.status(500).json({ error: "Failed to approve food item" });
  }
};

export const unapproveFood = async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;

  if (userRole !== "superadmin") {
    return res
      .status(403)
      .json({ error: "Only superadmins can unapprove food items" });
  }

  try {
    const food = await Food.findById(id).populate("workspaceId");
    if (!food) {
      return res.status(404).json({ error: "Food item not found" });
    }

    food.isApproved = false;
    await food.save();

    const notification = new Notification({
      to: food.workspaceId.userId,
      title: `Food Approved`,
      content: `(${food.name}) Food has been Unapproved by our Admin.`,
      from: req.user.id,
    });
    await notification.save();

    sendNotification(food.workspaceId.userId, {
      ...notification.toJSON(),
      from: req.user,
    });

    res
      .status(200)
      .json({ message: "Food item unapproved successfully", food });
  } catch (error) {
    console.error("Error unapproving food item:", error);
    res.status(500).json({ error: "Failed to unapprove food item" });
  }
};

export const deleteFood = async (req, res) => {
  const { id } = req.params;

  try {
    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({ error: "Food item not found" });
    }

    if (food.image) {
      deleteFiles([food.image]);
    }

    await food.remove();

    if (req.user.role !== "superadmin") {
      const notification = new Notification({
        to: food.workspaceId.userId,
        title: `Food Deleted`,
        content: `(${food.name}) Food has been Deleted by ${req.user.fullName}.`,
        from: req.user.id,
      });
      await notification.save();

      sendNotification(food.workspaceId.userId, {
        ...notification.toJSON(),
        from: req.user,
      });
    } else {
      const admin = await User.findOne({ role: "superadmin" });
      if (admin) {
        const notification = new Notification({
          to: admin._id,
          title: `Food Approved`,
          content: `(${food.name}) Food has been Deleted by ${req.user.fullName}.`,
          from: req.user.id,
        });
        await notification.save();

        sendNotification(admin._id, {
          ...notification.toJSON(),
          from: req.user,
        });
      }
    }

    res.status(200).json({ message: "Food item deleted successfully" });
  } catch (error) {
    console.error("Error deleting food item:", error);
    res.status(500).json({ error: "Failed to delete food item" });
  }
};

export const createMenu = async (req, res) => {
  const { name } = req.body;

  if (!name || !req.file) {
    return res.status(400).json({ error: "Menu name and image are required" });
  }

  try {
    const newMenu = new Menu({
      name,
      image: `/uploads/${req.file.filename}`,
    });

    await newMenu.save();

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `New Menu Created`,
        content: `${req.user.fullName} created Menu (${newMenu.name}).`,
        from: req.user.id,
      });
      await notification.save();

      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }
    res
      .status(201)
      .json({ message: "Menu created successfully", menu: newMenu });
  } catch (error) {
    console.error("Error creating menu:", error);
    res.status(500).json({ error: "Failed to create menu" });
  }
};

export const sanitizeDescription = (req, res, next) => {
  if (req.body.description) {
    req.body.description = sanitizeHtml(req.body.description, {
      allowedTags: [
        "b",
        "i",
        "u",
        "em",
        "strong",
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "a",
      ],
      allowedAttributes: {
        a: ["href", "target", "rel"],
      },
      allowedSchemes: ["http", "https", "mailto"],
      transformTags: {
        a: (tagName, attribs) => ({
          tagName: "a",
          attribs: {
            href: attribs.href,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        }),
      },
    });
  }
  next();
};

export const getMenus = async (req, res) => {
  const { workspaceId, query } = req.query;
  const filter = query
    ? {
        name: { $regex: query, $options: "i" },
      }
    : {};

  try {
    const menus = await Menu.find(filter);
    res.json({ menus });
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ error: "Failed to retrieve menus" });
  }
};

export const updateMenu = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const menu = await Menu.findById(id);

    if (!menu) {
      return res.status(404).json({ error: "Menu not found" });
    }

    if (req.file) {
      deleteFiles([menu.image]);
      menu.image = `/uploads/${req.file.filename}`;
    }

    if (name) {
      menu.name = name;
    }

    await menu.save();

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `Menu Updated`,
        content: `${req.user.fullName} updated menu (${menu.name}).`,
        from: req.user.id,
      });
      await notification.save();

      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }
    res.status(200).json({ message: "Menu updated successfully", menu });
  } catch (error) {
    console.error("Error updating menu:", error);
    res.status(500).json({ error: "Failed to update menu" });
  }
};

export const deleteMenu = async (req, res) => {
  const { id } = req.params;

  try {
    const menu = await Menu.findById(id);

    if (!menu) {
      return res.status(404).json({ error: "Menu not found" });
    }

    deleteFiles([menu.image]);

    await Food.deleteMany({ menu_id: id });
    await menu.remove();

    const admin = await User.findOne({ role: "superadmin" });
    if (admin) {
      const notification = new Notification({
        to: admin._id,
        title: `Menu Deleted`,
        content: `(${menu.name}) Menu has been Deleted by ${req.user.fullName}.`,
        from: req.user.id,
      });
      await notification.save();

      sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
    }

    res.status(200).json({ message: "Menu deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu:", error);
    res.status(500).json({ error: "Failed to delete menu" });
  }
};
export const activateFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    food.isActive = true;
    await food.save();
    res.json({ message: "Food activated", food });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deactivateFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    food.isActive = false;
    await food.save();
    res.json({ message: "Food deactivated", food });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
