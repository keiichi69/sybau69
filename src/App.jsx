
import React, { useEffect, useState, useMemo } from 'react';
import raw from './questions.json';

const ADMIN_KEY = "emyeuanhnhanvl";

function loadSaved(){
  try{
    const s = localStorage.getItem('sybau_questions_v1');
    if(s) return JSON.parse(s);
  }catch(e){}
  return raw;
}

export default function App(){
  const [questions, setQuestions] = useState(loadSaved());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [mode, setMode] = useState('practice');
  const [examN, setExamN] = useState(100);
  const [examSet, setExamSet] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerId, setTimerId] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(()=>{
    if(timerId) return;
    if(examStarted && timeLeft>0){
      const t = setInterval(()=> setTimeLeft(s=>{ if(s<=1){ clearInterval(t); finishExam(); return 0;} return s-1 }),1000);
      setTimerId(t);
      return ()=>clearInterval(t);
    }
  },[examStarted, timeLeft]);

  useEffect(()=>{ localStorage.setItem('sybau_questions_v1', JSON.stringify(questions)); },[questions]);

  const total = questions.length;
  const progress = useMemo(()=>{
    const answered = Object.keys(answers).length;
    const correct = Object.keys(answers).filter(k=>{
      const q = questions.find(x=>x.id===parseInt(k));
      return q && answers[k] && q.answer && answers[k]===q.answer;
    }).length;
    return { answered, correct, wrong: answered-correct };
  },[answers,questions]);

  function selectOption(qid, opt){
    setAnswers(prev=>({...prev, [qid]: opt}));
    if(mode==='practice'){
      // immediate feedback handled via class names in render
    }
  }

  function startExam(){
    let N = parseInt(examN) || 100; if(N>total) N=total;
    const idxs = Array.from({length: total}, (_,i)=>i);
    for(let i=idxs.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idxs[i],idxs[j]]=[idxs[j],idxs[i]] }
    const pick = idxs.slice(0,N);
    setExamSet(pick);
    setAnswers({});
    setExamStarted(true);
    setMode('exam');
    setTimeLeft(Math.ceil((3600/100)*N));
    setIndex(0);
  }

  function finishExam(){
    setExamStarted(false);
    computeResult();
  }

  function computeResult(){
    const setIds = (examStarted && mode==='exam') ? examSet.map(i=>questions[i].id) : Object.keys(answers).map(x=>parseInt(x));
    const res = grade(setIds);
    alert(`Kết quả: ${res.correct}/${res.total} — ${res.percent}%`);
  }

  function grade(setIds){
    let corr=0; const details=[];
    setIds.forEach(id=>{
      const q = questions.find(x=>x.id===id);
      const ua = answers[id];
      const isCorrect = q && ua && q.answer && ua===q.answer;
      if(isCorrect) corr++; else details.push({id, question: q?.question||'', your: ua||null, correct: q?.answer||null});
    });
    return { total:setIds.length, correct:corr, wrong:setIds.length-corr, percent: setIds.length?Math.round(100*corr/setIds.length):0, details};
  }

  function openEditor(q){
    setEditItem(q ? {...q} : { id: (questions.length? Math.max(...questions.map(x=>x.id))+1 : 1), question:'', options:{A:'',B:'',C:''}, answer:'A' });
    setShowEditor(true);
  }

  function saveEdit(){
    if(!editItem) return;
    setQuestions(prev=>{
      const idx = prev.findIndex(x=>x.id===editItem.id);
      let next = [...prev];
      if(idx>=0) next[idx]=editItem; else next.push(editItem);
      return next.sort((a,b)=>a.id-b.id);
    });
    setShowEditor(false);
  }

  function deleteItem(id){
    if(!confirm('Xóa câu hỏi?')) return;
    setQuestions(prev=> prev.filter(x=>x.id!==id));
    setShowEditor(false);
  }

  function exportJSON(){
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
    const a = document.createElement('a'); a.href = dataStr; a.download = 'questions_updated.json'; a.click();
  }

  function loginAdmin(){
    const key = prompt('Nhập admin key:');
    if(key===ADMIN_KEY){ setAdminMode(true); alert('Bật chế độ Admin'); } else alert('Key sai');
  }

  const current = questions[ examStarted && mode==='exam' ? examSet[index] : index ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-600 to-blue-400 text-white flex items-center justify-center font-bold">SY</div>
          <div>
            <div className="text-lg font-semibold">SYBAU69 (Dynamic Lite)</div>
            <div className="text-sm text-gray-500">Admin key: emyeuanhnhanvl</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!adminMode && <button className="px-3 py-1 border rounded" onClick={loginAdmin}>Login Admin</button>}
          {adminMode && <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={()=>setAdminMode(false)}>Logout Admin</button>}
          <select value={mode} onChange={e=>setMode(e.target.value)} className="border rounded px-2 py-1">
            <option value="practice">Luyện tập</option>
            <option value="exam">Kiểm tra</option>
          </select>
          <input className="border rounded px-2 py-1 w-20" value={examN} onChange={e=>setExamN(e.target.value)} />
          <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={startExam}>Bắt đầu</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-12 gap-4">
        <aside className="col-span-3 bg-white p-3 rounded shadow">
          <div className="mb-3">
            <div className="text-sm text-gray-500">Tiến độ</div>
            <div className="text-xl font-semibold">{progress.answered}/{total}</div>
            <div className="text-sm text-green-600">Đúng {progress.correct} • Sai {progress.wrong}</div>
          </div>
          <div className="grid grid-cols-6 gap-2 max-h-72 overflow-auto">
            {questions.map((q,i)=>(
              <button key={q.id} onClick={()=>setIndex(i)} className={`py-2 rounded ${answers[q.id] ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>{q.id}</button>
            ))}
          </div>
          {adminMode && <div className="mt-4 space-y-2"><button className="w-full px-3 py-2 bg-green-500 text-white rounded" onClick={()=>openEditor(null)}>Thêm câu</button><button className="w-full px-3 py-2 bg-yellow-400 rounded" onClick={exportJSON}>Xuất JSON</button></div>}
        </aside>

        <section className="col-span-9">
          <div className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-start mb-3">
              <div><div className="text-sm text-gray-500">Câu {current?.id}</div><div className="text-lg font-medium mt-2">{current?.question}</div></div>
              <div className="text-sm text-gray-500">{examStarted? 'Kiểm tra' : 'Luyện tập'}</div>
            </div>

            <div className="space-y-3">
              {['A','B','C'].map(L=>{
                const txt = current?.options?.[L]||'';
                const sel = answers[current?.id]===L;
                const isCorrect = current?.answer===L;
                const showCorrect = mode==='practice' || !examStarted;
                let cls = 'border p-4 rounded flex gap-3 items-start';
                if(sel && mode==='practice' && isCorrect) cls += ' bg-green-100 border-green-400 text-green-700';
                if(sel && mode==='practice' && !isCorrect) cls += ' bg-red-100 border-red-400 text-red-700';
                if(!sel && mode==='practice' && isCorrect) cls += ' ring-2 ring-green-200';
                return (<div key={L} className={cls} onClick={()=>selectOption(current.id,L)}><strong>{L}.</strong><div>{txt}</div></div>)
              })}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div>
                <button className="px-4 py-2 bg-gray-100 rounded mr-2" onClick={()=>setIndex(i=>Math.max(0,i-1))}>⬅ Trước</button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={()=>setIndex(i=>Math.min(total-1,i+1))}>Tiếp ➡</button>
              </div>
              <div className="flex items-center gap-2">
                {examStarted && <div className="font-semibold text-indigo-600">Thời gian: {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>}
                <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={finishExam}>Nộp bài</button>
              </div>
            </div>
          </div>

          {showEditor && editItem && (
            <div className="mt-4 bg-white p-4 rounded shadow">
              <h3 className="font-semibold">Chỉnh sửa câu {editItem.id}</h3>
              <div className="mt-2 space-y-2">
                <input className="w-full border p-2 rounded" value={editItem.question} onChange={e=>setEditItem({...editItem, question:e.target.value})} />
                <div className="grid grid-cols-1 gap-2">
                  {['A','B','C'].map(L=>(
                    <input key={L} className="w-full border p-2 rounded" value={editItem.options[L]} onChange={e=>setEditItem({...editItem, options:{...editItem.options, [L]:e.target.value}})} />
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-sm">Đáp án đúng:</label>
                  <select value={editItem.answer} onChange={e=>setEditItem({...editItem, answer:e.target.value})} className="border p-1 rounded">
                    <option>A</option><option>B</option><option>C</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="px-3 py-1 bg-green-500 text-white rounded" onClick={saveEdit}>Lưu</button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={()=>deleteItem(editItem.id)}>Xóa</button>
                  <button className="px-3 py-1 border rounded" onClick={()=>setShowEditor(false)}>Hủy</button>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
