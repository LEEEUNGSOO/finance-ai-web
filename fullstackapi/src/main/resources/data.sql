-- =========================================================
-- 파일   resources\data.sql — 서버가 뜰 때 넣는 기본 데이터 (금융정보 · 테스트 회원 · 토론방 예시)
-- 역할   ddl-auto=create 라서 서버를 켤 때마다 테이블을 새로 만들고 이 데이터를 다시 넣는다
--        AI은행 · 미래저축은행 · AI자산운용 · AI카드 는 모두 수업용 가상 회사 (실제 금융기관과 무관)
--        든든 정기예금 · 차곡차곡 자유적금 · 새싹 직장인 신용대출 은 AiService RAG 문서(rag.py)와 같은 상품이다
--        → 챗봇에게 '금리 높은 적금 추천' 은 bank_products(이 표), '중도해지 금리' 는 search_products(RAG) 로 답한다
-- =========================================================

-- ===== 1. 금융상품 (금리는 학습용 예시 값) =====
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'DEPOSIT', 'AI은행', '든든 정기예금', 3.20, 12, 1000000, 1, '12개월 연 3.2%, 24개월 연 3.4%. 만기에 원금과 이자를 한 번에 지급');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'DEPOSIT', 'AI은행', '든든 정기예금 2년', 3.40, 24, 1000000, 1, '든든 정기예금 24개월형. 중도해지 시 기간별 중도해지 금리 적용');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'DEPOSIT', 'AI은행', '모바일 쏙 정기예금', 3.30, 12, 500000, 1, '모바일 앱 전용 예금. 비대면 가입 우대금리 포함');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'DEPOSIT', '미래저축은행', '미래 스마트 정기예금', 3.60, 12, 1000000, 1, '저축은행 예금. 1인당 원금·이자 합계 5천만 원까지 예금자 보호');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'SAVING', 'AI은행', '차곡차곡 자유적금', 3.50, 12, 10000, 1, '매달 1만~300만 원 자유 납입. 가입 기간 6~36개월, 기본 연 3.5%');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'SAVING', 'AI은행', '새내기 청년 적금', 4.80, 24, 10000, 1, '만 19~34세 대상. 급여이체 시 우대금리 포함 최고 연 4.8%');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'SAVING', 'AI은행', '26주 챌린지 적금', 3.80, 6, 1000, 1, '매주 납입액을 조금씩 늘려 가는 6개월 적금');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'SAVING', '미래저축은행', '미래 정기적금', 4.20, 12, 10000, 1, '매월 같은 금액을 넣는 정기적금. 자동이체 우대 포함');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'LOAN', 'AI은행', '새싹 직장인 신용대출', 5.10, 12, 1000000, 3, '재직 6개월 이상 직장인. 한도 연소득의 1.5배(최대 1억), 연 5.1~7.9%');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'LOAN', 'AI은행', '든든 전세자금대출', 4.10, 24, 10000000, 2, '무주택 세대주 전세보증금 대출. 보증기관 보증서 필요');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'LOAN', 'AI은행', '쏙쏙 비상금대출', 6.90, 12, 500000, 3, '모바일로 바로 받는 소액 대출. 한도 최대 300만 원');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'FUND', 'AI자산운용', 'AI 미국 대표지수 인덱스 펀드', 0.00, 0, 10000, 4, '미국 대형주 지수를 따라가는 인덱스 펀드. 원금 손실 가능');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'FUND', 'AI자산운용', 'AI 국공채 안정형 펀드', 0.00, 0, 10000, 2, '국공채 위주로 운용하는 채권형 펀드. 변동성이 낮은 편');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'FUND', 'AI자산운용', 'AI 글로벌 기술주 펀드', 0.00, 0, 10000, 5, '해외 기술주 중심 공격형 주식 펀드. 원금 손실 위험 높음');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'FUND', 'AI자산운용', 'AI 배당 혼합형 펀드', 0.00, 0, 10000, 3, '배당주와 채권을 섞은 중립형 펀드');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'CARD', 'AI카드', 'AI 심플 적립카드', 0.00, 0, 0, 0, '전월 실적 조건 없이 국내 가맹점 0.7% 적립');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'CARD', 'AI카드', 'AI 생활 할인카드', 0.00, 0, 0, 0, '공과금·편의점·마트 생활비 할인 특화');
INSERT INTO finance_product (id, product_type, bank_name, product_name, interest_rate, period_months, min_amount, risk_level, description)
VALUES (finance_product_seq.NEXTVAL, 'CARD', 'AI카드', 'AI 트래블 체크카드', 0.00, 0, 0, 0, '해외 결제 수수료 면제, 해외 ATM 출금 수수료 월 5회 면제');

