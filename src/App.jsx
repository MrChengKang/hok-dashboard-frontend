import { useEffect, useState } from "react";
import AddMatchModal from "./components/AddMatchModal";
import AuthPage from "./components/AuthPage";

function App() {
  const [matches, setMatches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. 新增：編輯狀態
  const [editingId, setEditingId] = useState(null);

  const [newMatchData, setNewMatchData] = useState({
    hero: "",
    game: "Honor of Kings",
    result: "Victory",
    kda: "0/0/0",
    time: "Just now",
    position: "打野",
  });

  // 2. 新增：點擊編輯按鈕的處理函數
  const handleEditClick = (match) => {
    setEditingId(match.id); // 記錄正在編輯哪一筆
    setNewMatchData(match); // 把舊資料塞回表單
    setIsModalOpen(true); // 打開彈窗
  };

  const fetchMatches = () => {
    if (!currentUser) return;
    fetch(`http://localhost:8080/api/matches?username=${currentUser}`)
      .then((res) => res.json())
      .then((data) => setMatches(data))
      .catch((err) => console.error("抓取失敗:", err));
  };

  useEffect(() => {
    if (currentUser) fetchMatches();
  }, [currentUser]);

  // 3. 修改：儲存邏輯（支援新增與修改）
  const handleSaveMatch = async (e) => {
    e.preventDefault();

    // 判斷要打哪個 API 與方法
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
        setEditingId(null); // 重要：儲存完要重置編輯狀態
        fetchMatches();
        setNewMatchData({
          hero: "",
          game: "Honor of Kings",
          result: "Victory",
          kda: "0/0/0",
          time: "Just now",
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

  if (!isLoggedIn) {
    return (
      <AuthPage
        onLoginSuccess={(name) => {
          setIsLoggedIn(true);
          setCurrentUser(name);
        }}
      />
    );
  }

  // 統計數據計算
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
      {/* Header 部分 */}
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
            onClick={() => setIsModalOpen(true)}
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

      {/* 搜尋欄 */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="搜尋英雄名稱或分路..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800/40 border border-slate-700 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500 text-white"
        />
        <span className="absolute left-4 top-4 text-slate-500">🔍</span>
      </div>

      {/* 戰績列表 */}
      <div className="flex flex-col gap-4" key={currentUser + searchTerm}>
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match, index) => (
            <div
              key={`${match.id}-${index}`}
              className={`group relative bg-slate-800 p-6 rounded-2xl flex justify-between items-center border-l-4 shadow-xl transition-all hover:scale-[1.01] ${match.result === "Defeat" ? "border-l-red-500" : "border-l-blue-500"} animate-card`}
              style={{ animationDelay: `${index * 150}ms`, opacity: 0 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  {match.hero ? match.hero[0] : "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      {match.position || "未知分路"}
                    </span>
                    <span className="text-slate-500 text-xs">{match.time}</span>
                  </div>
                  <h3 className="text-2xl font-black mt-1">{match.hero}</h3>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-3xl font-black tracking-tighter">
                    {match.kda}
                  </div>
                  <div
                    className={`font-bold text-xs uppercase ${match.result === "MVP" ? "text-yellow-400" : "text-blue-400"}`}
                  >
                    {match.result}
                  </div>
                </div>

                {/* 4. 修改：操作按鈕區 */}
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
          <div className="text-center py-20 bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-700 text-slate-500">
            {searchTerm
              ? `找不到與 "${searchTerm}" 相關的戰績`
              : "目前沒有戰績記錄"}
          </div>
        )}
      </div>

      <AddMatchModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null); // 關閉時重置編輯狀態
          setNewMatchData({
            hero: "",
            game: "Honor of Kings",
            result: "Victory",
            kda: "0/0/0",
            time: "Just now",
            position: "打野",
          });
        }}
        onSave={handleSaveMatch}
        newData={newMatchData}
        setNewData={setNewMatchData}
        // 5. 傳入標題判斷
        title={editingId ? "編輯戰績" : "記錄新戰績"}
      />

      {/* Logout Modal 保持原樣 ... */}
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
              <p className="text-slate-400 mb-8 text-sm">
                登出後需要重新輸入密碼才能查看戰績。
              </p>
              <div className="flex gap-3">
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
