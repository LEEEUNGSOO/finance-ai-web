// ==============================================================
// 파일   common\ErrorResponse.java — 에러 응답 JSON 모양
// 역할   {"status":404,"message":"게시글이 없습니다"}
// ==============================================================
package com.shinhan.fullstackapi.common;

// 에러 응답 JSON 모양: {"status":404,"message":"게시글이 없습니다"}
public record ErrorResponse(int status, String message) {
}