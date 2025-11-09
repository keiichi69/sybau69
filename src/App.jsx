  // src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
// Dynamic load questions.json  

 // keep your 404-question JSON in src

// ADMIN KEY
const ADMIN_KEY = "emyeuanhnhanvl";

/* ===== utils ===== */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffleQuestionOptions(q) {
  const keys = Object.keys(q.options || {});
  const shuffledKeys = shuffleArray(keys);
  const newOptions = {};
  let newAnswer = null;
  for (let i = 0; i < shuffledKeys.length; i++) {
    const newKey = String.fromCharCode(65 + i);
    newOptions[newKey] = q.options[shuffledKeys[i]];
    if (shuffledKeys[i] === q.answer) newAnswer = newKey;
  }
  return { ...q, options: newOptions, answer: newAnswer || q.answer };
}
function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ===== local storage helpers ===== */
const LOCAL_KEY = "sybau_questions_v2";
function loadSavedQuestions() {
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    if (s) return JSON.parse(s);
  } catch (e) {
    // ignore
  }
  return null;
}
function saveQuestionsToLocal(qs) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(qs));
  } catch (e) {
    console.error("Save failed", e);
  }
}

/* ===== App ===== */
export default function App() {
    const [baseQuestions, setBaseQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
  // base questions: either saved in localStorage or rawQuestions
  

useEffect(() => {
  const jsonPath = process.env.PUBLIC_URL + "/questions.json";
  fetch(jsonPath, { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("Không tìm thấy questions.json");
      return res.json();
    })
    .then(data => {
      const clean = Array.isArray(data) ? data.sort((a, b) => (a.id || 0) - (b.id || 0)) : [];
      setBaseQuestions(clean);
    })
    .catch(err => {
      console.error("Lỗi load questions.json:", err);
    });
}, []);


  
  

 
  
  // states
  const [mode, setMode] = useState("practice"); // practice | exam
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
  try {
    const s = localStorage.getItem("sybau_answers_v2");
    return s ? JSON.parse(s) : {};
  } catch(e) { 
    return {}; 
  }
});
 // qid -> letter
  const [examSet, setExamSet] = useState([]); // array of q objects
  const [examIndex, setExamIndex] = useState(0);
  const [examN, setExamN] = useState(100);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
