# ==============================================================
# 파일   ai\train_fx.py — 학습 파일 (터미널 ③ 에서 한 번 실행)
# 흐름   가상 환율 400일 → data\fx.csv → RNN · LSTM 학습 → models\
#        → fx.py(서버)는 csv 와 모델을 불러 예측만 한다
# 저장   data\fx.csv · fx_rnn.pt · fx_lstm.pt · fx_meta.json (0~1 로 바꾼 lo · hi)
# 같이 씀  DATA · MODELS · WINDOW · FxModel → fx.py 가 import
# ==============================================================
import json
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn

BASE = Path(__file__).parent
MODELS = BASE / "models"
DATA = BASE / "data"
WINDOW = 20          # 최근 20일을 보고 다음 날을 맞힌다


# RNN · LSTM — 셀 종류만 다르고 모양은 같다
class FxModel(nn.Module):
    def __init__(self, cell="lstm"):
        super().__init__()
        rnn_class = nn.LSTM if cell == "lstm" else nn.RNN
        self.rnn = rnn_class(input_size=1, hidden_size=32, batch_first=True)
        self.fc = nn.Linear(32, 1)

    def forward(self, x):                 # x: (배치, 20, 1)
        out, _ = self.rnn(x)
        return self.fc(out[:, -1])        # 마지막 날의 기억 → 다음 날 값


# 원/달러 환율 400일 가상 데이터 (수업용) — 추세 + 물결 + 잡음
def make_fx(days=400, seed=9):
    rng = np.random.default_rng(seed)
    t = np.arange(days)
    rate = 1330 + 0.12 * t + 18 * np.sin(t / 25) + np.cumsum(rng.normal(0, 3.2, days))
    end = date.today() - timedelta(days=1)
    dates = [(end - timedelta(days=days - 1 - i)).isoformat() for i in range(days)]
    return pd.DataFrame({"date": dates, "rate": np.round(rate, 1)})


def windows(scaled):
    X = np.array([scaled[i:i + WINDOW] for i in range(len(scaled) - WINDOW)])
    y = scaled[WINDOW:]
    return torch.tensor(X, dtype=torch.float32).unsqueeze(-1), torch.tensor(y, dtype=torch.float32).unsqueeze(-1)


if __name__ == "__main__":
    torch.manual_seed(42)
    MODELS.mkdir(exist_ok=True)
    DATA.mkdir(exist_ok=True)

    df = make_fx()
    df.to_csv(DATA / "fx.csv", index=False)
    lo, hi = float(df["rate"].min()), float(df["rate"].max())
    scaled = ((df["rate"] - lo) / (hi - lo)).to_numpy()      # 0~1 로 맞춤
    X, y = windows(scaled)

    print("===== 1. 데이터 =====")
    print("환율", len(df), "일 /", df["date"].iloc[0], "~", df["date"].iloc[-1])
    print("입력 모양:", tuple(X.shape), "/ 정답 모양:", tuple(y.shape))

    for cell in ["rnn", "lstm"]:
        model = FxModel(cell)
        opt = torch.optim.Adam(model.parameters(), lr=0.01)
        loss_fn = nn.MSELoss()
        print(f"\n===== 2. {cell.upper()} 학습 =====")
        for epoch in range(1, 151):
            out = model(X)
            loss = loss_fn(out, y)
            opt.zero_grad()
            loss.backward()
            opt.step()
            if epoch % 50 == 0:
                print(f"epoch {epoch:2d}  loss {loss.item():.5f}")
        torch.save(model.state_dict(), MODELS / f"fx_{cell}.pt")

    (MODELS / "fx_meta.json").write_text(json.dumps({"lo": lo, "hi": hi}), encoding="utf-8")
    print("\n===== 3. 저장 =====")
    print("data/fx.csv · models/fx_rnn.pt · fx_lstm.pt · fx_meta.json")