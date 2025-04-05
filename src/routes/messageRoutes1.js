import express from 'express';
import Message from '../models/Message.js';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js'; 

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

const upload = multer({ storage });


router.post('/send', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const { sender, receiver, content, mediaType, reactions } = req.body;
    let mediaUrl = null;


    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

 
    if (!sender || !receiver || (!content && !mediaUrl)) {
      return res.status(400).json({ error: 'Sender, receiver, and content/media are required' });
    }

 
    let conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
    });


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
      conversationId: conversation._id, 
    });

    const savedMessage = await newMessage.save();


    conversation.lastMessage = savedMessage._id;
    await conversation.save();

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});


router.get('/conversation/:user1/:user2', authenticateToken, async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    console.log(`Fetching conversation between ${user1} and ${user2}`);


    const conversation = await Conversation.findOne({
      participants: { $all: [user1, user2] },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({ conversationId: conversation._id, isDeleted: false })
      .sort({ timestamp: 1 })  
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
