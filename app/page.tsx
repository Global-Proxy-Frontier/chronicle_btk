'use client';

import Navbar from "@/components/Navbar";
import AccountQueue from "@/components/AccountQueue";
import DataTerminal from "@/components/DataTerminal";
import ChatPanel from "@/components/ChatPanel";

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Queue (20%) */}
        <div className="w-[20%] min-w-[250px] shrink-0">
          <AccountQueue />
        </div>
        
        {/* Column 2: Terminal (50%) */}
        <div className="w-[50%] min-w-[500px] shrink-0">
          <DataTerminal />
        </div>
        
        {/* Column 3: Chat (30%) */}
        <div className="flex-1 min-w-[300px]">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
