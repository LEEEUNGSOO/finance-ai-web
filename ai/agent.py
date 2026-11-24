# ==============================================================
# 파일   ai\agent.py — 6번 메뉴 서버 (주소 /agent)
#
# 질문   ChatPanel  post("/agent", {message: "100달러 보내면 원화로 얼마야?"})
#   → Spring :8081/api/ai/agent → FastAPI :8001/agent → chat()
#   → LangGraph  route(LLM 이 도구 고름) → tools(우리 Python 이 실행) → answer(최종 답)
#   → {answer, path, steps, techs} → 말풍선 · 실행 경로 칩 · 실행한 도구
#
# 도구 4개는 HTTP 로 다시 부르지 않는다. 같은 FastAPI 안이라 앞 메뉴 파일의 함수를 바로 import
#   exchange → fx.py     credit_check → credit.py     search_products → rag.py     news_sentiment → news.py
#
# [Finance AI Web 에서 추가] 도구 5번 bank_products
#   → Spring :8081 /api/finance/products (JPA → Oracle) 를 HTTP 로 부른다
#   → AI 가 문서(RAG)뿐 아니라 우리 DB 의 실제 상품 목록까지 보고 답한다
# ==============================================================
import json
import operator
import os
import urllib.parse
import urllib.request
from typing import Annotated, TypedDict

from fastapi import APIRouter, HTTPException
from langchain_core.messages import AnyMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel

router = APIRouter(prefix="/agent", tags=["6. 통합 AI 상담"])   # 이 파일 주소는 /agent


# ---------- 도구 1~4 (Lab 그대로) — 앞 메뉴의 기능을 그대로 부른다 ----------
@tool
def exchange(usd: float) -> dict:
    """달러 금액을 오늘 환율로 원화로 계산하고, LSTM 이 예측한 내일 환율도 알려 준다."""
    from fx import forecast, latest_rate
    rate = latest_rate()
    return {"usd": usd, "rate": rate, "krw": round(usd * rate), "tomorrow_lstm": forecast(30)["lstm_next"]}


@tool
def credit_check(income: int, debt_ratio: float, late_count: int = 0) -> dict:
    """연소득(만원), 부채비율(%), 연체 횟수로 신용 등급과 연체 확률을 계산한다."""
    from credit import Customer, predict, to_grade
    _, prob = predict(Customer(income=income, debt_ratio=debt_ratio, late_count=late_count))
    return {"grade": to_grade(prob), "default_prob": round(prob, 4)}


@tool
def search_products(query: str) -> list:
    """예금·적금·대출·이체·해외송금 상품설명서에서 관련 내용을 찾는다."""
    from rag import search
    return search(query)


@tool
def news_sentiment(text: str) -> dict:
    """금융 뉴스 문장이 긍정·부정·중립 중 무엇인지 분석한다."""
    from news import analyze
    r = analyze(text)
    return {"label": r["label"], "probs": r["probs"]}


# [추가] 도구 5번 — Spring 이 Oracle 에서 꺼내 주는 은행 상품 목록 (금리 높은 순)
SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8081")


@tool
def bank_products(product_type: str = "", keyword: str = "") -> list:
    """은행 DB 에 등록된 실제 상품 목록을 금리 높은 순으로 찾는다.
    product_type: DEPOSIT(예금) · SAVING(적금) · LOAN(대출) · FUND(펀드) · CARD(카드) 중 하나, 모르면 빈 값.
    keyword: 상품명·설명에 들어갈 단어 (예: 청년, 직장인), 없으면 빈 값."""
    query = urllib.parse.urlencode({k: v for k, v in {"type": product_type, "keyword": keyword}.items() if v})
    with urllib.request.urlopen(f"{SPRING_URL}/api/finance/products?{query}", timeout=5) as res:
        items = json.loads(res.read().decode("utf-8"))
    return [{"name": p["productName"], "type": p["productType"], "rate": p["interestRate"],
             "months": p["periodMonths"], "risk": p["riskLevel"], "desc": p["description"]} for p in items[:5]]


