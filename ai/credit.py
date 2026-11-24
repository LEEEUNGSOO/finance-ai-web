# ==============================================================
# 파일   ai\credit.py — 1번 메뉴 서버 (주소 /credit)
#
# 슬라이더   CreditPanel  post("/credit", {age, income, debt_ratio, late_count, card_usage})
#   → Spring :8081/api/ai/credit → FastAPI :8001/credit → analyze()
#   → {lr_prob, dnn_prob, grade, what_if, techs} → 화면 게이지 · 막대
#
# 학습 곡선 CreditPanel  get("/credit/history")
#   → Spring :8081/api/ai/credit/history → FastAPI :8001/credit/history → history()
# ==============================================================
import json

import joblib
import numpy as np
import torch
from fastapi import APIRouter
from pydantic import BaseModel

from train_credit import MODELS, CreditDNN

router = APIRouter(prefix="/credit", tags=["1. 신용 분석"])   # main.py 가 붙여 줌 → 이 파일 주소는 모두 /credit 로 시작

# 서버 시작 때 한 번 로딩
meta = json.loads((MODELS / "credit_meta.json").read_text(encoding="utf-8"))
MEAN, STD = np.array(meta["mean"]), np.array(meta["std"])
lr_model = joblib.load(MODELS / "credit_lr.joblib")
dnn = CreditDNN()
dnn.load_state_dict(torch.load(MODELS / "credit_dnn.pt"))
dnn.eval()

# 연체 확률 → 신용 등급 (확률이 이 값보다 작으면 그 등급)
GRADE_CUT = [0.03, 0.06, 0.10, 0.15, 0.22, 0.30, 0.40, 0.52, 0.65]


# React 가 보낸 JSON → Customer 객체 (FastAPI 가 알아서 바꿈)
# 키 이름이 화면 FIELDS 의 key 와 다르면 에러 없이 기본값이 들어감 → 이름을 꼭 같게
class Customer(BaseModel):
    age: int = 35
    income: int = 4500          # 연소득(만원)
    debt_ratio: float = 40      # 부채비율(%)
    late_count: int = 0         # 연체 횟수
    card_usage: float = 50      # 카드 사용률(%)


def to_grade(prob):
    for i, cut in enumerate(GRADE_CUT):
        if prob < cut:
            return i + 1
    return 10


def predict(c: Customer):
    x = (np.array([[c.age, c.income, c.debt_ratio, c.late_count, c.card_usage]]) - MEAN) / STD
    lr_prob = float(lr_model.predict_proba(x)[0, 1])
    with torch.no_grad():
        dnn_prob = float(torch.sigmoid(dnn(torch.tensor(x, dtype=torch.float32)))[0, 0])
    return lr_prob, dnn_prob


# POST /credit  ("" = prefix 그대로)
@router.post("")
def analyze(c: Customer):
    lr_prob, dnn_prob = predict(c)
    better = c.model_copy(update={"debt_ratio": max(0, c.debt_ratio - 10)})   # 부채비율 10% 줄이면?
    _, better_prob = predict(better)
    return {                                  # dict 를 돌려주면 FastAPI 가 JSON 으로 바꿔 Spring 에 응답
        "lr_prob": round(lr_prob, 4),
        "dnn_prob": round(dnn_prob, 4),
        "grade": to_grade(dnn_prob),
        "what_if": {"debt_ratio": better.debt_ratio, "prob": round(better_prob, 4), "grade": to_grade(better_prob)},
        "model": "LogisticRegression + DNN (5→32→16→1)",
        "techs": ["ML", "DNN"],
    }


# GET /credit/history — 학습 때 저장한 epoch 기록 → 화면 학습 곡선
@router.get("/history")
def history():
    return {"history": meta["history"], "lr_acc": meta["lr_acc"], "dnn_acc": meta["dnn_acc"]}