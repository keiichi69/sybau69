import React from "react";

export default function ResetModal({ onConfirm, onHardReset, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
          Tùy chọn Reset
        </h3>
        <div className="flex flex-col gap-3">
          <button
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium active:scale-95"
            onClick={onConfirm}
          >
            Làm lại từ đầu
          </button>
          <button
            className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition font-medium active:scale-95"
            onClick={onHardReset}
          >
            Xóa toàn bộ dữ liệu (Refresh)
          </button>
          <button
            className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400 rounded-lg transition mt-2 active:scale-95"
            onClick={onClose}
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}