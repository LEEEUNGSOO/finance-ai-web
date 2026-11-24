# ==============================================================
# 파일   ai\fx.py — 3번 메뉴 서버 (주소 /fx)
#
# 화면 열기 · 30/60/120일   FxPanel  get("/fx?days=60")
#   → Spring :8081/api/ai/fx?days=60   (Spring 이 ?days=60 까지 붙여서 넘김)
#   → FastAPI :8001/fx?days=60 → forecast(days=60)   (주소 ? 뒤 값이 함수 인자로)
#   → {dates, actual, rnn, lstm, rnn_next, lstm_next, … techs} → 카드 4개 · 선 3줄
#
# 6번 통합 상담의 exchange 도구도 이 파일의 latest_rate() · forecast() 를 직접 부른다
# ==============================================================
import json
from datetime import datetime

import numpy as np
import pandas as pd
import torch
from fastapi import APIRouter

from train_fx import DATA, MODELS, WINDOW, FxModel

router = APIRouter(prefix="/fx", tags=["3. 환율 예측"])   # 이 파일 주소는 /fx

df = pd.read_csv(DATA / "fx.csv")
meta = json.loads((MODELS / "fx_meta.json").read_text(encoding="utf-8"))
LO, HI = meta["lo"], meta["hi"]
models = {}
for cell in ["rnn", "lstm"]:
    m = FxModel(cell)
    m.load_state_dict(torch.load(MODELS / f"fx_{cell}.pt"))
    m.eval()
    models[cell] = m


def latest_rate():
    return float(df["rate"].iloc[-1])


# 20일씩 잘라 넣고 다음 날 값을 원 단위로 돌려줌
def run(cell, series):
    scaled = (np.array(series) - LO) / (HI - LO)
    X = np.array([scaled[i:i + WINDOW] for i in range(len(scaled) - WINDOW + 1)])
    with torch.no_grad():
        out = models[cell](torch.tensor(X, dtype=torch.float32).unsqueeze(-1))
    return (out.squeeze(-1).numpy().astype(float) * (HI - LO) + LO).round(1).tolist()


# GET /fx?days=60 — BaseModel 이 아닌 보통 인자(days) = 주소 ? 뒤 값. 없으면 60
@router.get("")
def forecast(days: int = 60):
    rates = df["rate"].tolist()
    start = len(rates) - days
    part = rates[start - WINDOW:]                          # 보여 줄 구간 + 앞 20일
    result = {"dates": df["date"].tolist()[start:], "actual": rates[start:]}
    for cell in ["rnn", "lstm"]:
        pred = run(cell, part)                             # 마지막 값 = 내일 예측
        result[cell] = pred[:-1]
        result[f"{cell}_next"] = pred[-1]
        result[f"{cell}_mae"] = round(float(np.mean(np.abs(np.array(pred[:-1]) - np.array(rates[start:])))), 2)
    result["base_time"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    result["model"] = "RNN(32) · LSTM(32) — 최근 20일 → 다음 날"
    result["techs"] = ["RNN", "LSTM"]
    return result