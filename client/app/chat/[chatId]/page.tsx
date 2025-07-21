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
  const { chats, activeChat, setActiveChat, loadChatMessages } = useChatStore();
  const chatId = params.chatId as string;

  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find((c: Chat) => c.id === chatId);
      if (chat) {
        setActiveChat(chat);
        // Load messages for this chat if they haven't been loaded yet
        if (chat.messages.length === 0) {
          loadChatMessages(chatId);
        }
      } else {
        // Chat not found, redirect to home
        router.push('/');
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
