# ==============================================================
# 파일   ai\rag.py — 5번 메뉴 서버 (주소 /rag/ask)
#
# 질문   DocsPanel  post("/rag/ask", {question: "대출을 6개월 만에 갚으면..."})
#   → Spring :8081/api/ai/rag/ask → FastAPI :8001/rag/ask → ask() → answer()
#   → search()  질문 임베딩 → Chroma 에서 가까운 조각 3개
#   → OpenAI    [근거] 3개 + 질문 → 답
#   → {answer, sources, techs} → 왼쪽 답 · 오른쪽 근거 3개
#
# 6번 통합 상담의 search_products 도구도 이 파일의 search() 를 직접 부른다
# ==============================================================
import os
from pathlib import Path

import chromadb
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel

router = APIRouter(prefix="/rag", tags=["5. 금융 문서 상담"])   # 이 파일 주소는 /rag (아래 /ask 와 합쳐 /rag/ask)

BASE = Path(__file__).parent
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
EMBED_MODEL = "text-embedding-3-small"

# 상품설명서 조각 (수업용 가상 상품 — 실제 금융기관과 무관)
DOCS = [
    ("든든 정기예금 > 금리", "든든 정기예금의 기본 금리는 12개월 연 3.2%, 24개월 연 3.4%입니다. 만기에 원금과 이자를 한 번에 받습니다."),
    ("든든 정기예금 > 중도해지", "만기 전에 해지하면 중도해지 금리가 적용됩니다. 1개월 미만은 연 0.1%, 1개월 이상 6개월 미만은 기본 금리의 30%, 6개월 이상은 기본 금리의 50%입니다. 원금은 그대로 돌려받습니다."),
    ("차곡차곡 자유적금 > 가입", "자유적금은 매달 1만 원부터 300만 원까지 자유롭게 넣을 수 있습니다. 가입 기간은 6개월에서 36개월이며 기본 금리는 연 3.5%입니다."),
    ("차곡차곡 자유적금 > 중도해지", "자유적금을 만기 전에 해지하면 기본 금리의 40%가 적용됩니다. 3회 이상 납입하지 않으면 우대 금리가 없어집니다."),
    ("새싹 직장인 신용대출 > 한도와 금리", "재직 6개월 이상 직장인이 대상이며 한도는 연소득의 1.5배, 최대 1억 원입니다. 금리는 연 5.1%에서 7.9%이며 신용 등급에 따라 다릅니다."),
    ("새싹 직장인 신용대출 > 중도상환수수료", "대출 후 1년 안에 갚으면 갚는 금액의 0.7%가 중도상환수수료로 붙습니다. 1년이 지나면 수수료가 없습니다."),
    ("이체 안내 > 수수료", "인터넷·모바일 뱅킹 이체 수수료는 면제입니다. ATM에서 다른 은행으로 이체하면 건당 500원, 창구에서는 건당 1,000원입니다."),
    ("해외송금 안내 > 수수료와 환율", "모바일 해외송금은 건당 수수료 5,000원이며 송금 시점의 고시 환율이 적용됩니다. 하루 최대 5만 달러까지 보낼 수 있습니다."),
]

_client = None


def client():
    global _client
    if _client is None:
        _client = OpenAI()                     # .env 의 OPENAI_API_KEY 사용
    return _client


def embed(texts):
    result = client().embeddings.create(model=EMBED_MODEL, input=texts)
    return [d.embedding for d in sorted(result.data, key=lambda d: d.index)]


# 서랍(Chroma) 열기 — 비어 있으면 문서 8조각을 처음 한 번 넣는다
def collection():
    db = chromadb.PersistentClient(path=str(BASE / "chroma_db"))
    col = db.get_or_create_collection("lab_docs", embedding_function=None, metadata={"hnsw:space": "cosine"})
    if col.count() == 0:
        col.upsert(
            ids=[str(i) for i in range(len(DOCS))],
            embeddings=embed([f"{s}\n{t}" for s, t in DOCS]),
            documents=[t for _, t in DOCS],
            metadatas=[{"source": s} for s, _ in DOCS],
        )
    return col


def search(question, k=3):
    r = collection().query(query_embeddings=embed([question]), n_results=k)
    return [{"source": m["source"], "text": d, "score": round(1 - dist, 3)}
            for d, m, dist in zip(r["documents"][0], r["metadatas"][0], r["distances"][0])]


def answer(question):
    hits = search(question)
    context = "\n".join(f"[{h['source']}] {h['text']}" for h in hits)
    res = client().chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "아래 근거 문서의 내용만 사용해 짧게 답하세요. 근거에 없으면 '상품 문서에 없는 내용입니다.'라고 답하세요.\n[근거]\n" + context},
            {"role": "user", "content": question},
        ],
    )
    return {"answer": res.choices[0].message.content, "sources": hits}


# React 가 보낸 {"question": "..."} → AskRequest 객체
class AskRequest(BaseModel):
    question: str


# POST /rag/ask
@router.post("/ask")
def ask(req: AskRequest):
    try:
        result = answer(req.question)
    except Exception as exc:
        print("RAG 오류:", repr(exc))
        raise HTTPException(status_code=503, detail="문서 상담 실패 — .env 의 OPENAI_API_KEY 를 확인하세요.")
    result["model"] = f"Chroma + {EMBED_MODEL} + {MODEL}"
    result["techs"] = ["RAG"]
    return result