// src/utils/helpers.js

export function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffleQuestionOptions(q) {
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

export function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}