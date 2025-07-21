import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Chat, Message } from '@/app/types/chat';
import { chatAPI } from '@/app/lib/api';
import { ENV } from '@/app/lib/env';
import { APIError } from '@/app/lib/config';

interface ChatState {
  // State
  chats: Chat[];
  activeChat: Chat | null;
  isCreatingChat: boolean;
  isLoadingChats: boolean;
  error: string | null;

  // Actions
  setActiveChat: (chat: Chat | null) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  addMessageToChat: (chatId: string, message: Message) => void;
  updateMessageInChat: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  setChats: (chats: Chat[]) => void;
  setError: (error: string | null) => void;
  
  // Async actions
  createNewChat: (title?: string, navigate?: (chatId: string) => void) => Promise<void>;
  loadChats: () => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state - start with empty data
        chats: [],
        activeChat: null,
        isCreatingChat: false,
        isLoadingChats: false,
        error: null,

        // Actions
        setActiveChat: (chat) => set({ activeChat: chat }),
        
        addChat: (chat) => set((state) => ({ 
          chats: [chat, ...state.chats] 
        })),
        
        updateChat: (chatId, updates) => set((state) => ({
          chats: state.chats.map(chat => 
            chat.id === chatId ? { ...chat, ...updates } : chat
          ),
          activeChat: state.activeChat?.id === chatId 
            ? { ...state.activeChat, ...updates } 
            : state.activeChat
        })),
        
        addMessageToChat: (chatId, message) => set((state) => {
          const updatedChats = state.chats.map(chat => {
            if (chat.id === chatId) {
              return { ...chat, messages: [...chat.messages, message] };
            }
            return chat;
          });
          
          return {
            chats: updatedChats,
            activeChat: state.activeChat?.id === chatId 
              ? { ...state.activeChat, messages: [...state.activeChat.messages, message] }
              : state.activeChat
          };
        }),

        updateMessageInChat: (chatId, messageId, updates) => set((state) => {
          const updatedChats = state.chats.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: chat.messages.map(msg => 
                  msg.id === messageId ? { ...msg, ...updates } : msg
                )
              };
            }
            return chat;
          });
          
          return {
            chats: updatedChats,
            activeChat: state.activeChat?.id === chatId 
              ? {
                  ...state.activeChat,
                  messages: state.activeChat.messages.map(msg => 
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  )
                }
              : state.activeChat
          };
        }),
        
        setChats: (chats) => set({ chats }),
        
        setError: (error) => set({ error }),

        // Async actions
        createNewChat: async (title = 'New Chat', navigate) => {
          set({ isCreatingChat: true, error: null });
          
          if (ENV.IS_DEVELOPMENT) {
            console.log('Creating new chat with API URL:', ENV.API_URL);
            console.log('Chat title:', title);
          }
          
          try {
            const result = await chatAPI.createChat(title);
            
            if (ENV.IS_DEVELOPMENT) {
              console.log('API Response:', result);
            }
            
            if (result && result.success) {
              const newChat: Chat = {
                id: result.data.id,
                title: result.data.title,
                timestamp: new Date(result.data.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                messages: []
              };
              
              set((state) => ({
                chats: [newChat, ...state.chats],
                activeChat: newChat,
                error: null
              }));
              
              if (ENV.IS_DEVELOPMENT) {
                console.log('Successfully created chat:', newChat);
              }

              // Navigate to the new chat URL if navigate function is provided
              if (navigate) {
                navigate(newChat.id);
              }
            } else {
              throw new Error('Invalid API response format');
            }
          } catch (error) {
            const errorMessage = error instanceof APIError 
              ? `API Error (${error.status}): ${error.message}`
              : error instanceof Error 
              ? error.message 
              : 'Unknown error occurred';
            
            console.error('Error creating new chat:', {
              error,
              apiUrl: ENV.API_URL,
              message: errorMessage
            });
            
            // Fallback to local creation if API fails
            const fallbackChat: Chat = {
              id: Date.now().toString(),
              title,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messages: []
            };
            
            set((state) => ({
              chats: [fallbackChat, ...state.chats],
              activeChat: fallbackChat,
              error: `Failed to create chat on server: ${errorMessage}. Created locally instead.`
            }));

            // Navigate to fallback chat if navigate function is provided
            if (navigate) {
              navigate(fallbackChat.id);
            }
          } finally {
            set({ isCreatingChat: false });
          }
        },

        loadChats: async () => {
          set({ isLoadingChats: true, error: null });
          
          try {
            const result = await chatAPI.getChats();
            // Implementation depends on your API response structure
            // For now, we'll keep the initial chats
          } catch (error) {
            console.error('Error loading chats:', error);
            set({ error: 'Failed to load chats from server' });
          } finally {
            set({ isLoadingChats: false });
          }
        }
      }),
      {
        name: 'chat-store', // Storage key
        version: 1, // Increment this to clear old dummy data
        partialize: (state) => ({ 
          chats: state.chats,
          activeChat: state.activeChat 
        }), // Only persist chats and activeChat
      }
    ),
    {
      name: 'chat-store', // DevTools name
    }
  )
);
