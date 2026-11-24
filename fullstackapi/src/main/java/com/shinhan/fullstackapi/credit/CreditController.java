// ==============================================================
// 파일   credit\CreditController.java — 내 신용 분석 이력 API (로그인 필요)
// 역할   POST /api/credit/history  분석하고 저장
//        GET  /api/credit/history  내 이력 목록 (최신순)
// ==============================================================
package com.shinhan.fullstackapi.credit;

import com.shinhan.fullstackapi.credit.CreditDto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/credit/history")
public class CreditController {

    private final CreditService creditService;

    // ===== 1. 분석하고 저장 (201) =====
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HistoryResponse save(@Valid @RequestBody CreditRequest req,
                                @AuthenticationPrincipal UserDetails user) {
        return creditService.save(req, user.getUsername());
    }

    // ===== 2. 내 이력 목록 =====
    @GetMapping
    public List<HistoryResponse> myHistory(@AuthenticationPrincipal UserDetails user) {
        return creditService.myHistory(user.getUsername());
    }
}