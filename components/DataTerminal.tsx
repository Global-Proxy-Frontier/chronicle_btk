'use client';

import { useStore } from "@/store/store";
import { Terminal, ShieldAlert, Activity, Users, Download, FileText, FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchInitialAnalysis, fetchGlobalAnalysis } from "@/services/geminiService";
import Markdown from "react-markdown";
import { exportGlobalPDF, exportToCSV, exportToPDF } from "@/lib/exportUtils";

export default function DataTerminal() {
  const { accounts, selectedAccountId, userRole, insightCache, setInsightCache } = useStore();
  const account = accounts.find(a => a.id === selectedAccountId);
  
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [reportTimestamp, setReportTimestamp] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const performAnalysis = async (forceRefetch = false) => {
    const cacheKey = account ? `acc_${account.id}_${userRole}` : `global_${userRole}`;
    
    if (!forceRefetch && insightCache[cacheKey]) {
      setAiReport(insightCache[cacheKey].report);
      setReportTimestamp(new Date(insightCache[cacheKey].timestamp).toLocaleString('tr-TR'));
      return;
    }

    setAiReport(null);
    setReportTimestamp(null);
    setIsReportLoading(true);
    
    try {
      let report = '';
      if (account) {
        report = await fetchInitialAnalysis(account, userRole);
      } else {
        report = await fetchGlobalAnalysis(userRole);
      }
      setInsightCache(cacheKey, report);
      setAiReport(report);
      setReportTimestamp(new Date().toLocaleString('tr-TR'));
    } catch (e) {
      setAiReport("Analiz hatası.");
    } finally {
      setIsReportLoading(false);
    }
  };

  useEffect(() => {
    performAnalysis();
  }, [account?.id, selectedAccountId, userRole]);

  const markdownComponents = {
    strong: ({node, ...props}: any) => <span className="font-semibold text-white drop-shadow-sm" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-4 space-y-1 my-2 marker:text-emerald-500" {...props} />,
    li: ({node, ...props}: any) => <li className="text-slate-300" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-2 last:mb-0" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-xs font-bold text-white uppercase tracking-wider mt-4 mb-2" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mt-5 mb-3" {...props} />
  };

  const macroMarkdownComponents = {
    ...markdownComponents,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-4 space-y-1 my-2 marker:text-orange-500" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-5 mb-3" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-base font-bold text-orange-400 uppercase tracking-widest mt-6 mb-4" {...props} />
  };

  if (!account) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 grid grid-cols-3 gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-blue-500/30 bg-blue-500/10 rounded">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-slate-500">Total Monitored</label>
              <div className="text-xl font-mono text-white">12,405</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 border border-red-500/30 bg-red-500/10 rounded">
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-slate-500">Flagged (High Risk)</label>
              <div className="text-xl font-mono text-red-400">3</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 border border-emerald-500/30 bg-emerald-500/10 rounded">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-slate-500">Network Flow (24h)</label>
              <div className="text-xl font-mono text-emerald-400">$4.2M</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex gap-4 p-4 min-h-0">
          <div className="w-1/3 flex flex-col gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 shrink-0">
              <span className="w-1 h-3 bg-blue-500"></span>
              System Overview 
            </h3>
            <div className="border border-slate-800 bg-slate-900/30 rounded p-4 flex flex-col items-center justify-center flex-1 min-h-0">
               <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">Top Risk Origin</span>
               <span className="text-sm font-mono text-slate-300">FRANKFURT CENTRAL</span>
               <span className="text-xs text-red-400 mt-1">2 Flagged</span>
            </div>
            <div className="border border-slate-800 bg-slate-900/30 rounded p-4 flex flex-col items-center justify-center flex-1 min-h-0">
               <span className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">Trending Anomaly</span>
               <span className="text-sm font-mono text-slate-300">Layering / Pass-through</span>
               <span className="text-xs text-orange-400 mt-1">Spike: +400%</span>
            </div>
          </div>

          {/* AI Initial Report Panel (Macro) */}
          <div className="w-2/3 border border-slate-800 bg-slate-900/40 rounded flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[.2em] font-bold text-orange-400">System Macro Insight</span>
                {reportTimestamp && (
                  <span className="text-[8px] text-slate-500 font-mono ml-2 border-l border-slate-800 pl-2">
                    {reportTimestamp}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => performAnalysis(true)} 
                  disabled={isReportLoading}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-orange-400 rounded border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Activity className="w-3 h-3 text-orange-400" /> Re-Scan
                </button>
                {userRole !== 'JUNIOR_ANALYST' && (
                  <button 
                    onClick={() => exportGlobalPDF(aiReport)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-orange-400" /> Export PDF
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pr-2 custom-scrollbar">
              {isReportLoading ? (
                <div className="flex items-center gap-2 text-[11px] text-orange-500/70 italic font-mono h-full justify-center">
                  <div className="w-3 h-3 border-2 border-slate-700 border-t-orange-500 rounded-full animate-spin"></div>
                  Chronicle AI is scanning global topology...
                </div>
              ) : (
                <div className="text-[12px] leading-relaxed text-slate-300 font-sans">
                  {aiReport ? (
                    <Markdown components={macroMarkdownComponents}>
                      {aiReport}
                    </Markdown>
                  ) : (
                    <span className="italic">No analysis available.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Metadata Header */}
      <div className="p-4 bg-slate-900/50 border-b border-slate-800 grid grid-cols-4 gap-4 shrink-0">
        <div>
          <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Vessel / Entity</label>
          <div className="text-xs font-mono text-white tracking-wider uppercase">{account.name}</div>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">Origin Branch</label>
          <div className="text-xs text-slate-300 uppercase">{account.branch}</div>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">SWIFT / BIC</label>
          <div className="text-xs font-mono text-white tracking-wider uppercase">{account.swiftCode}</div>
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1">KYC Status</label>
          <div className="text-xs flex items-center gap-2 font-mono uppercase text-slate-300">
            <span className={`w-2 h-2 rounded-full ${account.kycStatus.includes('Flagged') ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
            {account.kycStatus}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden border-t border-slate-800">
        {/* Dense Transaction Table */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 bg-slate-950 border-r border-slate-800">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <span className="w-1 h-3 bg-emerald-500"></span>
            Transaction Ledger (T-minus 30 Days)
          </h3>
          <div className="flex gap-2">
             <button 
               onClick={() => exportToCSV(account)}
               className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-[9px] uppercase tracking-wider text-slate-300 rounded transition-colors cursor-pointer"
             >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> Export CSV
             </button>
             <button 
               onClick={() => exportToPDF(account, aiReport)}
               className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-[9px] uppercase tracking-wider text-slate-300 rounded transition-colors cursor-pointer"
             >
                <FileText className="w-3 h-3 text-red-500" /> Export SAR (PDF)
             </button>
          </div>
        </div>
        <div className="border border-slate-800 rounded-sm overflow-auto flex-1 bg-slate-950">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-[9px] uppercase tracking-tight text-slate-500 font-mono sticky top-0">
              <tr>
                <th className="p-2 border-b border-slate-800">Timestamp</th>
                <th className="p-2 border-b border-slate-800">Type</th>
                <th className="p-2 border-b border-slate-800 text-right">Amount (USD)</th>
                <th className="p-2 border-b border-slate-800">Method</th>
                <th className="p-2 border-b border-slate-800">Counterparty</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-mono divide-y divide-slate-900">
              {account.transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40">
                  <td className="p-2 text-slate-400">{tx.date} {tx.time}</td>
                  <td className={`p-2 font-bold ${tx.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type}
                  </td>
                  <td className="p-2 text-white font-bold text-right">
                    {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-slate-300">{tx.method}</td>
                  <td className="p-2 truncate max-w-[120px] text-slate-300">{tx.counterparty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>

        {/* AI Initial Report Panel side panel */}
        <div className="w-[380px] p-4 bg-slate-900/40 shrink-0 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-2 shrink-0 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-[.25em] font-bold text-emerald-500">Chronicle AI Insight</span>
            </div>
            {reportTimestamp && (
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-slate-500 font-mono" title="Last Analyzed Time">{reportTimestamp}</span>
                <button 
                  onClick={() => performAnalysis(true)} 
                  disabled={isReportLoading}
                  className="text-[9px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded transition-colors disabled:opacity-50 border border-slate-700 uppercase tracking-widest cursor-pointer leading-tight flex items-center gap-1"
                >
                  <Activity className="w-3 h-3" /> Re-Scan
                </button>
              </div>
            )}
          </div>
          <div className="h-[1px] w-full bg-slate-800 shrink-0 my-2"></div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {isReportLoading ? (
            <div className="flex items-center gap-2 text-[11px] text-emerald-500/70 italic font-mono h-full justify-center">
              <div className="w-3 h-3 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
              Analyzing...
            </div>
          ) : (
            <div className="text-[12px] leading-relaxed text-slate-300 font-sans">
              {aiReport ? (
                <Markdown components={markdownComponents}>
                  {aiReport}
                </Markdown>
              ) : (
                <span className="italic">No analysis available.</span>
              )}
            </div>
          )}
        </div>
         <div className="mt-3 flex gap-4 shrink-0 pt-3 border-t border-slate-800">
           <div className="bg-slate-800 p-2 rounded flex flex-col flex-1">
             <span className="text-[8px] uppercase text-slate-500 mb-0.5">Conf. Score</span>
             <span className="text-[10px] font-mono text-emerald-400">{(account.riskScore * 0.98).toFixed(1)}%</span>
           </div>
           <div className="bg-slate-800 p-2 rounded flex flex-col flex-1">
             <span className="text-[8px] uppercase text-slate-500 mb-0.5">Flag Type</span>
             <span className="text-[10px] font-mono text-white">{account.riskScore > 80 ? 'Structuring' : 'Routine'}</span>
           </div>
         </div>
       </div>
      </div>
    </div>
  );
}
