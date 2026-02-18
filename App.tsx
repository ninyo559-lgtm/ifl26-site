import React from 'react';
import { Trophy, Shield, Zap, Info } from 'lucide-react';

/**
 * Diagnostic App Component
 * Purpose: Verify if React is mounting correctly on Netlify.
 * This version has zero dependencies on environment variables or external scripts.
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-blue-600" dir="rtl">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 blur-[150px]" />
      </div>

      <div className="max-w-2xl w-full text-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
        {/* Simple Logo Replacement */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-blue-600/20 rounded-[2.5rem] flex items-center justify-center border border-blue-500/30 shadow-2xl shadow-blue-500/20">
            <Trophy size={48} className="text-blue-500" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">
            IFL 26 <span className="text-blue-500 font-light">TEST</span>
          </h1>
          <p className="text-slate-500 uppercase tracking-[0.4em] font-black text-xs">
            System Initialization Check
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] shadow-2xl backdrop-blur-xl">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3 text-green-400">
              <Zap size={20} fill="currentColor" />
              <span className="text-xl font-bold">המערכת באוויר - מצב בדיקה</span>
            </div>
            
            <p className="text-slate-400 leading-relaxed">
              אם אתה רואה את המסך הזה, סימן שתהליך ה-Build וה-Deployment של Netlify עבר בהצלחה. 
              כעת נוכל להחזיר את הרכיבים בהדרגה כדי לזהות מה גרם לקריסה.
            </p>

            <div className="pt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-3">
                <Shield size={18} className="text-blue-500" />
                <span className="text-xs font-black">UI Rendered</span>
              </div>
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-3">
                <Info size={18} className="text-blue-500" />
                <span className="text-xs font-black">Clean Start</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="opacity-30 flex flex-col items-center gap-2">
          <div className="h-px w-12 bg-white/20 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
            IFL 26 LEAGUE MASTER • 2022-2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;