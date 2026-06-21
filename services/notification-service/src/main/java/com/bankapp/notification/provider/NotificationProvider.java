package com.bankapp.notification.provider;

/**
 * Contract for all notification dispatch providers (push, email, SMS).
 * Swap the implementation bean to enable a real provider — no service-layer changes needed.
 */
public interface NotificationProvider {

    /** Human-readable name shown in logs (e.g. "FCM", "SendGrid", "Twilio", "Mock"). */
    String name();

    /**
     * Send a notification to the given recipient.
     *
     * @param recipient  push token, email address, or E.164 phone number depending on channel
     * @param title      notification title / subject
     * @param body       notification body text
     */
    void send(String recipient, String title, String body);
}
