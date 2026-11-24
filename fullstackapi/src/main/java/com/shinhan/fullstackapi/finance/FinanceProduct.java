// ==============================================================
// 파일   finance\FinanceProduct.java — 금융상품 엔티티 (테이블 FINANCE_PRODUCT)
// 역할   예금·적금·대출·펀드·카드. 기본 데이터는 data.sql
// ==============================================================
package com.shinhan.fullstackapi.finance;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

// 금융상품 (기본 데이터는 data.sql 로 들어간다)
@Entity
@Table(name = "finance_product")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FinanceProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "product_seq_gen")
    @SequenceGenerator(name = "product_seq_gen", sequenceName = "finance_product_seq", allocationSize = 1)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductType productType;

    @Column(nullable = false, length = 50)
    private String bankName;

    @Column(nullable = false, length = 100)
    private String productName;

    @Column(precision = 5, scale = 2)      // 금리(%) 예: 3.20  — 돈·비율은 double 대신 BigDecimal
    private BigDecimal interestRate;

    private int periodMonths;              // 가입 기간(개월), 펀드·카드는 0

    private long minAmount;                // 최소 가입 금액(원)

    private int riskLevel;                 // 위험 등급 0~5 (높을수록 위험)

    @Column(length = 500)
    private String description;
}