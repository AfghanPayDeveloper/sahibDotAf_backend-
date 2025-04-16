import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';
import { deleteMessage, getChatMessages, getChats, getConversationMessages, markAsRead, reactToMessage, sendMessage, updateMessageStatus } from '../controllers/chatController.js';

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

router.use(authenticateToken);

router.post('/send', upload.single('media'), sendMessage);

router.get('/conversation/:user1/:user2', getConversationMessages);

router.put('/markAsRead/:id', markAsRead);

router.put('/react/:messageId', reactToMessage);

router.put('/updateStatus/:id', updateMessageStatus);

router.put('/deleteMessage/:id', deleteMessage);

router.get('/', getChats);

router.get('/:chatId', getChatMessages);

export default router;
