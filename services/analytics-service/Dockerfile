FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

COPY pom.xml .
COPY services/base-domain/pom.xml services/base-domain/pom.xml
COPY services/analytics-service/pom.xml services/analytics-service/pom.xml

RUN mvn install -N -q

COPY services/base-domain/src services/base-domain/src
RUN mvn install -f services/base-domain/pom.xml -DskipTests -q

COPY services/analytics-service/src services/analytics-service/src
RUN mvn package -f services/analytics-service/pom.xml -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/services/analytics-service/target/*.jar app.jar
EXPOSE 8087
ENTRYPOINT ["java", "-jar", "app.jar"]
