// ==============================================================
// 파일   web\src\components\FxPanel.jsx — 3번 메뉴 화면
//
// 처음 열 때 · 버튼   setDays(120) → useEffect → get("/fx?days=120")
//   → :8081/api/ai/fx?days=120 → FastAPI forecast(days=120)
//   → setData(d) → 카드 4개 · 선 차트 · onUse(d.techs) → RNN · LSTM 불
// ==============================================================
import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { get } from "../api";

const won = (v) => `${Number(v).toLocaleString()}원`;

export default function FxPanel({ onUse }) {
  const [days, setDays] = useState(60);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    get(`/fx?days=${days}`)                   // GET 은 body 가 없어서 값을 주소 ? 뒤에 붙임
      .then((d) => { setData(d); setError(""); onUse(d.techs); })   // d = forecast() 가 return 한 dict
      .catch((e) => setError(e.message));
  }, [days]);                                 // days 가 바뀔 때마다 다시 요청

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">불러오는 중...</p>;

  // 배열 네 개 → 차트용 [{date, actual, rnn, lstm}, ...]
  const rows = data.dates.map((d, i) => ({ date: d.slice(5), actual: data.actual[i], rnn: data.rnn[i], lstm: data.lstm[i] }));
  const today = data.actual[data.actual.length - 1];

  return (
    <>
      <div className="fx-banner">
        <span>USD/KRW 환율 기준 시각 <b>{data.base_time}</b></span>
        <span className="muted">수업용 가상 데이터</span>
      </div>

      <div className="stats">
        <div className="stat"><div className="stat-label">오늘 환율</div><div className="stat-value">{won(today)}</div></div>
        <div className="stat"><div className="stat-label">내일 예측 · RNN</div><div className="stat-value" style={{ color: "#f97316" }}>{won(data.rnn_next)}</div></div>
        <div className="stat"><div className="stat-label">내일 예측 · LSTM</div><div className="stat-value" style={{ color: "#10b981" }}>{won(data.lstm_next)}</div></div>
        <div className="stat"><div className="stat-label">평균 오차 RNN / LSTM</div><div className="stat-value">{data.rnn_mae} / {data.lstm_mae}</div></div>
      </div>

      <div className="card">
        <p className="card-title">
          실제값 vs 예측값
          <span>
            {[30, 60, 120].map((d) => (
              <button key={d} className={d === days ? "btn" : "btn ghost"} style={{ marginLeft: 6 }} onClick={() => setDays(d)}>{d}일</button>
            ))}
          </span>
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" minTickGap={24} />
            <YAxis domain={["dataMin - 10", "dataMax + 10"]} tickFormatter={(v) => Math.round(v).toLocaleString()} width={60} />
            <Tooltip formatter={won} />
            <Legend />
            <Line dataKey="actual" name="실제 환율" stroke="#0f172a" strokeWidth={2.5} dot={false} />
            <Line dataKey="rnn" name="RNN 예측" stroke="#f97316" strokeDasharray="5 4" dot={false} />
            <Line dataKey="lstm" name="LSTM 예측" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="muted">{data.model}</p>
      </div>
      <style>{`.fx-banner { display: flex; justify-content: space-between; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 10px 16px; margin-bottom: 14px; font-size: 14px; }`}</style>
    </>
  );
}