import React, { useEffect, useMemo, useRef, useState } from "react";
import { shuffleArray, shuffleQuestionOptions } from "./utils/helpers";

// Import Components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import QuestionCard from "./components/QuestionCard";
import AdminEditor from "./components/AdminEditor";
import ResultsPanel from "./components/ResultsPanel";
import ResetModal from "./components/ResetModal";

// CONSTANTS
const ADMIN_KEY = "emyeuanhnhanvl";
const ANSWERS_KEY = "sybau_answers_v2";

export default function App() {
  // --- Data States ---
  const [baseQuestions, setBaseQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("sybau_theme") === "dark");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --- Quiz States ---
  const [mode, setMode] = useState("practice");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ANSWERS_KEY)) || {}; } catch (e) { return {}; }
  });

  // --- Exam States ---
  const [examSet, setExamSet] = useState([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examN, setExamN] = useState(100);
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

  const totalQuestions = baseQuestions.length;

  // --- Effects ---
  useEffect(() => {
    const jsonPath = `${process.env.PUBLIC_URL || ""}/questions.json`;
    fetch(jsonPath, { cache: "no-store" })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const clean = Array.isArray(data) ? data.sort((a, b) => (a.id || 0) - (b.id || 0)) : [];
        setBaseQuestions(clean);
        setLoading(false);
      })
      .catch((err) => { console.error(err); setLoading(false); });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem("sybau_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Không kích hoạt phím tắt khi đang nhập liệu hoặc modal đang mở
      if (showEditor || showResetModal || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case "ArrowLeft":
          goPrev();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "1": case "a": case "A":
          if (currentQuestion) setAnswers(prev => ({ ...prev, [currentQuestion.id]: "A" }));
          break;
        case "2": case "b": case "B":
          if (currentQuestion) setAnswers(prev => ({ ...prev, [currentQuestion.id]: "B" }));
          break;
        case "3": case "c": case "C":
          if (currentQuestion) setAnswers(prev => ({ ...prev, [currentQuestion.id]: "C" }));
          break;
        case "4": case "d": case "D":
          if (currentQuestion) setAnswers(prev => ({ ...prev, [currentQuestion.id]: "D" }));
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, showEditor, showResetModal, mode, practiceIndex, examIndex, baseQuestions, examSet]); 

  // --- Logic Helpers ---
  const practiceProgress = useMemo(() => {
    const answeredIds = Object.keys(answers).map(k => parseInt(k)).filter(n => !isNaN(n));
    let correct = 0;
    for (const id of answeredIds) {
      const q = baseQuestions.find(x => x.id === id);
      if (q && answers[id] && q.answer === answers[id]) correct++;
    }
    return { answered: answeredIds.length, correct, wrong: answeredIds.length - correct };
  }, [answers, baseQuestions]);

  const currentQuestion = useMemo(() => {
    return mode === "practice" ? baseQuestions[practiceIndex] : examSet[examIndex];
  }, [mode, practiceIndex, examIndex, baseQuestions, examSet]);

  const resetExamState = () => {
    setShowResults(false);
    setExamStarted(false);
    setExamSet([]);
    setTimeLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // --- Handlers ---
  function promptAdminLogin() {
    if (prompt("Nhập admin key:") === ADMIN_KEY) { setIsAdmin(true); alert("Admin mode ON"); } else alert("Key sai");
  }

  function startExam() {
    let N = Math.min(Math.max(parseInt(examN, 10) || 100, 1), totalQuestions);
    const picks = shuffleArray(baseQuestions).slice(0, N).map(q => shuffleQuestionOptions(q));
    setExamSet(picks); setAnswers({}); setExamIndex(0); setMode("exam"); setExamStarted(true); setShowResults(false); setResultsData(null);
    setTimeLeft(Math.ceil((3600 / 100) * N));
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(timerRef.current); handleSubmitExam(); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  function handleSubmitExam() {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamStarted(false);
    const setIds = mode === "exam" && examSet.length ? examSet.map(q => q.id) : Object.keys(answers).map(k => parseInt(k));
    
    let correct = 0;
    const details = [];
    for (const id of setIds) {
      const q = (mode === "exam" ? examSet : baseQuestions).find(x => x.id === id);
      const ua = answers[id];
      if (q && q.answer && ua && ua.toUpperCase() === q.answer.toUpperCase()) correct++;
      else details.push({ id, question: q?.question || "", your: ua || null, correct: q?.answer || null });
    }
    setResultsData({ total: setIds.length, correct, wrong: setIds.length - correct, percent: setIds.length ? Math.round((100 * correct) / setIds.length) : 0, details });
    setShowResults(true);
  }

  // --- Reset Handlers ---
  const handleResetConfirm = () => {
    setAnswers({});
    resetExamState();
    setPracticeIndex(0);
    setExamIndex(0);
    setShowResetModal(false);
  };

  const handleHardReset = () => {
    localStorage.removeItem(ANSWERS_KEY);
    window.location.reload();
  };

  // --- Admin Handlers (ĐÃ SỬA: Thêm logic Export/Import) ---
  function openEditor(q) {
    setEditItem(q ? { ...q } : { id: baseQuestions.length ? Math.max(...baseQuestions.map(x => x.id)) + 1 : 1, question: "", options: { A: "", B: "", C: "", D: "" }, answer: "A" });
    setShowEditor(true);
  }

  function saveEdit() {
    if (!editItem) return;
    setBaseQuestions(prev => {
      const idx = prev.findIndex(x => x.id === editItem.id);
      const next = [...prev];
      if (idx >= 0) next[idx] = editItem; else next.push(editItem);
      return next.sort((a, b) => a.id - b.id);
    });
    setShowEditor(false); setEditItem(null);
  }

  function deleteQuestion(id) {
    if (confirm("Xóa câu hỏi này?")) {
      setBaseQuestions(prev => prev.filter(x => x.id !== id));
      setShowEditor(false);
      setAnswers(prev => { const p = { ...prev }; delete p[id]; return p; });
    }
  }

  // Logic Export JSON mới
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(baseQuestions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "questions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Logic Import JSON mới
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (Array.isArray(parsed)) {
          const clean = parsed.sort((a, b) => (a.id || 0) - (b.id || 0));
          setBaseQuestions(clean);
          alert(`Đã nhập thành công ${clean.length} câu hỏi!`);
        } else {
          alert("File JSON không đúng định dạng (phải là danh sách câu hỏi).");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi đọc file JSON. Vui lòng kiểm tra lại nội dung file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input file
  };
  
  // Navigation
  const jumpTo = (idx) => {
    if (mode === "practice") setPracticeIndex(idx); else setExamIndex(idx);
    setIsMobileSidebarOpen(false);
  };
  const goNext = () => jumpTo(Math.min((mode === "practice" ? practiceIndex : examIndex) + 1, (mode === "practice" ? baseQuestions : examSet).length - 1));
  const goPrev = () => jumpTo(Math.max((mode === "practice" ? practiceIndex : examIndex) - 1, 0));

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-indigo-600 font-bold">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 p-2 md:p-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto animate-fadeIn">
        
        <Header 
          darkMode={darkMode} setDarkMode={setDarkMode} isAdmin={isAdmin} 
          promptAdminLogin={promptAdminLogin} logoutAdmin={() => setIsAdmin(false)} 
          mode={mode} setMode={setMode} examN={examN} setExamN={setExamN} 
          startExam={startExam} resetExamState={resetExamState}
        />

        <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow mb-4 flex items-center justify-between text-gray-800 dark:text-gray-200 transition-colors">
          <div>
            <div className="text-xs md:text-sm text-gray-500">Tiến độ</div>
            <div className="text-base md:text-lg font-semibold">{practiceProgress.answered}/{totalQuestions} đã trả lời</div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Đúng: <span className="text-green-600">{practiceProgress.correct}</span> • Sai: <span className="text-red-500">{practiceProgress.wrong}</span>
            </div>
          </div>
          <div className="w-1/2 ml-4">
            <div className="h-3 md:h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${totalQuestions ? Math.round((practiceProgress.answered / totalQuestions) * 100) : 0}%` }} />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Sidebar 
            isMobileSidebarOpen={isMobileSidebarOpen} setIsMobileSidebarOpen={setIsMobileSidebarOpen}
            navList={mode === "practice" ? baseQuestions : examSet} mode={mode} answers={answers}
            currentIndex={mode === "practice" ? practiceIndex : examIndex} jumpTo={jumpTo}
            examStarted={examStarted} timeLeft={timeLeft} isAdmin={isAdmin} openEditor={openEditor}
            // Đã truyền hàm xử lý vào Sidebar
            exportJSON={handleExportJSON} 
            importJSONFile={handleImportJSON}
            hardReset={() => { if(confirm("Hard Reset sẽ xóa toàn bộ tiến độ. Bạn có chắc không?")) handleHardReset(); }}
          />

          <section className="md:col-span-2">
            <QuestionCard 
              currentQuestion={currentQuestion} mode={mode} examStarted={examStarted}
              answers={answers} chooseOption={(qid, l) => setAnswers(prev => ({ ...prev, [qid]: l }))}
              goPrev={goPrev} goNext={goNext} handleSubmitExam={handleSubmitExam}
              setShowResetModal={setShowResetModal}
            />

            {isAdmin && showEditor && (
              <AdminEditor 
                editItem={editItem} setEditItem={setEditItem} 
                saveEdit={saveEdit} deleteQuestion={deleteQuestion} setShowEditor={setShowEditor} 
              />
            )}

            {showResults && (
              <ResultsPanel resultsData={resultsData} />
            )}
          </section>
        </div>

        {showResetModal && (
          <ResetModal 
            onConfirm={handleResetConfirm} 
            onHardReset={handleHardReset} 
            onClose={() => setShowResetModal(false)} 
          />
        )}
      </div>
    </div>
  );
}