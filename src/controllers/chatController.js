import Message from '../models/Message.js';
import Chat from '../models/Chat.js';



export const getConversationMessages = async (req, res) => {
    try {
        const { user1, user2 } = req.params;
        console.log(`Fetching conversation between ${user1} and ${user2}`);


        const conversation = await Chat.findOne({
            participants: { $all: [user1, user2] },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Chat not found' });
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
}

// export const sendMessage = async (req, res) => {
//     try {
//         const { sender, receiver, content, mediaType, reactions } = req.body;
//         let mediaUrl = null;


//         if (req.file) {
//             mediaUrl = `/uploads/${req.file.filename}`;
//         }


//         if (!sender || !receiver || (!content && !mediaUrl)) {
//             return res.status(400).json({ error: 'Sender, receiver, and content/media are required' });
//         }


//         let conversation = await Chat.findOne({
//             participants: { $all: [sender, receiver] },
//         });

//         if (!conversation) {
//             conversation = new Chat({
//                 participants: [sender, receiver],
//             });
//             await conversation.save();
//         }

//         const newMessage = new Message({
//             sender,
//             receiver,
//             content,
//             media: mediaUrl,
//             mediaType: mediaType || 'none',
//             reactions: reactions || [],
//             conversationId: conversation._id,
//         });

//         const savedMessage = await newMessage.save();


//         conversation.lastMessage = savedMessage._id;
//         await conversation.save();

//         res.status(201).json(savedMessage);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to send message' });
//     }
// }

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMessage = await Message.findByIdAndUpdate(id, { isRead: true }, { new: true });

        res.status(200).json(updatedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
}

export const reactToMessage = async (req, res) => {
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
}

export const updateMessageStatus = async (req, res) => {
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
}

export const deleteMessage = async (req, res) => {
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
}


// 👇👇👇 bellow this are hemat's code
export const getChats = async (req, res) => {
    const userId = req.user.id;

    try {
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'fullName email profileImage')
            .populate('lastMessage')

        res.status(200).json({ chats });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }

}


// 🔰 do we have to delete the message from the database when chat is deleted?
// or just mark it as deleted?
export const getChatMessages = async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;
    try {
        const chat = await Chat.findById(chatId)
            .populate('participants', 'fullName email profileImage')
            .populate('lastMessage');

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const messages = await Message.find({ chat: chatId, isDeleted: false })
            .sort({ createdAt: -1 })
            .populate('sender', 'fullName email profileImage')
            .populate('receiver', 'fullName email profileImage');
        if (!messages.length) {
            return res.status(404).json({ error: 'No messages found' });
        }
        res.status(200).json({ chat, messages });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Failed to fetch chat messages' });

    }
}

export const sendMessage = async (req, res) => {
    const { content, mediaType, reactions } = req.body;
    const { chatId } = req.params;
    const userId = req.user.id;

    try {
        if (!content && !req.file) {
            return res.status(400).json({ error: 'Content or media is required' });
        }

        let mediaUrl = null;
        if (req.file) {
            mediaUrl = `/uploads/${req.file.filename}`;
        }

        const newMessage = new Message({
            sender: userId,
            chat: chatId,
            content,
            mediaUrl,
            mediaType: mediaType || 'none',
            reactions: reactions || [],
        });

        const savedMessage = await newMessage.save();

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        chat.lastMessage = savedMessage._id;
        await chat.save();

        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
}
