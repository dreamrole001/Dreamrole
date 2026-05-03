// src/main/java/com/jobera/repository/UserCertificationRepository.java
package com.jobera.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jobera.entity.UserCertification;

public interface UserCertificationRepository extends JpaRepository<UserCertification, Long> {
    List<UserCertification> findByUserId(Long userId);
}