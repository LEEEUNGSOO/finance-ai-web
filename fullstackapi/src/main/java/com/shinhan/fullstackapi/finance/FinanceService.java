// ==============================================================
// 파일   finance\FinanceService.java — 금융정보 조회 로직
// 역할   type 글자를 ProductType 으로 바꾸고, 잘못된 값이면 400
// ==============================================================
package com.shinhan.fullstackapi.finance;

import com.shinhan.fullstackapi.finance.FinanceDto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceService {

    private final FinanceProductRepository productRepository;
    private final ExchangeRateRepository rateRepository;

    // type: DEPOSIT / SAVING / LOAN / FUND / CARD (없으면 전체), keyword: 검색어 (없으면 전체)
    public List<ProductResponse> searchProducts(String type, String keyword) {
        ProductType productType = parseType(type);
        String kw = (keyword == null) ? "" : keyword.trim();
        return productRepository.search(productType, kw).stream()
                .map(ProductResponse::from)
                .toList();
    }

    public ProductResponse getProduct(Long id) {
        return productRepository.findById(id)
                .map(ProductResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품이 없습니다"));
    }

    public List<RateResponse> rates() {
        return rateRepository.findAllByOrderByIdAsc().stream().map(RateResponse::from).toList();
    }

    private ProductType parseType(String type) {
        if (type == null || type.isBlank()) return null;
        try {
            return ProductType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type 은 DEPOSIT, SAVING, LOAN, FUND, CARD 중 하나입니다");
        }
    }
}