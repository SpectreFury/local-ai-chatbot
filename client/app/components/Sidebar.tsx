'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/app/stores/chatStore';
import { Chat } from '@/app/types/chat';
import ChatContextMenu from './ChatContextMenu';
import RenameDialog from './RenameDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';

export default function Sidebar() {
  const router = useRouter();
  const { 
    chats, 
    activeChat, 
    isCreatingChat, 
    isLoadingChats, 
    createNewChat, 
    setActiveChat, 
    loadChats,
    renameChat,
    deleteChat
  } = useChatStore();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    chatId: string | null;
    position: { x: number; y: number };
  }>({ isOpen: false, chatId: null, position: { x: 0, y: 0 } });

  // Dialog states
  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    chatId: string | null;
    currentTitle: string;
  }>({ isOpen: false, chatId: null, currentTitle: '' });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    chatId: string | null;
    chatTitle: string;
  }>({ isOpen: false, chatId: null, chatTitle: '' });

  useEffect(() => {
    // Load chats when component mounts
    loadChats();
  }, [loadChats]);

  const handleNewChat = () => {
    createNewChat('New Chat', (chatId: string) => {
      router.push(`/chat/${chatId}`);
    });
  };

  const handleChatClick = (chat: Chat) => {
    setActiveChat(chat);
    router.push(`/chat/${chat.id}`);
  };

  const handleRightClick = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      chatId: chat.id,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const handleRename = () => {
    const chat = chats.find(c => c.id === contextMenu.chatId);
    if (chat) {
      setRenameDialog({
        isOpen: true,
        chatId: chat.id,
        currentTitle: chat.title
      });
    }
  };

  const handleDelete = () => {
    const chat = chats.find(c => c.id === contextMenu.chatId);
    if (chat) {
      setDeleteDialog({
        isOpen: true,
        chatId: chat.id,
        chatTitle: chat.title
      });
    }
  };

  const confirmRename = async (newTitle: string) => {
    if (renameDialog.chatId) {
      await renameChat(renameDialog.chatId, newTitle);
      setRenameDialog({ isOpen: false, chatId: null, currentTitle: '' });
    }
  };

  const confirmDelete = async () => {
    if (deleteDialog.chatId) {
      await deleteChat(deleteDialog.chatId, () => {
        // Navigate to home if we deleted the active chat
        if (activeChat?.id === deleteDialog.chatId) {
          router.push('/');
        }
      });
      setDeleteDialog({ isOpen: false, chatId: null, chatTitle: '' });
    }
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
        {isLoadingChats ? (
          <div className="px-4 py-6 text-center text-gray-500">
            <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2"></div>
            <p className="text-sm">Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500">
            <p className="text-sm">No chats yet. Create your first chat!</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatClick(chat)}
              onContextMenu={(e) => handleRightClick(e, chat)}
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
          ))
        )}
      </div>

      {/* Context Menu */}
      <ChatContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ isOpen: false, chatId: null, position: { x: 0, y: 0 } })}
        onRename={handleRename}
        onDelete={handleDelete}
        position={contextMenu.position}
      />

      {/* Rename Dialog */}
      <RenameDialog
        isOpen={renameDialog.isOpen}
        currentTitle={renameDialog.currentTitle}
        onClose={() => setRenameDialog({ isOpen: false, chatId: null, currentTitle: '' })}
        onConfirm={confirmRename}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        chatTitle={deleteDialog.chatTitle}
        onClose={() => setDeleteDialog({ isOpen: false, chatId: null, chatTitle: '' })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
