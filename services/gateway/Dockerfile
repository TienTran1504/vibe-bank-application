FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Layer 1: POMs only (cached until a dependency changes)
COPY pom.xml .
COPY services/base-domain/pom.xml services/base-domain/pom.xml
COPY services/gateway/pom.xml services/gateway/pom.xml

# Install parent POM into local .m2
RUN mvn install -N -q

# Layer 2: build + install base-domain into local .m2
COPY services/base-domain/src services/base-domain/src
RUN mvn install -f services/base-domain/pom.xml -DskipTests -q

# Layer 3: build gateway fat JAR (repackage declared explicitly in pom.xml)
COPY services/gateway/src services/gateway/src
RUN mvn package -f services/gateway/pom.xml -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/services/gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
