import React from "react";

export default function AdminEditor({ editItem, setEditItem, saveEdit, deleteQuestion, setShowEditor }) {
  if (!editItem) return null;

  return (
    <div className="mt-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-2 border-indigo-100 dark:border-slate-600 animate-slideUp">
      <h3 className="font-bold text-lg text-indigo-800 dark:text-indigo-300 mb-4">
        {editItem.id ? `Sửa câu ${editItem.id}` : "Thêm câu mới"}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Nội dung câu hỏi</label>
          <textarea
            rows={3}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-300 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            value={editItem.question}
            onChange={(e) => setEditItem({ ...editItem, question: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {["A", "B", "C", "D"].map((L) => (
            <div key={L} className="flex gap-2 items-center">
              <span className="font-bold w-6 text-center dark:text-gray-300">{L}</span>
              <input
                className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-300 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={(editItem.options && editItem.options[L]) || ""}
                onChange={(e) =>
                  setEditItem({
                    ...editItem,
                    options: { ...(editItem.options || {}), [L]: e.target.value },
                  })
                }
              />
            </div>
          ))}
        </div>

        <div className="flex gap-4 items-center bg-gray-50 dark:bg-slate-700 p-3 rounded">
          <label className="text-sm font-bold dark:text-gray-300">Đáp án đúng:</label>
          <select
            value={editItem.answer}
            onChange={(e) => setEditItem({ ...editItem, answer: e.target.value })}
            className="border p-2 rounded bg-white dark:bg-slate-600 dark:text-white shadow-sm dark:border-slate-500"
          >
            {["A", "B", "C", "D"].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          {editItem.id && (
            <button
              className="px-4 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 transition"
              onClick={() => deleteQuestion(editItem.id)}
            >
              Xóa
            </button>
          )}
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-slate-500 transition"
            onClick={() => { setShowEditor(false); setEditItem(null); }}
          >
            Hủy
          </button>
          <button
            className="px-6 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600 transition"
            onClick={saveEdit}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}