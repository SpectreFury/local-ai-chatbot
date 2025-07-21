import prisma from '../db/prisma.js';
import { Ollama } from 'ollama';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Ollama instance
const ollama = new Ollama();

const getChatsHandler = async (req, res) => {
    res.send("Hello World")
};

const getChatHandler = async (req, res) => {};

const createChatHandler = async (req, res) => {
    try {
        const { title } = req.body;
        
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

const createMessageHandler = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, role } = req.body;

        if (!content || !chatId) {
            return res.status(400).json({
                success: false,
                message: 'Content and chatId are required'
            });
        }

        // Verify chat exists
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: { messages: true }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Save user message to database
        const userMessage = await prisma.message.create({
            data: {
                content,
                role: 'USER', // Always USER for user messages
                chatId
            }
        });

        // Set headers for streaming response
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Prepare conversation history for context
        const conversationHistory = chat.messages.map(msg => ({
            role: msg.role.toLowerCase() === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        // Add the new user message
        conversationHistory.push({
            role: 'user',
            content: content
        });

        let assistantResponse = '';

        console.log('Using Ollama model:', process.env.OLLAMA_MODEL || 'gemma3:1b');
        console.log('Conversation history length:', conversationHistory.length);

        try {
            // Create a transform stream to pipe tokens
            const { Readable, Transform } = await import('stream');
            const { pipeline } = await import('stream/promises');

            // Create Ollama stream
            const ollamaStream = await ollama.chat({
                model: process.env.OLLAMA_MODEL || 'gemma3:1b',
                messages: conversationHistory,
                stream: true,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                }
            });

            // Convert async iterator to readable stream
            const ollamaReadable = new Readable({
                objectMode: true,
                async read() {
                    // This will be handled by the async iterator
                }
            });

            // Transform stream to process chunks
            const tokenTransform = new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    if (chunk.message?.content) {
                        const content = chunk.message.content;
                        assistantResponse += content;
                        
                        // Push the token content as a buffer
                        this.push(content);
                    }
                    callback();
                }
            });

            // Start the async iteration in background
            (async () => {
                try {
                    for await (const chunk of ollamaStream) {
                        ollamaReadable.push(chunk);
                    }
                    ollamaReadable.push(null); // End the stream
                } catch (error) {
                    ollamaReadable.destroy(error);
                }
            })();

            // Pipeline: Ollama -> Transform -> Response
            await pipeline(
                ollamaReadable,
                tokenTransform,
                res
            );

            // Save assistant response to database after streaming completes
            if (assistantResponse) {
                await prisma.message.create({
                    data: {
                        content: assistantResponse,
                        role: 'ASSISTANT',
                        chatId
                    }
                });
            }

        } catch (ollamaError) {
            console.error('Ollama streaming error:', ollamaError);
            
            // Send error message to client if headers haven't been sent
            if (!res.headersSent) {
                const errorMessage = 'Sorry, I encountered an error processing your message. Please make sure Ollama is running with the gemma3:1b model.';
                res.write(errorMessage);
                
                // Save error response to database
                await prisma.message.create({
                    data: {
                        content: errorMessage,
                        role: 'ASSISTANT',
                        chatId
                    }
                });
            }
            
            res.end();
        }

    } catch (error) {
        console.error('Error creating message:', error);
        
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to create message',
                error: error.message
            });
        } else {
            res.end();
        }
    }
};

const stopChatHandler = async (req, res) => {};


export { getChatHandler, getChatsHandler, createChatHandler, createMessageHandler, stopChatHandler  };
