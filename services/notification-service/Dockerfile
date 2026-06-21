FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

COPY pom.xml .
COPY services/base-domain/pom.xml services/base-domain/pom.xml
COPY services/notification-service/pom.xml services/notification-service/pom.xml

RUN mvn install -N -q

COPY services/base-domain/src services/base-domain/src
RUN mvn install -f services/base-domain/pom.xml -DskipTests -q

COPY services/notification-service/src services/notification-service/src
RUN mvn package -f services/notification-service/pom.xml -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/services/notification-service/target/*.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
