package com.bankapp.auth.security;

import com.bankapp.auth.domain.entity.User;
import com.bankapp.auth.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String userIdOrEmail) throws UsernameNotFoundException {
        User user = tryLoadById(userIdOrEmail);
        if (user == null) {
            user = userRepository.findByEmail(userIdOrEmail)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userIdOrEmail));
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getId().toString())
                .password(user.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .accountLocked(user.getStatus() == User.UserStatus.BANNED)
                .disabled(user.getStatus() == User.UserStatus.SUSPENDED)
                .build();
    }

    private User tryLoadById(String value) {
        try {
            UUID id = UUID.fromString(value);
            return userRepository.findById(id).orElse(null);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
