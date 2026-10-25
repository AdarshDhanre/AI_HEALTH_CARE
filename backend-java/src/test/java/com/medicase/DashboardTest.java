package com.medicase;

import com.medicase.entity.User;
import com.medicase.repository.UserRepository;
import com.medicase.service.TrendService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class DashboardTest {

    @Autowired
    private TrendService trendService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testDashboard() {
        User user = userRepository.findByEmail("patient_94567362875062@ayushman.local").orElseThrow();
        try {
            var res = trendService.dashboard(user, 1L);
            System.out.println("DASHBOARD SUCCESS: " + res);
        } catch (Exception e) {
            System.out.println("DASHBOARD EXCEPTION CAUGHT:");
            e.printStackTrace();
            throw e;
        }
    }
}