-- ===== 2. 환율 (1 단위 기준 원화, JPY 는 100엔 기준, 학습용 예시 값) =====
INSERT INTO exchange_rate (id, currency_code, currency_name, rate, base_date) VALUES (exchange_rate_seq.NEXTVAL, 'USD', '미국 달러', 1385.50, DATE '2026-11-13');
INSERT INTO exchange_rate (id, currency_code, currency_name, rate, base_date) VALUES (exchange_rate_seq.NEXTVAL, 'JPY', '일본 엔(100)', 905.20, DATE '2026-11-13');
INSERT INTO exchange_rate (id, currency_code, currency_name, rate, base_date) VALUES (exchange_rate_seq.NEXTVAL, 'EUR', '유로', 1498.30, DATE '2026-11-13');
INSERT INTO exchange_rate (id, currency_code, currency_name, rate, base_date) VALUES (exchange_rate_seq.NEXTVAL, 'CNY', '중국 위안', 192.40, DATE '2026-11-13');
INSERT INTO exchange_rate (id, currency_code, currency_name, rate, base_date) VALUES (exchange_rate_seq.NEXTVAL, 'GBP', '영국 파운드', 1765.10, DATE '2026-11-13');

-- ===== 3. 테스트 회원 (비밀번호는 모두 1234) =====
--   password 칸은 '1234' 를 BCrypt 로 암호화한 값 → 로그인할 때 passwordEncoder.matches('1234', 이 값) 이 true
--   user1 · user2 두 명이라 "남의 글 수정 → 403" 을 바로 확인할 수 있다
INSERT INTO member (id, username, password, nickname, role, created_at, updated_at)
VALUES (member_seq.NEXTVAL, 'user1', '$2a$10$bSsebzxIM/zpWMfnp9kOnerLmuBTuEa5RIxOncCmLIWnytOKmWDqi', '김신한', 'USER', LOCALTIMESTAMP - INTERVAL '3' DAY, LOCALTIMESTAMP - INTERVAL '3' DAY);
INSERT INTO member (id, username, password, nickname, role, created_at, updated_at)
VALUES (member_seq.NEXTVAL, 'user2', '$2a$10$bSsebzxIM/zpWMfnp9kOnerLmuBTuEa5RIxOncCmLIWnytOKmWDqi', '이금융', 'USER', LOCALTIMESTAMP - INTERVAL '3' DAY, LOCALTIMESTAMP - INTERVAL '3' DAY);
INSERT INTO member (id, username, password, nickname, role, created_at, updated_at)
VALUES (member_seq.NEXTVAL, 'admin', '$2a$10$bSsebzxIM/zpWMfnp9kOnerLmuBTuEa5RIxOncCmLIWnytOKmWDqi', '관리자', 'ADMIN', LOCALTIMESTAMP - INTERVAL '3' DAY, LOCALTIMESTAMP - INTERVAL '3' DAY);

-- ===== 4. 토론방 예시 글 =====
--   member_id 는 번호를 직접 쓰지 않고 username 으로 찾아 넣는다 (순서가 바뀌어도 안전)
INSERT INTO post (id, title, content, member_id, view_count, created_at, updated_at)
VALUES (post_seq.NEXTVAL, '토론방 이용 안내', '금융상품 · 금리 · 환율에 대해 자유롭게 이야기하는 곳입니다. 글쓰기 · 댓글은 로그인 후 쓸 수 있고, 수정 · 삭제는 작성자만 할 수 있습니다.',
        (SELECT id FROM member WHERE username = 'admin'), 12, LOCALTIMESTAMP - INTERVAL '2' DAY, LOCALTIMESTAMP - INTERVAL '2' DAY);
