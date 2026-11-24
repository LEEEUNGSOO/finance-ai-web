// ==============================================================
// 파일   finance\ProductType.java — 상품 종류
// 역할   DB 에는 'DEPOSIT' 같은 글자로 저장된다 (@Enumerated(EnumType.STRING))
// ==============================================================
package com.shinhan.fullstackapi.finance;

public enum ProductType {
    DEPOSIT,   // 예금
    SAVING,    // 적금
    LOAN,      // 대출
    FUND,      // 펀드
    CARD       // 카드
}