TOOLS = [exchange, credit_check, search_products, news_sentiment, bank_products]
TOOL_MAP = {t.name: t for t in TOOLS}
TOOL_TECH = {"exchange": "LSTM", "credit_check": "DNN", "search_products": "RAG", "news_sentiment": "BERT",
             "bank_products": "Oracle"}

SYSTEM = ("당신은 은행 AI 상담원입니다. 필요한 도구를 골라 쓰고, 도구 결과를 근거로 한국어로 짧게 답하세요. "
          "상품 추천·금리 비교는 bank_products, 약관·수수료 같은 규정은 search_products 를 쓰세요. "
          "도구가 필요 없는 인사·잡담은 바로 답하세요.")


# ---------- LangGraph — 상태 · 노드 3개 · 화살표 ----------
class State(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]     # 대화가 계속 쌓임
    steps: Annotated[list[dict], operator.add]              # 도구 실행 기록
    path: Annotated[list[str], operator.add]                # 지나간 노드


llm = None


def get_llm():
    global llm
    if llm is None:
        llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"), temperature=0)
    return llm


# 노드 1 — LLM 이 도구를 고른다 (Tool Calling)
def route(state: State):
    msg = get_llm().bind_tools(TOOLS).invoke(state["messages"])
    return {"messages": [msg], "path": ["route"]}


# 노드 2 — 고른 도구를 실제로 실행한다 (실행은 우리 Python)
def run_tools(state: State):
    results, steps = [], []
    for call in state["messages"][-1].tool_calls:
        try:
            out = TOOL_MAP[call["name"]].invoke(call["args"])
        except Exception as exc:
            out = {"error": str(exc)}
        steps.append({"tool": call["name"], "args": call["args"], "result": out})
        results.append(ToolMessage(content=json.dumps(out, ensure_ascii=False), tool_call_id=call["id"]))
    return {"messages": results, "steps": steps, "path": ["tools"]}


# 노드 3 — 도구 결과를 보고 최종 답을 쓴다 (도구는 더 부르지 않음)
def answer(state: State):
    msg = get_llm().bind_tools(TOOLS, tool_choice="none").invoke(state["messages"])
    return {"messages": [msg], "path": ["answer"]}


# 화살표 — route 다음은 도구를 골랐으면 tools, 아니면 끝
def after_route(state: State):
    return "tools" if state["messages"][-1].tool_calls else END


graph = StateGraph(State)
graph.add_node("route", route)
graph.add_node("tools", run_tools)
graph.add_node("answer", answer)
graph.add_edge(START, "route")
graph.add_conditional_edges("route", after_route, ["tools", END])
graph.add_edge("tools", "answer")
graph.add_edge("answer", END)
app_graph = graph.compile()


# React 가 보낸 {"message": "..."} → AgentRequest 객체
class AgentRequest(BaseModel):
    message: str


# POST /agent
@router.post("")
def chat(req: AgentRequest):
    try:
        state = app_graph.invoke({
            "messages": [SystemMessage(SYSTEM), HumanMessage(req.message)],
            "steps": [], "path": [],
        })
    except Exception as exc:
        print("에이전트 오류:", repr(exc))
        raise HTTPException(status_code=503, detail="AI 상담 실패 — .env 의 OPENAI_API_KEY 와 FastAPI 터미널 로그를 확인하세요.")
    used = [TOOL_TECH[s["tool"]] for s in state["steps"] if s["tool"] in TOOL_TECH]   # 실제로 부른 도구의 기술 → 기술 지도
    return {
        "answer": state["messages"][-1].content,
        "path": ["질문"] + state["path"],
        "steps": state["steps"],
        "model": "LangGraph (route → tools → answer) + " + os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "techs": ["LangChain", "LangGraph", "Tool Calling"] + used,
    }