package com.medicase.security;

import com.medicase.entity.User;
import com.medicase.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository users;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User u = users.findByEmail(email.toLowerCase()).orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new org.springframework.security.core.userdetails.User(
                u.getEmail(), u.getPasswordHash(), u.isActive(), true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())));
    }
}
