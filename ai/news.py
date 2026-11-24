# ==============================================================
# 파일   ai\news.py — 4번 메뉴 서버 (주소 /news)
#
# 예시 · 분석 버튼   NewsPanel  post("/news", {text: "한국은행이 기준금리를 동결했다"})
#   → Spring :8081/api/ai/news → FastAPI :8001/news → news() → load() → analyze()
#   → {label, probs, tokens, training, techs} → ① 토큰 ② Attention ③ 감성 ④ LoRA 표
#
# 실패하면   HTTPException(detail=실제 에러) → Spring 이 그대로 전달 → 화면 빨간 상자에 detail
# 따로 실행  python news.py → 맨 아래 __main__ → 모델만 미리 내려받기
# ==============================================================
import torch
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/news", tags=["4. 금융 뉴스 분석"])   # 이 파일 주소는 /news

MODEL_NAME = "snunlp/KR-FinBert-SC"            # 3일차 Hugging Face 시간의 금융 감성 BERT
KOREAN = {"positive": "긍정", "negative": "부정", "neutral": "중립"}
tok, bert = None, None

# 4일차 Fine-tuning · LoRA 실행 결과 (화면 표) — 숫자는 4일차 결과로 바꿔 넣어도 됨
TRAINING = [
    {"method": "학습 전", "trainable": 0, "size": "-", "accuracy": 0.25},
    {"method": "Full Fine-tuning", "trainable": 110620420, "size": "423MB", "accuracy": 1.0},
    {"method": "LoRA", "trainable": 297988, "size": "1.2MB", "accuracy": 1.0},
]


# 처음 부를 때 한 번만 로딩 (다운로드 실패해도 다른 메뉴는 그대로)
def load():
    global tok, bert
    if bert is None:
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
        tok = AutoTokenizer.from_pretrained(MODEL_NAME)
        try:
            # eager = Attention 값을 꺼낼 수 있는 계산 방식
            bert = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, attn_implementation="eager")
        except (TypeError, ValueError):
            bert = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)   # 옛 버전이면 옵션 없이
        bert.eval()


def analyze(text):
    load()
    enc = tok(text, return_tensors="pt", truncation=True, max_length=64)
    with torch.no_grad():
        out = bert(**enc, output_attentions=True)
    # 감성 — 점수 3개 → 확률 3개 → 한글 이름
    probs = torch.softmax(out.logits, dim=-1)[0].tolist()
    labels = {}
    for i, p in enumerate(probs):
        name = str(bert.config.id2label[i]).lower()            # "positive" · "negative" · "neutral"
        labels[KOREAN.get(name, name)] = round(p, 4)

    # Attention — 마지막 층, 헤드 평균, [CLS] 가 각 토큰을 본 정도 (못 받으면 모두 같은 값)
    tokens = tok.convert_ids_to_tokens(enc["input_ids"][0])
    if out.attentions:
        att = out.attentions[-1][0].mean(dim=0)[0].tolist()
    else:
        att = [1.0] * len(tokens)
    pairs = [(t, a) for t, a in zip(tokens, att) if t not in ("[CLS]", "[SEP]", "[PAD]")]   # 시작 · 끝 · 채움 표시 빼기
    top = max((a for _, a in pairs), default=1) or 1
    return {
        "label": max(labels, key=labels.get),
        "probs": labels,
        "tokens": [{"token": t, "weight": round(a / top, 3)} for t, a in pairs],
    }


# React 가 보낸 {"text": "..."} → NewsRequest 객체
class NewsRequest(BaseModel):
    text: str


# POST /news
@router.post("")
def news(req: NewsRequest):
    # 에러 → {"detail": "..."} → Spring fastApiError() → React api.js 의 data.detail → 빨간 상자
    try:
        load()                                                  # 모델 못 받음 → 503
    except Exception as exc:
        print("뉴스 모델 로딩 오류:", repr(exc))
        raise HTTPException(status_code=503,
                            detail=f"뉴스 모델을 불러오지 못했습니다. python news.py 로 먼저 내려받으세요. ({type(exc).__name__}: {exc})")
    try:
        result = analyze(req.text)                              # 분석 중 에러 → 500
    except Exception as exc:
        print("뉴스 분석 오류:", repr(exc))
        raise HTTPException(status_code=500, detail=f"뉴스 분석 중 오류: {type(exc).__name__}: {exc}")
    result["training"] = TRAINING
    result["model"] = MODEL_NAME
    result["techs"] = ["Transformer", "Attention", "BERT", "Hugging Face", "Fine-tuning", "LoRA"]
    return result


# python news.py → 모델 미리 내려받기 + 한 번 실행해 보기
if __name__ == "__main__":
    r = analyze("한국은행이 기준금리를 동결했다")
    print("===== 뉴스 모델 준비 완료 =====")
    print(r["label"], r["probs"])
    print([t["token"] for t in r["tokens"]])