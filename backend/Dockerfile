FROM eclipse-temurin:25-jre-alpine

RUN apk add --no-cache curl \
    && addgroup -S -g 10001 blog \
    && adduser -S -D -H -u 10001 -G blog blog

WORKDIR /app

COPY backend/build/libs/blog-backend-0.0.1-SNAPSHOT.jar app.jar

USER 10001:10001

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
