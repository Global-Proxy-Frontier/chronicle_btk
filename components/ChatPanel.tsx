'use client';

import { useStore } from "@/store/store";
import { Send, Zap } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { chatWithChronicle } from "@/services/geminiService";
import Markdown from "react-markdown";

export default function ChatPanel() {
  const { accounts, selectedAccountId, chatHistory, addChatMessage, isAiAnalyzing, setAiAnalyzing, userRole } = useStore();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  
  const account = accounts.find(a => a.id === selectedAccountId);
  
  const contextId = account ? account.id : 'GLOBAL';
  const visibleChatHistory = chatHistory.filter(msg => msg.contextId === contextId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiAnalyzing]);

  const handleSubmitMessage = async (userMsg: string) => {
    if (!userMsg.trim() || isAiAnalyzing) return;

    setInput("");
    
    // Pass the existing history before we add the new user message 
    // so we don't accidentally double-send it as context and current message too.
    const currentHistory = [...visibleChatHistory];
    
    addChatMessage({ id: Date.now().toString(), sender: 'user', text: userMsg, contextId });
    setAiAnalyzing(true);

    try {
      // Pass null account if selectedAccountId is 'global' or similar
      const responseText = await chatWithChronicle(account || null, currentHistory, userMsg, userRole);
      addChatMessage({ id: (Date.now() + 1).toString(), sender: 'ai', text: responseText, contextId });
    } catch (e) {
      addChatMessage({ id: (Date.now() + 1).toString(), sender: 'ai', text: 'ERROR: connection failed.', contextId });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitMessage(input.trim());
  };

  return (
    <div className="flex flex-col h-full border-l border-slate-800 bg-slate-900/20">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Investigation Terminal {account ? `[${account.id}]` : '[GLOBAL VIEW]'}
        </span>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-slate-600"></div>
          <div className="w-1 h-1 rounded-full bg-slate-600"></div>
          <div className="w-1 h-1 rounded-full bg-slate-600"></div>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        {visibleChatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-70">
            <div className="text-center text-slate-500 font-mono text-[10px] uppercase tracking-widest border border-slate-800 px-4 py-2 rounded">
              Awaiting Commands
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[250px]">
              <button onClick={() => handleSubmitMessage("Bu hesapta/sistemde herhangi bir anomali var mı?")} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 rounded cursor-pointer transition-colors active:scale-95">
                <Zap className="w-3 h-3 text-emerald-500" /> Anomalileri Tara
              </button>
              <button onClick={() => handleSubmitMessage("Ağdaki para transferlerinin özetini verir misin?")} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 rounded cursor-pointer transition-colors active:scale-95">
                <Zap className="w-3 h-3 text-orange-500" /> Akış Özeti Çıkar
              </button>
              <button onClick={() => handleSubmitMessage("Şüpheli İşlem Raporu (STR) için bir draft hazırlar mısın?")} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 rounded cursor-pointer transition-colors active:scale-95">
                <Zap className="w-3 h-3 text-red-500" /> STR Taslağı Oluştur
              </button>
            </div>
          </div>
        )}
        
        {visibleChatHistory.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}>
            <span className={`text-[8px] uppercase font-bold ${msg.sender === 'user' ? 'text-slate-600' : 'text-emerald-600'}`}>
              {msg.sender === 'user' ? userRole.replace('_', ' ') : 'Chronicle AI'}
            </span>
            <div className={`p-3 text-[12px] max-w-[95%] leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-slate-800/80 rounded-br-xl rounded-tr-xl rounded-bl-sm border-l-2 border-slate-600 text-slate-300 font-mono' 
                : 'bg-emerald-950/40 rounded-bl-xl rounded-tl-xl rounded-br-sm border-r-2 border-emerald-800 text-emerald-100'
            }`}>
              <Markdown
                components={{
                  strong: ({node, ...props}) => <span className="font-semibold text-white drop-shadow-sm" {...props} />,
                  ul: ({node, ...props}) => <ul className="flex flex-col gap-1 my-2" {...props} />,
                  li: ({node, ...props}) => <li className="flex gap-2 items-start before:content-['>'] before:text-emerald-500 before:font-bold" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                }}
              >
                {msg.text}
              </Markdown>
            </div>
          </div>
        ))}

        {isAiAnalyzing && (
          <div className="flex items-center gap-2 py-4 justify-end">
            <span className="text-[10px] text-slate-500 italic">Chronicle is analyzing...</span>
            <div className="w-3 h-3 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={userRole === 'AUDITOR' ? "Read-only mode" : isAiAnalyzing ? "Processing request..." : "Query engine..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isAiAnalyzing || userRole === 'AUDITOR'}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-3 pr-10 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-700 font-mono transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isAiAnalyzing || !input.trim() || userRole === 'AUDITOR'}
              className="absolute right-2 text-slate-500 hover:text-emerald-500 disabled:opacity-50 disabled:hover:text-slate-500 transition-colors p-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
        <div className="mt-2 flex justify-between text-[8px] text-slate-600 font-mono uppercase tracking-widest pl-1">
          <span>Enter to submit</span>
        </div>
      </div>
    </div>
  );
}
