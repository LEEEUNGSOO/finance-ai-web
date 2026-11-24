// ==============================================================
// 파일   credit\CreditHistoryRepository.java — CREDIT_HISTORY 테이블 조회
// 역할   "내 이력" = 로그인한 회원 것만, 최신순
// ==============================================================
package com.shinhan.fullstackapi.credit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreditHistoryRepository extends JpaRepository<CreditHistory, Long> {

    // 쿼리 메서드 → where member.username = ? order by id desc
    List<CreditHistory> findByMemberUsernameOrderByIdDesc(String username);
}