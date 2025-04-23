import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { userSockets } from '../utils/socket.js';



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
            .populate('participants', 'fullName email profileImage status lastSeen')
            .populate('lastMessage')

        const formattedChats = chats.map(chat => {
            if (!chat.isGroup) {
                const otherUser = chat.participants.find(p => p._id.toString() !== userId);
                return {
                    ...chat.toJSON(),
                    chatName: otherUser.fullName,
                    chatProfile: otherUser.profileImage
                };
            }
            return chat; // For group chats, keep as is or handle differently
        });

        res.status(200).json({ chats: formattedChats });
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
            .sort({ createdAt: 1 })
            .populate('sender', 'fullName email profileImage')

        const formattedMessages = messages.map(message => {
            if (message.sender._id.toString() !== userId) {
                return {
                    ...message.toJSON(),
                    isYou: false,
                };
            }
            return {
                ...message.toJSON(),
                isYou: true,
            };
        })

        res.status(200).json({ chat, messages: formattedMessages });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Failed to fetch chat messages' });

    }
}

export const createChatAndSendMessage = async (req, res) => {
    const { content, mediaType, reactions, receiverId, messageType } = req.body;
    const userId = req.user.id;

    try {
        const chat = await Chat.findOrCreate({
            participants: [receiverId, userId],
        })

        const newMessage = await Message.create({
            userId,
            content,
            chat: chat._id,
            messageType: messageType || 'text'
        })

        chat.lastMessage = newMessage._id;
        await chat.save();
        const receiverSocket = userSockets[receiverId];

        if (receiverSocket) {
            const notification = await Notification.create({
                from: userId,
                to: receiverId,
                title: "New message",
                content: "You have a new message",
            })

            sendNotification(receiverId, notification);
            receiverSocket.emit("receive_message", { ...newMessage.toJSON(), isYou: false });
        }
        res.status(201).send({ message: { ...newMessage.toJSON(), isYou: true }, chat });
    } catch (error) {
        console.error("Error creating chat and sending message:", error);
        res.status(500).send({ error: "Error creating chat and sending message" });
    }
}

export const sendMessage = async (req, res) => {
    const { content, mediaType, reactions, receiverId } = req.body;
    const userId = req.user.id;
    const { chatId } = req.params;
    console.log(req.body)

    try {
        if (!content && !req.files) {
            return res.status(400).json({ error: 'Content or media is required' });
        }

        let chatToSendMessage = await Chat.findOne({
            _id: chatId,
            participants: userId,
        });

        if (!chatToSendMessage) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        let mediaUrl = null;
        if (req.file) {
            mediaUrl = `/uploads/${req.file.filename}`;
        }

        const newMessage = new Message({
            sender: userId,
            chat: chatToSendMessage._id,
            content,
            mediaUrl,
            mediaType: mediaType || 'none',
            reactions: reactions || [],
        });

        const savedMessage = await newMessage.save();

        chatToSendMessage.lastMessage = savedMessage._id;
        await chatToSendMessage.save();

        let otherUser = chatToSendMessage.participants.find(p => p._id.toString() !== userId);
        const userSocket = userSockets[otherUser._id];
        if (userSocket) {
            userSocket.emit('receiveMessage', { ...savedMessage.toJSON(), isYou: false });
        } else {
            console.log(`${otherUser._id} is offline `, "💀💀💀");
        }

        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
}
