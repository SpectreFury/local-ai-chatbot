import prisma from '../db/prisma.js';
import { Ollama } from 'ollama';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Ollama instance
const ollama = new Ollama();

// Stream management - track active streams for stopping
const activeStreams = new Map();

const getChatsHandler = async (req, res) => {
    try {
        const chats = await prisma.chat.findMany({
            orderBy: {
                updatedAt: 'desc' // Most recently updated first
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1 // Only get the latest message for preview
                }
            }
        });

        // Transform the data to match frontend format
        const transformedChats = chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            timestamp: formatTimestamp(chat.updatedAt),
            messages: [] // We'll load messages separately when chat is opened
        }));

        res.json({
            success: true,
            data: transformedChats,
            message: 'Chats retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting chats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve chats',
            error: error.message
        });
    }
};

// Helper function to format timestamps
const formatTimestamp = (date) => {
    const now = new Date();
    const chatDate = new Date(date);
    const diffMs = now - chatDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return chatDate.toLocaleDateString([], { weekday: 'short' });
    } else {
        return chatDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};

const getChatHandler = async (req, res) => {
    try {
        const { id } = req.params;

        const chat = await prisma.chat.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc' // Messages in chronological order
                    }
                }
            }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Transform the data to match frontend format
        const transformedChat = {
            id: chat.id,
            title: chat.title,
            timestamp: formatTimestamp(chat.updatedAt),
            messages: chat.messages.map(msg => ({
                id: msg.id,
                role: msg.role.toLowerCase() === 'user' ? 'user' : 'bot',
                content: msg.content,
                timestamp: formatTimestamp(msg.createdAt)
            }))
        };

        res.json({
            success: true,
            data: transformedChat,
            message: 'Chat retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting chat:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve chat',
            error: error.message
        });
    }
};

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
        
        // Generate a unique stream ID for this request
        const streamId = `${chatId}-${Date.now()}`;
        let streamAborted = false;

        console.log('Using Ollama model:', process.env.OLLAMA_MODEL || 'gemma3:1b');
        console.log('Conversation history length:', conversationHistory.length);
        console.log('Stream ID:', streamId);

        // Register this stream as active
        activeStreams.set(streamId, {
            chatId,
            abort: () => {
                streamAborted = true;
                console.log('Stream aborted:', streamId);
            }
        });

        // Send the stream ID to client in headers so it can be used for stopping
        res.setHeader('X-Stream-Id', streamId);

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
                    // Check if stream has been aborted
                    if (streamAborted) {
                        callback(new Error('Stream aborted by user'));
                        return;
                    }

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
                        // Check for abort before processing each chunk
                        if (streamAborted) {
                            break;
                        }
                        ollamaReadable.push(chunk);
                    }
                    ollamaReadable.push(null); // End the stream
                } catch (error) {
                    if (!streamAborted) {
                        ollamaReadable.destroy(error);
                    }
                }
            })();

            // Pipeline: Ollama -> Transform -> Response
            await pipeline(
                ollamaReadable,
                tokenTransform,
                res
            );

            // Save assistant response to database after streaming completes
            if (assistantResponse && !streamAborted) {
                await prisma.message.create({
                    data: {
                        content: assistantResponse,
                        role: 'ASSISTANT',
                        chatId
                    }
                });
            } else if (streamAborted && assistantResponse) {
                // Save partial response if stream was stopped
                await prisma.message.create({
                    data: {
                        content: assistantResponse + ' [Response stopped by user]',
                        role: 'ASSISTANT',
                        chatId
                    }
                });
            }

        } catch (ollamaError) {
            console.error('Ollama streaming error:', ollamaError);
            
            // Send error message to client if headers haven't been sent and stream wasn't aborted
            if (!res.headersSent && !streamAborted) {
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
        } finally {
            // Clean up the stream from active streams
            activeStreams.delete(streamId);
        }

    } catch (error) {
        console.error('Error creating message:', error);
        
        // Clean up the stream from active streams if it exists
        const streamId = `${req.params.chatId}-${Date.now()}`;
        if (activeStreams.has(streamId)) {
            activeStreams.delete(streamId);
        }
        
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

const stopChatHandler = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { streamId } = req.body; // Stream ID sent from frontend

        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: 'ChatId is required'
            });
        }

        console.log('Stop request received for chatId:', chatId, 'streamId:', streamId);
        console.log('Active streams:', Array.from(activeStreams.keys()));

        let stoppedCount = 0;

        if (streamId && activeStreams.has(streamId)) {
            // Stop specific stream
            const stream = activeStreams.get(streamId);
            if (stream.chatId === chatId) {
                stream.abort();
                activeStreams.delete(streamId);
                stoppedCount = 1;
            }
        } else {
            // Stop all active streams for this chat (fallback)
            for (const [id, stream] of activeStreams.entries()) {
                if (stream.chatId === chatId) {
                    stream.abort();
                    activeStreams.delete(id);
                    stoppedCount++;
                }
            }
        }

        res.json({
            success: true,
            message: stoppedCount > 0 
                ? `Stopped ${stoppedCount} active stream(s)` 
                : 'No active streams found for this chat',
            stoppedCount
        });

    } catch (error) {
        console.error('Error stopping chat:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop chat stream',
            error: error.message
        });
    }
};


export { getChatHandler, getChatsHandler, createChatHandler, createMessageHandler, stopChatHandler  };
