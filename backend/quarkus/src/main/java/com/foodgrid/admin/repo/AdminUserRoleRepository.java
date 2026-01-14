package com.foodgrid.admin.repo;

import io.quarkus.hibernate.orm.panache.Panache;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class AdminUserRoleRepository {
  @SuppressWarnings("unchecked")
  public List<String> listRoles(String adminUserId) {
    return Panache.getEntityManager()
      .createNativeQuery("select role from admin_user_roles where admin_user_id = ?1")
      .setParameter(1, adminUserId)
      .getResultList();
  }
}
