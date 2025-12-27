import React from "react";

export default function Header({
  darkMode, setDarkMode, isAdmin, promptAdminLogin, logoutAdmin,
  mode, setMode, examN, setExamN, startExam, resetExamState
}) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-6 pb-4 border-b border-indigo-100 dark:border-slate-700 gap-4 transition-colors">
      <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-start">
        <img src="./android-chrome-512x512.png" alt="logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover shadow-md hover:scale-110 transition-transform" onError={(e) => {e.target.style.display = 'none'}} />
        <div className="text-center md:text-left">
          <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent drop-shadow-sm">
            Thằng nào nhìn dòng này là GEY
          </div>
          <a href="https://www.youtube.com/watch?v=9mA7h1jfxc8&list=RD9mA7h1jfxc8&start_radio=1" target="_blank" rel="noreferrer" className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            Hoan hô ban nhạc thủ đô
          </a>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center w-full md:w-auto">
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg border shadow-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-slate-700 dark:text-yellow-300 transition bg-white dark:bg-slate-800" title="Toggle Dark Mode">
          {darkMode ? "🌙" : "☀️"}
        </button>

        {!isAdmin ? (
          <button className="px-3 py-2 border rounded-lg shadow-sm hover:bg-gray-50 transition text-sm dark:bg-slate-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-700 bg-white" onClick={promptAdminLogin}>
            Login
          </button>
        ) : (
          <button className="px-3 py-2 bg-yellow-400 rounded-lg shadow hover:bg-yellow-300 transition text-sm text-black" onClick={() => { if (confirm("Logout admin?")) logoutAdmin(); }}>
            Admin ON
          </button>
        )}

        <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg transition-colors">
          <button onClick={() => { setMode("practice"); resetExamState(); }} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === "practice" ? "bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300" : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600"}`}>
            Luyện tập
          </button>
          <button onClick={() => { setMode("exam"); resetExamState(); }} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === "exam" ? "bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300" : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600"}`}>
            Kiểm tra
          </button>
        </div>

        {mode === "exam" && (
          <>
            <input className="border rounded-lg px-2 py-1.5 w-16 text-center shadow-sm hover:border-indigo-300 transition dark:bg-slate-800 dark:border-gray-600 dark:text-gray-200" value={examN} type="number" onChange={(e) => setExamN(e.target.value)} />
            <button onClick={startExam} className="px-3 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition">
              Bắt đầu
            </button>
          </>
        )}
      </div>
    </div>
  );
}