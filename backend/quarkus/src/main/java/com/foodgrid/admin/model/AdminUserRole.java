package com.foodgrid.admin.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "admin_user_roles")
@IdClass(AdminUserRole.AdminUserRoleId.class)
public class AdminUserRole extends PanacheEntityBase {

  @Id
  @Column(name = "admin_user_id", length = 36)
  public String adminUserId;

  @Id
  @Column(name = "role", length = 20)
  public String role;

  public AdminUserRole() {}

  public AdminUserRole(final String adminUserId, final String role) {
    this.adminUserId = adminUserId;
    this.role = role;
  }

  public static class AdminUserRoleId implements Serializable {
    public String adminUserId;
    public String role;

    public AdminUserRoleId() {}

    public AdminUserRoleId(final String adminUserId, final String role) {
      this.adminUserId = adminUserId;
      this.role = role;
    }

    @Override
    public boolean equals(final Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      final AdminUserRoleId that = (AdminUserRoleId) o;
      return Objects.equals(adminUserId, that.adminUserId) && Objects.equals(role, that.role);
    }

    @Override
    public int hashCode() {
      return Objects.hash(adminUserId, role);
    }
  }
}
