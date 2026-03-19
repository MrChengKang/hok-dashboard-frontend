import { Trophy } from "lucide-react";

function AddMatchModal({ isOpen, onClose, onSave, newData, setNewData }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="text-yellow-400" size={24} /> 記錄王者戰績
        </h2>

        <form onSubmit={onSave} className="space-y-4">
          {/* 英雄名稱 */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              英雄名稱
            </label>
            <input
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              value={newData.hero}
              onChange={(e) => setNewData({ ...newData, hero: e.target.value })}
              placeholder="例如：李白、韓信..."
            />
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

          {/* KDA 數據 */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">KDA</label>
            <input
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none"
              value={newData.kda}
              onChange={(e) => setNewData({ ...newData, kda: e.target.value })}
              placeholder="0/0/0"
            />
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
