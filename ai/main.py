# ==============================================================
# 파일   ai\main.py — FastAPI 서버의 시작점 (uvicorn main:app)
# 역할   메뉴 파일 7개(credit.py …)를 찾아 주소로 붙인다
#
# 요청이 들어오는 길
#   React :5174 → Spring :8081 /api/ai/credit → FastAPI :8001 /credit
#                 (로그인 확인 JWT)               ↑ 여기가 이 서버
#
# 메뉴 파일 하나 = router 하나
#   credit.py 안에  router = APIRouter(prefix="/credit")
#   → 여기서 app.include_router(router) → /credit 주소가 생김
#   → 그래서 메뉴를 추가해도 main.py 는 고치지 않는다
# ==============================================================
from dotenv import load_dotenv

load_dotenv()                      # .env 의 OPENAI_API_KEY 를 먼저 읽어 둠 → 5 · 6번 메뉴가 꺼내 씀

import importlib

from fastapi import FastAPI

app = FastAPI(title="Finance AI Web — AI 서버")    # uvicorn main:app 의 app = 이 객체. :8001/docs 화면 제목

# 메뉴 파일이 있으면 붙이고, 없거나 에러면 건너뛴다 → 한 메뉴가 안 돼도 나머지는 동작
MENUS = ["analysis", "credit", "digit", "fx", "news", "rag", "agent"]
loaded = {}
for name in MENUS:
    try:
        module = importlib.import_module(name)     # "credit" → credit.py 를 import. 파일 안 모델 로딩도 이때 한 번
        app.include_router(module.router)          # credit.py 의 router(/credit) 를 서버에 붙임 → 주소가 생김
        loaded[name] = "ok"
    except ModuleNotFoundError as exc:
        loaded[name] = f"아직 없음 ({exc.name})"
    except Exception as exc:
        loaded[name] = f"에러: {exc}"
    print(f"[메뉴] {name:7} {loaded[name]}")


# 연결 확인용 — :8001/health 와 :8081/api/ai/health 가 같은 JSON 이면 Spring → FastAPI 연결 성공
@app.get("/health")
def health():
    return {"status": "ok", "menus": loaded}