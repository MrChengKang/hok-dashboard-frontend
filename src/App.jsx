import { useEffect, useState } from "react";
import AddMatchModal from "./components/AddMatchModal";
import AuthPage from "./components/AuthPage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const formatRelativeTime = (dateValue, now) => {
  if (!dateValue || dateValue === "Just now") return "Just now";
  let past;
  if (Array.isArray(dateValue)) {
    past = new Date(
      dateValue[0],
      dateValue[1] - 1,
      dateValue[2],
      dateValue[3] || 0,
      dateValue[4] || 0,
      dateValue[5] || 0,
    );
  } else {
    let safeStr = dateValue;
    if (typeof safeStr === "string") {
      safeStr = safeStr.replace(" ", "T");
      if (!safeStr.includes("+")) safeStr += "+08:00";
    }
    past = new Date(safeStr);
  }
  if (isNaN(past.getTime())) return "Just now";
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

const ActivityHeatmap = ({ data }) => {
  // 產生最近 14 天的日期
  const days = [...Array(14)]
    .map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    })
    .reverse();

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl mb-10">
      <h3 className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Battle Activity (Last 14 Days)
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {days.map((date) => {
          const dayData = data.find((d) => d.date === date);
          const count = dayData ? dayData.count : 0;

          const colorClass =
            count === 0
              ? "bg-slate-900"
              : count <= 2
                ? "bg-green-900"
                : count <= 4
                  ? "bg-green-600"
                  : "bg-green-400";

          return (
            <div
              key={date}
              className="flex flex-col items-center gap-1 min-w-[32px]"
            >
              <div
                title={`${date}: ${count} matches`}
                className={`w-8 h-8 rounded-md ${colorClass} transition-all hover:scale-110 cursor-help border border-white/5`}
              />
              <span className="text-[8px] text-slate-500 font-bold">
                {date.split("-")[2]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function App() {
  // ==========================================
  // 1. useState (狀態定義都在最頂層)
  // ==========================================
  const [matches, setMatches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [newMatchData, setNewMatchData] = useState({
    hero: "",
    game: "Honor of Kings",
    result: "Victory",
    kda: "0/0/0",
    position: "打野",
  });

  // ==========================================
  // 2. useEffect (必須在任何 return 之前執行)
  // ==========================================

  // 檢查登錄狀態
  useEffect(() => {
    const savedUser = localStorage.getItem("hok_user");
    if (savedUser) {
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  // 更新相對時間的計時器
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 🔴 修正黑屏的關鍵：分頁校正 Hook 必須放在這裡
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPosition]);

  // 抓取數據 Hook
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetchMatches();
    }
  }, [isLoggedIn, currentUser]);

  // ==========================================
  // 3. 邏輯函式
  // ==========================================
  const fetchMatches = () => {
    if (!currentUser) return;
    fetch(`http://localhost:8080/api/matches?username=${currentUser}`)
      .then((res) => res.json())
      .then((data) => setMatches(data))
      .catch((err) => console.error("抓取失敗:", err));
  };

  const handleEditClick = (match) => {
    setEditingId(match.id);
    setNewMatchData({
      hero: match.hero,
      game: match.game,
      result: match.result,
      kda: match.kda,
      position: match.position,
    });
    setIsModalOpen(true);
  };

  const handleSaveMatch = async (e) => {
    e.preventDefault();
    if (!newMatchData.hero || newMatchData.hero.trim() === "") {
      alert("⚠️ 請先選擇一位英雄！");
      return;
    }
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `http://localhost:8080/api/matches/${editingId}`
      : "http://localhost:8080/api/matches";
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newMatchData, username: currentUser }),
      });
      if (response.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        await fetchMatches();
        setNewMatchData({
          hero: "",
          game: "Honor of Kings",
          result: "Victory",
          kda: "0/0/0",
          position: "打野",
        });
      }
    } catch (err) {
      console.error("儲存失敗:", err);
    }
  };

  const deleteMatch = (id) => {
    if (window.confirm("確定要刪除這場戰績嗎？")) {
      fetch(`http://localhost:8080/api/matches/${id}`, {
        method: "DELETE",
      }).then(() => fetchMatches());
    }
  };

  const heatmapData = matches.reduce((acc, match) => {
    const date = new Date(match.createdAt || match.created_at)
      .toISOString()
      .split("T")[0];
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []);

  // ==========================================
  // 4. 條件渲染 (在所有 Hook 之後)
  // ==========================================
  if (isLoading) return <div className="min-h-screen bg-[#020617]"></div>;
  if (!isLoggedIn)
    return (
      <AuthPage
        onLoginSuccess={(name) => {
          setIsLoggedIn(true);
          setCurrentUser(name);
          localStorage.setItem("hok_user", name);
        }}
      />
    );

  // ==========================================
  // 5. 數據計算
  // ==========================================
  const totalMatches = matches.length;
  const wins = matches.filter(
    (m) => m.result === "Victory" || m.result === "MVP",
  ).length;
  const winRate =
    totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0;
  const avgKda =
    matches.length > 0
      ? (
          matches.reduce((acc, curr) => {
            const [k, d, a] = curr.kda.split("/").map(Number);
            return acc + (k + a) / (d || 1);
          }, 0) / totalMatches
        ).toFixed(1)
      : "0.0";

  const filteredMatches = matches.filter((match) => {
    const matchesSearch =
      match.hero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = selectedPosition
      ? match.position === selectedPosition
      : true;
    return matchesSearch && matchesPosition;
  });

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const currentItems = filteredMatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const positionStats = matches.reduce((acc, curr) => {
    const pos = curr.position || "未知";
    if (!acc[pos]) acc[pos] = { total: 0, wins: 0 };
    acc[pos].total += 1;
    if (curr.result === "Victory" || curr.result === "MVP") acc[pos].wins += 1;
    return acc;
  }, {});

  const positionColors = {
    打野: "bg-red-500",
    中路: "bg-purple-500",
    對抗路: "bg-orange-500",
    發育路: "bg-yellow-500",
    遊走: "bg-green-500",
  };

  const heroStats = matches.reduce((acc, curr) => {
    const name = curr.hero || "未知";
    if (!acc[name])
      acc[name] = { name, total: 0, wins: 0, position: curr.position };
    acc[name].total += 1;
    if (curr.result === "Victory" || curr.result === "MVP") acc[name].wins += 1;
    return acc;
  }, {});

  const topHeroes = Object.values(heroStats)
    .sort((a, b) => b.wins - a.wins || b.total - a.total)
    .slice(0, 3);

  const trendData = [...matches]
    .sort(
      (a, b) =>
        new Date(a.createdAt || a.created_at) -
        new Date(b.createdAt || b.created_at),
    )

    .slice(-7)

    .map((m) => {
      const [k, d, a] = m.kda.split("/").map(Number);
      const score = parseFloat(((k + a) / Math.max(1, d)).toFixed(1));
      return {
        name: m.hero ? m.hero[0] : "?",
        kda: score,
        fullHero: m.hero,
      };
    });

  const bestRole =
    Object.keys(positionStats).length > 0
      ? Object.keys(positionStats).reduce((a, b) =>
          positionStats[a]?.wins > positionStats[b]?.wins ? a : b,
        )
      : "N/A";

  // ==========================================
  // 6. 畫面渲染 (JSX)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0f172a] p-8 text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-blue-400 tracking-tighter italic">
            HOK DASHBOARD
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Player:{" "}
            <span className="text-blue-300 font-bold">{currentUser}</span>
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setEditingId(null);
              setNewMatchData({
                hero: "",
                game: "Honor of Kings",
                result: "Victory",
                kda: "0/0/0",
                position: "打野",
              });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 px-8 py-2.5 rounded-full font-bold shadow-lg shadow-blue-900/20 transition-all"
          >
            + New Record
          </button>
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="bg-slate-800 hover:bg-red-500/20 text-slate-400 px-5 py-2.5 rounded-full font-bold text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-widest">
            Total Matches
          </p>
          <span className="text-4xl font-black">{totalMatches}</span>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl relative overflow-hidden text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-widest">
            Win Rate
          </p>
          <span className="text-4xl font-black text-blue-400">{winRate}%</span>
          <div className="absolute bottom-0 left-0 h-1 bg-slate-700 w-full">
            <div
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${winRate}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-widest">
            Avg KDA
          </p>
          <span className="text-4xl font-black text-yellow-500">{avgKda}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <ActivityHeatmap data={heatmapData} />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* 最近 7 場 KDA 走勢圖 */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl h-[300px]">
          <h3 className="text-slate-400 text-xs font-black uppercase mb-6 flex items-center gap-2 tracking-widest">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Recent Performance (KDA Trend)
          </h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorKda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                  itemStyle={{ color: "#3b82f6", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="kda"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorKda)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 分路熱度分析 (小提示) */}
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">
              Stats Summary
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              你在{" "}
              <span className="text-blue-400 font-bold">
                {selectedPosition || "所有分路"}
              </span>{" "}
              的表現
              {winRate > 60 ? "非常強勢！🔥" : "還有提升空間，加油！⚔️"}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">
                  Best Role
                </p>
                <p className="text-xl font-black text-white">
                  {Object.keys(positionStats).reduce(
                    (a, b) =>
                      positionStats[a]?.wins > positionStats[b]?.wins ? a : b,
                    "N/A",
                  )}
                </p>
              </div>
              <div className="text-right text-blue-400 font-black text-xs">
                RANKED PRO ANALYTICS
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左側邊欄 */}
        <div className="lg:col-span-4 lg:sticky lg:top-8 flex flex-col gap-6">
          <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl">
            <h3 className="text-slate-400 text-xs font-black uppercase mb-6 flex items-center gap-2 tracking-widest">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Position Stats
            </h3>
            <div className="flex flex-col gap-3">
              {["打野", "中路", "對抗路", "發育路", "遊走"].map((pos) => {
                const stats = positionStats[pos] || { total: 0, wins: 0 };
                const rate =
                  stats.total > 0
                    ? ((stats.wins / stats.total) * 100).toFixed(0)
                    : 0;
                const isActive = selectedPosition === pos;
                return (
                  <button
                    key={pos}
                    onClick={() => setSelectedPosition(isActive ? null : pos)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isActive ? "bg-blue-600 border-blue-400 shadow-lg" : "bg-slate-900/50 border-slate-800 hover:border-slate-600"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${positionColors[pos]}`}
                      ></div>
                      <span
                        className={`font-bold ${isActive ? "text-white" : "text-slate-300"}`}
                      >
                        {pos}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black block text-sm">{rate}%</span>
                      <span className="text-[10px] text-slate-500">
                        {stats.wins}W / {stats.total}T
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🏆 最強英雄排行榜 Top Heroes */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl mt-6">
            <h3 className="text-slate-400 text-xs font-black uppercase mb-6 flex items-center gap-2 tracking-widest">
              <span className="text-yellow-500">👑</span>
              Top Heroes 最強英雄
            </h3>

            <div className="flex flex-col gap-4">
              {topHeroes.length > 0 ? (
                topHeroes.map((hero, index) => {
                  const winRate = ((hero.wins / hero.total) * 100).toFixed(0);
                  const medalColors = [
                    "text-yellow-400",
                    "text-slate-300",
                    "text-orange-500",
                  ];

                  // 🔴 加入分路專屬漸層色邏輯
                  const badgeGradients = {
                    打野: "from-red-500 to-red-800",
                    中路: "from-purple-500 to-purple-800",
                    對抗路: "from-orange-400 to-orange-700",
                    發育路: "from-yellow-400 to-yellow-700",
                    遊走: "from-green-400 to-green-700",
                    未知: "from-slate-500 to-slate-800",
                  };
                  const bgGradient =
                    badgeGradients[hero.position] || badgeGradients["未知"];

                  return (
                    <div
                      key={hero.name}
                      className="flex items-center justify-between group transition-all hover:translate-x-1"
                    >
                      <div className="flex items-center gap-3">
                        {/* 名次數字 */}
                        <span
                          className={`text-lg font-black w-4 ${medalColors[index] || "text-slate-500"}`}
                        >
                          {index + 1}
                        </span>

                        {/* 🔴 改造成彩色小徽章 */}
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bgGradient} flex items-center justify-center font-black text-sm text-white shadow-lg shadow-black/20 border border-white/10`}
                        >
                          <span className="drop-shadow-sm">{hero.name[0]}</span>
                        </div>

                        <div>
                          <p className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                            {hero.name}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">
                            {hero.position}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black text-blue-400">
                          {winRate}%
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {hero.wins}W / {hero.total}T
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-slate-600 text-xs py-4 italic">
                  No Stats Yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 右側列表 */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative group">
            <input
              type="text"
              placeholder="搜尋英雄名稱或分路..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/50 p-5 pl-14 rounded-3xl outline-none focus:border-blue-500 focus:bg-slate-800/60 transition-all text-white placeholder-slate-600"
            />
            <span className="absolute left-6 top-5 text-xl opacity-50 group-focus-within:opacity-100 transition-opacity">
              🔍
            </span>
            {selectedPosition && (
              <div className="absolute right-4 top-3.5">
                <button
                  onClick={() => setSelectedPosition(null)}
                  className="bg-blue-600/20 text-blue-400 text-[10px] font-bold px-3 py-1.5 rounded-full border border-blue-500/50 hover:bg-blue-600/40"
                >
                  {selectedPosition} ✕
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {currentItems.length > 0 ? (
              currentItems.map((match) => {
                // 🔴 新增：根據分路設定不同的漸層顏色
                const avatarGradients = {
                  打野: "from-red-500 to-red-800",
                  中路: "from-purple-500 to-purple-800",
                  對抗路: "from-orange-400 to-orange-700",
                  發育路: "from-yellow-400 to-yellow-700",
                  遊走: "from-green-400 to-green-700",
                  未知: "from-slate-500 to-slate-800",
                };
                const bgGradient =
                  avatarGradients[match.position] || avatarGradients["未知"];

                return (
                  <div
                    key={match.id}
                    className={`group relative bg-slate-800/50 p-6 rounded-3xl flex justify-between items-center border border-slate-700/50 transition-all hover:border-blue-500/50 hover:bg-slate-800 ${match.result === "Defeat" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-blue-500"}`}
                  >
                    <div className="flex items-center gap-5">
                      {/* 動態漸層背景 */}
                      <div
                        className={`
    w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white 
    shadow-lg shadow-black/40 border border-white/10
    bg-gradient-to-br ${
      match.position === "打野"
        ? "from-red-500 to-red-800"
        : match.position === "中路"
          ? "from-purple-500 to-purple-800"
          : match.position === "對抗路"
            ? "from-orange-400 to-orange-700"
            : match.position === "發育路"
              ? "from-yellow-400 to-yellow-700"
              : "from-green-500 to-green-800"
    }
  `}
                      >
                        <span className="drop-shadow-md">
                          {match.hero ? match.hero[0] : "?"}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-700 text-slate-300 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                            {match.position}
                          </span>
                          <span className="text-slate-500 text-[10px] font-bold">
                            {formatRelativeTime(
                              match.createdAt || match.created_at,
                              currentTime,
                            )}
                          </span>
                        </div>
                        <h3 className="text-2xl font-black">{match.hero}</h3>
                      </div>
                    </div>

                    {/* ... 右側的 KDA 和操作按鈕保持不變 ... */}
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-3xl font-black tracking-tighter text-white">
                          {match.kda}
                        </div>
                        <div
                          className={`font-black text-[10px] uppercase tracking-[0.2em] ${match.result === "MVP" ? "text-yellow-400" : match.result === "Victory" ? "text-blue-400" : "text-red-400"}`}
                        >
                          {match.result}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleEditClick(match)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-400 p-2 transition-all"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteMatch(match.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 p-2 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 text-slate-500 bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-800">
                No match records found.
              </div>
            )}
          </div>

          {/* 分頁控制 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${currentPage === 1 ? "bg-slate-800 text-slate-600" : "bg-slate-700 hover:bg-blue-600 text-white shadow-lg"}`}
              >
                ←
              </button>
              <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2">
                <span className="text-blue-400 font-black">{currentPage}</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400 font-bold">{totalPages}</span>
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${currentPage === totalPages ? "bg-slate-800 text-slate-600" : "bg-slate-700 hover:bg-blue-600 text-white shadow-lg"}`}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      <AddMatchModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        onSave={handleSaveMatch}
        newData={newMatchData}
        setNewData={setNewMatchData}
        title={editingId ? "編輯戰績" : "記錄新戰績"}
      />

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsLogoutModalOpen(false)}
          ></div>
          <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="text-center">
              <div className="text-3xl mb-4 text-red-500">👋</div>
              <h3 className="text-xl font-bold mb-2">準備登出？</h3>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 bg-slate-800 py-3 rounded-xl font-bold text-sm"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setCurrentUser("");
                    setIsLogoutModalOpen(false);
                    localStorage.removeItem("hok_user");
                  }}
                  className="flex-1 bg-red-600 py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-900/20"
                >
                  確定登出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
