import express from 'express';
import Message from '../models/Message.js';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js'; // Assuming Conversation model is created

const router = express.Router();

// Set up file upload with multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Directory to store files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage });

// Send message (text, media, reactions)
router.post('/send', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const { sender, receiver, content, mediaType, reactions } = req.body;
    let mediaUrl = null;

    // If there's a media file, upload it and get its URL
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    // Validate required fields
    if (!sender || !receiver || (!content && !mediaUrl)) {
      return res.status(400).json({ error: 'Sender, receiver, and content/media are required' });
    }

    // Check if a conversation exists between sender and receiver
    let conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
    });

    // If conversation doesn't exist, create a new one
    if (!conversation) {
      conversation = new Conversation({
        participants: [sender, receiver],
      });
      await conversation.save();
    }

    const newMessage = new Message({
      sender,
      receiver,
      content,
      media: mediaUrl,
      mediaType: mediaType || 'none',
      reactions: reactions || [],
      conversationId: conversation._id,  // Associate with conversation
    });

    const savedMessage = await newMessage.save();

    // Optionally, update the conversation's lastMessage
    conversation.lastMessage = savedMessage._id;
    await conversation.save();

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Fetch messages for a specific conversation (protected)
router.get('/conversation/:user1/:user2', authenticateToken, async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    console.log(`Fetching conversation between ${user1} and ${user2}`);

    // Find the conversation between the two users
    const conversation = await Conversation.findOne({
      participants: { $all: [user1, user2] },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({ conversationId: conversation._id, isDeleted: false }) // Exclude deleted messages
      .sort({ timestamp: 1 })  // Sort by timestamp to get messages in order of appearance
      .populate('sender', 'fullName email profileImage')
      .populate('receiver', 'fullName email profileImage');

    if (messages.length === 0) {
      return res.status(404).json({ error: 'No messages found' });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark message as read (protected)
router.put('/markAsRead/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMessage = await Message.findByIdAndUpdate(id, { isRead: true }, { new: true });

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// React to a message (protected)
router.put('/react/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $push: { reactions: { user: userId, emoji } },
      },
      { new: true }
    );

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Update message status (sent, delivered, read)
router.put('/updateStatus/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['sent', 'delivered', 'read'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedMessage = await Message.findByIdAndUpdate(id, { messageStatus: status }, { new: true });
    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// Delete a message (mark as deleted, not actually remove it from DB)
router.put('/deleteMessage/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const updatedMessage = await Message.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    if (!updatedMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
