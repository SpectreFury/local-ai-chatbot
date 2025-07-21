'use client';

import { useRouter } from 'next/navigation';
import { useChatStore } from '@/app/stores/chatStore';
import { Chat } from '@/app/types/chat';

export default function Sidebar() {
  const router = useRouter();
  const { chats, activeChat, isCreatingChat, createNewChat, setActiveChat } = useChatStore();

  const handleNewChat = () => {
    createNewChat('New Chat', (chatId: string) => {
      router.push(`/chat/${chatId}`);
    });
  };

  const handleChatClick = (chat: Chat) => {
    setActiveChat(chat);
    router.push(`/chat/${chat.id}`);
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* New Chat Button */}
      <div className="p-4">
        <button 
          onClick={handleNewChat}
          disabled={isCreatingChat}
          className="w-full bg-gray-800 text-white rounded-lg py-3 px-4 font-medium hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isCreatingChat ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating...
            </>
          ) : (
            'New Chat'
          )}
        </button>
      </div>

      {/* App Title */}
      <div className="px-4 pb-4">
        <h1 className="text-lg font-medium text-gray-900">ChatGPT-style App</h1>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleChatClick(chat)}
            className={`px-4 py-3 cursor-pointer border-l-4 ${
              activeChat?.id === chat.id 
                ? 'bg-white border-blue-500 shadow-sm' 
                : 'border-transparent hover:bg-gray-100'
            } transition-all`}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900 truncate flex-1">{chat.title}</h3>
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{chat.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
