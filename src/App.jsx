// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

// ADMIN KEY
const ADMIN_KEY = "emyeuanhnhanvl";
const LOCAL_KEY = "sybau_questions_v2";
const ANSWERS_KEY = "sybau_answers_v2";

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
    const newKey = String.fromCharCode(65 + i); // A, B, C...
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

/* ===== App ===== */
export default function App() {
  // --- Data States ---
  const [baseQuestions, setBaseQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Dark Mode State ---
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("sybau_theme");
    return saved === "dark";
  });

  // --- Mobile UI State ---
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --- Load Data Effect ---
  useEffect(() => {
    const publicUrl = process.env.PUBLIC_URL || "";
    const jsonPath = `${publicUrl}/questions.json`;
    
    fetch(jsonPath, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy questions.json");
        return res.json();
      })
      .then((data) => {
        const clean = Array.isArray(data)
          ? data.sort((a, b) => (a.id || 0) - (b.id || 0))
          : [];
        setBaseQuestions(clean);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi load questions.json:", err);
        setLoading(false);
      });
  }, []);

  // --- Dark Mode Effect ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem("sybau_theme", "dark");
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("sybau_theme", "light");
    }
  }, [darkMode]);

  // --- Quiz States ---
  const [mode, setMode] = useState("practice"); // practice | exam
  const [practiceIndex, setPracticeIndex] = useState(0);
  
  // Load answers from local storage
  const [answers, setAnswers] = useState(() => {
    try {
      const s = localStorage.getItem(ANSWERS_KEY);
      return s ? JSON.parse(s) : {};
    } catch (e) {
      return {};
    }
  });

  // --- Exam States ---
  const [examSet, setExamSet] = useState([]); // array of shuffled questions
  const [examIndex, setExamIndex] = useState(0);
  const [examN, setExamN] = useState(100); // Number of questions for exam
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // --- UI/Modal States ---
  const [showResetModal, setShowResetModal] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState(null);

  // --- Admin States ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // --- Derived Values ---
  const totalQuestions = baseQuestions.length;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Sync answers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
    } catch (e) {}
  }, [answers]);

  // Practice Progress Calculation
  const practiceProgress = useMemo(() => {
    const answeredIds = Object.keys(answers)
      .map((k) => parseInt(k))
      .filter((n) => !Number.isNaN(n));
    let correct = 0;
    for (const id of answeredIds) {
      const q = baseQuestions.find((x) => x.id === id);
      if (q && answers[id] && q.answer && answers[id] === q.answer) correct++;
    }
    return {
      answered: answeredIds.length,
      correct,
      wrong: answeredIds.length - correct,
    };
  }, [answers, baseQuestions]);

  // Current Question Resolver
  const currentQuestion = useMemo(() => {
    if (mode === "practice") return baseQuestions[practiceIndex] || null;
    return examSet[examIndex] || null;
  }, [mode, practiceIndex, examIndex, baseQuestions, examSet]);

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
    if (q) {
      setEditItem({ ...q });
    } else {
      // create new id = max+1
      const newid = baseQuestions.length
        ? Math.max(...baseQuestions.map((x) => x.id)) + 1
        : 1;
      setEditItem({
        id: newid,
        question: "",
        options: { A: "", B: "", C: "", D: "" },
        answer: "A",
      });
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
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(baseQuestions, null, 2));
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

    // Timer setup
    const secondsPerQuestion = 3600 / 100; // Standard timing ratio
    const totalSec = Math.ceil(secondsPerQuestion * N);
    setTimeLeft(totalSec);

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
    
    const setIds =
      mode === "exam" && examSet.length
        ? examSet.map((q) => q.id)
        : Object.keys(answers).map((k) => parseInt(k));
        
    const res = gradeSet(setIds);
    setResultsData(res);
    setShowResults(true);
  }

  function gradeSet(setIds) {
    let correct = 0;
    const details = [];
    for (const id of setIds) {
      const qExam = examSet.find((x) => x.id === id);
      const qBase = baseQuestions.find((x) => x.id === id);
      const q = qExam || qBase;
      
      const ua = answers[id];
      const isCorrect =
        q && q.answer && ua && ua.toUpperCase() === q.answer.toUpperCase();
        
      if (isCorrect) correct++;
      else
        details.push({
          id,
          question: q?.question || "",
          your: ua || null,
          correct: q?.answer || null,
        });
    }
    const total = setIds.length;
    return {
      total,
      correct,
      wrong: total - correct,
      percent: total ? Math.round((100 * correct) / total) : 0,
      details,
    };
  }

  /* ===== option CSS class logic (UPDATED FOR DARK MODE & TOUCH) ===== */
  function optionClass(q, letter) {
    const chosen = answers[q.id];
    
    // Base: added active:scale-98 for touch feedback
    const base = "border p-4 rounded transition active:scale-[0.98] md:active:scale-100 ";
    const darkBase = " dark:border-gray-600 dark:text-gray-200 ";
    const getCls = (specific) => base + darkBase + specific;

    // Practice Mode
    if (mode === "practice") {
      if (!chosen) return getCls("hover:shadow-sm dark:hover:bg-slate-700");
      
      const isChosen = chosen === letter;
      const isCorrect = q.answer === letter;
      if (isChosen && isCorrect)
        return getCls("bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300");
      if (isChosen && !isCorrect)
        return getCls("bg-red-100 border-red-400 text-red-800 dark:bg-red-900/40 dark:border-red-500 dark:text-red-300");
      if (!isChosen && isCorrect)
        return getCls("ring-2 ring-green-200 dark:ring-green-700");
      return getCls("hover:shadow-sm opacity-50 dark:opacity-40");
    } 
    
    // Exam Mode
    else {
      const isChosen = chosen === letter;
      if (examStarted) {
        if (isChosen)
          return getCls("bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-500");
        return getCls("hover:shadow-sm dark:hover:bg-slate-700");
      } 
      else {
        if (!chosen) {
          if (q.answer === letter)
            return getCls("bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300");
          return getCls("opacity-50 dark:opacity-40");
        } else {
          const userCorrect = chosen === q.answer;
          if (userCorrect) {
            if (letter === chosen)
              return getCls("bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300");
            return getCls("opacity-50 dark:opacity-40");
          } else {
            if (letter === chosen)
              return getCls("bg-red-100 border-red-400 text-red-800 dark:bg-red-900/40 dark:border-red-500 dark:text-red-300");
            if (letter === q.answer)
              return getCls("ring-2 ring-green-200 dark:ring-green-700");
            return getCls("opacity-50 dark:opacity-40");
          }
        }
      }
    }
  }

  /* ===== navigation/helpers ===== */
  function goNext() {
    if (mode === "practice")
      setPracticeIndex((i) => Math.min(i + 1, baseQuestions.length - 1));
    else setExamIndex((i) => Math.min(i + 1, examSet.length - 1));
  }
  function goPrev() {
    if (mode === "practice") setPracticeIndex((i) => Math.max(i - 1, 0));
    else setExamIndex((i) => Math.max(i - 1, 0));
  }
  function jumpTo(idx) {
    if (mode === "practice") setPracticeIndex(idx);
    else setExamIndex(idx);
    // Auto collapse sidebar on mobile after selection
    setIsMobileSidebarOpen(false);
  }

  const navList = mode === "practice" ? baseQuestions : examSet;

  /* ===== UI ===== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 p-2 md:p-4 selection:bg-indigo-200 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      <div className="max-w-6xl mx-auto animate-fadeIn">
        
        {/* Header - Optimized for Mobile */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-6 pb-4 border-b border-indigo-100 dark:border-slate-700 gap-4 transition-colors">
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-start">
            <img
              src="./android-chrome-512x512.png"
              alt="logo"
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover shadow-md transition-transform hover:scale-110"
              onError={(e) => {e.target.style.display = 'none'}}
            />
            <div className="text-center md:text-left">
              <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300 bg-clip-text text-transparent drop-shadow-sm">
                Thằng nào nhìn dòng này là GEY
              </div>
              <a
                href="https://www.youtube.com/watch?v=9mA7h1jfxc8&list=RD9mA7h1jfxc8&start_radio=1"
                target="_blank"
                rel="noreferrer"
                className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Hoan hô ban nhạc thủ đô
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center w-full md:w-auto">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg border shadow-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-slate-700 dark:text-yellow-300 transition bg-white dark:bg-slate-800"
              title="Toggle Dark Mode"
            >
              {darkMode ? "🌙" : "☀️"}
            </button>

            {!isAdmin && (
              <button
                className="px-3 py-2 border rounded-lg shadow-sm hover:bg-gray-50 transition text-sm dark:bg-slate-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-700 bg-white"
                onClick={promptAdminLogin}
              >
                Login
              </button>
            )}

            {isAdmin && (
              <button
                className="px-3 py-2 bg-yellow-400 rounded-lg shadow hover:bg-yellow-300 transition text-sm text-black"
                onClick={() => {
                  if (confirm("Logout admin?")) logoutAdmin();
                }}
              >
                Admin ON
              </button>
            )}

            {/* Mode Tabs */}
            <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg transition-colors">
              <button
                onClick={() => {
                  setMode("practice");
                  setShowResults(false);
                  setExamStarted(false);
                  setExamSet([]);
                  setTimeLeft(0);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === "practice"
                    ? "bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600"
                }`}
              >
                Luyện tập
              </button>
              <button
                onClick={() => {
                  setMode("exam");
                  setShowResults(false);
                  setExamStarted(false);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === "exam"
                    ? "bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600"
                }`}
              >
                Kiểm tra
              </button>
            </div>

            {mode === "exam" && (
              <input
                className="border rounded-lg px-2 py-1.5 w-16 text-center shadow-sm hover:border-indigo-300 transition dark:bg-slate-800 dark:border-gray-600 dark:text-gray-200"
                value={examN}
                type="number"
                onChange={(e) => setExamN(e.target.value)}
              />
            )}

            {mode === "exam" && (
              <button
                onClick={startExam}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
              >
                Bắt đầu
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow mb-4 flex items-center justify-between text-gray-800 dark:text-gray-200 transition-colors">
          <div>
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Tiến độ</div>
            <div className="text-base md:text-lg font-semibold">
              {practiceProgress.answered}/{totalQuestions} đã trả lời
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Đúng: <span className="text-green-600 dark:text-green-400">{practiceProgress.correct}</span> • Sai:{" "}
              <span className="text-red-500 dark:text-red-400">{practiceProgress.wrong}</span>
            </div>
          </div>
          <div className="w-1/2 ml-4">
            <div className="h-3 md:h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    totalQuestions
                      ? Math.round(
                          (practiceProgress.answered / totalQuestions) * 100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Left: Navigation Sidebar (Collapsible on Mobile) */}
          <aside className="md:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-xl shadow h-fit transition-colors">
             {/* Mobile Toggle Header */}
            <div 
              className="flex items-center justify-between md:mb-4 cursor-pointer md:cursor-default"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
              <h3 className="font-bold text-gray-700 dark:text-gray-200 md:block">
                Danh sách câu hỏi
              </h3>
              <button className="md:hidden text-gray-500 dark:text-gray-400 text-sm border px-2 py-1 rounded">
                {isMobileSidebarOpen ? "Thu gọn ▲" : "Mở rộng ▼"}
              </button>
            </div>

            {/* Content Wrapper - Hidden on mobile unless toggled */}
            <div className={`${isMobileSidebarOpen ? 'block mt-4' : 'hidden'} md:block animate-fadeIn`}>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[60vh] md:max-h-[70vh] overflow-auto pr-1">
                {navList.map((q, idx) => {
                  const qid = q.id;
                  const done = answers[qid];
                  const isCurrent =
                    (mode === "practice" ? practiceIndex : examIndex) === idx;
                  return (
                    <button
                      key={qid}
                      onClick={() => jumpTo(idx)}
                      className={`py-2 rounded text-xs font-semibold transition active:scale-95 ${
                        done
                          ? "bg-indigo-600 text-white dark:bg-indigo-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                      } ${isCurrent ? "ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-slate-800" : ""}`}
                    >
                      {q.id}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 pt-2 border-t dark:border-slate-700">
                {mode === "exam"
                  ? "Trong chế độ kiểm tra, đáp án chỉ hiện sau khi nộp."
                   : "mmb."}
              </div>

              {mode === "exam" && examStarted && (
                <div className="mt-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-center text-indigo-700 dark:text-indigo-300">
                  Thời gian: <strong className="text-xl">{formatTime(timeLeft)}</strong>
                </div>
              )}

              {/* Admin Sidebar Controls */}
              {isAdmin && (
                <div className="mt-4 space-y-2 border-t dark:border-slate-700 pt-2">
                  <div className="text-xs font-bold text-gray-400 uppercase">Admin Tools</div>
                  <button
                    className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    onClick={() => openEditor(null)}
                  >
                    Thêm câu hỏi
                  </button>
                  <button
                    className="w-full px-3 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 transition"
                    onClick={exportJSON}
                  >
                    Xuất JSON
                  </button>
                  <label className="w-full block cursor-pointer">
                    <div className="w-full px-3 py-2 border border-dashed border-gray-400 rounded text-center text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                      Import JSON
                    </div>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={importJSONFile}
                      className="hidden"
                    />
                  </label>
                  <button
                    className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition text-sm"
                    onClick={() => {
                      if (
                        confirm("Xóa localStorage (khôi phục file gốc khi reload)?")
                      ) {
                        localStorage.removeItem(LOCAL_KEY);
                        localStorage.removeItem(ANSWERS_KEY);
                        window.location.reload();
                      }
                    }}
                  >
                    Hard Reset
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Right: Question Card */}
          <section className="md:col-span-2">
            <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow min-h-[300px] flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <span className="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded">
                        Câu {(currentQuestion && currentQuestion.id) || "—"}
                      </span>
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {mode === "practice"
                          ? "Luyện tập"
                          : examStarted
                          ? "Đang thi"
                          : "Kết quả thi"}
                      </div>
                    </div>
                    
                    <div className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
                      {(currentQuestion && currentQuestion.question) ||
                        "Chọn câu hỏi từ danh sách để bắt đầu"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {currentQuestion &&
                    Object.keys(currentQuestion.options || {}).map((L) => {
                      const cls = optionClass(currentQuestion, L);
                      return (
                        <button
                          key={L}
                          onClick={() => chooseOption(currentQuestion.id, L)}
                          className={cls + " w-full text-left flex gap-3 items-start select-none touch-manipulation"}
                        >
                          <div className="min-w-[28px] h-[28px] flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 font-bold text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                            {L}
                          </div>
                          <div className="whitespace-pre-wrap pt-1 text-sm md:text-base">
                            {currentQuestion.options[L]}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-between border-t dark:border-slate-700 pt-4 gap-3">
                <div className="flex w-full md:w-auto gap-2">
                  <button
                    onClick={goPrev}
                    className="flex-1 md:flex-none px-4 py-3 md:py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-200 rounded text-gray-700 transition active:scale-95 font-medium"
                  >
                    ⬅ Trước
                  </button>
                  <button
                    onClick={goNext}
                    className="flex-1 md:flex-none px-4 py-3 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition shadow-md shadow-indigo-200 dark:shadow-none active:scale-95 font-medium"
                  >
                    Tiếp ➡
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => {
                      if (!confirm("Nộp bài?")) return;
                      handleSubmitExam();
                    }}
                    className="px-4 py-3 md:py-2 bg-red-500 hover:bg-red-600 text-white rounded transition shadow-md shadow-red-200 dark:shadow-none active:scale-95 text-sm font-medium"
                  >
                    Nộp bài
                  </button>
                  <button
                    className="px-3 py-3 md:py-2 border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-slate-700 dark:text-gray-300 rounded text-gray-600 transition active:scale-95 text-sm"
                    onClick={() => setShowResetModal(true)}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Editor Panel */}
            {isAdmin && showEditor && editItem && (
              <div className="mt-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-2 border-indigo-100 dark:border-slate-600 animate-slideUp transition-colors">
                <h3 className="font-bold text-lg text-indigo-800 dark:text-indigo-300 mb-4">
                  {editItem.id ? `Chỉnh sửa câu ${editItem.id}` : "Thêm câu mới"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Nội dung câu hỏi</label>
                    <textarea
                      rows={3}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-300 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={editItem.question}
                      onChange={(e) =>
                        setEditItem({ ...editItem, question: e.target.value })
                      }
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
                              options: {
                                ...(editItem.options || {}),
                                [L]: e.target.value,
                              },
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
                      onChange={(e) =>
                        setEditItem({ ...editItem, answer: e.target.value })
                      }
                      className="border p-2 rounded bg-white dark:bg-slate-600 dark:text-white shadow-sm dark:border-slate-500"
                    >
                      {["A", "B", "C", "D"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2 justify-end mt-4">
                    {editItem.id && (
                       <button
                       className="px-4 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 transition"
                       onClick={() => deleteQuestion(editItem.id)}
                     >
                       Xóa câu hỏi
                     </button>
                    )}
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-slate-500 transition"
                      onClick={() => {
                        setShowEditor(false);
                        setEditItem(null);
                      }}
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
            )}

            {/* Results Panel */}
            {showResults && resultsData && (
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
            )}
          </section>
        </div>

        {/* Reset Modal Overlay */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
                Tùy chọn Reset
              </h3>
              <div className="flex flex-col gap-3">
                <button
                  className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium active:scale-95"
                  onClick={() => {
                    // Reset Logic
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
                  Làm lại từ đầu
                </button>
                <button
                  className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition font-medium active:scale-95"
                  onClick={() => {
                    localStorage.removeItem(ANSWERS_KEY);
                    window.location.reload();
                  }}
                >
                  Xóa toàn bộ dữ liệu (Refresh)
                </button>
                <button
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400 rounded-lg transition mt-2 active:scale-95"
                  onClick={() => setShowResetModal(false)}
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}