# ==============================================================
# 파일   ai\train_credit.py — 학습 파일 (터미널 ③ 에서 한 번 실행)
# 흐름   가상 고객 5,000명 → ML · DNN 학습 → models\ 에 저장
#        → credit.py(서버)는 저장된 파일을 불러 예측만 한다
# 저장   credit_lr.joblib (ML) · credit_dnn.pt (DNN) · credit_meta.json (표준화 값 · 학습 기록)
# 같이 씀  CreditDNN · MODELS → credit.py,  make_data · FEATURES → analysis.py 가 import
# ==============================================================
import json
from pathlib import Path

import joblib
import numpy as np
import torch
import torch.nn as nn
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

BASE = Path(__file__).parent
MODELS = BASE / "models"
FEATURES = ["age", "income", "debt_ratio", "late_count", "card_usage"]


# DNN — 입력 5개 → 32 → 16 → 1 (연체 확률)
class CreditDNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(5, 32), nn.ReLU(),
            nn.Linear(32, 16), nn.ReLU(),
            nn.Linear(16, 1),
        )

    def forward(self, x):
        return self.net(x)


# 고객 5,000명 가상 데이터 — 다운로드 없이 매번 같은 값
def make_data(n=5000, seed=42):
    rng = np.random.default_rng(seed)
    age = rng.integers(20, 70, n)
    income = rng.integers(1500, 12000, n)              # 연소득(만원)
    debt_ratio = rng.uniform(0, 100, n)                # 부채비율(%)
    late_count = rng.poisson(0.8, n).clip(0, 10)       # 최근 1년 연체 횟수
    card_usage = rng.uniform(0, 100, n)                # 카드 한도 사용률(%)

    score = (-4.2 + 0.05 * debt_ratio + 0.7 * late_count + 0.025 * card_usage
             - 0.0003 * income + 0.0004 * (age - 45) ** 2
             + 0.012 * late_count * debt_ratio / 10)            # 연체 + 부채가 겹치면 더 위험 (DNN 이 잡는 부분)
    score = score * 1.6
    prob = 1 / (1 + np.exp(-score))
    y = (rng.uniform(0, 1, n) < prob).astype(np.float32)   # 1 = 연체
    X = np.column_stack([age, income, debt_ratio, late_count, card_usage]).astype(np.float32)
    return X, y


if __name__ == "__main__":
    torch.manual_seed(42)
    MODELS.mkdir(exist_ok=True)

    X, y = make_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    mean, std = X_train.mean(axis=0), X_train.std(axis=0)

    print("===== 1. 데이터 =====")
    print("학습:", X_train.shape, "/ 시험:", X_test.shape, "/ 연체 비율:", round(float(y.mean()), 3))

    # ML — 로지스틱 회귀
    lr = LogisticRegression(max_iter=1000)
    lr.fit((X_train - mean) / std, y_train)
    lr_acc = lr.score((X_test - mean) / std, y_test)
    joblib.dump(lr, MODELS / "credit_lr.joblib")
    print("\n===== 2. ML (로지스틱 회귀) =====")
    print("시험 정확도:", round(lr_acc, 4))

    # DNN — PyTorch 학습 루프
    xt = torch.tensor((X_train - mean) / std)
    yt = torch.tensor(y_train).unsqueeze(1)
    xs = torch.tensor((X_test - mean) / std)
    ys = torch.tensor(y_test).unsqueeze(1)

    model = CreditDNN()
    loss_fn = nn.BCEWithLogitsLoss()
    opt = torch.optim.Adam(model.parameters(), lr=0.001)
    history = []

    print("\n===== 3. DNN 학습 =====")
    for epoch in range(0, 41):
        if epoch > 0:                                     # epoch 0 은 학습 전 성적만 기록
            model.train()
            for i in range(0, len(xt), 128):              # 128명씩
                out = model(xt[i:i + 128])
                loss = loss_fn(out, yt[i:i + 128])
                opt.zero_grad()
                loss.backward()
                opt.step()
        model.eval()
        with torch.no_grad():
            train_loss = loss_fn(model(xt), yt).item()
            test_acc = ((model(xs) > 0).float() == ys).float().mean().item()
        history.append({"epoch": epoch, "loss": round(train_loss, 4), "acc": round(test_acc, 4)})
        if epoch % 5 == 0:
            print(f"epoch {epoch:2d}  loss {train_loss:.4f}  시험 정확도 {test_acc:.4f}")

    torch.save(model.state_dict(), MODELS / "credit_dnn.pt")
    meta = {"mean": mean.tolist(), "std": std.tolist(), "history": history,
            "lr_acc": round(lr_acc, 4), "dnn_acc": history[-1]["acc"]}
    (MODELS / "credit_meta.json").write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")

    print("\n===== 4. 저장 =====")
    print("models/credit_lr.joblib · credit_dnn.pt · credit_meta.json")