import React from "react";

export default function ResultsPanel({ resultsData }) {
  if (!resultsData) return null;

  return (
    <div className="mt-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow border-l-4 border-indigo-500 transition-colors">
      <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mb-2">
        Kết quả thi
      </h3>
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded text-green-800 dark:text-green-300">
          <div className="text-2xl font-bold">{resultsData.correct}</div>
          <div className="text-xs uppercase">Đúng</div>
        </div>
        <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded text-red-800 dark:text-red-300">
          <div className="text-2xl font-bold">{resultsData.wrong}</div>
          <div className="text-xs uppercase">Sai</div>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded text-blue-800 dark:text-blue-300">
          <div className="text-2xl font-bold">{resultsData.percent}%</div>
          <div className="text-xs uppercase">Tỉ lệ</div>
        </div>
      </div>

      <details className="mt-4 group">
        <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded select-none">
          Xem chi tiết câu sai ({resultsData.details.length})
        </summary>
        <ul className="mt-2 space-y-3 max-h-96 overflow-auto pr-2">
          {resultsData.details.map((d) => (
            <li key={d.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-900/30 text-sm">
              <div className="font-bold text-gray-800 dark:text-gray-200 mb-1">
                Câu {d.id}: {d.question}
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-red-600 dark:text-red-400 bg-white dark:bg-slate-700 px-2 py-1 rounded border border-red-200 dark:border-red-800">
                  Bạn chọn: {d.your || "(Chưa chọn)"}
                </span>
                <span className="text-green-700 dark:text-green-400 bg-white dark:bg-slate-700 px-2 py-1 rounded border border-green-200 dark:border-green-800">
                  Đáp án: {d.correct}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}