// timer
const [showResetModal, setShowResetModal] = useState(false);
    

  const timerRef = useRef(null);
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState(null);

  // admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // derived
  const totalQuestions = baseQuestions.length;
  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // practice progress
  const practiceProgress = useMemo(() => {
    const answeredIds = Object.keys(answers)
      .map((k) => parseInt(k))
      .filter((n) => !Number.isNaN(n));
    let correct = 0;
    for (const id of answeredIds) {
      const q = baseQuestions.find((x) => x.id === id);
      if (q && answers[id] && q.answer && answers[id] === q.answer) correct++;
    }
    return { answered: answeredIds.length, correct, wrong: answeredIds.length - correct };
  }, [answers, baseQuestions]);

  // current question (practice/exam)
  const currentQuestion = useMemo(() => {
    if (mode === "practice") return baseQuestions[practiceIndex] || null;
    return examSet[examIndex] || null;
  }, [mode, practiceIndex, examIndex, baseQuestions, examSet]);


  // uhuh saved answers to localStorage

    useEffect(() => {
  try {
    localStorage.setItem("sybau_answers_v2", JSON.stringify(answers));
  } catch(e) {}
}, [answers]);

  /* ===== Admin functions ===== */
  function promptAdminLogin() {
    const key = prompt("Nhập admin key:");
    if (key === ADMIN_KEY) {
      setIsAdmin(true);
      alert("Admin mode ON");
    } else {
      alert("Key sai");
    }
  }
  function logoutAdmin() {
    setIsAdmin(false);
    alert("Admin mode OFF");
  }
  function openEditor(q) {
    if (q) setEditItem({ ...q });
    else {
      // create new id = max+1
      const newid = baseQuestions.length ? Math.max(...baseQuestions.map((x) => x.id)) + 1 : 1;
      setEditItem({ id: newid, question: "", options: { A: "", B: "", C: "" }, answer: "A" });
    }
    setShowEditor(true);
  }
  function saveEdit() {
    if (!editItem) return;
    setBaseQuestions((prev) => {
      const idx = prev.findIndex((x) => x.id === editItem.id);
      let next = [...prev];
      if (idx >= 0) next[idx] = editItem;
      else next.push(editItem);
      return next.sort((a, b) => a.id - b.id);
    });
    setShowEditor(false);
    setEditItem(null);
  }
  function deleteQuestion(id) {
    if (!confirm("Xóa câu hỏi này?")) return;
    setBaseQuestions((prev) => prev.filter((x) => x.id !== id));
    setShowEditor(false);
    // also remove answer state
    setAnswers((prev) => {
      const p = { ...prev };
      delete p[id];
      return p;
    });
  }
  function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(baseQuestions, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "questions_updated.json";
    a.click();
  }
  function importJSONFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) return alert("File không hợp lệ");
        setBaseQuestions(parsed.slice().sort((a, b) => a.id - b.id));
        alert("Import xong");
      } catch (err) {
        alert("Lỗi đọc file");
      }
    };
    reader.readAsText(file);
  }

  /* ===== Selection and grading logic ===== */
  function chooseOption(qid, letter) {
    setAnswers((prev) => {
      const next = { ...prev, [qid]: letter };
      return next;
    });
  }

  function startExam() {
    let N = parseInt(examN, 10) || 100;
    if (N < 1) N = 1;
    if (N > totalQuestions) N = totalQuestions;
    // shuffle questions then pick first N
    const picks = shuffleArray(baseQuestions).slice(0, N);
    // shuffle options per question
    const mapped = picks.map((q) => shuffleQuestionOptions(q));
    setExamSet(mapped);
    setAnswers({});
    setExamIndex(0);
    setMode("exam");
    setExamStarted(true);
    setShowResults(false);
    setResultsData(null);
    const secondsPerQuestion = 3600 / 100;
    const totalSec = Math.ceil(secondsPerQuestion * N);
    setTimeLeft(totalSec);
    // start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleSubmitExam();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function handleSubmitExam() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setExamStarted(false);
    // grade exam set if exam; else grade answered ones
    const setIds = mode === "exam" && examSet.length ? examSet.map((q) => q.id) : Object.keys(answers).map((k) => parseInt(k));
    const res = gradeSet(setIds);
    setResultsData(res);
    setShowResults(true);
  }

  function gradeSet(setIds) {
    let correct = 0;
    const details = [];
    for (const id of setIds) {
      // for examSet preference
      const qExam = examSet.find((x) => x.id === id);
      const qBase = baseQuestions.find((x) => x.id === id);
      const q = qExam || qBase;
      const ua = answers[id];
      const isCorrect = q && q.answer && ua && ua.toUpperCase() === q.answer.toUpperCase();
      if (isCorrect) correct++;
      else details.push({ id, question: q?.question || "", your: ua || null, correct: q?.answer || null });
    }
    const total = setIds.length;
    return { total, correct, wrong: total - correct, percent: total ? Math.round((100 * correct) / total) : 0, details };
  }

  /* ===== option CSS class logic ===== */
  function optionClass(q, letter) {
    const chosen = answers[q.id];
    if (mode === "practice") {
      if (!chosen) return "border p-4 rounded hover:shadow-sm transition";
      const isChosen = chosen === letter;
      const isCorrect = q.answer === letter;
      if (isChosen && isCorrect) return "border p-4 rounded bg-green-100 border-green-400 text-green-800 transition";
      if (isChosen && !isCorrect) return "border p-4 rounded bg-red-100 border-red-400 text-red-800 transition";
      if (!isChosen && isCorrect) return "border p-4 rounded ring-2 ring-green-200 transition";
      return "border p-4 rounded hover:shadow-sm transition";
    } else {
      // exam mode
      const isChosen = chosen === letter;
      if (examStarted) {
        if (isChosen) return "border p-4 rounded bg-blue-50 border-blue-300 transition";
        return "border p-4 rounded hover:shadow-sm transition";
      } else {
        // after submission
        if (!chosen) {
          if (q.answer === letter) return "border p-4 rounded bg-green-100 border-green-400 text-green-800 transition";
          return "border p-4 rounded";
        } else {
          const userCorrect = chosen === q.answer;
          if (userCorrect) {
            if (letter === chosen) return "border p-4 rounded bg-green-100 border-green-400 text-green-800 transition";
            return "border p-4 rounded";
          } else {
            if (letter === chosen) return "border p-4 rounded bg-red-100 border-red-400 text-red-800 transition";
            if (letter === q.answer) return "border p-4 rounded ring-2 ring-green-200 transition";
            return "border p-4 rounded";
          }
        }
      }
    }
  }

  /* ===== navigation/helpers ===== */
  function goNext() {
    if (mode === "practice") setPracticeIndex((i) => Math.min(i + 1, baseQuestions.length - 1));
    else setExamIndex((i) => Math.min(i + 1, examSet.length - 1));
  }
  function goPrev() {
    if (mode === "practice") setPracticeIndex((i) => Math.max(i - 1, 0));
    else setExamIndex((i) => Math.max(i - 1, 0));
  }
  function jumpTo(idx) {
    if (mode === "practice") setPracticeIndex(idx);
    else setExamIndex(idx);
  }
  function resetAll() {
    if (!confirm("Reset toàn bộ tiến độ trên trình duyệt?")) return;
    setAnswers({});
    setExamSet([]);
    setExamStarted(false);
    setShowResults(false);
    setResultsData(null);
    setTimeLeft(0);
    setMode("practice");
    setPracticeIndex(0);
    setExamIndex(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  const navList = mode === "practice" ? baseQuestions : examSet;

  /* ===== UI ===== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-600 to-blue-400 text-white flex items-center justify-center font-bold">36</div>
            <div>
              <div className="text-lg font-semibold">Thằng nào nhìn dòng này là GEY</div>
              <a href="https://www.youtube.com/watch?v=9mA7h1jfxc8&list=RD9mA7h1jfxc8&start_radio=1"  target="_blank" className="text-sm text-gray-500"> Hoan hô ban nhạc thủ đô</a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isAdmin && <button className="px-3 py-1 border rounded" onClick={promptAdminLogin}>Login Admin</button>}
            {isAdmin && <button className="px-3 py-1 bg-yellow-400 rounded" onClick={() => { if (confirm("Logout admin?")) logoutAdmin(); }}>Admin ON</button>}
            <select value={mode} onChange={(e) => { setMode(e.target.value); setShowResults(false); setExamStarted(false); if (e.target.value === "practice") { setExamSet([]); setTimeLeft(0); } }} className="border rounded px-2 py-1">
              <option value="practice">Luyện tập</option>
              <option value="exam">Kiểm tra</option>
            </select>
            {mode === "exam" && <input className="border rounded px-2 py-1 w-20" value={examN} onChange={(e) => setExamN(e.target.value)} />}
            {mode === "exam" ? <button onClick={startExam} className="px-3 py-2 bg-indigo-600 text-white rounded">Bắt đầu</button> : <div className="text-sm text-gray-500 px-3">Chế độ Luyện tập</div>}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Tiến độ</div>
            <div className="text-lg font-semibold">{practiceProgress.answered}/{totalQuestions} đã trả lời</div>
            <div className="text-sm text-gray-600">Đúng: {practiceProgress.correct} • Sai: {practiceProgress.wrong}</div>
          </div>
          <div className="w-1/2">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-4 bg-indigo-600 rounded-full" style={{ width: `${Math.round((practiceProgress.answered / totalQuestions) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Left: nav */}
          <aside className="md:col-span-1 bg-white p-4 rounded-xl shadow max-h-[70vh] overflow-auto">
            <div className="grid grid-cols-6 gap-2">
              {navList.map((q, idx) => {
                const qid = q.id;
                const done = answers[qid];
                const isCurrent = (mode === "practice" ? practiceIndex : examIndex) === idx;
                return (
                  <button key={qid} onClick={() => jumpTo(idx)} className={`py-2 rounded ${done ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"} ${isCurrent ? "ring-2 ring-indigo-300" : ""}`}>
                    {q.id}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-gray-500 mt-3">Trong kiểm tra, đáp án sẽ hiển thị sau khi nộp</div>

            {mode === "exam" && examStarted && <div className="mt-3 text-sm text-indigo-600">Thời gian còn lại: <strong>{formatTime(timeLeft)}</strong></div>}

            {/* Admin controls */}
            {isAdmin && (
              <div className="mt-4 space-y-2">
                <button className="w-full px-3 py-2 bg-green-500 text-white rounded" onClick={() => openEditor(null)}>Thêm câu</button>
                <button className="w-full px-3 py-2 bg-yellow-400 rounded" onClick={exportJSON}>Xuất JSON</button>
                <label className="w-full block">
                  <div className="mt-2 text-xs text-gray-600">Import JSON:</div>
                  <input type="file" accept=".json,application/json" onChange={importJSONFile} className="mt-1" />
                </label>
                <button className="w-full px-3 py-2 bg-gray-100 rounded" onClick={() => { if (confirm("Xóa localStorage (khôi phục file gốc)?")) { localStorage.removeItem(LOCAL_KEY); window.location.reload(); } }}>Reset dữ liệu local</button>
              </div>
            )}
          </aside>

          {/* Right: question card */}
          <section className="md:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Câu {(currentQuestion && currentQuestion.id) || "—"}</div>
                  <div className="text-lg font-medium mt-2">{(currentQuestion && currentQuestion.question) || "Chọn câu để hiển thị"}</div>
                </div>
                <div className="text-sm text-gray-500">{mode === "practice" ? "Luyện tập" : (examStarted ? "Kiểm tra (Đang làm)" : "Kiểm tra")}</div>
              </div>

              <div className="mt-6 space-y-3">
                {currentQuestion && Object.keys(currentQuestion.options || {}).map((L) => {
                  const cls = optionClass(currentQuestion, L);
                  return (
                    <button
                      key={L}
                      onClick={() => chooseOption(currentQuestion.id, L)}
                      className={cls + " w-full text-left flex gap-3 items-start"}
                    >
                      <strong className="min-w-[28px]">{L}.</strong>
                      <div className="whitespace-pre-wrap">{currentQuestion.options[L]}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  <button onClick={goPrev} className="px-4 py-2 bg-gray-100 rounded mr-2">⬅ Trước</button>
                  <button onClick={goNext} className="px-4 py-2 bg-indigo-600 text-white rounded">Tiếp ➡</button>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => { if (!confirm("Nộp bài?")) return; handleSubmitExam(); }} className="px-4 py-2 bg-red-500 text-white rounded">Nộp bài</button>
                  <button
                         className="px-3 py-2 border rounded"
                          onClick={() => setShowResetModal(true)}
>
                          Reset
                  </button>
                              {showResetModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Chọn kiểu Reset</h3>
                  <div className="flex flex-col gap-3">
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded"
                      onClick={() => {
                        // Reset tiến độ bình thường
                        setAnswers({});
                        setExamSet([]);
                        setExamStarted(false);
                        setShowResults(false);
                        setResultsData(null);
                        setTimeLeft(0);
                        setMode("practice");
                        setPracticeIndex(0);
                        setExamIndex(0);
                        if (timerRef.current) clearInterval(timerRef.current);
                        setShowResetModal(false);
                      }}
                    >
                      Reset tiến độ
                    </button>
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded"
                      onClick={() => {
                        // Xóa localStorage
                        localStorage.removeItem(LOCAL_KEY);
                        window.location.reload();
                      }}
                    >
                      Reset localStorage
                    </button>
                    <button
                      className="px-4 py-2 border rounded"
                      onClick={() => setShowResetModal(false)}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

              
                  {isAdmin && currentQuestion && <button className="px-3 py-2 border rounded" onClick={() => openEditor(currentQuestion)}>Sửa câu</button>}
                </div>
              </div>
            </div>

            {/* results */}
            {showResults && resultsData && (
              <div className="mt-4 bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold text-indigo-700">Kết quả: {resultsData.correct}/{resultsData.total} đúng — {resultsData.percent}%</h3>
                <details className="mt-2"><summary className="cursor-pointer">Danh sách câu sai ({resultsData.details.length})</summary>
                  <ul className="mt-2 text-sm text-gray-700 max-h-64 overflow-auto">
                    {resultsData.details.map((d) => (
                      <li key={d.id} className="mb-2 border-b pb-1">
                        <strong>Câu {d.id}</strong>: {d.question}<br />
                        <span className="text-red-600">Đáp án của bạn: {d.your || '—'}</span><br />
                        <span className="text-green-700">Đáp án đúng: {d.correct}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            )}

            {/* Editor panel (admin) */}
            {showEditor && editItem && (
              <div className="mt-4 bg-white p-4 rounded-xl shadow">
                <h3 className="font-semibold">Chỉnh sửa câu {editItem.id}</h3>
                <div className="mt-2 space-y-2">
                  <input className="w-full border p-2 rounded" value={editItem.question} onChange={(e) => setEditItem({ ...editItem, question: e.target.value })} />
                  <div className="grid grid-cols-1 gap-2">
                    {["A", "B", "C"].map((L) => (
                      <input key={L} className="w-full border p-2 rounded" value={(editItem.options && editItem.options[L]) || ""} onChange={(e) => setEditItem({ ...editItem, options: { ...(editItem.options || {}), [L]: e.target.value } })} />
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-sm">Đáp án đúng:</label>
                    <select value={editItem.answer} onChange={(e) => setEditItem({ ...editItem, answer: e.target.value })} className="border p-1 rounded">
                      <option>A</option><option>B</option><option>C</option>
                    </select>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 bg-green-500 text-white rounded" onClick={saveEdit}>Lưu</button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => deleteQuestion(editItem.id)}>Xóa</button>
                    <button className="px-3 py-1 border rounded" onClick={() => { setShowEditor(false); setEditItem(null); }}>Hủy</button>
                  </div>
                </div>
              </div>
            )}

          </section>
        </div>
      </div>
    </div>
  );
}