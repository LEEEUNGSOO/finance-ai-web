// ==============================================================
// 파일   finance\ExchangeRateRepository.java — EXCHANGE_RATE 테이블 조회
// 역할   전체 환율을 id 순으로
// ==============================================================
package com.shinhan.fullstackapi.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {

    List<ExchangeRate> findAllByOrderByIdAsc();

    Optional<ExchangeRate> findByCurrencyCode(String currencyCode);
}