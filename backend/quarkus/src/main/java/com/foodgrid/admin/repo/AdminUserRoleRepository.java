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

  public void addRole(String adminUserId, String role) {
    Panache.getEntityManager()
      .createNativeQuery("insert ignore into admin_user_roles (admin_user_id, role) values (?1, ?2)")
      .setParameter(1, adminUserId)
      .setParameter(2, role)
      .executeUpdate();
  }

  public void removeRole(String adminUserId, String role) {
    Panache.getEntityManager()
      .createNativeQuery("delete from admin_user_roles where admin_user_id = ?1 and role = ?2")
      .setParameter(1, adminUserId)
      .setParameter(2, role)
      .executeUpdate();
  }

  public void replaceRoles(String adminUserId, List<String> roles) {
    Panache.getEntityManager()
      .createNativeQuery("delete from admin_user_roles where admin_user_id = ?1")
      .setParameter(1, adminUserId)
      .executeUpdate();

    if (roles == null) return;
    for (String r : roles) {
      if (r == null || r.isBlank()) continue;
      addRole(adminUserId, r);
    }
  }
}
