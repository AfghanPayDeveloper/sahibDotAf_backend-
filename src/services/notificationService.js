import Notification from "../models/Notification.js";

export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ to: req.user._id }).sort({
      created_at: -1,
    }).limit(10);
    const sendData = {
      data: notifications.map((notification) => ({
        type: "Notifications",
        id: notification._id,
        attributes: notification,
      })),
    };

    res.status(200).send(sendData);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      errors: [
        { detail: "Failed to get notifications due to an internal error." },
      ],
    });
  }
};

export const readNotification = async (req, res) => {
  const { notifyId } = req.params;
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notifyId, to: req.user._id },
      {
        unread: false,
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).send({
        errors: [{ detail: "Notification not found." }],
      });
    }

    const sendData = {
      message: "Notification has been read.",
      data: {
        type: "Notifications",
        id: notification._id,
        attributes: notification,
      },
    };

    res.status(200).send(sendData);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      errors: [
        { detail: "Failed to read notification due to an internal error." },
      ],
    });
  }
};

export const readUserAllNotification = async (req, res) => {
  try {
    await Notification.updateMany(
      { unread: true, to: req.user._id },
      {
        unread: false,
      }
    );

    const notifications = await Notification.find({
      to: req.user._id,
    }).sort({created_at: -1}).limit(10);

    if (!notifications.length) {
      return res.status(404).send({
        errors: [{ detail: "No Notification found to read." }],
      });
    }

    const sentData = {
      message: "All notifications marked as read.",
      data: notifications.map((notification) => ({
        type: "Notification",
        id: notification._id,
        attributes: notification,
      })),
    };

    res.status(200).json(sentData);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      errors: [
        { detail: "Failed to read notification due to an internal error." },
      ],
    });
  }
};
