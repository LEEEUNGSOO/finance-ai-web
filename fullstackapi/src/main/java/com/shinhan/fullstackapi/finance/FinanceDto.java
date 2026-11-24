// ==============================================================
// 파일   finance\FinanceDto.java — 금융정보 응답 모양
// 역할   ProductResponse · RateResponse — 엔티티를 그대로 내보내지 않는다
// ==============================================================
package com.shinhan.fullstackapi.finance;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FinanceDto {

    public record ProductResponse(Long id, String productType, String bankName, String productName,
                                  BigDecimal interestRate, int periodMonths, long minAmount,
                                  int riskLevel, String description) {
        public static ProductResponse from(FinanceProduct p) {
            return new ProductResponse(p.getId(), p.getProductType().name(), p.getBankName(),
                    p.getProductName(), p.getInterestRate(), p.getPeriodMonths(), p.getMinAmount(),
                    p.getRiskLevel(), p.getDescription());
        }
    }

    public record RateResponse(String currencyCode, String currencyName, BigDecimal rate, LocalDate baseDate) {
        public static RateResponse from(ExchangeRate r) {
            return new RateResponse(r.getCurrencyCode(), r.getCurrencyName(), r.getRate(), r.getBaseDate());
        }
    }
}