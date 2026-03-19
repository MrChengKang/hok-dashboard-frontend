import { useState, useEffect } from "react";

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 1. 新增提示訊息狀態
  const [msg, setMsg] = useState({ text: "", type: "" }); // type 可以是 'error' 或 'success'

  // 2. 自動清除訊息的邏輯
  useEffect(() => {
    if (msg.text) {
      const timer = setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 清除舊訊息
    setMsg({ text: "", type: "" });

    if (!isLogin) {
      if (form.password.length < 8) {
        setMsg({ text: "❌ 密碼至少需要 8 個字元", type: "error" });
        return;
      }
      if (form.password !== form.confirmPassword) {
        setMsg({ text: "❌ 兩次密碼輸入不一致", type: "error" });
        return;
      }
    }

    const path = isLogin ? "/login" : "/register";
    try {
      const res = await fetch(`http://localhost:8080/api/auth${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });
      const result = await res.text();

      if (result.includes("Success")) {
        setMsg({ text: `🎉 ${result}`, type: "success" });
        if (isLogin) {
          // 延遲一下下再進入，讓用戶看到成功訊息
          setTimeout(() => onLoginSuccess(form.username), 1000);
        } else {
          setTimeout(() => {
            setIsLogin(true);
            setForm({ username: "", password: "", confirmPassword: "" });
          }, 1500);
        }
      } else {
        setMsg({ text: `⚠️ ${result}`, type: "error" });
      }
    } catch (err) {
      setMsg({ text: "🚀 伺服器連線失敗", type: "error" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
      {/* 3. 自定義提示彈窗 (Toast) */}
      {msg.text && (
        <div
          className={`fixed top-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300 ${
            msg.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-white relative z-10">
        <h2 className="text-3xl font-black mb-6 text-blue-400">
          {isLogin ? "Login" : "Register"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 transition-all"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 transition-all"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              {showPassword ? "👁️" : "🙈"}
            </button>
          </div>

          {!isLogin && (
            <div className="relative animate-in fade-in slide-in-from-top-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 transition-all"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                required={!isLogin}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showConfirmPassword ? "👁️" : "🙈"}
              </button>
            </div>
          )}

          <button className="w-full bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/20">
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-500 text-sm">
          {isLogin ? "No account?" : "Have account?"}
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setForm({ username: "", password: "", confirmPassword: "" });
              setMsg({ text: "", type: "" });
            }}
            className="text-blue-400 cursor-pointer ml-1 font-bold hover:underline"
          >
            {isLogin ? "Create one" : "Log in"}
          </span>
        </p>
      </div>
    </div>
  );
}
