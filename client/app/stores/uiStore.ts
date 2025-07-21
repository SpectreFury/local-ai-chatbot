import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Message input state
  inputMessage: string;
  isSendingMessage: boolean;
  
  // UI states
  sidebarCollapsed: boolean;
  
  // Actions
  setInputMessage: (message: string) => void;
  clearInputMessage: () => void;
  setIsSendingMessage: (sending: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      inputMessage: '',
      isSendingMessage: false,
      sidebarCollapsed: false,

      // Actions
      setInputMessage: (message) => set({ inputMessage: message }),
      clearInputMessage: () => set({ inputMessage: '' }),
      setIsSendingMessage: (sending) => set({ isSendingMessage: sending }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'ui-store',
    }
  )
);
