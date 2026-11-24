// ==============================================================
// 파일   common\PageResponse.java — 페이지 응답 모양
// 역할   Page 객체 대신 content · page · totalPages · totalElements 만
// ==============================================================
package com.shinhan.fullstackapi.common;

import org.springframework.data.domain.Page;

import java.util.List;

// Page 객체를 그대로 JSON 으로 내보내지 않고 필요한 값만 담는다
public record PageResponse<T>(
        List<T> content,
        int page,           // 현재 페이지 (0부터)
        int size,
        long totalElements,
        int totalPages
) {
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}