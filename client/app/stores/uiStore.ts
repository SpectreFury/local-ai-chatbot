import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Message input state
  inputMessage: string;
  isSendingMessage: boolean;
  
  // Streaming state
  activeStreamId: string | null;
  isStreamActive: boolean;
  isTyping: boolean; // For typing indicator
  
  // UI states
  sidebarCollapsed: boolean;
  
  // Actions
  setInputMessage: (message: string) => void;
  clearInputMessage: () => void;
  setIsSendingMessage: (sending: boolean) => void;
  setActiveStreamId: (streamId: string | null) => void;
  setIsStreamActive: (active: boolean) => void;
  setIsTyping: (typing: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      inputMessage: '',
      isSendingMessage: false,
      activeStreamId: null,
      isStreamActive: false,
      isTyping: false,
      sidebarCollapsed: false,

      // Actions
      setInputMessage: (message) => set({ inputMessage: message }),
      clearInputMessage: () => set({ inputMessage: '' }),
      setIsSendingMessage: (sending) => set({ isSendingMessage: sending }),
      setActiveStreamId: (streamId) => set({ activeStreamId: streamId }),
      setIsStreamActive: (active) => set({ isStreamActive: active }),
      setIsTyping: (typing) => set({ isTyping: typing }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'ui-store',
    }
  )
);
