'use client';

import { useStore } from "@/store/store";
import { Globe } from "lucide-react";

export default function AccountQueue() {
  const { accounts, selectedAccountId, setSelectedAccountId } = useStore();

  const getRiskColor = (score: number) => {
    if (score > 80) return 'bg-red-950 text-red-400 border-red-900';
    if (score >= 50) return 'bg-orange-950 text-orange-400 border-orange-900';
    return 'bg-slate-900 text-slate-500 border-slate-700';
  };

  return (
    <div className="flex flex-col h-full border-r border-slate-800 bg-slate-950">
      <div className="p-3 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between shrink-0">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Flagged Queue ({accounts.length})</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-slate-950">
        {/* Global Dashboard Button */}
        <div
          onClick={() => setSelectedAccountId(null)}
          className={`p-3 border-b border-slate-800 cursor-pointer flex items-center gap-3 ${
            selectedAccountId === null
              ? 'bg-emerald-950/20 border-l-2 border-l-emerald-500'
              : 'hover:bg-slate-900'
          }`}
        >
          <div className={`p-2 rounded ${selectedAccountId === null ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className={`text-xs font-bold tracking-wide uppercase ${selectedAccountId === null ? 'text-emerald-400' : 'text-slate-300'}`}>
              MACRO VIEW
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">Global Analytics</div>
          </div>
        </div>

        {accounts.map(acc => {
          const isActive = selectedAccountId === acc.id;
          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`p-3 border-b border-slate-800 cursor-pointer ${
                isActive
                  ? 'bg-slate-800/40 border-l-2 border-l-emerald-500'
                  : 'hover:bg-slate-900'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono text-slate-400">{acc.id}</span>
                <span className={`text-[9px] px-1 border rounded ${getRiskColor(acc.riskScore)}`}>
                  RISK: {acc.riskScore}
                </span>
              </div>
              <div className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {acc.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 uppercase">{acc.kycStatus}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
