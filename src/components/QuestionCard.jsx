import React from "react";

export default function QuestionCard({
  currentQuestion, mode, examStarted, answers, chooseOption,
  goPrev, goNext, handleSubmitExam, setShowResetModal
}) {

  // Logic tính class CSS cho đáp án
  function getOptionClass(q, letter) {
    const chosen = answers[q.id];
    const base = "border p-4 rounded transition active:scale-[0.98] md:active:scale-100 ";
    const darkBase = " dark:border-gray-600 dark:text-gray-200 ";
    const getCls = (specific) => base + darkBase + specific;

    if (mode === "practice") {
      if (!chosen) return getCls("hover:shadow-sm dark:hover:bg-slate-700");
      const isChosen = chosen === letter;
      const isCorrect = q.answer === letter;
      if (isChosen && isCorrect) return getCls("bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300");
      if (isChosen && !isCorrect) return getCls("bg-red-100 border-red-400 text-red-800 dark:bg-red-900/40 dark:border-red-500 dark:text-red-300");
      if (!isChosen && isCorrect) return getCls("ring-2 ring-green-200 dark:ring-green-700");
      return getCls("hover:shadow-sm opacity-50 dark:opacity-40");
    } else {
      // Exam Mode
      const isChosen = chosen === letter;
      if (examStarted) {
        if (isChosen) return getCls("bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-500");
        return getCls("hover:shadow-sm dark:hover:bg-slate-700");
      } else {
        // Exam Result View
        if (!chosen) {
          if (q.answer === letter) return getCls("bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300");
          return getCls("opacity-50 dark:opacity-40");
        } else {
          const userCorrect = chosen === q.answer;
          if (userCorrect) {
            if (letter === chosen) return getCls("bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300");
            return getCls("opacity-50 dark:opacity-40");
          } else {
            if (letter === chosen) return getCls("bg-red-100 border-red-400 text-red-800 dark:bg-red-900/40 dark:border-red-500 dark:text-red-300");
            if (letter === q.answer) return getCls("ring-2 ring-green-200 dark:ring-green-700");
            return getCls("opacity-50 dark:opacity-40");
          }
        }
      }
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow min-h-[300px] flex flex-col justify-between transition-colors">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded">
            Câu {(currentQuestion && currentQuestion.id) || "—"}
          </span>
          <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
            {mode === "practice" ? "Luyện tập" : examStarted ? "Đang thi" : "Kết quả thi"}
          </div>
        </div>
        
        <div className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
          {(currentQuestion && currentQuestion.question) || "Chọn câu hỏi từ danh sách để bắt đầu"}
        </div>

        <div className="mt-6 space-y-3">
          {currentQuestion && Object.keys(currentQuestion.options || {}).map((L) => (
            <button key={L} onClick={() => chooseOption(currentQuestion.id, L)} className={getOptionClass(currentQuestion, L) + " w-full text-left flex gap-3 items-start select-none touch-manipulation"}>
              <div className="min-w-[28px] h-[28px] flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 font-bold text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                {L}
              </div>
              <div className="whitespace-pre-wrap pt-1 text-sm md:text-base">
                {currentQuestion.options[L]}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between border-t dark:border-slate-700 pt-4 gap-3">
        <div className="flex w-full md:w-auto gap-2">
          <button onClick={goPrev} className="flex-1 md:flex-none px-4 py-3 md:py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-200 rounded text-gray-700 transition active:scale-95 font-medium">⬅ Trước</button>
          <button onClick={goNext} className="flex-1 md:flex-none px-4 py-3 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition shadow-md shadow-indigo-200 dark:shadow-none active:scale-95 font-medium">Tiếp ➡</button>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button onClick={() => { if (!confirm("Nộp bài?")) return; handleSubmitExam(); }} className="px-4 py-3 md:py-2 bg-red-500 hover:bg-red-600 text-white rounded transition shadow-md shadow-red-200 dark:shadow-none active:scale-95 text-sm font-medium">Nộp bài</button>
          <button className="px-3 py-3 md:py-2 border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-slate-700 dark:text-gray-300 rounded text-gray-600 transition active:scale-95 text-sm" onClick={() => setShowResetModal(true)}>Reset</button>
        </div>
      </div>
    </div>
  );
}