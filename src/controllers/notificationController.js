import Notification from "../models/Notification.js";

export const getAllNotifications = async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10
  try {
    const notifications = await Notification.find({ to: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit) // Skip notifications for previous pages
      .limit(parseInt(limit)) // Limit the number of notifications per page
      .populate("from");

    const totalNotifications = await Notification.countDocuments({
      to: req.user.id,
    }); // Total number of notifications for the user

    res.status(200).send({
      notifications,
      total: totalNotifications,
      hasMore: page * limit < totalNotifications, // Check if there are more notifications
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      error: "Failed to get notifications due to an internal error.",
    });
  }
};

export const readNotification = async (req, res) => {
  const { notifyId } = req.params;
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notifyId, to: req.user.id },
      {
        unread: false,
      },
      { new: true }
    ).populate("from");

    if (!notification) {
      return res.status(404).send({
        error: "Notification not found.",
      });
    }

    console.log("Notification read:", notification);
    res.status(200).send({
      message: "Notification has been read.",
      data: notification,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      error: "Failed to read notification due to an internal error.",
    });
  }
};

export const readUserAllNotification = async (req, res) => {
  try {
    await Notification.updateMany(
      { unread: true, to: req.user.id },
      {
        unread: false,
      }
    );

    const notifications = await Notification.find({
      to: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("from");

    res.status(200).json({
      message: "All notifications marked as read.",
      data: notifications,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      error: "Failed to read notification due to an internal error.",
    });
  }
};
