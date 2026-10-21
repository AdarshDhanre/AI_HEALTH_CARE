package com.medicase.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
@Getter @Setter @NoArgsConstructor
public class Patient {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_uid", nullable = false, unique = true)
    private String patientUid;

    @ManyToOne @JoinColumn(name = "user_id")
    private User user;               // set when the patient has their own login

    @ManyToOne @JoinColumn(name = "doctor_id")
    private User doctor;             // treating practitioner

    @Column(nullable = false)
    private String name;

    private LocalDate dob;
    private String gender;
    private String phone;\n\n    @Column(name = "email")\n    private String email;

    @Column(name = "diet_pref", nullable = false)
    private String dietPref = "VEGETARIAN";

    @Column(name = "preferred_language", nullable = false)
    private String preferredLanguage = "en";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
