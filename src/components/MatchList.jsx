import React from "react";

function MatchList({ matches, onSelect, selectedId }) {
  // 1. 統一的空狀態判斷放在最前面
  if (matches.length === 0) {
    return (
      <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
        <div className="text-slate-500 mb-2 font-medium">
          No match history found
        </div>
        <div className="text-slate-600 text-sm">
          Try adjusting your search or filters
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
      {matches.map((match, index) => (
        <div
          key={match.id}
          onClick={() => onSelect(match)}
          className={`p-6 flex items-center justify-between cursor-pointer transition-all duration-300
      match-item-animate 
      ${
        selectedId === match.id
          ? "bg-blue-900/20 border-l-4 border-blue-500"
          : "hover:bg-slate-800/50 border-l-4 border-transparent hover:translate-x-1"
      }`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${match.hero}`}
                alt={match.hero}
                className={`w-12 h-12 rounded-2xl p-1 bg-slate-800 border-2 transition-all
                  ${
                    match.result === "Victory"
                      ? "border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                      : "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] group-hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                  }`}
              />
              {/* 勝利時的小光圈 */}
              <div
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 
                ${match.result === "Victory" ? "bg-green-500" : "bg-red-500"}`}
              />
            </div>
            <div>
              <div className="font-bold text-lg">{match.hero}</div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider
                  ${
                    match.game === "League of Legends"
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
              >
                {match.game}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`font-mono ${parseInt(match.kda.split("/")[0]) >= 10 ? "text-yellow-400" : "text-slate-300"}`}
            >
              {match.kda}
            </div>
            <div className="text-xs text-slate-500">{match.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MatchList;
