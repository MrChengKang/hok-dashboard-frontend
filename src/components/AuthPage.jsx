import { useState, useEffect } from "react";

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    otp: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // --- 2FA 相關狀態 ---
  const [countdown, setCountdown] = useState(0);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // 倒數計時邏輯
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 自動清除訊息
  useEffect(() => {
    if (msg.text) {
      const timer = setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  // --- 發送驗證碼函式 ---
  const handleSendOtp = async () => {
    if (!form.email.includes("@")) {
      setMsg({ text: "❌ 請輸入正確的 Email", type: "error" });
      return;
    }
    try {
      const res = await fetch("http://localhost:8080/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      if (res.ok) {
        setMsg({ text: "📩 驗證碼已發送", type: "success" });
        setIsOtpSent(true);
        setCountdown(60);
      }
    } catch (err) {
      setMsg({ text: "🚀 伺服器連線失敗", type: "error" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });

    // 1. 只有在「非登入模式」(即 註冊 或 重設密碼) 時才強制檢查驗證碼
    if (!isLogin || isReset) {
      if (isOtpSent) {
        try {
          const verifyRes = await fetch(
            "http://localhost:8080/api/auth/verify-otp",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: form.email, otp: form.otp }),
            },
          );
          const verifyResult = await verifyRes.text();
          if (verifyResult !== "Verify Success") {
            setMsg({ text: "❌ 驗證碼錯誤", type: "error" });
            return;
          }
        } catch (err) {
          setMsg({ text: "🚀 驗證失敗", type: "error" });
          return;
        }
      } else {
        setMsg({ text: "⚠️ 請先發送並輸入驗證碼", type: "error" });
        return;
      }
    }

    // 2. 處理「重設密碼」邏輯
    if (isReset) {
      try {
        const res = await fetch(
          `http://localhost:8080/api/auth/reset-password`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: form.username,
              newPassword: form.password,
            }),
          },
        );
        const result = await res.text();
        if (result.includes("Success")) {
          setMsg({ text: "✅ 密碼已更新", type: "success" });
          setTimeout(() => {
            setIsReset(false);
            setIsLogin(true);
          }, 2000);
        } else {
          setMsg({ text: `⚠️ ${result}`, type: "error" });
        }
      } catch (err) {
        setMsg({ text: "🚀 連線失敗", type: "error" });
      }
      return;
    }

    // 3. 處理「註冊」時的密碼二次確認
    if (!isLogin) {
      if (form.password !== form.confirmPassword) {
        setMsg({ text: "❌ 兩次密碼輸入不一致", type: "error" });
        return;
      }
    }

    // 4. 處理「一般登入」或「註冊」邏輯
    const path = isLogin ? "/login" : "/register";
    try {
      const res = await fetch(`http://localhost:8080/api/auth${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          email: form.email, // 🔴 確保註冊時傳送 Email 給後端
        }),
      });
      const result = await res.text();
      if (result.toLowerCase().includes("success")) {
        setMsg({ text: `🎉 ${result}`, type: "success" });
        if (isLogin) {
          setTimeout(() => onLoginSuccess(form.username), 1000);
        } else {
          setIsLogin(true);
        }
      } else {
        setMsg({ text: `⚠️ ${result}`, type: "error" });
      }
    } catch (err) {
      setMsg({ text: "🚀 連線失敗", type: "error" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden font-sans">
      {/* 🔴 新增：背景流光效果 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>

      {/* 訊息彈窗提示 */}
      {msg.text && (
        <div
          className={`fixed top-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl font-black z-50 animate-in fade-in zoom-in slide-in-from-top-4 duration-300 ${msg.type === "success" ? "bg-blue-600 shadow-blue-900/40" : "bg-red-500 shadow-red-900/40"} text-white shadow-2xl border border-white/10`}
        >
          {msg.text}
        </div>
      )}

      {/* 登入框容器：加入毛玻璃效果 */}
      <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[40px] w-full max-w-md shadow-2xl text-white relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-blue-400 italic tracking-tighter mb-1">
            {isReset ? "RESET" : isLogin ? "LOGIN" : "REGISTER"}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            HOK Dashboard Access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">
              Player Username
            </label>
            <input
              className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              placeholder="輸入玩家名稱"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          {/* Email & Send Code (僅在註冊/重設密碼時顯示) */}
          {(!isLogin || isReset) && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">
                Verify Email
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-slate-950/50 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required={!isLogin || isReset}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 0}
                  className={`px-5 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all shadow-lg ${countdown > 0 ? "bg-slate-800 text-slate-500" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20"}`}
                >
                  {countdown > 0 ? `${countdown}S` : "Send"}
                </button>
              </div>
            </div>
          )}

          {/* OTP Input */}
          {(!isLogin || isReset) && isOtpSent && (
            <div className="animate-pulse">
              <input
                className="w-full bg-blue-500/10 border-2 border-blue-500/50 p-4 rounded-2xl outline-none text-center font-black tracking-[1em] text-blue-400"
                placeholder="000000"
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value })}
                required
              />
            </div>
          )}

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* Confirm Password (註冊專用) */}
          {!isLogin && !isReset && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-500 text-sm"
                placeholder="確認新密碼"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-white shadow-xl shadow-blue-900/30 transition-all active:scale-[0.98] mt-4">
            {isReset
              ? "UPDATE PASSWORD"
              : isLogin
                ? "ENTER DASHBOARD"
                : "CREATE ACCOUNT"}
          </button>
        </form>

        {/* 切換連結 */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            {isLogin ? "No account?" : "Already a player?"}
            <span
              onClick={() => {
                setIsLogin(!isLogin);
                setIsReset(false);
                setIsOtpSent(false);
                setMsg({ text: "", type: "" });
              }}
              className="text-blue-400 cursor-pointer ml-2 hover:text-blue-300 transition-colors"
            >
              {isLogin ? "REGISTER NOW" : "LOG IN"}
            </span>
          </p>
          {isLogin && (
            <span
              onClick={() => {
                setIsReset(true);
                setIsOtpSent(false);
                setMsg({ text: "", type: "" });
              }}
              className="block text-[10px] text-slate-600 cursor-pointer hover:text-slate-400 font-bold tracking-tighter"
            >
              FORGOT PASSWORD?
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
