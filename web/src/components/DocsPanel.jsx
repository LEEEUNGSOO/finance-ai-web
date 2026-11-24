// ==============================================================
// 파일   web\src\components\DocsPanel.jsx — 5번 메뉴 화면
//
// 예시 · 질문 버튼 → ask(q)
//   → post("/rag/ask", {question}) → :8081/api/ai/rag/ask → FastAPI ask()
//   → setResult(data) → 답 · 근거 3개와 유사도 · onUse(data.techs) → RAG 불
// ==============================================================
import { useState } from "react";
import { post } from "../api";

const EXAMPLES = [
  "정기예금을 4개월 만에 해지하면 금리가 어떻게 돼?",
  "대출을 6개월 만에 다 갚으면 수수료 있어?",
  "ATM으로 다른 은행에 이체하면 수수료는?",
  "해외송금 하루 한도는 얼마야?",
];

export default function DocsPanel({ onUse }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function ask(q) {
    if (!q.trim()) return;
    setQuestion(q);
    setLoading(true);
    post("/rag/ask", { question: q })         // 키 question → FastAPI AskRequest.question
      .then((data) => { setResult(data); setError(""); onUse(data.techs); })   // data = ask() 가 return 한 dict
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  return (
    <>
      <div className="card">
        <div className="chips">
          {EXAMPLES.map((ex) => <button key={ex} className="chip" onClick={() => ask(ex)}>{ex}</button>)}
        </div>
        <form className="input-row" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="상품에 대해 물어보세요" />
          <button className="btn" disabled={loading}>{loading ? "찾는 중..." : "질문"}</button>
        </form>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="grid2">
          <div className="card">
            <p className="card-title">AI 답변 <span className="model-tag">{result.model}</span></p>
            <p className="answer">{result.answer}</p>
          </div>
          <div className="card">
            <p className="card-title">근거 문서 — 가까운 조각 3개</p>
            {result.sources.map((s) => (
              <div key={s.source} className="source">
                <div className="source-head"><b>{s.source}</b><span>유사도 {s.score}</span></div>
                <div className="prob-bar"><div style={{ width: `${s.score * 100}%`, background: "#10b981" }} /></div>
                <p className="muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`
        .answer { font-size: 16px; line-height: 1.7; white-space: pre-wrap; margin: 0; }
        .source { margin-bottom: 14px; }
        .source-head { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
        .source-head span { color: #64748b; font-size: 12px; }
        .prob-bar { height: 8px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
        .prob-bar div { height: 100%; }
      `}</style>
    </>
  );
}