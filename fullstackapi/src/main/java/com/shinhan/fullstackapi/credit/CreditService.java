// ==============================================================
// 파일   credit\CreditService.java — Spring 이 직접 FastAPI 를 부르고 결과를 DB 에 저장
// 역할   AiProxyController 는 "그대로 전달" 만 한다
//        이 서비스는 Spring 이 중간에서 답을 꺼내 쓰는 예 → Spring ↔ FastAPI ↔ Oracle 이 한 번에 이어진다
//
//   React  POST /api/credit/history {age, income, ...}
//     → 여기 save()
//        ① fastApiClient.post("/credit")  → FastAPI credit.py 가 등급 계산
//        ② 받은 lr_prob · dnn_prob · grade 로 CreditHistory 만들기
//        ③ repository.save()             → Oracle CREDIT_HISTORY 에 INSERT
//     → 저장된 1건을 React 로
//   * 화면에 보이던 결과를 그대로 받지 않고 서버가 다시 계산 → 브라우저에서 등급을 조작해 저장할 수 없다
// ==============================================================
package com.shinhan.fullstackapi.credit;

import com.shinhan.fullstackapi.credit.CreditDto.*;
import com.shinhan.fullstackapi.member.Member;
import com.shinhan.fullstackapi.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CreditService {

    private final RestClient fastApiClient;              // ai\RestClientConfig 에서 만든 것
    private final CreditHistoryRepository historyRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public HistoryResponse save(CreditRequest req, String username) {
        Member member = memberRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보가 없습니다"));

        // ① FastAPI 에 물어보기 (꺼져 있으면 GlobalExceptionHandler 가 503 으로 바꿔 준다)
        AiCreditResult ai = fastApiClient.post()
                .uri("/credit")
                .contentType(MediaType.APPLICATION_JSON)
                .body(req)
                .retrieve()
                .body(AiCreditResult.class);
        if (ai == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 서버 응답이 비어 있습니다");
        }

        // ② ③ 저장
        CreditHistory saved = historyRepository.save(CreditHistory.builder()
                .member(member)
                .age(req.age())
                .income(req.income())
                .debtRatio(BigDecimal.valueOf(req.debtRatio()))
                .lateCount(req.lateCount())
                .cardUsage(BigDecimal.valueOf(req.cardUsage()))
                .lrProb(BigDecimal.valueOf(ai.lrProb()))
                .dnnProb(BigDecimal.valueOf(ai.dnnProb()))
                .grade(ai.grade())
                .build());
        return HistoryResponse.from(saved);
    }

    public List<HistoryResponse> myHistory(String username) {
        return historyRepository.findByMemberUsernameOrderByIdDesc(username).stream()
                .map(HistoryResponse::from)
                .toList();
    }
}