package com.bankapp.notification.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Mock SMS provider — logs instead of calling Twilio.
 *
 * To enable real SMS (Phase 5 / future):
 *  1. Add the Twilio Java SDK to pom.xml:
 *       <dependency>
 *           <groupId>com.twilio.sdk</groupId>
 *           <artifactId>twilio</artifactId>
 *           <version>9.x.x</version>
 *       </dependency>
 *  2. Create TwilioSmsProvider:
 *       @Component("smsProvider")
 *       @ConditionalOnProperty(name="notification.sms.enabled", havingValue="true")
 *       public class TwilioSmsProvider implements NotificationProvider {
 *           @Value("${notification.sms.twilio-account-sid}") String accountSid;
 *           @Value("${notification.sms.twilio-auth-token}")  String authToken;
 *           @Value("${notification.sms.twilio-from-number}") String fromNumber;
 *
 *           @PostConstruct
 *           void init() { Twilio.init(accountSid, authToken); }
 *
 *           @Override public String name() { return "Twilio"; }
 *
 *           @Override
 *           public void send(String toNumber, String title, String body) {
 *               Message.creator(new PhoneNumber(toNumber),
 *                               new PhoneNumber(fromNumber),
 *                               title + ": " + body).create();
 *           }
 *       }
 *  3. Set in application.yml or env:
 *       notification.sms.enabled=true
 *       TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
 *       TWILIO_AUTH_TOKEN=your_auth_token
 *       TWILIO_FROM_NUMBER=+15005550006
 *  4. Remove @ConditionalOnProperty from this class (or change havingValue to "false").
 */
@Slf4j
@Component("smsProvider")
@ConditionalOnProperty(name = "notification.sms.enabled", havingValue = "false", matchIfMissing = true)
public class MockSmsProvider implements NotificationProvider {

    @Override
    public String name() { return "Mock-SMS"; }

    @Override
    public void send(String recipient, String title, String body) {
        log.info("[{}] SMS → to={} | message='{}: {}'", name(), recipient, title, body);
    }
}
