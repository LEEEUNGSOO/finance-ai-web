// ==============================================================
// 파일   web\src\components\CreditPanel.jsx — 1번 메뉴 화면
//
// 처음 열 때   get("/credit/history")   → :8081/api/ai/credit/history → FastAPI history()  → 학습 곡선
// 슬라이더     post("/credit", customer) → :8081/api/ai/credit         → FastAPI analyze()  → 게이지 · 막대
// 답을 받으면  setResult(data) → 화면 다시 그림 · onUse(data.techs) → 기술 지도 ML · DNN 불
// Finance AI Web 추가  "내 이력에 저장" → http.post("/api/credit/history", customer)
//                      → Spring CreditService 가 FastAPI 를 다시 불러 등급 계산 → Oracle CREDIT_HISTORY 저장
// ==============================================================
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { get, post, http, errorMessage } from "../api";

// 슬라이더 5개 — 이름은 FastAPI Customer 와 같게
const FIELDS = [
  { key: "age", label: "나이", min: 20, max: 69, step: 1, unit: "세" },
  { key: "income", label: "연소득", min: 1500, max: 12000, step: 100, unit: "만원" },
  { key: "debt_ratio", label: "부채비율", min: 0, max: 100, step: 1, unit: "%" },
  { key: "late_count", label: "연체 횟수 (1년)", min: 0, max: 10, step: 1, unit: "회" },
  { key: "card_usage", label: "카드 사용률", min: 0, max: 100, step: 1, unit: "%" },
];

const pct = (p) => `${(p * 100).toFixed(1)}%`;

export default function CreditPanel({ onUse }) {
  const [customer, setCustomer] = useState({ age: 35, income: 4500, debt_ratio: 55, late_count: 1, card_usage: 70 });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  // 학습 곡선 — 처음 한 번
  useEffect(() => {
    get("/credit/history").then(setHistory).catch((e) => setError(e.message));   // 답 {history, lr_acc, dnn_acc} → history
  }, []);

  // 슬라이더가 멈추면 0.25초 뒤 예측 (움직일 때마다 요청하지 않게)
  useEffect(() => {
    const timer = setTimeout(() => {
      post("/credit", customer)                // customer 객체 → JSON → Spring → FastAPI Customer
        .then((data) => { setResult(data); setError(""); onUse(data.techs); })   // data = analyze() 가 return 한 dict
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [customer]);

  const change = (key, value) => { setSaved(""); setCustomer({ ...customer, [key]: Number(value) }); };

  // 지금 입력으로 분석해서 DB 에 남기기 (Spring → FastAPI → Oracle)
  const save = () =>
    http.post("/api/credit/history", customer)
      .then(({ data }) => { setSaved(`${data.grade}등급으로 저장했습니다 (서비스 > 내 신용 이력)`); onUse(["JPA", "Oracle"]); })
      .catch((e) => setError(errorMessage(e)));

  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="grid2">
        <div className="card">
          <p className="card-title">고객 정보</p>
          {FIELDS.map((f) => (
            <div key={f.key} className="slider">
              <div className="slider-head">
                <span>{f.label}</span>
                <b>{customer[f.key].toLocaleString()}{f.unit}</b>
              </div>
              <input type="range" min={f.min} max={f.max} step={f.step} value={customer[f.key]}
                     onChange={(e) => change(f.key, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="card">
          <p className="card-title">신용 등급 {result && <span className="model-tag">{result.model}</span>}</p>
          {result && (
            <>
              <Gauge grade={result.grade} />
              <p className="gauge-text"><b>{result.grade}등급</b> · 연체 확률 {pct(result.dnn_prob)}</p>
              <div className="whatif">
                <span>부채비율을 {customer.debt_ratio}% → {result.what_if.debt_ratio}% 로 줄이면?</span>
                <b>{result.grade}등급 → {result.what_if.grade}등급</b>
                <button className="btn" onClick={() => change("debt_ratio", result.what_if.debt_ratio)}>적용</button>
              </div>
              <div className="save-row">
                <button className="btn ghost" onClick={save}>내 이력에 저장</button>
                {saved && <span className="ok-text">{saved}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <p className="card-title">ML vs DNN — 연체 확률</p>
          {result && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[{ name: "ML (로지스틱)", prob: result.lr_prob }, { name: "DNN", prob: result.dnn_prob }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={pct} domain={[0, 1]} />
                <Tooltip formatter={pct} />
                <Bar dataKey="prob" name="연체 확률" radius={[8, 8, 0, 0]}>
                  <Cell fill="#60a5fa" />
                  <Cell fill="#10b981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <p className="card-title">
            DNN 학습 곡선
            {history && <span className="model-tag">시험 정확도 ML {pct(history.lr_acc)} · DNN {pct(history.dnn_acc)}</span>}
          </p>
          {history && (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={history.history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="epoch" />
                <YAxis yAxisId="loss" />
                <YAxis yAxisId="acc" orientation="right" domain={[0.5, 1]} tickFormatter={pct} />
                <Tooltip />
                <Legend />
                <Line yAxisId="loss" dataKey="loss" name="loss" stroke="#f97316" dot={false} strokeWidth={2} />
                <Line yAxisId="acc" dataKey="acc" name="정확도" stroke="#10b981" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <style>{CSS}</style>
    </>
  );
}

// 반원 게이지 — 1등급(초록) ~ 10등급(빨강)
function Gauge({ grade }) {
  const colors = ["#059669", "#10b981", "#34d399", "#a3e635", "#facc15", "#fbbf24", "#fb923c", "#f97316", "#ef4444", "#dc2626"];
  const arc = (i) => {
    const a1 = Math.PI * (1 - i / 10), a2 = Math.PI * (1 - (i + 1) / 10);
    const p = (a, r) => `${100 + r * Math.cos(a)} ${100 - r * Math.sin(a)}`;
    return `M ${p(a1, 90)} A 90 90 0 0 1 ${p(a2, 90)} L ${p(a2, 60)} A 60 60 0 0 0 ${p(a1, 60)} Z`;
  };
  const angle = Math.PI * (1 - (grade - 0.5) / 10);
  return (
    <svg viewBox="0 0 200 110" className="gauge">
      {colors.map((c, i) => <path key={i} d={arc(i)} fill={c} opacity={i + 1 === grade ? 1 : 0.35} />)}
      <line x1="100" y1="100" x2={100 + 70 * Math.cos(angle)} y2={100 - 70 * Math.sin(angle)}
            stroke="#0f172a" strokeWidth="4" strokeLinecap="round" style={{ transition: "all .4s" }} />
      <circle cx="100" cy="100" r="7" fill="#0f172a" />
    </svg>
  );
}

const CSS = `
.slider { margin-bottom: 14px; }
.slider-head { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; }
.slider input { width: 100%; accent-color: #10b981; }
.gauge { width: 100%; max-width: 320px; display: block; margin: 0 auto; }
.gauge-text { text-align: center; font-size: 18px; margin: 6px 0 14px; }
.gauge-text b { font-size: 26px; }
.whatif { display: flex; align-items: center; gap: 10px; background: #ecfdf5; border-radius: 10px; padding: 10px 14px; font-size: 14px; }
.whatif b { margin-left: auto; color: #047857; white-space: nowrap; }
.whatif .btn { white-space: nowrap; }
`;