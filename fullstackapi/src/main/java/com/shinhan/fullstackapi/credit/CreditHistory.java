// ==============================================================
// 파일   credit\CreditHistory.java — 신용 분석 결과 1건 (테이블 CREDIT_HISTORY)
// 역할   Lab 의 1번 신용 분석은 결과를 화면에만 보여 주고 끝났다
//        Finance AI Web 은 "내 이력에 저장" 을 누르면 누가·언제·어떤 입력으로·몇 등급이 나왔는지 DB 에 남긴다
//
// MEMBER 1 : N CREDIT_HISTORY (회원 한 명이 여러 번 분석할 수 있다)
// ==============================================================
package com.shinhan.fullstackapi.credit;

import com.shinhan.fullstackapi.common.BaseTimeEntity;
import com.shinhan.fullstackapi.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "credit_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CreditHistory extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "credit_seq_gen")
    @SequenceGenerator(name = "credit_seq_gen", sequenceName = "credit_history_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)          // 이력 목록을 볼 때 회원 정보까지 매번 가져오지 않도록 LAZY
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // ----- 입력 (FastAPI credit.py 의 Customer 와 같은 5가지) -----
    private int age;
    private int income;                          // 연소득(만원)
    @Column(precision = 5, scale = 1)
    private BigDecimal debtRatio;                // 부채비율(%)
    private int lateCount;                       // 연체 횟수
    @Column(precision = 5, scale = 1)
    private BigDecimal cardUsage;                // 카드 사용률(%)

    // ----- 결과 (FastAPI 가 돌려준 값) -----
    @Column(precision = 6, scale = 4)
    private BigDecimal lrProb;                   // 로지스틱 회귀 부도 확률
    @Column(precision = 6, scale = 4)
    private BigDecimal dnnProb;                  // DNN 부도 확률
    private int grade;                           // 1~10 등급 (1 이 가장 좋음)

    @Builder
    private CreditHistory(Member member, int age, int income, BigDecimal debtRatio, int lateCount,
                          BigDecimal cardUsage, BigDecimal lrProb, BigDecimal dnnProb, int grade) {
        this.member = member;
        this.age = age;
        this.income = income;
        this.debtRatio = debtRatio;
        this.lateCount = lateCount;
        this.cardUsage = cardUsage;
        this.lrProb = lrProb;
        this.dnnProb = dnnProb;
        this.grade = grade;
    }
}