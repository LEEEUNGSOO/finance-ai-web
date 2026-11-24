# ==============================================================
# 파일   ai\digit.py — 2번 메뉴 서버 (주소 /digit)
#
# 손을 떼면   DigitPanel  post("/digit", {image: "data:image/png;base64,iVBOR..."})
#   → Spring :8081/api/ai/digit   (그림도 JSON 안의 긴 글자라 Spring 은 그대로 넘김)
#   → FastAPI :8001/digit → recognize() → to_mnist() 28×28 → CNN
#   → {digit, probs(10개), pixels(28×28), techs} → 큰 숫자 · 미리보기 · 확률 막대
# ==============================================================
import base64
import io

import numpy as np
import torch
from fastapi import APIRouter
from PIL import Image
from pydantic import BaseModel

from train_digit import MODELS, DigitCNN

router = APIRouter(prefix="/digit", tags=["2. 손글씨 인식"])   # 이 파일 주소는 /digit

model = DigitCNN()
model.load_state_dict(torch.load(MODELS / "digit_cnn.pt"))
model.eval()


# React 가 보낸 {"image": "..."} → DigitRequest 객체. 키 이름 image 가 화면과 같아야 함
class DigitRequest(BaseModel):
    image: str      # 캔버스 그림 "data:image/png;base64,...."


# 캔버스 그림 → MNIST 모양 28×28 (검은 바탕 · 흰 글씨 · 가운데 정렬)
def to_mnist(data_url):
    raw = base64.b64decode(data_url.split(",")[-1])
    img = Image.open(io.BytesIO(raw)).convert("L")         # 흑백
    arr = np.array(img)
    ys, xs = np.nonzero(arr > 30)                           # 글씨가 있는 칸
    if len(xs) == 0:
        return None
    crop = img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    w, h = crop.size
    scale = 20 / max(w, h)                                  # 긴 쪽을 20칸으로
    crop = crop.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    canvas = Image.new("L", (28, 28), 0)
    canvas.paste(crop, ((28 - crop.size[0]) // 2, (28 - crop.size[1]) // 2))
    return np.array(canvas, dtype=np.float32) / 255.0      # 0~1


# POST /digit
@router.post("")
def recognize(req: DigitRequest):
    pixels = to_mnist(req.image)
    if pixels is None:
        return {"digit": None, "probs": [0] * 10, "pixels": [], "techs": ["CNN"], "model": "CNN"}
    x = torch.tensor((pixels - 0.1307) / 0.3081).view(1, 1, 28, 28)
    with torch.no_grad():
        probs = torch.softmax(model(x), dim=1)[0]
    return {
        "digit": int(probs.argmax()),
        "probs": [round(float(p), 4) for p in probs],
        "pixels": np.round(pixels, 2).tolist(),             # AI 가 본 28×28
        "model": "CNN (Conv 16 → Conv 32 → FC 64 → 10)",
        "techs": ["CNN"],
    }