import { useEffect, useState } from "react";
import AddMatchModal from "./components/AddMatchModal";
import AuthPage from "./components/AuthPage";

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
    // 🔴 終極修復：強制加上 'T' 與馬來西亞時區 '+08:00'
    let safeStr = dateValue;
    if (typeof safeStr === "string") {
      safeStr = safeStr.replace(" ", "T"); // 替換空格防 Safari 報錯
      if (!safeStr.includes("+")) {
        safeStr += "+08:00"; // 強制鎖定為馬來西亞時間
      }
    }
    past = new Date(safeStr);
  }

  if (isNaN(past.getTime())) return "Just now";

  // 計算秒數差
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // 如果時間差是負數（未來時間）或小於 60 秒，一律顯示 Just now
  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

function App() {
  const [matches, setMatches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);

  // 每分鐘更新一次，讓列表中的時間自動跳動
  const [currentTime, setCurrentTime] = useState(new Date());

  const [newMatchData, setNewMatchData] = useState({
    hero: "",
    game: "Honor of Kings",
    result: "Victory",
    kda: "0/0/0",
    position: "打野",
  });

  // 1. 頁面載入檢查
  useEffect(() => {
    const savedUser = localStorage.getItem("hok_user");
    if (savedUser) {
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  // 2. 定時器：讓相對時間每分鐘重算一次
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 3. 抓取資料
  const fetchMatches = () => {
    if (!currentUser) return;
    fetch(`http://localhost:8080/api/matches?username=${currentUser}`)
      .then((res) => res.json())
      .then((data) => setMatches(data))
      .catch((err) => console.error("抓取失敗:", err));
  };

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetchMatches();
    }
  }, [isLoggedIn, currentUser]);

  // 🔴 幫你補齊遺失的編輯按鈕函式！
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

  // 4. 儲存戰績
  const handleSaveMatch = async (e) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `http://localhost:8080/api/matches/${editingId}`
      : "http://localhost:8080/api/matches";

    try {
      const response = await fetch(url, {
        method: method,
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

  // 5. 刪除戰績
  const deleteMatch = (id) => {
    if (window.confirm("確定要刪除這場戰績嗎？")) {
      fetch(`http://localhost:8080/api/matches/${id}`, {
        method: "DELETE",
      }).then(() => fetchMatches());
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#020617]"></div>;

  if (!isLoggedIn) {
    return (
      <AuthPage
        onLoginSuccess={(name) => {
          setIsLoggedIn(true);
          setCurrentUser(name);
          localStorage.setItem("hok_user", name);
        }}
      />
    );
  }

  // 統計邏輯
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

  const filteredMatches = matches.filter(
    (match) =>
      match.hero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.position.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 text-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black text-blue-400 tracking-tighter">
            HOK DASHBOARD
          </h1>
          <p className="text-slate-400 text-sm">
            歡迎回來{" "}
            <span className="text-blue-300 font-bold">{currentUser}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingId(null); // 確保新增時是空表單
              setNewMatchData({
                hero: "",
                game: "Honor of Kings",
                result: "Victory",
                kda: "0/0/0",
                position: "打野",
              });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full font-bold shadow-lg"
          >
            + 記錄新戰績
          </button>
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="bg-slate-800 hover:bg-red-500/20 text-slate-400 px-4 py-2 rounded-full font-bold text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2">
            Total Matches
          </p>
          <span className="text-4xl font-black">{totalMatches}</span>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2">
            Win Rate
          </p>
          <span className="text-4xl font-black text-blue-400">{winRate}%</span>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2">
            Avg KDA
          </p>
          <span className="text-4xl font-black text-yellow-500">{avgKda}</span>
        </div>
      </div>

      {/* 搜尋 */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="搜尋英雄名稱或分路..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800/40 border border-slate-700 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500 text-white"
        />
        <span className="absolute left-4 top-4">🔍</span>
      </div>

      {/* 戰績列表 */}
      <div className="flex flex-col gap-4">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <div
              key={match.id}
              className={`group relative bg-slate-800 p-6 rounded-2xl flex justify-between items-center border-l-4 transition-all hover:scale-[1.01] ${match.result === "Defeat" ? "border-l-red-500" : "border-l-blue-500"}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  {match.hero ? match.hero[0] : "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      {match.position}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {/* 🔴 統一使用 createdAt */}
                      {formatRelativeTime(
                        match.createdAt || match.created_at,
                        currentTime,
                      )}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black mt-1">{match.hero}</h3>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-3xl font-black text-white">
                    {match.kda}
                  </div>
                  <div
                    className={`font-bold text-xs uppercase ${match.result === "MVP" ? "text-yellow-400" : "text-blue-400"}`}
                  >
                    {match.result}
                  </div>
                </div>
                <div className="flex gap-2">
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
          ))
        ) : (
          <div className="text-center py-20 text-slate-500 bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-700">
            目前沒有戰績記錄
          </div>
        )}
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
