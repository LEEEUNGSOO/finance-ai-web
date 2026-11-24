// ==============================================================
// 파일   web\src\components\ChatPanel.jsx — 6번 메뉴 화면
//
// 예시 · 보내기 → send(text)
//   → 내 말풍선 먼저 추가
//   → await post("/agent", {message}) → :8081/api/ai/agent → FastAPI chat()
//   → AI 말풍선 추가 (answer · path · steps) · onUse(data.techs) → 기술 지도
// 다른 화면은 .then() 을 썼고, 여기는 같은 일을 async · await · try/catch 로 썼다
// Finance AI Web 추가  도구 bank_products(Oracle 상품 DB) · 예시 1줄 · 화면 오른쪽 아래 팝업 챗봇도 같은 /agent 를 쓴다
// ==============================================================
import { useState } from "react";
import { post } from "../api";

const EXAMPLES = [
  "100달러 보내면 원화로 얼마야?",
  "연소득 4500만원, 부채비율 60%면 신용 등급이 어때?",
  "대출을 중간에 갚으면 수수료가 있어?",
  "'한국은행 기준금리 동결' 뉴스는 좋은 쪽이야?",
  "금리 높은 적금 추천해 줘",
];
export const TOOL_NAME = { exchange: "환율 계산", credit_check: "신용 분석", search_products: "상품 문서 검색", news_sentiment: "뉴스 분석", bank_products: "상품 DB 조회" };

export default function ChatPanel({ onUse }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text) {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const data = await post("/agent", { message: text });   // 키 message → FastAPI AgentRequest.message. 답이 올 때까지 기다림
      setMessages((prev) => [...prev, { role: "ai", content: data.answer, path: data.path, steps: data.steps, model: data.model }]);
      onUse(data.techs);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", content: "요청 실패: " + e.message, path: [], steps: [] }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="card">
        <div className="chips">
          {EXAMPLES.map((ex) => <button key={ex} className="chip" disabled={loading} onClick={() => send(ex)}>{ex}</button>)}
        </div>

        <div className="chat">
          {messages.length === 0 && <p className="muted" style={{ textAlign: "center", marginTop: 60 }}>위 예시를 누르거나 아래에 질문을 입력하세요.</p>}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="bubble">{m.content}</div>
              {m.role === "ai" && m.path?.length > 0 && (
                <div className="path">
                  {m.path.map((p, j) => (
                    <span key={j}>{j > 0 && <i>→</i>}<em>{p === "tools" ? `tools (${m.steps.map((s) => TOOL_NAME[s.tool] || s.tool).join(", ")})` : p}</em></span>
                  ))}
                </div>
              )}
              {m.steps?.length > 0 && (
                <details className="steps">
                  <summary>실행한 도구 {m.steps.length}개</summary>
                  {m.steps.map((s, j) => (
                    <pre key={j}>{`${s.tool}(${JSON.stringify(s.args)})\n→ ${JSON.stringify(s.result).slice(0, 400)}`}</pre>
                  ))}
                </details>
              )}
            </div>
          ))}
          {loading && <div className="msg ai"><div className="bubble muted">생각 중...</div></div>}
        </div>

        <form className="input-row" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="무엇이든 물어보세요" />
          <button className="btn" disabled={loading}>보내기</button>
          <button type="button" className="btn ghost" onClick={() => setMessages([])}>지우기</button>
        </form>
      </div>
      <style>{CSS}</style>
    </>
  );
}

const CSS = `
.chat { min-height: 360px; max-height: 56vh; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding: 8px 2px 16px; }
.msg { display: flex; flex-direction: column; max-width: 78%; }
.msg.user { align-self: flex-end; align-items: flex-end; }
.bubble { padding: 12px 16px; border-radius: 14px; line-height: 1.6; white-space: pre-wrap; }
.user .bubble { background: #10b981; color: #fff; }
.ai .bubble { background: #f1f5f9; }
.path { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; font-size: 12px; }
.path em { font-style: normal; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 6px; font-weight: 700; }
.path i { font-style: normal; color: #94a3b8; margin: 0 4px; }
.steps { margin-top: 6px; font-size: 12px; color: #64748b; }
.steps pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; white-space: pre-wrap; font-size: 11px; }
`;