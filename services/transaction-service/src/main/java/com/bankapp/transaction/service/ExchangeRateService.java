package com.bankapp.transaction.service;

import java.math.BigDecimal;

public interface ExchangeRateService {
    /** Exchange rate to convert 1 unit of fromCurrency into toCurrency. */
    BigDecimal getRate(String fromCurrency, String toCurrency);

    /** Fee rate applied on cross-currency transfers (e.g. 0.015 = 1.5%). */
    BigDecimal getFeeRate();

    boolean isCrossCurrency(String fromCurrency, String toCurrency);
}
