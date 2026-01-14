package com.foodgrid.admin.repo;

import com.foodgrid.admin.model.AdminUser;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class AdminUserRepository implements PanacheRepositoryBase<AdminUser, String> {
  public Optional<AdminUser> findByEmail(String email) {
    return find("email", email).firstResultOptional();
  }
}
