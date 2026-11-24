// ==============================================================
// 파일   web\src\components\FinancePanel.jsx — 금융상품 검색 (서비스 메뉴, 로그인 없이)
// 역할   GET /api/finance/products?type=SAVING&keyword=청년 → Spring FinanceService → JPA JPQL → Oracle
//        GET /api/finance/rates                              → 오늘 환율 표
// 기술 지도  검색 성공 → JPA · Oracle 불
// 챗봇의 bank_products 도구도 똑같은 주소를 부른다 → 여기 결과와 챗봇 추천이 같다
// ==============================================================
import { useEffect, useState } from "react";
import { http, errorMessage } from "../api";

const TYPES = [
  ["", "전체"], ["DEPOSIT", "예금"], ["SAVING", "적금"], ["LOAN", "대출"], ["FUND", "펀드"], ["CARD", "카드"],
];
const TYPE_NAME = Object.fromEntries(TYPES);

export default function FinancePanel({ onUse }) {
  const [type, setType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState([]);
  const [rates, setRates] = useState([]);
  const [error, setError] = useState("");

  // ===== 1. 검색 — 빈 값은 undefined 로 빼서 ?type=&keyword= 가 안 붙게 =====
  const search = (t = type, kw = keyword) => {
    http.get("/api/finance/products", { params: { type: t || undefined, keyword: kw || undefined } })
      .then(({ data }) => { setItems(data); setError(""); onUse(["JPA", "Oracle"]); })
      .catch((e) => setError(errorMessage(e)));
  };

  // ===== 2. 처음 한 번 — 전체 상품 + 환율 =====
  useEffect(() => {
    search("", "");
    http.get("/api/finance/rates").then(({ data }) => setRates(data)).catch(() => {});
  }, []);

  // ===== 3. 화면 — 종류 칩 · 검색창 · 상품 표 · 환율 카드 =====
  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <div className="chips">
          {TYPES.map(([v, label]) => (
            <button key={v} className={type === v ? "chip on" : "chip"} onClick={() => { setType(v); search(v, keyword); }}>{label}</button>
          ))}
        </div>
        <form className="input-row" onSubmit={(e) => { e.preventDefault(); search(); }}>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="상품명 · 회사 · 설명에서 찾기 (예: 청년, 중도해지)" />
          <button className="btn">검색</button>
        </form>
      </div>

      <div className="card">
        <p className="card-title">상품 {items.length}개 <span className="model-tag">금리 높은 순 · JPQL</span></p>
        <table className="table">
          <thead><tr><th>종류</th><th>상품</th><th>회사</th><th className="num">금리</th><th className="num">기간</th><th className="num">위험</th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td><span className={`type t-${p.productType}`}>{TYPE_NAME[p.productType]}</span></td>
                <td><b>{p.productName}</b><div className="muted">{p.description}</div></td>
                <td>{p.bankName}</td>
                <td className="num">{Number(p.interestRate) > 0 ? `${Number(p.interestRate).toFixed(2)}%` : "-"}</td>
                <td className="num">{p.periodMonths > 0 ? `${p.periodMonths}개월` : "-"}</td>
                <td className="num">{p.riskLevel}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="muted" style={{ textAlign: "center" }}>검색 결과가 없습니다</td></tr>}
          </tbody>
        </table>
      </div>

      {rates.length > 0 && (
        <div className="card">
          <p className="card-title">오늘의 환율 <span className="model-tag">{rates[0].baseDate} 기준 · 예시 값</span></p>
          <div className="stats rates">
            {rates.map((r) => (
              <div key={r.currencyCode} className="stat">
                <div className="stat-label">{r.currencyCode} · {r.currencyName}</div>
                <div className="stat-value">{Number(r.rate).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}