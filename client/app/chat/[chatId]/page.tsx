'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import ChatArea from '@/app/components/ChatArea';
import MessageInput from '@/app/components/MessageInput';
import ErrorNotification from '@/app/components/ErrorNotification';
import { useChatStore } from '@/app/stores/chatStore';
import { Chat } from '@/app/types/chat';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { chats, activeChat, setActiveChat, loadChatMessages, loadChats } = useChatStore();
  const chatId = params.chatId as string;

  useEffect(() => {
    // Load chats first if they're not loaded
    if (chats.length === 0) {
      loadChats();
    }
  }, [chats.length, loadChats]);

  useEffect(() => {
    if (chatId) {
      // Try to find the chat in the existing chats
      const chat = chats.find((c: Chat) => c.id === chatId);
      
      if (chat) {
        // Chat found in the list, set it as active and load messages if needed
        setActiveChat(chat);
        if (chat.messages.length === 0) {
          loadChatMessages(chatId);
        }
      } else if (chats.length > 0) {
        // Chats are loaded but this chat ID doesn't exist, redirect to home
        router.push('/');
      } else {
        // Chats not loaded yet, try to load this specific chat directly
        loadChatMessages(chatId).then(() => {
          // After loading, check if it was successful by looking in the store
          const updatedChats = useChatStore.getState().chats;
          const loadedChat = updatedChats.find((c: Chat) => c.id === chatId);
          if (loadedChat) {
            setActiveChat(loadedChat);
          } else {
            // Chat doesn't exist, redirect to home
            router.push('/');
          }
        }).catch(() => {
          // Failed to load chat, redirect to home
          router.push('/');
        });
      }
    }
  }, [chatId, chats, setActiveChat, loadChatMessages, router]);

  return (
    <>
      <ErrorNotification />
      <main className="flex h-screen bg-white">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              <ChatArea />
              <MessageInput />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Loading chat...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <p className="text-sm text-gray-500">Local ChatGPT-style chat</p>
        </div>
      </main>
    </>
  );
}
