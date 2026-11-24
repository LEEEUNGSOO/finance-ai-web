// ==============================================================
// 파일   ai\RestClientConfig.java — FastAPI 를 부를 전화기
// 역할   Spring → FastAPI 로 요청을 보낼 RestClient(전화기)를 하나 만들어 둔다
//
// application.yml 의 fastapi.base-url → (@Value) → 이 파일의 RestClient(baseUrl :8001)
//   → (생성자로 들어감) → AiProxyController · CreditService 의 fastApiClient.get() / post()
// ==============================================================
package com.shinhan.fullstackapi.ai;

import java.net.http.HttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient fastApiClient(RestClient.Builder builder,
                                    @Value("${fastapi.base-url}") String baseUrl) {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)      // JDK 기본은 HTTP/2 를 먼저 시도 → FastAPI(uvicorn) 와 맞추려고 1.1 로 고정
                .build();
        return builder
                .baseUrl(baseUrl)                          // 앞 주소 http://localhost:8001 고정 → 쓸 때는 "/credit" 처럼 뒤만
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .build();
    }
}