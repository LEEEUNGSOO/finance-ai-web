// ==============================================================
// 파일   web\src\components\MyCreditPanel.jsx — 내 신용 분석 이력 (서비스 메뉴, 로그인)
// 역할   GET /api/credit/history → Spring CreditService → Oracle CREDIT_HISTORY (내 것만, 최신순)
//        1번 신용 분석 화면의 "내 이력에 저장" 버튼이 쌓은 기록을 표와 선 차트로 본다
// ==============================================================
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { http, errorMessage } from "../api";

export default function MyCreditPanel({ onUse, onGo }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  // ===== 1. 처음 한 번 — 내 이력 불러오기 =====
  useEffect(() => {
    http.get("/api/credit/history")
      .then(({ data }) => { setRows(data); onUse(["JPA", "Oracle"]); })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  // ===== 2. 에러 · 로딩 · 빈 목록 =====
  if (error) return <p className="error">{error}</p>;
  if (!rows) return <p className="muted">불러오는 중...</p>;
  if (rows.length === 0)
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <p>아직 저장한 분석이 없습니다.</p>
        <button className="btn" onClick={() => onGo("credit")}>1번 신용 분석으로 가기</button>
      </div>
    );

  // ===== 3. 차트용 — 오래된 것부터 1회, 2회 … =====
  const chart = [...rows].reverse().map((r, i) => ({ no: i + 1, grade: r.grade }));

  return (
    <>
      <div className="card">
        <p className="card-title">등급 변화 <span className="model-tag">1등급이 가장 좋음</span></p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="no" tickFormatter={(v) => `${v}회`} />
            <YAxis reversed domain={[1, 10]} ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} interval={0} width={30} />
            <Tooltip formatter={(v) => `${v}등급`} labelFormatter={(v) => `${v}번째 저장`} />
            <Line dataKey="grade" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <p className="card-title">저장한 분석 {rows.length}건</p>
        <table className="table">
          <thead><tr><th>저장 시각</th><th className="num">나이</th><th className="num">연소득</th><th className="num">부채비율</th><th className="num">연체</th><th className="num">카드</th><th className="num">연체 확률</th><th className="num">등급</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.createdAt?.replace("T", " ").slice(0, 16)}</td>
                <td className="num">{r.age}</td>
                <td className="num">{r.income.toLocaleString()}만</td>
                <td className="num">{Number(r.debtRatio)}%</td>
                <td className="num">{r.lateCount}회</td>
                <td className="num">{Number(r.cardUsage)}%</td>
                <td className="num">{(Number(r.dnnProb) * 100).toFixed(1)}%</td>
                <td className="num"><b>{r.grade}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}