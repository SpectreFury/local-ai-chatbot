import prisma from '../db/prisma.js';

const getChatsHandler = async (req, res) => {
    res.send("Hello World")
};

const getChatHandler = async (req, res) => {};

const createChatHandler = async (req, res) => {
    try {
        const { title } = req.body;
        
        // Create new chat with title or default title
        const newChat = await prisma.chat.create({
            data: {
                title: title || 'New Chat'
            }
        });

        res.status(201).json({
            success: true,
            data: newChat,
            message: 'Chat created successfully'
        });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create chat',
            error: error.message
        });
    }
};

const createMessageHandler = async (req, res) => {};

const stopChatHandler = async (req, res) => {};


export { getChatHandler, getChatsHandler, createChatHandler, createMessageHandler, stopChatHandler  };
