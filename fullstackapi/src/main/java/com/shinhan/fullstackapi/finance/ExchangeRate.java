// ==============================================================
// 파일   finance\ExchangeRate.java — 환율 엔티티 (테이블 EXCHANGE_RATE)
// 역할   통화 코드 · 이름 · 원화 환율 · 기준일
// ==============================================================
package com.shinhan.fullstackapi.finance;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "exchange_rate")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "rate_seq_gen")
    @SequenceGenerator(name = "rate_seq_gen", sequenceName = "exchange_rate_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, length = 3)
    private String currencyCode;           // USD, JPY ...

    @Column(nullable = false, length = 30)
    private String currencyName;

    @Column(precision = 10, scale = 2)
    private BigDecimal rate;               // 원화 기준

    private LocalDate baseDate;
}