// ==============================================================
// 파일   common\BaseTimeEntity.java — 생성일·수정일 공통 부모
// 역할   @CreatedDate · @LastModifiedDate — FullstackapiApplication 의 @EnableJpaAuditing 이 채운다
// ==============================================================
package com.shinhan.fullstackapi.common;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

// 여러 엔티티가 공통으로 쓰는 생성일·수정일 (테이블은 따로 안 만들어짐)
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseTimeEntity {

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}