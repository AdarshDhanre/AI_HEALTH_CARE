package com.medicase.controller;

import com.medicase.dto.response.UserResponse;
import com.medicase.entity.User;
import com.medicase.exception.ResourceNotFoundException;
import com.medicase.repository.UserRepository;
import com.medicase.service.AuditService;
import com.medicase.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final UserRepository users;
    private final AuthService auth;
    private final AuditService audit;

    @GetMapping("/users")
    public List<UserResponse> users() {
        return users.findAll().stream().map(UserResponse::from).toList();
    }

    @PutMapping("/users/{id}/active")
    public UserResponse setActive(@PathVariable Long id, @RequestParam boolean value) {
        User admin = auth.currentUser();
        if (admin.getId().equals(id)) throw new IllegalArgumentException("You cannot deactivate your own account");
        User u = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.setActive(value);
        audit.log(admin, value ? "USER_ACTIVATE" : "USER_DEACTIVATE", "User", id, null);
        return UserResponse.from(users.save(u));
    }
}
