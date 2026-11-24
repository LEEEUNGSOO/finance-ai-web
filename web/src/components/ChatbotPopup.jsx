// ==============================================================
// 파일   web\src\components\ChatbotPopup.jsx — 오른쪽 아래 둥근 버튼으로 여는 팝업 챗봇
// 역할   어느 화면에 있든 바로 물어볼 수 있는 상담 창. 뒤에서 하는 일은 6번 통합 AI 상담과 똑같다
//
//   보내기 → post("/agent", {message})            api.js (토큰 자동)
//     → Spring /api/ai/agent (로그인 확인) → FastAPI agent.py
//     → LangGraph  route → (도구 필요하면) tools → answer
//                  도구 5개: exchange · credit_check · search_products(RAG) · news_sentiment · bank_products(Oracle)
//     → {answer, path, steps, techs} → 말풍선 + 어떤 도구를 썼는지 이름표 · onUse(techs) → 기술 지도
// 로그인 전이면 버튼은 보이지만 창 안에 "로그인하기" 만 나온다
// ==============================================================
import { useEffect, useRef, useState } from "react";
import { post } from "../api";
import { useAuth } from "../auth/AuthContext";
import { TOOL_NAME } from "./ChatPanel";

const SUGGESTIONS = ["금리 높은 적금 추천해 줘", "예금 중도해지하면 이자는?", "100달러는 원화로 얼마야?"];

export default function ChatbotPopup({ onUse, onNeedLogin }) {
  const { user } = useAuth();
  // ===== 1. 상태 — 열림 · 입력 · 로딩 · 대화 목록 =====
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "안녕하세요! Finance AI 상담봇입니다.\n상품 추천, 약관, 환율, 신용, 뉴스까지 물어보세요." },
  ]);
  const bottomRef = useRef(null);

  // ===== 2. 새 말풍선이 생기면 맨 아래로 스크롤 =====
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, open]);

  // ===== 3. 보내기 — 내 말풍선 → post("/agent") → AI 말풍선 + 쓴 도구 이름 =====
  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const data = await post("/agent", { message: q });
      setMessages((m) => [...m, { role: "bot", text: data.answer, tools: (data.steps || []).map((s) => TOOL_NAME[s.tool] || s.tool) }]);
      onUse(data.techs || []);
    } catch (e) {
      setMessages((m) => [...m, { role: "bot", text: e.message, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  // ===== 4. 화면 — 열려 있으면 창, 항상 오른쪽 아래 둥근 버튼 =====
  return (
    <>
      {open && (
        <div className="cb-panel">
          <div className="cb-head">
            <div><b>AI 금융 상담</b><span>LangGraph · Tool Calling · RAG</span></div>
            <button className="cb-x" onClick={() => setOpen(false)} aria-label="닫기">×</button>
          </div>

          {!user ? (
            <div className="cb-login">
              <p>챗봇은 로그인 후 쓸 수 있습니다.</p>
              <button className="btn" onClick={() => { setOpen(false); onNeedLogin("챗봇은 로그인 후 쓸 수 있습니다"); }}>로그인하기</button>
            </div>
          ) : (
            <>
              <div className="cb-body">
                {messages.map((m, i) => (
                  <div key={i} className={`cb-row ${m.role}`}>
                    <div className={`cb-bubble ${m.role} ${m.error ? "err" : ""}`}>
                      {m.tools?.length > 0 && <div className="cb-tools">{m.tools.map((t) => <span key={t}>{t}</span>)}</div>}
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && <div className="cb-row bot"><div className="cb-bubble bot typing"><i /><i /><i /></div></div>}
                <div ref={bottomRef} />
              </div>
              {messages.length === 1 && (
                <div className="cb-suggest">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}</div>
              )}
              <form className="cb-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="질문을 입력하세요" maxLength={500} />
                <button disabled={loading || !input.trim()}>전송</button>
              </form>
            </>
          )}
        </div>
      )}
      <button className={`cb-fab ${open ? "on" : ""}`} onClick={() => setOpen(!open)} aria-label="챗봇 열기">{open ? "×" : "AI"}</button>
    </>
  );
}