import React, { useState, useMemo } from "react";
import { formatTime } from "../utils/helpers";

export default function Sidebar({
  isMobileSidebarOpen, setIsMobileSidebarOpen, navList, mode, answers,
  currentIndex, jumpTo, examStarted, timeLeft, isAdmin,
  openEditor, exportJSON, importJSONFile, hardReset
}) {
  // State cho ô tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

  // Logic lọc câu hỏi
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return navList;
    const lowerTerm = searchTerm.toLowerCase();
    return navList.filter(q => 
      q.id.toString().includes(lowerTerm) || 
      (q.question && q.question.toLowerCase().includes(lowerTerm))
    );
  }, [navList, searchTerm]);

  return (
    // THAY ĐỔI Ở ĐÂY:
    // 1. Thêm 'sticky top-4': Giữ sidebar cố định khi cuộn trang chính
    // 2. Thêm 'h-[calc(100vh-2rem)]': Chiều cao cố định theo màn hình để scrollbar bên trong hoạt động
    // 3. Xóa 'h-fit' và 'max-h-[85vh]' cũ để tránh xung đột
    <aside className="md:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-xl shadow transition-colors flex flex-col sticky top-4 h-[calc(100vh-2rem)]">
      
      {/* Header Sidebar & Mobile Toggle */}
      <div className="flex items-center justify-between mb-2 md:mb-4 cursor-pointer md:cursor-default" onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}>
        <h3 className="font-bold text-gray-700 dark:text-gray-200 md:block">
          Danh sách câu hỏi ({filteredList.length})
        </h3>
        <button className="md:hidden text-gray-500 dark:text-gray-400 text-sm border px-2 py-1 rounded">
          {isMobileSidebarOpen ? "Thu gọn ▲" : "Mở rộng ▼"}
        </button>
      </div>

      {/* Search Input */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} md:block mb-3 animate-fadeIn shrink-0`}>
        <input
          type="text"
          placeholder="🔍 Tìm số câu..."
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid danh sách câu hỏi - Vùng này sẽ cuộn */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} md:block animate-fadeIn flex-1 overflow-hidden flex flex-col min-h-0`}>
        {/* 'overflow-y-auto': Cho phép cuộn dọc */}
        {/* 'content-start': Tránh lỗi flexbox làm giãn nút */}
        <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 overflow-y-auto pr-1 flex-1 content-start scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {filteredList.length > 0 ? (
            filteredList.map((q) => {
              const originalIndex = navList.findIndex(item => item.id === q.id);
              const done = answers[q.id];
              const isCurrent = currentIndex === originalIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => jumpTo(originalIndex)}
                  className={`py-2 rounded text-xs font-semibold transition active:scale-95 border ${
                    done
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 border-transparent"
                  } ${isCurrent ? "ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-slate-800 border-indigo-400 z-10" : ""}`}
                >
                  {q.id}
                </button>
              );
            })
          ) : (
            <div className="col-span-5 text-center text-gray-400 text-sm py-4">Không tìm thấy</div>
          )}
        </div>

        {/* Footer Sidebar - Luôn nằm dưới cùng */}
        <div className="mt-auto pt-4 border-t dark:border-slate-700 space-y-3 shrink-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center italic">
              {mode === "exam" ? "Nhìn CC" : "Mẹ m beo"}
            </div>

            {mode === "exam" && examStarted && (
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-center text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
                Thời gian: <strong className="text-xl font-mono">{formatTime(timeLeft)}</strong>
              </div>
            )}

            {isAdmin && (
              <div className="space-y-2 pt-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Tools</div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-2 py-1.5 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition" onClick={() => openEditor(null)}>+ Thêm</button>
                  <button className="px-2 py-1.5 bg-yellow-400 text-black text-xs rounded hover:bg-yellow-500 transition" onClick={exportJSON}>Xuất JSON</button>
                </div>
                <label className="block w-full cursor-pointer text-center px-2 py-1.5 border border-dashed border-gray-400 rounded text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700">
                  Import JSON
                  <input type="file" accept=".json,application/json" onChange={importJSONFile} className="hidden" />
                </label>
                <button className="w-full px-2 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded hover:bg-red-200 transition" onClick={hardReset}>Hard Reset App</button>
              </div>
            )}
        </div>
      </div>
    </aside>
  );
}