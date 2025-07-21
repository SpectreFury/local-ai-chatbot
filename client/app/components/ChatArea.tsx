'use client';

import { useChatStore } from '@/app/stores/chatStore';

export default function ChatArea() {
  const { activeChat } = useChatStore();

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <>
      {/* Chat Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900">{activeChat.title}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeChat.messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className="font-semibold text-gray-900">
              {message.role === 'user' ? 'User:' : 'Bot:'}
            </div>
            <div className="text-gray-800 leading-relaxed">
              {message.content}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
