# ==============================================================
# 파일   ai\Dockerfile — FastAPI 서버를 컨테이너로 만드는 설명서
# 역할   ① CPU 전용 torch 를 먼저 설치 (그냥 pip install 하면 GPU 용 2~3GB 가 깔립니다)
#        ② requirements.txt 설치 (torch 는 이미 같은 버전이라 건너뜁니다)
#        ③ 학습 파일 3개 + 뉴스 모델 내려받기를 빌드할 때 한 번 → models · data 폴더가 이미지 안에 생깁니다
#        ④ uvicorn 으로 8001 실행 (--reload 없이, 0.0.0.0 으로 열어 Spring 이 부를 수 있게)
# 빌드 시간  EC2 8GB(m7i-flex.large · t3.large) 기준 10~15분 (MNIST · BERT 내려받기 포함)
# ==============================================================
# 라이브러리 설치부터 모델 학습까지 마친 AI 서버 이미지를 만듭니다.
# 흐름: python 이미지 → torch(CPU) · requirements 설치 → 코드 복사 → 학습 → uvicorn 실행
FROM python:3.12-slim
WORKDIR /app
# 로그를 바로 출력하고, pip 캐시를 남기지 않아 이미지를 줄입니다
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

# ===== ① ② 라이브러리 =====
# requirements.txt 를 코드보다 먼저 복사 → 코드만 바뀌면 설치 단계는 캐시를 재사용합니다
COPY requirements.txt .
RUN pip install torch==2.15.0 torchvision==0.29.2 --index-url https://download.pytorch.org/whl/cpu \
 && pip install -r requirements.txt

# ===== ③ 코드 + 학습 =====
COPY *.py ./
# 모델 파일이 이미지 안에 만들어집니다 (하나라도 실패하면 빌드가 멈춥니다)
RUN python train_credit.py && python train_digit.py && python train_fx.py && python news.py

# ===== ④ 실행 =====
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]