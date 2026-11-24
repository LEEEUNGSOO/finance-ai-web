// ==============================================================
// 파일   credit\CreditDto.java — 신용 이력 요청·응답 모양
// 역할   CreditRequest  = React 가 보내는 고객 정보 (FastAPI Customer 와 같은 이름 → 그대로 넘긴다)
//        AiCreditResult = FastAPI /credit 이 돌려주는 JSON 중 필요한 부분만
//        HistoryResponse = React 에 돌려주는 이력 1건
// ==============================================================
package com.shinhan.fullstackapi.credit;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreditDto {

    // FastAPI 로 보낼 때 snake_case 이름이 필요하다 (debt_ratio …) → @JsonProperty
    public record CreditRequest(
            @Min(19) @Max(100) int age,
            @Min(0) int income,
            @JsonProperty("debt_ratio") @Min(0) @Max(300) double debtRatio,
            @JsonProperty("late_count") @Min(0) @Max(20) int lateCount,
            @JsonProperty("card_usage") @Min(0) @Max(100) double cardUsage) {
    }

    // FastAPI 응답에는 what_if, model, techs 도 있지만 저장에 필요한 3개만 받는다
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AiCreditResult(
            @JsonProperty("lr_prob") double lrProb,
            @JsonProperty("dnn_prob") double dnnProb,
            int grade) {
    }

    public record HistoryResponse(Long id, int age, int income, BigDecimal debtRatio, int lateCount,
                                  BigDecimal cardUsage, BigDecimal lrProb, BigDecimal dnnProb,
                                  int grade, LocalDateTime createdAt) {
        public static HistoryResponse from(CreditHistory h) {
            return new HistoryResponse(h.getId(), h.getAge(), h.getIncome(), h.getDebtRatio(),
                    h.getLateCount(), h.getCardUsage(), h.getLrProb(), h.getDnnProb(),
                    h.getGrade(), h.getCreatedAt());
        }
    }
}