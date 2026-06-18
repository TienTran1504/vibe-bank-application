# DevOps — Docker, Kubernetes & CI/CD

## Local Development Setup

### Option A — Full Stack via Docker (recommended)
Builds and starts everything (infra + all services) in one command:
```bash
docker-compose up -d --build
```
On first run this compiles all services inside Docker (~3-5 min). Subsequent runs use layer cache and are fast.

To rebuild only one service after a code change:
```bash
docker-compose up -d --build auth-service
docker-compose up -d --build gateway
```

### Option B — Infra via Docker, Services via Maven (for local dev / debugging)
```bash
# Start infra only
docker-compose up -d postgres redis mongodb kafka zookeeper

# Start a service with hot-reload (picks up .env or env vars)
mvn spring-boot:run -pl services/auth-service -am
```

### Service Startup Order
1. Zookeeper → Kafka
2. PostgreSQL, Redis, MongoDB (parallel)
3. Auth Service `:8001`
4. API Gateway `:8080`
5. Other services (parallel)

### Frontend (npm workspaces)
```bash
cd frontend
npm install              # installs all workspaces (shared, mobile, admin)
npm run dev -w admin     # start admin dashboard
npm run start -w mobile  # start React Native metro bundler
```

### Environment Variables (per service)
Each service reads from environment or a `.env` file (gitignored).
Run `mvn install -N` once from the root before running any service for the first time (installs the parent POM).
```env
# Auth Service (:8001)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/auth_db
SPRING_DATASOURCE_USERNAME=bankapp
SPRING_DATASOURCE_PASSWORD=secret
SPRING_REDIS_HOST=localhost
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
JWT_SECRET=your-256-bit-secret-must-be-32-chars-min
JWT_ACCESS_EXPIRY_MS=900000
JWT_REFRESH_EXPIRY_MS=604800000
OTP_TTL_SECONDS=300
```

---

## Docker (Per Service)

### Multi-Module Dockerfile Pattern
This project is a Maven multi-module build. All Dockerfiles use the project root as build context
and follow this step-by-step pattern to correctly produce an executable fat JAR:

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Layer 1: POMs only — cached until a dependency version changes
COPY pom.xml .
COPY services/base-domain/pom.xml services/base-domain/pom.xml
COPY services/<service-name>/pom.xml services/<service-name>/pom.xml

# Install parent POM into local .m2 so child modules can resolve it
RUN mvn install -N -q

# Layer 2: build + install base-domain into local .m2
COPY services/base-domain/src services/base-domain/src
RUN mvn install -f services/base-domain/pom.xml -DskipTests -q

# Layer 3: build the service fat JAR
COPY services/<service-name>/src services/<service-name>/src
RUN mvn package -f services/<service-name>/pom.xml -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/services/<service-name>/target/*.jar app.jar
EXPOSE <port>
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Key rules for every service Dockerfile:**
- Build context must be the **project root** (`context: .` in docker-compose), not the service directory
- Use `-f services/<name>/pom.xml` (not `-pl`) to avoid reactor interference
- Install parent POM with `mvn install -N` before building any module
- Install base-domain with `mvn install` (not `package`) so it lands in local `.m2`
- `spring-boot-maven-plugin` must declare an explicit `<execution>` with `<goal>repackage</goal>` in the service's `pom.xml` — do not rely on the default lifecycle binding in multi-module Docker builds

### .dockerignore
A `.dockerignore` at the project root prevents local `target/` directories and `node_modules`
from being sent to the Docker daemon (dramatically speeds up build context transfer):
```
**/target/
frontend/node_modules/
frontend/.expo/
**/.git/
**/.idea/
**/.vscode/
```

### docker-compose service block pattern
```yaml
  <service-name>:
    build:
      context: .                                    # MUST be project root
      dockerfile: services/<service-name>/Dockerfile
    container_name: bankapp-<service-name>
    ports:
      - "<port>:<port>"
    environment:
      SPRING_PROFILES_ACTIVE: docker
      JWT_SECRET: ${JWT_SECRET:-change-me-in-production-must-be-256-bits!!}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      kafka:
        condition: service_healthy
```

---

## Kubernetes (Helm Charts)

### Chart Structure
```
infra/helm/
├── Chart.yaml
├── values.yaml              # Default values
├── values-staging.yaml      # Staging overrides
├── values-prod.yaml         # Production overrides
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── configmap.yaml
    ├── secret.yaml
    ├── hpa.yaml              # Horizontal Pod Autoscaler
    └── ingress.yaml
```

### Deployment Template
```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.serviceName }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Values.serviceName }}
  template:
    spec:
      containers:
      - name: {{ .Values.serviceName }}
        image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
        ports:
        - containerPort: {{ .Values.service.port }}
        env:
        - name: SPRING_DATASOURCE_URL
          valueFrom:
            secretKeyRef:
              name: {{ .Values.serviceName }}-secret
              key: datasource-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: {{ .Values.service.port }}
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: {{ .Values.service.port }}
          initialDelaySeconds: 60
          periodSeconds: 30
```

### Helm Commands
```bash
# Install / upgrade
helm upgrade --install bankapp-user-service ./infra/helm \
  -f infra/helm/values-prod.yaml \
  --set image.tag=v1.2.3 \
  --namespace bankapp

# Check rollout
kubectl rollout status deployment/bankapp-user-service -n bankapp

# Rollback
helm rollback bankapp-user-service 1 -n bankapp
```

---

## CI/CD Pipeline (GitHub Actions)

### `.github/workflows/deploy.yml`
```yaml
name: Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'
    - name: Run tests
      run: mvn test --no-transfer-progress

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_TOKEN }}
    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        push: true
        tags: bankapp/user-service:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to K8s
      run: |
        helm upgrade --install bankapp-user-service ./infra/helm \
          --set image.tag=${{ github.sha }} \
          --namespace bankapp
```

---

## Observability Stack

### Prometheus + Grafana
- Spring Boot Actuator exposes `/actuator/prometheus` on each service
- Prometheus scrapes all services every 15s
- Grafana dashboards:
  - **Golden Signals**: request rate, error rate, latency (p50/p95/p99)
  - **Transaction Volume**: total, by type, by status
  - **JVM Health**: heap usage, GC time, thread count
  - **Kafka Lag**: consumer group lag per topic

### ELK Stack (Logging)
- Logstash collects logs from all services
- Elasticsearch indexes and stores
- Kibana dashboards for log search and analysis
- Log format: structured JSON with `traceId`, `spanId`, `userId`, `level`, `message`

### Spring Boot Actuator Endpoints
Enable in `application.yml`:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true  # /health/readiness and /health/liveness for K8s
```

---

## Load Testing
Use `k6` for load testing before any production deploy:
```javascript
// infra/load-tests/transfer.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Ramp up
    { duration: '1m', target: 1000 },   // Sustain
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% under 500ms
    http_req_failed: ['rate<0.01'],     // Less than 1% errors
  },
};

export default function () {
  const res = http.post('/api/v1/transactions/transfer', JSON.stringify({
    fromAccountId: '...',
    toAccountId: '...',
    amount: '1.00',
    currency: 'USD',
  }), { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` } });

  check(res, { 'status is 202': (r) => r.status === 202 });
}
```

Run: `k6 run infra/load-tests/transfer.js`
