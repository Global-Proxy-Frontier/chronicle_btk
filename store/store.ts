import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, MOCK_ACCOUNTS } from '@/lib/mockData';

export type UserRole = 'SYSTEM_ADMIN' | 'COMPLIANCE_OFFICER' | 'JUNIOR_ANALYST' | 'AUDITOR';

export type ChatMessage = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  contextId: string;
};

export type AiInsight = {
  report: string;
  timestamp: string;
};

interface StoreState {
  accounts: Account[];
  selectedAccountId: string | null;
  chatHistory: ChatMessage[];
  isAiAnalyzing: boolean;
  userRole: UserRole;
  insightCache: Record<string, AiInsight>;
  setSelectedAccountId: (id: string | null) => void;
  setUserRole: (role: UserRole) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setAiAnalyzing: (status: boolean) => void;
  clearChat: () => void;
  setInsightCache: (id: string, insight: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      accounts: MOCK_ACCOUNTS,
      selectedAccountId: null,
      chatHistory: [],
      isAiAnalyzing: false,
      userRole: 'COMPLIANCE_OFFICER',
      insightCache: {},
      setSelectedAccountId: (id) => set({ selectedAccountId: id }),
      setUserRole: (role) => set({ userRole: role }),
      addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
      setAiAnalyzing: (status) => set({ isAiAnalyzing: status }),
      clearChat: () => set({ chatHistory: [] }),
      setInsightCache: (id, insight) => set((state) => ({ 
        insightCache: { 
          ...state.insightCache, 
          [id]: { report: insight, timestamp: new Date().toISOString() } 
        } 
      })),
    }),
    {
      name: 'chronicle-storage',
      partialize: (state) => ({ 
        chatHistory: state.chatHistory, 
        userRole: state.userRole,
        insightCache: state.insightCache 
      }),
    }
  )
);

