package com.foodgrid.auth.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "employee_shift_schedules")
public class EmployeeShiftSchedule extends PanacheEntityBase {
  @Id
  @Column(length = 36)
  public String id;

  @Column(name = "employee_id", nullable = false, length = 36)
  public String employeeId;

  @Column(name = "outlet_id", nullable = false, length = 36)
  public String outletId;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "start_at", nullable = false)
  public Date startAt;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "end_at", nullable = false)
  public Date endAt;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "created_at")
  public Date createdAt;
}
