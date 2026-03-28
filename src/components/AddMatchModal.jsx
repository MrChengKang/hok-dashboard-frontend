import React, { useState } from "react";
import { HERO_DATABASE } from "../constants/heroes";
import { Trophy, Image as ImageIcon, Loader2, X } from "lucide-react";
import Tesseract from "tesseract.js";

function AddMatchModal({ isOpen, onClose, onSave, newData, setNewData }) {
  const [ocrLoading, setOcrLoading] = useState(false);

  if (!isOpen) return null;

  // 手動更新 KDA 邏輯
  const handleKdaUpdate = (index, newVal) => {
    const kdaArray = newData.kda.split("/");
    const value = Math.max(0, newVal);
    const newKdaArray = [...kdaArray];
    newKdaArray[index] = value;
    const updatedKdaStr = newKdaArray.join("/");

    setNewData({ ...newData, kda: updatedKdaStr });
  };

  const handleOcrScan = async (file) => {
    if (!file) return;
    setOcrLoading(true);
    // 歸零戰績，但保留當前選好的英雄與分路
    setNewData((prev) => ({ ...prev, kda: "0/0/0", result: "Victory" }));

    try {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.filter = "grayscale(100%) contrast(200%)";
      ctx.drawImage(image, 0, 0);

      const processedImage = canvas.toDataURL("image/jpeg", 1.0);
      const {
        data: { text },
      } = await Tesseract.recognize(processedImage, "chi_sim+eng");
      const cleanText = text.replace(/\s+/g, "").toLowerCase();

      // --- 🟢 數據提取邏輯 (勝負 & MVP) ---
      let detectedResult = "Victory";
      if (cleanText.includes("mvp")) {
        detectedResult = "MVP";
      } else if (/defeat|失敗|失败|失|败/i.test(cleanText)) {
        detectedResult = "Defeat";
      }

      // --- 🟢 KDA 提取 ---
      let finalKda = "0/0/0";
      const kdaMatch = text.match(
        /(\d{1,2})\s*[\/|\\I1]\s*(\d{1,2})\s*[\/|\\I1]\s*(\d{1,2})/,
      );
      if (kdaMatch) {
        finalKda = `${kdaMatch[1]}/${kdaMatch[2]}/${kdaMatch[3]}`;
      } else {
        const nums = text.match(/\d+/g);
        if (nums) {
          const plausible = nums.filter(
            (n) => n.length <= 2 && parseInt(n) < 50,
          );
          if (plausible.length >= 3)
            finalKda = `${plausible[0]}/${plausible[1]}/${plausible[2]}`;
        }
      }

      setNewData((prev) => ({
        ...prev,
        kda: finalKda,
        result: detectedResult,
      }));
      alert(`🎉 辨識完成！\n戰績：${finalKda}\n判定：${detectedResult}`);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("辨識失敗，請手動輸入。");
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Trophy className="text-yellow-400" size={20} /> 記錄王者戰績
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full"
          >
            <X className="text-slate-500 hover:text-white" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-5 pr-1 custom-scrollbar">
          {/* 1. OCR 掃描區 */}
          <div className="p-3 rounded-2xl bg-slate-950/50 border-2 border-dashed border-slate-700/50 hover:border-blue-500/50 transition-all text-center">
            {ocrLoading ? (
              <div className="flex items-center justify-center gap-3 py-1 text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-xs font-black tracking-widest uppercase">
                  Analyzing...
                </p>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <div className="flex items-center justify-center gap-3 text-slate-500 hover:text-blue-400">
                  <ImageIcon size={18} />
                  <p className="text-[11px] font-black uppercase">
                    Smart Scan Screenshot
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleOcrScan(e.target.files[0])}
                />
              </label>
            )}
          </div>

          {/* 2. 分路與英雄 (手動選擇區) */}
          <div className="space-y-3">
            <label className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
              Step 1: Select Hero & Position
            </label>
            {/* 🔴 分路手動選按鈕 */}
            <div className="flex gap-1.5">
              {["打野", "中路", "對抗路", "發育路", "遊走"].map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() =>
                    setNewData({ ...newData, position: pos, hero: "" })
                  }
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] transition-all border ${
                    newData.position === pos
                      ? "bg-blue-600 border-blue-400 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* 英雄列表 */}
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-950/40 rounded-xl border border-slate-800">
              {HERO_DATABASE.filter(
                (h) => h.defaultPos === newData.position,
              ).map((hero) => (
                <button
                  key={hero.name}
                  type="button"
                  onClick={() => setNewData({ ...newData, hero: hero.name })}
                  className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-all ${
                    newData.hero === hero.name
                      ? "bg-blue-600/20 ring-2 ring-blue-500"
                      : "hover:bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${hero.color || "from-slate-500 to-slate-800"} text-[10px] font-black text-white shadow-sm`}
                  >
                    {hero.initials}
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">
                    {hero.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. 勝負與 KDA (兩欄佈局) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                Step 2: Match Info
              </label>
              <div className="space-y-3">
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  value={newData.result}
                  onChange={(e) =>
                    setNewData({ ...newData, result: e.target.value })
                  }
                >
                  <option value="Victory">Victory</option>
                  <option value="Defeat">Defeat</option>
                  <option value="MVP">MVP</option>
                </select>
                <div className="p-2.5 bg-blue-600/5 border border-blue-500/10 rounded-xl">
                  <p className="text-[9px] text-blue-400 font-bold uppercase tracking-tight">
                    Hero Selected:
                  </p>
                  <p className="text-xs text-white font-bold">
                    {newData.hero || "None"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                Performance (K/D/A)
              </label>
              <div className="space-y-1.5">
                {[
                  { label: "K", index: 0, color: "text-red-400" },
                  { label: "D", index: 1, color: "text-slate-400" },
                  { label: "A", index: 2, color: "text-green-400" },
                ].map((stat) => {
                  const val = parseInt(newData.kda.split("/")[stat.index]) || 0;
                  return (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800"
                    >
                      <span
                        className={`text-[10px] font-black w-4 ${stat.color}`}
                      >
                        {stat.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleKdaUpdate(stat.index, val - 1)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-white text-xs hover:bg-red-500/20"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-white min-w-[12px] text-center">
                          {val}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleKdaUpdate(stat.index, val + 1)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-white text-xs hover:bg-blue-500/20"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs text-slate-300"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={onSave}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xs text-white shadow-lg shadow-blue-600/20"
          >
            儲存戰績
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddMatchModal;
