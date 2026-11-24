// ==============================================================
// 파일   finance\FinanceController.java — 금융정보 API 주소 (로그인 없이 누구나)
// 역할   /api/finance/products(검색) · /products/{id} · /rates — AI 챗봇의 bank_products 도구도 여기를 부른다
// ==============================================================
package com.shinhan.fullstackapi.finance;

import com.shinhan.fullstackapi.finance.FinanceDto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 금융정보 조회 (로그인 없이 누구나) — AiService 의 상품 검색 Tool 도 이 API 를 부른다
@RestController
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    // ===== 1. 상품 검색 · 상품 하나 =====
    // GET /api/finance/products?type=SAVING&keyword=청년
    @GetMapping("/api/finance/products")
    public List<ProductResponse> products(@RequestParam(required = false) String type,
                                          @RequestParam(required = false) String keyword) {
        return financeService.searchProducts(type, keyword);
    }

    @GetMapping("/api/finance/products/{id}")
    public ProductResponse product(@PathVariable Long id) {
        return financeService.getProduct(id);
    }

    // ===== 2. 환율 =====
    @GetMapping("/api/finance/rates")
    public List<RateResponse> rates() {
        return financeService.rates();
    }
}