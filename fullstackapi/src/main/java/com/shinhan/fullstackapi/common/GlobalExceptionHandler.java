// ==============================================================
// 파일   common\GlobalExceptionHandler.java — 에러를 React 가 읽을 수 있는 JSON 으로
// 역할   Lab 의 FastAPI 에러 처리 2개 + 풀스택 에러 처리 2개를 한 파일에 모았다
//
// FastAPI 꺼짐            → 503 {"message": "AI 서버(FastAPI)에 연결할 수 없습니다."}   (Lab)
// FastAPI 가 에러로 답    → 같은 상태 코드 + {"detail": "..."} 그대로                   (Lab)
// Service 의 업무 에러    → ResponseStatusException → {"status":404,"message":"게시글이 없습니다"}
// @Valid 검증 실패        → 400 {"status":400,"message":"title: 공백일 수 없습니다"}
//   → React api.js 가 detail 또는 message 를 꺼내 빨간 상자에 표시
// ==============================================================
package com.shinhan.fullstackapi.common;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // (Lab) FastAPI 꺼짐 → 503
    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<Map<String, String>> fastApiDown(ResourceAccessException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", "AI 서버(FastAPI)에 연결할 수 없습니다."));
    }

    // (Lab) FastAPI 가 에러로 답함 → 그대로 전달
    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<String> fastApiError(RestClientResponseException e) {
        return ResponseEntity.status(e.getStatusCode())
                .contentType(new MediaType(MediaType.APPLICATION_JSON, StandardCharsets.UTF_8))
                .body(e.getResponseBodyAsString(StandardCharsets.UTF_8));
    }

    // (풀스택) Service 에서 throw new ResponseStatusException(HttpStatus.NOT_FOUND, "...")
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleStatus(ResponseStatusException e) {
        int status = e.getStatusCode().value();
        return ResponseEntity.status(status).body(new ErrorResponse(status, e.getReason()));
    }

    // (풀스택) @Valid 검증 실패
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValid(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .findFirst().orElse("입력값을 확인하세요");
        return ResponseEntity.badRequest().body(new ErrorResponse(400, msg));
    }
}