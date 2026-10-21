package com.medicase.service;

import com.medicase.dto.request.LoginRequest;
import com.medicase.dto.request.RegisterRequest;
import com.medicase.dto.response.AuthResponse;
import com.medicase.entity.Patient;
import com.medicase.entity.User;
import com.medicase.enums.Role;
import com.medicase.repository.PatientRepository;
import com.medicase.repository.UserRepository;
import com.medicase.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final Set<String> LANGS = Set.of("en", "hi", "mr");

    private final UserRepository users;
    private final PatientRepository patients;
    private final PatientService patientService;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtUtil jwt;
    private final AuditService audit;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.role() == Role.ADMIN) throw new IllegalArgumentException("Admin accounts cannot be self-registered");
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw new IllegalArgumentException("An account with this email already exists");

        User u = new User();
        u.setEmail(email);
        u.setFullName(req.fullName().trim());
        u.setRole(req.role());
        u.setLanguage(req.language() != null && LANGS.contains(req.language()) ? req.language() : "en");
        u.setPasswordHash(encoder.encode(req.password()));
        u = users.save(u);

        if (u.getRole() == Role.PATIENT) {                     // patients get their own record straight away
            Patient p = new Patient();
            p.setPatientUid(patientService.newUid());
            p.setUser(u);
            p.setName(u.getFullName());
            p.setPreferredLanguage(u.getLanguage());
            patients.save(p);
        }
        audit.log(u, "USER_REGISTER", "User", u.getId(), u.getRole().name());
        return toResponse(u);
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(email, req.password()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            throw new BadCredentialsException("Invalid credentials");
        }
        User u = users.findByEmail(email).orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        audit.log(u, "USER_LOGIN", "User", u.getId(), null);
        return toResponse(u);
    }

    public User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetails ud))
            throw new BadCredentialsException("Not authenticated");
        return users.findByEmail(ud.getUsername()).orElseThrow(() -> new BadCredentialsException("Not authenticated"));
    }

    private AuthResponse toResponse(User u) {
        return new AuthResponse(jwt.generate(u.getEmail(), u.getRole().name()), u.getId(), u.getEmail(),
                u.getFullName(), u.getRole().name(), u.getLanguage());
    }
}