INSERT INTO post (id, title, content, member_id, view_count, created_at, updated_at)
VALUES (post_seq.NEXTVAL, '예금 금리 지금 묶어 두는 게 나을까요?', '정기예금 금리가 3% 초반인데, 앞으로 더 내려갈 것 같아서 2년짜리로 묶어 둘지 고민입니다. 다들 어떻게 하시나요?',
        (SELECT id FROM member WHERE username = 'user1'), 8, LOCALTIMESTAMP - INTERVAL '1' DAY, LOCALTIMESTAMP - INTERVAL '1' DAY);
INSERT INTO post (id, title, content, member_id, view_count, created_at, updated_at)
VALUES (post_seq.NEXTVAL, '청년 적금 우대금리 조건 정리', '새내기 청년 적금은 만 19~34세 대상이고, 급여이체를 걸면 우대금리까지 최고 연 4.8%입니다. 자동이체 날짜를 월급날 다음 날로 맞추면 편합니다.',
        (SELECT id FROM member WHERE username = 'user2'), 5, LOCALTIMESTAMP - INTERVAL '20' HOUR, LOCALTIMESTAMP - INTERVAL '20' HOUR);
INSERT INTO post (id, title, content, member_id, view_count, created_at, updated_at)
VALUES (post_seq.NEXTVAL, '달러 환전 타이밍 질문', '다음 달 해외 출장이라 달러가 필요한데, 환율 예측 메뉴에서 LSTM 이 내일 조금 오른다고 나오네요. 미리 나눠서 바꿔 두는 게 좋을까요?',
        (SELECT id FROM member WHERE username = 'user1'), 3, LOCALTIMESTAMP - INTERVAL '5' HOUR, LOCALTIMESTAMP - INTERVAL '5' HOUR);
INSERT INTO post (id, title, content, member_id, view_count, created_at, updated_at)
VALUES (post_seq.NEXTVAL, '신용 분석 해 보니 등급이 생각보다 낮게 나왔어요', '카드 사용률을 80%로 넣었더니 등급이 확 떨어지네요. 부채비율을 낮추면 몇 등급까지 오르는지도 같이 보여 줘서 좋았습니다.',
        (SELECT id FROM member WHERE username = 'user2'), 1, LOCALTIMESTAMP - INTERVAL '1' HOUR, LOCALTIMESTAMP - INTERVAL '1' HOUR);

-- ===== 5. 댓글 예시 =====
--   post_id 도 제목으로 찾아 넣는다
INSERT INTO post_comment (id, content, post_id, member_id, created_at, updated_at)
VALUES (post_comment_seq.NEXTVAL, '저는 절반만 2년으로 묶고 절반은 1년으로 했어요.',
        (SELECT id FROM post WHERE title = '예금 금리 지금 묶어 두는 게 나을까요?'), (SELECT id FROM member WHERE username = 'user2'),
        LOCALTIMESTAMP - INTERVAL '22' HOUR, LOCALTIMESTAMP - INTERVAL '22' HOUR);
INSERT INTO post_comment (id, content, post_id, member_id, created_at, updated_at)
VALUES (post_comment_seq.NEXTVAL, '좋은 방법이네요. 그렇게 나눠 보겠습니다.',
        (SELECT id FROM post WHERE title = '예금 금리 지금 묶어 두는 게 나을까요?'), (SELECT id FROM member WHERE username = 'user1'),
        LOCALTIMESTAMP - INTERVAL '21' HOUR, LOCALTIMESTAMP - INTERVAL '21' HOUR);
INSERT INTO post_comment (id, content, post_id, member_id, created_at, updated_at)
VALUES (post_comment_seq.NEXTVAL, '정리 감사합니다. 급여이체 조건은 몰랐네요.',
        (SELECT id FROM post WHERE title = '청년 적금 우대금리 조건 정리'), (SELECT id FROM member WHERE username = 'user1'),
        LOCALTIMESTAMP - INTERVAL '18' HOUR, LOCALTIMESTAMP - INTERVAL '18' HOUR);
INSERT INTO post_comment (id, content, post_id, member_id, created_at, updated_at)
VALUES (post_comment_seq.NEXTVAL, '한 번에 바꾸기보다 몇 번 나눠서 바꾸면 부담이 덜해요.',
        (SELECT id FROM post WHERE title = '달러 환전 타이밍 질문'), (SELECT id FROM member WHERE username = 'user2'),
        LOCALTIMESTAMP - INTERVAL '4' HOUR, LOCALTIMESTAMP - INTERVAL '4' HOUR);