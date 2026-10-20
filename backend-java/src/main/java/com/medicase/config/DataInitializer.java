package com.medicase.config;

import com.medicase.entity.User;
import com.medicase.enums.Role;
import com.medicase.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Creates the first admin account on an empty database. Change the password after first login. */
@Configuration
public class DataInitializer {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    CommandLineRunner seedAdmin(UserRepository users, PasswordEncoder encoder,
                                @Value("${medicase.admin.email}") String email,
                                @Value("${medicase.admin.password}") String password) {
        return args -> {
            if (users.existsByRole(Role.ADMIN)) return;
            User u = new User();
            u.setEmail(email);
            u.setFullName("System Admin");
            u.setRole(Role.ADMIN);
            u.setPasswordHash(encoder.encode(password));
            users.save(u);
            log.warn("Seeded admin account {} - change its password", email);
        };
    }
}
