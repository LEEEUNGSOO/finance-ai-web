// ==============================================================
// 파일   web\src\components\DigitPanel.jsx — 2번 메뉴 화면
//
// 캔버스에 그리기 → 손을 떼면 end()
//   → toDataURL() 그림을 PNG 글자(base64)로
//   → post("/digit", {image}) → :8081/api/ai/digit → FastAPI recognize()
//   → setResult(data) → 큰 숫자 · 28×28 · 확률 막대 · onUse(data.techs) → CNN 불
// ==============================================================
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { post } from "../api";

export default function DigitPanel({ onUse }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // 검은 바탕으로 시작 (MNIST 와 같은 색: 검은 바탕 · 흰 글씨)
  useEffect(() => clear(), []);

  function ctx() {
    return canvasRef.current.getContext("2d");
  }

  function clear() {
    const c = ctx();
    c.fillStyle = "#000";
    c.fillRect(0, 0, 280, 280);
    setResult(null);
  }

  function point(e) {
    const r = canvasRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) * 280) / r.width, ((e.clientY - r.top) * 280) / r.height];
  }

  function start(e) {
    drawing.current = true;
    const [x, y] = point(e);
    const c = ctx();
    c.beginPath();
    c.moveTo(x, y);
  }

  function move(e) {
    if (!drawing.current) return;
    const [x, y] = point(e);
    const c = ctx();
    c.lineTo(x, y);
    c.strokeStyle = "#fff";
    c.lineWidth = 18;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.stroke();
  }

  // 손을 떼면 바로 예측 — 그림을 PNG 글자(base64)로 보냄
  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    post("/digit", { image: canvasRef.current.toDataURL("image/png") })   // 키 image → FastAPI DigitRequest.image
      .then((data) => { setResult(data); setError(""); onUse(data.techs); })   // data = recognize() 가 return 한 dict
      .catch((e) => setError(e.message));
  }

  const probs = (result?.probs || Array(10).fill(0)).map((p, i) => ({ digit: String(i), p }));

  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="grid2">
        <div className="card">
          <p className="card-title">
            신청서 금액 칸 — 숫자 하나를 그려 보세요
            <button className="btn ghost" onClick={clear}>지우기</button>
          </p>
          <canvas ref={canvasRef} width={280} height={280} className="pad"
                  onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} />
        </div>

        <div className="card">
          <p className="card-title">AI 가 읽은 숫자 {result && <span className="model-tag">{result.model}</span>}</p>
          <div className="digit-row">
            <div className="digit-big">{result?.digit ?? "?"}</div>
            <div>
              <p className="muted">AI 가 본 28 × 28</p>
              <div className="mini">
                {(result?.pixels || []).flat().map((v, i) => (
                  <span key={i} style={{ background: `rgb(${v * 255},${v * 255},${v * 255})` }} />
                ))}
              </div>
            </div>
          </div>
          {result?.digit != null && (
            <p className="muted">확신 {(result.probs[result.digit] * 100).toFixed(1)}%</p>
          )}
        </div>
      </div>

      <div className="card">
        <p className="card-title">0 ~ 9 확률</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={probs}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="digit" />
            <YAxis domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} />
            <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
            <Bar dataKey="p" name="확률" radius={[6, 6, 0, 0]}>
              {probs.map((d) => <Cell key={d.digit} fill={Number(d.digit) === result?.digit ? "#ec4899" : "#cbd5e1"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <style>{CSS}</style>
    </>
  );
}

const CSS = `
.pad { width: 280px; height: 280px; border-radius: 12px; cursor: crosshair; touch-action: none; display: block; margin: 0 auto; }
.digit-row { display: flex; gap: 24px; align-items: center; }
.digit-big { width: 140px; height: 140px; border-radius: 16px; display: grid; place-items: center; font-size: 84px; font-weight: 800;
  color: #be185d; background: #fdf2f8; }
.mini { display: grid; grid-template-columns: repeat(28, 5px); gap: 0; background: #000; width: 140px; min-height: 140px; border-radius: 6px; overflow: hidden; }
.mini span { width: 5px; height: 5px; }
`;