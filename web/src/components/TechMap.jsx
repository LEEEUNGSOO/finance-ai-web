// ==============================================================
// 파일   web\src\components\TechMap.jsx — 오른쪽 기술 지도. 실행된 기술에 불이 들어온다
// 불이 켜지는 길   FastAPI 답의 techs → Panel 의 onUse(techs) → App 의 used → 여기 used.includes(t)
// Finance AI Web 추가  "풀스택" 그룹 5개 — Spring 응답에는 techs 가 없어서 화면(LoginPanel 등)이 직접 onUse 로 켠다
//                      Oracle 은 챗봇이 bank_products 도구를 쓰면 FastAPI techs 로도 켜진다
// 이름이 FastAPI techs 와 글자까지 같아야 불이 들어옴 ("Hugging Face" · "Tool Calling" 띄어쓰기 포함)
// ==============================================================

// ===== 1. 기술 이름 22개 (그룹 5개) =====
const GROUPS = [
  { name: "데이터 분석 (56시간)", items: ["Pandas", "Chart"] },
  { name: "머신러닝 · 딥러닝", items: ["ML", "DNN", "CNN", "RNN", "LSTM"] },
  { name: "자연어 · 모델", items: ["Transformer", "Attention", "BERT", "Hugging Face", "Fine-tuning", "LoRA"] },
  { name: "LLM 서비스", items: ["RAG", "LangChain", "LangGraph", "Tool Calling"] },
  { name: "풀스택 (Finance AI Web)", items: ["Spring Security", "JWT", "Redis", "JPA", "Oracle"] },
];
const TOTAL = GROUPS.reduce((n, g) => n + g.items.length, 0);

// ===== 2. 화면 — used 에 있는 이름만 초록 불 =====
export default function TechMap({ used, onReset }) {
  const count = used.filter((t) => GROUPS.some((g) => g.items.includes(t))).length;

  return (
    <aside className="tech">
      <h3>기술 지도</h3>
      <p className="tech-count">
        {count} / {TOTAL} 실행됨
        {count > 0 && (
          <button className="chip" style={{ marginLeft: 8, padding: "2px 8px" }} onClick={onReset}>초기화</button>
        )}
      </p>
      {GROUPS.map((g) => (
        <div key={g.name}>
          <p className="tech-group">{g.name}</p>
          <div className="tech-list">
            {g.items.map((t) => (
              <div key={t} className={used.includes(t) ? "tech-item on" : "tech-item"}>
                <span className="dot" />
                {t}
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}