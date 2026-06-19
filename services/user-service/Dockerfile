FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

COPY pom.xml .
COPY services/base-domain/pom.xml services/base-domain/pom.xml
COPY services/user-service/pom.xml services/user-service/pom.xml

RUN mvn install -N -q

COPY services/base-domain/src services/base-domain/src
RUN mvn install -f services/base-domain/pom.xml -DskipTests -q

COPY services/user-service/src services/user-service/src
RUN mvn package -f services/user-service/pom.xml -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/services/user-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
