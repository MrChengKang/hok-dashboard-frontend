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
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
      {msg.text && (
        <div
          className={`fixed top-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-bold z-50 animate-bounce ${msg.type === "success" ? "bg-green-500" : "bg-red-500"} text-white shadow-2xl`}
        >
          {msg.text}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-white relative z-10">
        <h2 className="text-3xl font-black mb-6 text-blue-400">
          {isReset ? "Reset" : isLogin ? "Login" : "Register"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />

          {(!isLogin || isReset) && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <input
                className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required={!isLogin || isReset}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={countdown > 0}
                className={`px-4 rounded-xl text-xs font-bold transition-all ${countdown > 0 ? "bg-slate-700 text-slate-400" : "bg-blue-600 hover:bg-blue-500"}`}
              >
                {countdown > 0 ? `${countdown}s` : "Send"}
              </button>
            </div>
          )}

          {(!isLogin || isReset) && isOtpSent && (
            <input
              className="w-full bg-slate-950 border-2 border-blue-500 p-3 rounded-xl outline-none animate-pulse text-sm"
              placeholder="6-digit Code"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              required
            />
          )}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>

          {!isLogin && !isReset && (
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 animate-in fade-in slide-in-from-top-2 text-sm"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
            />
          )}

          <button className="w-full bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/20">
            {isReset ? "Update Password" : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-500 text-sm">
          {isLogin ? "No account?" : "Have account?"}
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setIsReset(false);
              setIsOtpSent(false);
              setMsg({ text: "", type: "" });
            }}
            className="text-blue-400 cursor-pointer ml-1 font-bold hover:underline"
          >
            {isLogin ? "Create one" : "Log in"}
          </span>
          {isLogin && (
            <span
              onClick={() => {
                setIsReset(true);
                setIsOtpSent(false);
                setMsg({ text: "", type: "" });
              }}
              className="block mt-2 text-xs cursor-pointer hover:text-white"
            >
              Forgot Password?
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
