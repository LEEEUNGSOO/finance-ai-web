// ==============================================================
// 파일   web\src\components\AnalysisPanel.jsx — 대시보드 카드 아래 고객 현황 차트
//
// 처음 열 때   get("/analysis") → :8081/api/ai/analysis → FastAPI analysis()
// 답을 받으면  setData(d) → 차트 4개 · onUse(d.techs) → 기술 지도 Pandas · Chart 불
// ==============================================================
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { get } from "../api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];
const pct = (v) => `${(v * 100).toFixed(1)}%`;

// 대시보드 분석 — 56시간 6일차 분석 화면과 같은 모양 (카드 · 원 차트 · 막대 · 표) + 선 차트
export default function AnalysisPanel({ onUse }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    get("/analysis")                          // 대시보드가 뜨면 한 번
      .then((d) => { setData(d); onUse(d.techs); })   // d = analysis() 가 return 한 dict
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">분석 중...</p>;

  const s = data.summary;

  return (
    <>
      <p className="section-title">고객 현황 — 56시간 pandas · 시각화 <span className="model-tag">{data.model}</span></p>
      <div className="stats">
        <div className="stat"><div className="stat-label">고객 수</div><div className="stat-value">{s.customers.toLocaleString()}명</div></div>
        <div className="stat"><div className="stat-label">연체율</div><div className="stat-value" style={{ color: "#ef4444" }}>{pct(s.default_rate)}</div></div>
        <div className="stat"><div className="stat-label">평균 연소득</div><div className="stat-value">{s.avg_income.toLocaleString()}만원</div></div>
        <div className="stat"><div className="stat-label">평균 부채비율</div><div className="stat-value">{s.avg_debt}%</div></div>
      </div>

      <div className="grid2">
        <div className="card">
          <p className="card-title">연소득 구간별 고객 비율</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.by_income} dataKey="count" nameKey="group" outerRadius={85} innerRadius={45}
                   label={(e) => `${e.group} ${(e.percent * 100).toFixed(0)}%`}>
                {data.by_income.map((d, i) => <Cell key={d.group} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v.toLocaleString()}명`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="card-title">연체 횟수별 연체율</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.by_late}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="group" />
              <YAxis tickFormatter={pct} />
              <Tooltip formatter={pct} />
              <Bar dataKey="rate" name="연체율" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <p className="card-title">부채비율이 오르면 연체율은?</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.by_debt}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="group" />
              <YAxis tickFormatter={pct} />
              <Tooltip formatter={pct} />
              <Line dataKey="rate" name="연체율" stroke="#ef4444" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="card-title">연령대별 요약</p>
          <table className="table">
            <thead><tr><th>연령대</th><th className="num">고객 수</th><th className="num">평균 연소득</th><th className="num">연체율</th></tr></thead>
            <tbody>
              {data.by_age.map((r) => (
                <tr key={r.group}>
                  <td>{r.group}</td>
                  <td className="num">{r.count.toLocaleString()}명</td>
                  <td className="num">{r.income.toLocaleString()}만원</td>
                  <td className="num">{pct(r.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{CSS}</style>
    </>
  );
}

const CSS = `
.section-title { margin: 28px 0 12px; font-size: 18px; font-weight: 800; display: flex; gap: 10px; align-items: center; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th, .table td { padding: 9px 6px; border-bottom: 1px solid #f1f5f9; text-align: left; }
.table th { color: #64748b; font-weight: 500; font-size: 13px; }
.num { text-align: right !important; font-variant-numeric: tabular-nums; }
`;