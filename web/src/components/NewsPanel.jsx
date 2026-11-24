// ==============================================================
// 파일   web\src\components\NewsPanel.jsx — 4번 메뉴 화면
//
// 예시 · 분석 버튼 → analyze(t)
//   → post("/news", {text}) → :8081/api/ai/news → FastAPI news()
//   → setResult(data) → ① 토큰 ② 진한 단어 ③ 확률 막대 ④ LoRA 표 · onUse(data.techs) → 6개 불
// 처음 한 번은 FastAPI 가 모델을 불러오느라 답이 늦다 → loading 으로 "분석 중..."
// ==============================================================
import { useState } from "react";
import { post } from "../api";

const EXAMPLES = [
  "한국은행이 기준금리를 동결했다",
  "A은행 3분기 순이익 12% 증가, 비이자이익이 실적 견인",
  "고금리 장기화로 가계부채 부담 커져… 연체율 상승",
];
const COLORS = { 긍정: "#10b981", 부정: "#ef4444", 중립: "#64748b" };

export default function NewsPanel({ onUse }) {
  const [text, setText] = useState(EXAMPLES[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function analyze(t) {
    setText(t);
    setLoading(true);
    post("/news", { text: t })                // 키 text → FastAPI NewsRequest.text
      .then((data) => { setResult(data); setError(""); onUse(data.techs); })   // data = news() 가 return 한 dict
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  return (
    <>
      <div className="card">
        <div className="chips">
          {EXAMPLES.map((ex) => <button key={ex} className="chip" onClick={() => analyze(ex)}>{ex}</button>)}
        </div>
        <div className="input-row">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="뉴스 문장" />
          <button className="btn" disabled={loading} onClick={() => analyze(text)}>{loading ? "분석 중..." : "분석"}</button>
        </div>
        {loading && <p className="muted">처음 한 번은 모델을 불러오느라 시간이 걸립니다.</p>}
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <>
          <div className="card">
            <p className="card-title">① Transformer — 문장을 토큰으로 <span className="model-tag">{result.model}</span></p>
            <div className="tokens">
              {result.tokens.map((t, i) => <span key={i} className="token">{t.token}</span>)}
            </div>
            <p className="card-title" style={{ marginTop: 16 }}>② Attention — BERT 가 많이 본 단어</p>
            <div className="tokens">
              {result.tokens.map((t, i) => (
                <span key={i} className="token" style={{ background: `rgba(124, 58, 237, ${0.08 + t.weight * 0.8})`, color: t.weight > 0.5 ? "#fff" : "#1f2937" }}>
                  {t.token}
                </span>
              ))}
            </div>
          </div>

          <div className="grid2">
            <div className="card">
              <p className="card-title">③ BERT · Hugging Face — 감성 분석</p>
              <p className="news-label" style={{ color: COLORS[result.label] }}>{result.label}</p>
              {Object.entries(result.probs).map(([k, v]) => (
                <div key={k} className="prob-row">
                  <span>{k}</span>
                  <div className="prob-bar"><div style={{ width: `${v * 100}%`, background: COLORS[k] || "#94a3b8" }} /></div>
                  <b>{(v * 100).toFixed(1)}%</b>
                </div>
              ))}
            </div>

            <div className="card">
              <p className="card-title">④ Fine-tuning · LoRA — 4일차 학습 결과</p>
              <table className="table">
                <thead><tr><th>방식</th><th className="num">학습 파라미터</th><th className="num">저장</th><th className="num">정확도</th></tr></thead>
                <tbody>
                  {result.training.map((r) => (
                    <tr key={r.method}>
                      <td>{r.method}</td>
                      <td className="num">{r.trainable.toLocaleString()}</td>
                      <td className="num">{r.size}</td>
                      <td className="num">{(r.accuracy * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <style>{CSS}</style>
    </>
  );
}

const CSS = `
.tokens { display: flex; flex-wrap: wrap; gap: 6px; }
.token { padding: 6px 10px; border-radius: 8px; background: #f1f5f9; font-size: 14px; font-family: Consolas, monospace; }
.news-label { font-size: 34px; font-weight: 800; margin: 0 0 12px; }
.prob-row { display: grid; grid-template-columns: 40px 1fr 60px; gap: 10px; align-items: center; margin-bottom: 8px; font-size: 14px; }
.prob-bar { height: 12px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
.prob-bar div { height: 100%; border-radius: 6px; transition: width .4s; }
.prob-row b { text-align: right; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th, .table td { padding: 9px 6px; border-bottom: 1px solid #f1f5f9; text-align: left; }
.table th { color: #64748b; font-weight: 500; font-size: 13px; }
.num { text-align: right !important; font-variant-numeric: tabular-nums; }
`;