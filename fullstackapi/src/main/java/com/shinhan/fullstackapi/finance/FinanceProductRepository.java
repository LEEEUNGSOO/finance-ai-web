package com.shinhan.fullstackapi.finance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FinanceProductRepository extends JpaRepository<FinanceProduct, Long> {

    // ===== 쿼리 메서드: 이름 규칙으로 SQL 이 만들어진다 =====
    List<FinanceProduct> findByProductTypeOrderByInterestRateDesc(ProductType type);

    // ===== JPQL: type 이 null 이면 전체, keyword 는 상품명·은행명·설명에서 찾는다 =====
    @Query("""
            select p from FinanceProduct p
            where (:type is null or p.productType = :type)
              and (p.productName like concat('%', :keyword, '%')
                   or p.bankName like concat('%', :keyword, '%')
                   or p.description like concat('%', :keyword, '%'))
            order by p.interestRate desc, p.id
            """)
    List<FinanceProduct> search(@Param("type") ProductType type, @Param("keyword") String keyword);
}