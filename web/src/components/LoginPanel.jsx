// ==============================================================
// 파일   web\src\components\LoginPanel.jsx — 로그인 · 회원가입 화면 (탭 2개)
// 역할   로그인   POST /api/auth/login  → 토큰 2개를 localStorage 에 → 원래 가려던 메뉴로 이동
//        회원가입 POST /api/auth/signup → 성공하면 로그인 탭으로
// 화면   왼쪽 소개(초록) · 오른쪽 입력 폼 — 좌우로 나눈 카드 하나
// 기술 지도  로그인 성공 → Spring Security · JWT · Redis 불 (Refresh Token 이 Redis 에 저장되므로)
// ==============================================================
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { errorMessage } from "../api";

export default function LoginPanel({ onUse, onDone, reason }) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", nickname: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ===== 1. 입력값 하나로 관리 — name 속성이 form 의 키 =====
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ===== 2. 제출 — 로그인이면 토큰 받고 원래 메뉴로, 가입이면 로그인 탭으로 =====
  async function submit(e) {
    e.preventDefault();
    setError(""); setMsg(""); setLoading(true);
    try {
      if (tab === "login") {
        await login(form.username, form.password);
        onUse(["Spring Security", "JWT", "Redis"]);
        onDone();
      } else {
        await signup(form);
        setMsg("가입 완료! 이제 로그인하세요.");
        setTab("login");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ===== 3. 화면 — 왼쪽 소개 · 오른쪽 탭 · 입력칸 · 에러 =====
  return (
    <div className="auth-wrap">
      <div className="auth-split">
        {/* 왼쪽 — 서비스 소개 */}
        <div className="auth-brand">
          <div className="auth-logo">FW</div>
          <h2>Finance AI Web</h2>
          <p className="auth-sub">AI 금융 서비스를 웹 서비스로</p>
          <ul>
            <li>AI 메뉴 6개 — 신용 · 손글씨 · 환율 · 뉴스 · 문서 · 상담</li>
            <li>토론방 · 금융상품 검색 · 내 신용 이력</li>
            <li>JWT · Redis 로 안전한 로그인</li>
          </ul>
          <p className="auth-stack">React · Spring Boot · FastAPI · Oracle</p>
        </div>

        {/* 오른쪽 — 로그인 · 회원가입 */}
        <div className="auth-form">
          {reason && <p className="notice">{reason}</p>}
          <div className="tabs">
            <button className={tab === "login" ? "tab on" : "tab"} onClick={() => setTab("login")}>로그인</button>
            <button className={tab === "signup" ? "tab on" : "tab"} onClick={() => setTab("signup")}>회원가입</button>
          </div>
          <form onSubmit={submit} className="form">
            <label>아이디<input name="username" value={form.username} onChange={change} placeholder="4~20자" required /></label>
            <label>비밀번호<input name="password" type="password" value={form.password} onChange={change} placeholder="4~30자" required /></label>
            {tab === "signup" && (
              <label>닉네임<input name="nickname" value={form.nickname} onChange={change} placeholder="토론방에 보일 이름" required /></label>
            )}
            {error && <p className="error">{error}</p>}
            {msg && <p className="ok">{msg}</p>}
            <button className="btn" disabled={loading}>{tab === "login" ? "로그인" : "가입하기"}</button>
          </form>
          <p className="muted auth-note">
            로그인하면 Access Token(30분)과 Refresh Token(7일)을 받습니다. Access 가 만료되면 화면이 알아서 재발급합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
