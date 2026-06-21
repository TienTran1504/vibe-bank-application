package com.bankapp.wallet.service;

import com.bankapp.wallet.dto.TopUpRequest;
import com.bankapp.wallet.dto.WalletResponse;
import com.bankapp.wallet.dto.WalletTransactionResponse;
import com.bankapp.wallet.dto.WithdrawRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WalletService {
    WalletResponse getOrCreateWallet(UUID userId);
    WalletResponse topUp(UUID userId, TopUpRequest request);
    WalletResponse withdraw(UUID userId, WithdrawRequest request);
    Page<WalletTransactionResponse> listTransactions(UUID userId, Pageable pageable);
}
