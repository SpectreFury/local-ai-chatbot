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
  loadChatMessages: (chatId: string) => Promise<void>;
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
        // Async actions
        createNewChat: async (title?: string, navigate?: (chatId: string) => void) => {
          set({ isCreatingChat: true, error: null });
          
          try {
            const response = await chatAPI.createChat(title);
            const newChat: Chat = {
              id: response.data.id,
              title: response.data.title,
              timestamp: 'Now',
              messages: []
            };
            
            set((state) => ({ 
              chats: [newChat, ...state.chats],
              activeChat: newChat,
              isCreatingChat: false 
            }));
            
            if (navigate) {
              navigate(newChat.id);
            }
          } catch (error) {
            console.error('Error creating chat:', error);
            set({ 
              error: error instanceof APIError ? error.message : 'Failed to create new chat',
              isCreatingChat: false 
            });
          }
        },

        loadChats: async () => {
          set({ isLoadingChats: true, error: null });
          
          try {
            const response = await chatAPI.getChats();
            const chats: Chat[] = response.data || [];
            
            set({ 
              chats,
              isLoadingChats: false,
              // Set active chat to first one if none is selected
              activeChat: get().activeChat || (chats.length > 0 ? chats[0] : null)
            });
          } catch (error) {
            console.error('Error loading chats:', error);
            set({ 
              error: 'Failed to load chats from server',
              isLoadingChats: false 
            });
          }
        },

        loadChatMessages: async (chatId: string) => {
          try {
            const response = await chatAPI.getChat(chatId);
            const chatData: Chat = response.data;
            
            set((state) => ({
              chats: state.chats.map(chat => 
                chat.id === chatId ? chatData : chat
              ),
              activeChat: state.activeChat?.id === chatId ? chatData : state.activeChat
            }));
          } catch (error) {
            console.error('Error loading chat messages:', error);
            set({ error: 'Failed to load chat messages' });
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
