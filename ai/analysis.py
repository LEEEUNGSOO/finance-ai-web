# ==============================================================
# 파일   ai\analysis.py — 대시보드 분석 서버 (주소 /analysis)
#
# 대시보드 열기   AnalysisPanel  get("/analysis")
#   → Spring :8081/api/ai/analysis → FastAPI :8001/analysis → analysis()
#   → {summary, by_age, by_income, by_late, by_debt, techs} → 카드 4 · 도넛 · 막대 · 선 · 표
# 모델 없이 pandas 만 씀 → train_credit.py 를 안 돌려도 동작
# ==============================================================
import pandas as pd
from fastapi import APIRouter

from train_credit import FEATURES, make_data

router = APIRouter(prefix="/analysis", tags=["대시보드 분석"])   # 이 파일 주소는 /analysis

# 신용 분석에서 쓴 가상 고객 5,000명 → DataFrame (모델 없이 데이터만)
X, y = make_data()
df = pd.DataFrame(X, columns=FEATURES)
df["default"] = y
df["age_group"] = (df["age"] // 10 * 10).astype(int).astype(str) + "대"
df["income_group"] = pd.cut(df["income"], [0, 3000, 6000, 9000, 99999],
                            labels=["3천 미만", "3천~6천", "6천~9천", "9천 이상"])
df["debt_group"] = (df["debt_ratio"] // 10 * 10).astype(int)
df["late_group"] = df["late_count"].clip(upper=4).astype(int).astype(str) + "회"
df.loc[df["late_group"] == "4회", "late_group"] = "4회+"


@router.get("")
def analysis():
    by_age = df.groupby("age_group").agg(count=("default", "size"), rate=("default", "mean"),
                                         income=("income", "mean")).reset_index()
    by_income = df.groupby("income_group", observed=True)["default"].size().reset_index(name="count")
    by_debt = df.groupby("debt_group")["default"].mean().reset_index(name="rate")
    by_late = df.groupby("late_group")["default"].mean().reset_index(name="rate")
    return {
        "summary": {
            "customers": len(df),
            "default_rate": round(float(df["default"].mean()), 4),
            "avg_income": int(df["income"].mean()),
            "avg_debt": round(float(df["debt_ratio"].mean()), 1),
        },
        "by_age": [{"group": g, "count": int(c), "rate": round(float(r), 4), "income": int(i)}
                   for g, c, r, i in by_age.itertuples(index=False)],
        "by_income": [{"group": str(g), "count": int(c)} for g, c in by_income.itertuples(index=False)],
        "by_late": [{"group": g, "rate": round(float(r), 4)} for g, r in by_late.itertuples(index=False)],
        "by_debt": [{"group": f"{int(g)}%", "rate": round(float(r), 4)} for g, r in by_debt.itertuples(index=False)],
        "model": "pandas groupby (가상 고객 5,000명)",
        "techs": ["Pandas", "Chart"],
    }