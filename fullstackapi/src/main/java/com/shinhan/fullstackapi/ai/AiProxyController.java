// ==============================================================
// 파일   ai\AiProxyController.java — /api/ai/** 를 FastAPI 로 전달 (@CrossOrigin 없음 만 뺌 → SecurityConfig 에서 한 번에)
// 역할   React 와 FastAPI 사이의 다리. /api/ai/** 요청을 FastAPI 로 그대로 넘기고, 답도 그대로 돌려준다
//
// 요청 한 번이 지나가는 길 (1번 신용 분석 예)
//   React   post("/credit", 고객)                       api.js
//     → POST http://localhost:8081/api/ai/credit       (Authorization: Bearer 토큰)
//     → JWT 필터가 로그인 확인 (Finance AI Web 에서 추가된 부분)
//     → 이 컨트롤러 post() → targetPath "/api/ai/credit" → "/credit"
//     → POST http://localhost:8001/credit → FastAPI credit.py analyze()
//     → 받은 JSON 글자를 그대로 React 로
// ==============================================================
package com.shinhan.fullstackapi.ai;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/api/ai")
public class AiProxyController {

    private static final String PREFIX = "/api/ai";
    private static final MediaType JSON = new MediaType(MediaType.APPLICATION_JSON, StandardCharsets.UTF_8);   // 한글 안 깨지게

    private final RestClient fastApiClient;

    public AiProxyController(RestClient fastApiClient) {
        this.fastApiClient = fastApiClient;
    }

    // ===== 1. GET 전달 =====
    // GET 전달   예) :8081/api/ai/fx?days=60 → :8001/fx?days=60
    @GetMapping("/**")
    public ResponseEntity<String> get(HttpServletRequest request) {
        String body = fastApiClient.get()
                .uri(targetPath(request))
                .retrieve()
                .body(String.class);
        return ResponseEntity.ok().contentType(JSON).body(body);
    }

    // ===== 2. POST 전달 =====
    // POST 전달  예) :8081/api/ai/credit → :8001/credit  (React 가 보낸 JSON body 도 그대로)
    @PostMapping("/**")
    public ResponseEntity<String> post(HttpServletRequest request, @RequestBody String json) {
        String body = fastApiClient.post()
                .uri(targetPath(request))
                .contentType(MediaType.APPLICATION_JSON)
                .body(json)
                .retrieve()
                .body(String.class);
        return ResponseEntity.ok().contentType(JSON).body(body);
    }

    // ===== 3. 주소 바꾸기 =====
    // "/api/ai/fx?days=60" → "/fx?days=60"
    private String targetPath(HttpServletRequest request) {
        String path = request.getRequestURI().substring(PREFIX.length());
        String query = request.getQueryString();
        System.out.println("[Spring → FastAPI] " + request.getMethod() + " " + path);
        return query == null ? path : path + "?" + query;
    }
}