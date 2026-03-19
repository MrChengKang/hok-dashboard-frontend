import React, { useState } from "react";
import { Gamepad2, User, Lock, AlertCircle } from "lucide-react"; // 👈 增加 AlertCircle 圖標

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  // 👈 新增：錯誤訊息狀態
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔒 密碼長度驗證邏輯
    if (credentials.password.length < 8) {
      setError("Password must be at least 8 characters!"); // 設定提示
      return; // 攔截，不執行登入
    }

    // 通過驗證
    setError("");
    if (credentials.username && credentials.password) {
      onLogin(credentials.username);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] bg-gradient-to-br from-[#020617] to-[#1e1b4b] flex items-center justify-center p-4">
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-10 rounded-[2rem] w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl mb-4 shadow-lg shadow-blue-500/40">
            <Gamepad2 size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">PLAYER LOGIN</h1>
          <p className="text-slate-400 text-sm">
            Enter your credentials to sync stats
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={20}
            />
            <input
              type="text"
              required
              placeholder="Username"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all text-white"
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
            />
          </div>

          <div className="relative">
            <Lock
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? "text-red-500" : "text-slate-500"}`}
              size={20}
            />
            <input
              type="password"
              required
              placeholder="Password (min 8 chars)"
              // 👈 動態邊框顏色：出錯時變紅色
              className={`w-full bg-slate-950 border rounded-xl py-4 pl-12 pr-4 outline-none transition-all text-white ${
                error
                  ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  : "border-slate-800 focus:border-blue-500"
              }`}
              onChange={(e) => {
                setError(""); // 用戶開始輸入時，自動隱藏錯誤
                setCredentials({ ...credentials, password: e.target.value });
              }}
            />
          </div>

          {/* 👈 警告訊息 UI */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-in fade-in zoom-in duration-200">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-lg transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] text-white"
          >
            START SESSION
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
