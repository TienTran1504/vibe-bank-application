package com.bankapp.transaction.service.impl;

import com.bankapp.transaction.service.ExchangeRateService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
public class ExchangeRateServiceImpl implements ExchangeRateService {

    // Canonical rates expressed as: 1 USD = X units
    private static final Map<String, BigDecimal> RATES_FROM_USD = Map.of(
            "USD", BigDecimal.ONE,
            "VND", new BigDecimal("26000"),
            "EUR", new BigDecimal("0.87")
    );

    // 1.5% conversion fee
    private static final BigDecimal FEE_RATE = new BigDecimal("0.015");

    @Override
    public BigDecimal getRate(String fromCurrency, String toCurrency) {
        if (fromCurrency.equals(toCurrency)) return BigDecimal.ONE;

        BigDecimal fromInUsd = RATES_FROM_USD.get(fromCurrency);
        BigDecimal toInUsd   = RATES_FROM_USD.get(toCurrency);

        if (fromInUsd == null || toInUsd == null) {
            throw new IllegalArgumentException("Unsupported currency pair: " + fromCurrency + " → " + toCurrency);
        }
        // rate = (1 / fromInUsd) * toInUsd  →  converts fromCurrency to toCurrency
        return toInUsd.divide(fromInUsd, 8, RoundingMode.HALF_UP);
    }

    @Override
    public BigDecimal getFeeRate() {
        return FEE_RATE;
    }

    @Override
    public boolean isCrossCurrency(String fromCurrency, String toCurrency) {
        return !fromCurrency.equals(toCurrency);
    }
}
