// ==============================================================
// 파일   web\src\App.jsx — 화면 전체 틀 (Lab App.jsx + 풀스택 메뉴)
// 역할   왼쪽 메뉴 · 가운데 화면 · 오른쪽 기술 지도 · 오른쪽 아래 팝업 챗봇
//
//   view 상태 하나로 화면을 바꾼다 (라우터 없음, Lab 과 같은 방식)
//     "home"                    대시보드 (Lab 첫 화면 + 분석 차트)        누구나
//     credit·digit·fx·news·docs·chat   AI 메뉴 1~6 (Lab 그대로)          로그인
//     finance                   금융상품 검색                              누구나
//     board                     토론방                                     보기 누구나 / 쓰기 로그인
//     mycredit                  내 신용 이력                               로그인
//     login                     로그인 · 회원가입
//
//   로그인이 필요한 메뉴를 누르면 → login 화면 → 성공하면 원래 가려던 메뉴로 (next)
//   used = 지금까지 켜진 기술 이름 목록 → TechMap 에 불
// ==============================================================
import { useEffect, useState } from "react";
import AnalysisPanel from "./components/AnalysisPanel";
import CreditPanel from "./components/CreditPanel";
import DigitPanel from "./components/DigitPanel";
import FxPanel from "./components/FxPanel";
import NewsPanel from "./components/NewsPanel";
import DocsPanel from "./components/DocsPanel";
import ChatPanel from "./components/ChatPanel";
import TechMap from "./components/TechMap";
import LoginPanel from "./components/LoginPanel";
import FinancePanel from "./components/FinancePanel";
import BoardPanel from "./components/BoardPanel";
import MyCreditPanel from "./components/MyCreditPanel";
import ChatbotPopup from "./components/ChatbotPopup";
import { useAuth } from "./auth/AuthContext";
import { setLogoutHandler } from "./api";
import "./App.css";

// ----- AI 메뉴 6개 (Lab 과 같음) -----
const MENUS = [
  { id: "credit", no: 1, title: "신용 분석", tech: "ML · DNN", desc: "슬라이더로 고객 정보를 바꾸면 등급이 바로 바뀝니다", Panel: CreditPanel },
  { id: "digit", no: 2, title: "손글씨 숫자", tech: "CNN", desc: "마우스로 쓴 숫자를 CNN 이 알아봅니다", Panel: DigitPanel },
  { id: "fx", no: 3, title: "환율 예측", tech: "RNN · LSTM", desc: "지난 환율로 내일 환율을 예측합니다", Panel: FxPanel },
  { id: "news", no: 4, title: "뉴스 감성", tech: "BERT · LoRA", desc: "금융 뉴스 한 줄이 좋은 소식인지 판단합니다", Panel: NewsPanel },
  { id: "docs", no: 5, title: "금융 문서 상담", tech: "RAG", desc: "상품설명서에서 근거를 찾아 답합니다", Panel: DocsPanel },
  { id: "chat", no: 6, title: "통합 AI 상담", tech: "LangGraph · Tool Calling", desc: "질문에 맞는 도구를 골라 실행합니다", Panel: ChatPanel },
];

// ----- 풀스택 서비스 메뉴 3개 (Finance AI Web 에서 추가) -----
const SERVICES = [
  { id: "finance", icon: "₩", title: "금융상품 검색", tech: "JPA · Oracle", desc: "예금·적금·대출·펀드·카드를 DB 에서 찾습니다", Panel: FinancePanel, login: false },
  { id: "board", icon: "✎", title: "토론방", tech: "CRUD · JPA", desc: "글·댓글을 쓰고 고치고 지웁니다", Panel: BoardPanel, login: false },
  { id: "mycredit", icon: "★", title: "내 신용 이력", tech: "Spring → FastAPI → Oracle", desc: "저장한 신용 분석 기록을 봅니다", Panel: MyCreditPanel, login: true },
];

const ALL = [...MENUS.map((m) => ({ ...m, login: true })), ...SERVICES];

