package com.bankapp.notification.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Mock email provider — logs instead of calling SendGrid/SMTP.
 *
 * To enable real email (Phase 5):
 *  1. Add sendgrid-java dependency to pom.xml
 *  2. Implement a SendGridEmailProvider using SendGrid.api()
 *  3. Set notification.email.enabled=true and provide SENDGRID_API_KEY env var
 *  4. Annotate SendGridEmailProvider with @ConditionalOnProperty(name="notification.email.enabled", havingValue="true")
 */
@Slf4j
@Component("emailProvider")
@ConditionalOnProperty(name = "notification.email.enabled", havingValue = "false", matchIfMissing = true)
public class MockEmailProvider implements NotificationProvider {

    @Override
    public String name() { return "Mock-Email"; }

    @Override
    public void send(String recipient, String title, String body) {
        log.info("[{}] EMAIL → to={} | subject='{}' | body='{}'", name(), recipient, title, body);
    }
}
