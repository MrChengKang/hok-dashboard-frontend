import React from "react";

function WinRateChart({ wins, total }) {
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const strokeDasharray = 283; // 圓周長 (2 * PI * R)
  const offset = strokeDasharray - (winRate / 100) * strokeDasharray;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center relative group transition-all hover:border-blue-500/50">
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
        Overall Performance
      </h3>

      <div className="relative w-32 h-32">
        {/* 底圈 */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-slate-800"
          />
          {/* 進度圈 */}
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-blue-500 transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          />
        </svg>

        {/* 中間文字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black">{winRate}%</span>
          <span className="text-[10px] text-slate-500 font-bold">WIN RATE</span>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-center">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold">Wins</p>
          <p className="text-sm font-bold text-green-500">{wins}</p>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold">
            Losses
          </p>
          <p className="text-sm font-bold text-red-500">{total - wins}</p>
        </div>
      </div>
    </div>
  );
}

export default WinRateChart;
