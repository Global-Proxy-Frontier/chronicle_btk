'use client';

import { useEffect, useState } from 'react';
import { useStore, UserRole } from '@/store/store';

export default function Navbar() {
  const [time, setTime] = useState('');
  const { userRole, setUserRole } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const roles: UserRole[] = ['SYSTEM_ADMIN', 'COMPLIANCE_OFFICER', 'JUNIOR_ANALYST', 'AUDITOR'];

  return (
    <nav className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 z-50 relative">
      <div className="flex items-center gap-4">
        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
        <span className="font-bold tracking-tighter text-lg text-white">CHRONICLE ENGINE</span>
        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono uppercase tracking-widest">v.4.2-STABLE</span>
      </div>
      <div className="flex items-center gap-6 text-[11px] font-mono">
        <div className="flex flex-col items-end">
          <span className="text-slate-500 uppercase text-[9px]">System Clock</span>
          <span className="text-slate-300">{time || '...'}</span>
        </div>
        <div className="h-8 w-[1px] bg-slate-800"></div>
        <div className="flex flex-col items-end relative">
          <span className="text-slate-500 uppercase text-[9px]">Access Level</span>
          <div className="relative">
            <select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-transparent text-emerald-400 text-right appearance-none focus:outline-none cursor-pointer hover:text-emerald-300 font-bold z-10 relative"
              style={{ paddingRight: '12px' }}
            >
              {roles.map(r => (
                <option key={r} value={r} className="bg-slate-900 text-emerald-400">{r.replace('_', ' ')}</option>
              ))}
            </select>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
               ▼
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
