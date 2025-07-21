'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/Sidebar';
import ErrorNotification from './components/ErrorNotification';
import { useChatStore } from './stores/chatStore';

export default function Home() {
  const router = useRouter();
  const { chats } = useChatStore();

  useEffect(() => {
    // If there are chats available, redirect to the first one
    if (chats.length > 0) {
      router.push(`/chat/${chats[0].id}`);
    }
  }, [chats, router]);

  return (
    <>
      <ErrorNotification />
      <main className="flex h-screen bg-white">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                Welcome to Local ChatGPT
              </h1>
              <p className="mb-6">
                {chats.length === 0 
                  ? "Start a new conversation by clicking 'New Chat'" 
                  : "Select a chat from the sidebar or start a new one"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <p className="text-sm text-gray-500">Local ChatGPT-style chat</p>
        </div>
      </main>
    </>
  );
}