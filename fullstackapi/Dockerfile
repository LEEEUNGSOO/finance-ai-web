# ==============================================================
# 파일   fullstackapi\Dockerfile — Spring 서버를 컨테이너로 만드는 설명서
# 역할   1단계 gradle 로 jar 만들기 → 2단계 jar 만 들고 가볍게 실행
#        서버에 JDK · Gradle 을 따로 깔 필요가 없습니다 (Docker 만 있으면 됩니다)
# ==============================================================
# 두 단계(multi-stage, 여러 단계) 빌드로 작은 실행 이미지를 만듭니다.
# 흐름: gradle 이미지에서 jar 빌드 → JRE 이미지로 jar 만 복사 → java -jar 로 실행

# ===== 1단계: 빌드 (Gradle 8.14.3 + JDK 21) =====
# AS build — 이 단계에 build 라는 이름을 붙여 2단계에서 꺼내 씁니다
FROM gradle:8.14.3-jdk21 AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src ./src
RUN gradle bootJar --no-daemon -q          # → build/libs/fullstackapi-0.0.1-SNAPSHOT.jar

# ===== 2단계: 실행 (JRE 21 만) =====
FROM eclipse-temurin:21-jre
WORKDIR /app
# 1단계(build)에서 만든 jar 하나만 app.jar 로 가져옵니다
COPY --from=build /app/build/libs/*-SNAPSHOT.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]