export default function App() {
  const { user, logout, forget } = useAuth();
  const [view, setView] = useState("home");
  const [next, setNext] = useState("home");          // 로그인 후 갈 곳
  const [reason, setReason] = useState("");
  const [used, setUsed] = useState([]);

  const onUse = (techs = []) => setUsed((prev) => [...new Set([...prev, ...techs])]);

  // Refresh Token 까지 만료되면 api.js 가 이 함수를 부른다
  useEffect(() => {
    setLogoutHandler(() => { forget(); needLogin("로그인이 만료되었습니다. 다시 로그인하세요", "home"); });
  }, []);

  function needLogin(msg, target) {
    setReason(msg);
    setNext(target ?? view);
    setView("login");
  }

  function go(id) {
    const menu = ALL.find((m) => m.id === id);
    if (menu?.login && !user) return needLogin(`'${menu.title}' 은(는) 로그인 후 쓸 수 있습니다`, id);
    setView(id);
  }

  const current = ALL.find((m) => m.id === view);

  return (
    <div className="app">
      {/* ---------- 왼쪽 메뉴 ---------- */}
      <nav className="side">
        <div className="logo" onClick={() => setView("home")}>
          <div className="logo-mark">FW</div>
          <div><b>Finance AI Web</b><small>Spring · FastAPI · React</small></div>
        </div>

        <p className="side-label">AI 메뉴</p>
        {MENUS.map((m) => (
          <button key={m.id} className={view === m.id ? "nav active" : "nav"} onClick={() => go(m.id)}>
            <span className="nav-no">{m.no}</span>{m.title}{!user && <span className="lock">🔒</span>}
          </button>
        ))}

        <p className="side-label">서비스</p>
        {SERVICES.map((m) => (
          <button key={m.id} className={view === m.id ? "nav active" : "nav"} onClick={() => go(m.id)}>
            <span className="nav-no">{m.icon}</span>{m.title}{m.login && !user && <span className="lock">🔒</span>}
          </button>
        ))}

        <div className="side-foot">
          {user ? (
            <div className="me">
              <span><b>{user.nickname}</b> 님</span>
              <button className="chip" onClick={() => { logout(); setView("home"); }}>로그아웃</button>
            </div>
          ) : (
            <button className="btn" style={{ width: "100%" }} onClick={() => needLogin("", "home")}>로그인 · 회원가입</button>
          )}
          <p>React 5174 → Spring 8081 → FastAPI 8001</p>
        </div>
      </nav>

      {/* ---------- 가운데 화면 ---------- */}
      <main className="main">
        {view === "home" && (
          <>
            <section className="hero">
              <p className="eyebrow">Finance AI Lab + Full-stack</p>
              <h1>AI 금융 서비스를 웹 서비스로</h1>
              <p>AI 메뉴 6개는 FastAPI, 회원·토론방·금융상품·이력은 Spring + Oracle + Redis. 오른쪽 아래 AI 버튼으로 언제든 상담하세요.</p>
            </section>

            <p className="section-title">AI 메뉴 <span className="muted">로그인 필요</span></p>
            <div className="cards">
              {MENUS.map((m) => (
                <button key={m.id} className={`menu-card c${m.no}`} onClick={() => go(m.id)}>
                  <span className="card-no">0{m.no}</span><b>{m.title}</b><span className="card-tech">{m.tech}</span><span className="card-desc">{m.desc}</span>
                </button>
              ))}
            </div>

            <p className="section-title">서비스 <span className="muted">Spring · JPA · Oracle</span></p>
            <div className="cards">
              {SERVICES.map((m) => (
                <button key={m.id} className="menu-card svc" onClick={() => go(m.id)}>
                  <span className="card-no">{m.icon}</span><b>{m.title}</b><span className="card-tech">{m.tech}</span><span className="card-desc">{m.desc}</span>
                </button>
              ))}
            </div>

            <p className="section-title">데이터 분석 <span className="muted">Pandas · 누구나</span></p>
            <AnalysisPanel onUse={onUse} />
          </>
        )}

        {view === "login" && (
          <>
            <div className="page-head"><span className="page-no">🔑</span><div><h2>로그인 · 회원가입</h2><p>Spring Security · JWT · Redis</p></div></div>
            <LoginPanel onUse={onUse} reason={reason} onDone={() => { setReason(""); setView(next); }} />
          </>
        )}

        {current && (
          <>
            <div className="page-head">
              <span className="page-no">{current.no ? `0${current.no}` : current.icon}</span>
              <div><h2>{current.title}</h2><p>{current.tech} — {current.desc}</p></div>
            </div>
            <current.Panel key={current.id} onUse={onUse} onGo={go} onNeedLogin={(msg) => needLogin(msg, current.id)} />
          </>
        )}
      </main>

      {/* ---------- 오른쪽 기술 지도 ---------- */}
      <TechMap used={used} onReset={() => setUsed([])} />

      {/* ---------- 오른쪽 아래 팝업 챗봇 ---------- */}
      <ChatbotPopup onUse={onUse} onNeedLogin={(msg) => needLogin(msg, view)} />
    </div>
  );
}