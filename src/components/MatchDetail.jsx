import React from "react";
import { X, Target, Zap, Shield } from "lucide-react";

// 1. 內部的輔助組件，不用 export，因為只有這檔案會用到
function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-2xl">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <span className="font-bold">{value}</span>
    </div>
  );
}

// 2. 主要的 MatchDetail 組件
function MatchDetail({ selectedMatch, onClose, onDelete }) {
  // 3. 雖然 App.jsx 有判斷，但在這裡加個保護更安全
  if (!selectedMatch) return null;

  return (
    <div className="w-80 flex-shrink-0 sticky top-8 animate-in slide-in-from-right duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold">Match Detail</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <img
            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${selectedMatch.hero}`}
            className="w-24 h-24 rounded-3xl mb-4 shadow-2xl shadow-blue-500/20"
            alt="Hero"
          />
          <h2 className="text-2xl font-black">{selectedMatch.hero}</h2>
          <span className="text-blue-500 font-bold">{selectedMatch.game}</span>
        </div>

        <div className="text-center mb-8">
          <div className="flex flex-col items-center">
            <h2
              className={`text-4xl font-black italic tracking-tighter mb-1
              ${selectedMatch.result === "Victory" ? "text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" : "text-red-500"}`}
            >
              {selectedMatch.result.toUpperCase()}
            </h2>
          </div>
        </div>

        <div className="space-y-6">
          <DetailItem
            icon={<Target className="text-red-400" />}
            label="Damage Dealt"
            value={selectedMatch.damageDealt || "0"}
          />
          <DetailItem
            icon={<Zap className="text-yellow-400" />}
            label="Gold Earned"
            value={selectedMatch.goldEarned || "0k"}
          />
          <DetailItem
            icon={<Shield className="text-blue-400" />}
            label="KDA Ratio"
            value={selectedMatch.kda}
          />
        </div>

        <div className="flex gap-3 mt-6">
          {/* Replay Match 按鈕：使用 flex-1 讓兩者均分寬度 */}
          <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20">
            Replay Match
          </button>

          {/* Delete Record 按鈕 */}
          <button
            onClick={() => onDelete(selectedMatch.id)}
            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold transition-all border border-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchDetail;
