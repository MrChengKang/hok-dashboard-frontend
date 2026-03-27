import { HERO_DATABASE } from "../constants/heroes";
import { Trophy } from "lucide-react";

function AddMatchModal({ isOpen, onClose, onSave, newData, setNewData }) {
  if (!isOpen) return null;

  const handleKdaUpdate = (index, newVal) => {
    const kdaArray = newData.kda.split("/");
    const value = Math.max(0, newVal);
    const newKdaArray = [...kdaArray];
    newKdaArray[index] = value;

    const kills = parseInt(newKdaArray[0]) || 0;
    const deaths = parseInt(newKdaArray[1]) || 0;
    const assists = parseInt(newKdaArray[2]) || 0;

    // 調整 MVP 門檻：(K+A)/D >= 3 且擊殺 >= 3
    const kdaScore = (kills + assists) / Math.max(1, deaths);
    const isExcellent = kdaScore >= 3 && kills >= 3;

    const updatedKdaStr = newKdaArray.join("/");
    let finalResult = newData.result;

    // 智能判斷：如果是 Victory 且表現好 -> MVP；如果表現變差 -> Victory
    if (
      isExcellent &&
      (newData.result === "Victory" || newData.result === "MVP")
    ) {
      finalResult = "MVP";
    } else if (!isExcellent && newData.result === "MVP") {
      finalResult = "Victory";
    }

    setNewData({
      ...newData,
      kda: updatedKdaStr,
      result: finalResult,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="text-yellow-400" size={24} /> 記錄王者戰績
        </h2>

        <form onSubmit={onSave} className="space-y-4">
          {/* 1. 分路選擇 (Filter) */}
          <div className="mb-4">
            <label className="text-slate-400 text-[10px] font-black uppercase mb-2 block">
              Position 分路
            </label>
            <div className="flex flex-wrap gap-2">
              {["打野", "中路", "對抗路", "發育路", "遊走"].map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() =>
                    setNewData({ ...newData, position: pos, hero: "" })
                  } // 切換分路時重置英雄
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                    newData.position === pos
                      ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 英雄列表 (根據目前選的分路過濾) */}
          {/* --- components/AddMatchModal.jsx 英雄選擇部分 --- */}

          <div className="mb-6">
            <label className="text-slate-400 text-[10px] font-black uppercase mb-3 block tracking-widest">
              Select Hero 選擇英雄 ({newData.position})
            </label>
            <div className="grid grid-cols-4 gap-3 max-h-56 overflow-y-auto p-3 bg-slate-950/40 rounded-2xl border border-slate-800">
              {HERO_DATABASE.filter(
                (h) => h.defaultPos === newData.position,
              ).map((hero) => {
                // 🔴 這裡直接使用你在 heroes.js 裡定義的自定義顏色
                const heroGradient =
                  hero.color || "from-slate-500 to-slate-800";

                return (
                  <button
                    key={hero.name}
                    type="button"
                    onClick={() => {
                      setNewData({ ...newData, hero: hero.name });
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all duration-200 ${
                      newData.hero === hero.name
                        ? "bg-blue-600/20 ring-4 ring-blue-500 shadow-lg shadow-blue-900/30 scale-105"
                        : "hover:bg-slate-800/60"
                    }`}
                  >
                    {/* 🔴 優化的彩色徽章 */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${heroGradient} shadow-lg shadow-black/30 border border-white/10`}
                    >
                      {/* 顯示縮寫 initials，加上陰影 */}
                      <span className="text-white font-black text-xl drop-shadow-md tracking-tighter">
                        {hero.initials}
                      </span>
                    </div>
                    {/* 英雄名字 */}
                    <span
                      className={`text-[11px] font-bold ${newData.hero === hero.name ? "text-white" : "text-slate-300"} truncate w-full text-center`}
                    >
                      {hero.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 勝負結果 */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">結果</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none"
                value={newData.result}
                onChange={(e) =>
                  setNewData({ ...newData, result: e.target.value })
                }
              >
                <option value="Victory">Victory</option>
                <option value="Defeat">Defeat</option>
                <option value="MVP">MVP</option>
              </select>
            </div>

            {/* 分路選擇 - 這是你剛剛在資料庫新增的重點 */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">分路</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none"
                value={newData.position}
                onChange={(e) =>
                  setNewData({ ...newData, position: e.target.value })
                }
              >
                <option value="打野">打野</option>
                <option value="對抗路">對抗路</option>
                <option value="中路">中路</option>
                <option value="發育路">發育路</option>
                <option value="遊走">遊走</option>
              </select>
            </div>
          </div>

          {/* KDA 快速輸入區塊 */}
          {/* KDA 快速輸入區塊 */}
          <div className="mb-6">
            <label className="text-slate-400 text-[10px] font-black uppercase mb-3 block tracking-widest">
              Performance 戰績數據 (K / D / A)
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Kills", index: 0, color: "text-red-400" },
                { label: "Deaths", index: 1, color: "text-slate-400" },
                { label: "Assists", index: 2, color: "text-green-400" },
              ].map((stat) => {
                const kdaArray = newData.kda.split("/");
                const currentVal = parseInt(kdaArray[stat.index]) || 0;

                return (
                  <div
                    key={stat.label}
                    className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-center"
                  >
                    <p
                      className={`text-[10px] font-black uppercase mb-2 ${stat.color}`}
                    >
                      {stat.label}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleKdaUpdate(stat.index, currentVal - 1)
                        } // 🔴 改用這個
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-white font-black transition-all"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={currentVal}
                        onChange={(e) =>
                          handleKdaUpdate(
                            stat.index,
                            parseInt(e.target.value) || 0,
                          )
                        } // 🔴 改用這個
                        className="w-full bg-transparent text-center font-black text-xl outline-none text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleKdaUpdate(stat.index, currentVal + 1)
                        } // 🔴 改用這個
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-blue-500/20 text-white font-black transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30"
            >
              儲存戰績
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMatchModal;
