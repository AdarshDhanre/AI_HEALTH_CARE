package com.medicase.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwt;
    private final CustomUserDetailsService userDetails;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            jwt.validate(header.substring(7)).ifPresent(email -> {
                try {
                    UserDetails ud = userDetails.loadUserByUsername(email);
                    if (ud.isEnabled()) {                       // deactivated users are cut off immediately
                        var auth = new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                } catch (Exception ignored) { /* unknown user -> stays unauthenticated */ }
            });
        }
        chain.doFilter(req, res);
    }
}
