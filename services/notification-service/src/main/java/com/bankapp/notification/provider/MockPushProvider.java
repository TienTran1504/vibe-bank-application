package com.bankapp.notification.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Mock push provider — logs instead of calling FCM/APNs.
 *
 * To enable real push notifications (Phase 5):
 *  1. Add the Firebase Admin SDK dependency to pom.xml
 *  2. Implement a FcmPushProvider that calls FirebaseMessaging.getInstance().send()
 *  3. Set notification.push.enabled=true and provide FCM_SERVER_KEY env var
 *  4. Annotate FcmPushProvider with @ConditionalOnProperty(name="notification.push.enabled", havingValue="true")
 *     and remove @ConditionalOnProperty from this class (or give it havingValue="false")
 */
@Slf4j
@Component("pushProvider")
@ConditionalOnProperty(name = "notification.push.enabled", havingValue = "false", matchIfMissing = true)
public class MockPushProvider implements NotificationProvider {

    @Override
    public String name() { return "Mock-Push"; }

    @Override
    public void send(String recipient, String title, String body) {
        log.info("[{}] PUSH → token={} | title='{}' | body='{}'", name(), recipient, title, body);
    }
}
