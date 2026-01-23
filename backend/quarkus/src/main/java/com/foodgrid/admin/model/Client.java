package com.foodgrid.admin.model;

import com.foodgrid.payment.model.PaymentGatewayType;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "clients")
public class Client extends PanacheEntityBase {

  @Id
  @Column(length = 36)
  public String id;

  @Column(nullable = false, length = 190)
  public String name;

  @Column(name = "contact_email", length = 190)
  public String contactEmail;

  @Enumerated(EnumType.STRING)
  @Column(length = 32)
  public Status status = Status.ACTIVE;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "created_at")
  public Date createdAt;

  @Temporal(TemporalType.TIMESTAMP)
  @Column(name = "updated_at")
  public Date updatedAt;

  @Enumerated(EnumType.STRING)
  @Column(name = "default_gateway_type", length = 50)
  public PaymentGatewayType defaultGatewayType;

  @Column(name = "payment_enabled")
  public boolean paymentEnabled = false;

  @Column(name = "auto_capture_enabled")
  public boolean autoCaptureEnabled = true;

  @Column(name = "partial_refund_enabled")
  public boolean partialRefundEnabled = true;

  @Column(name = "webhook_url", length = 500)
  public String webhookUrl;

  /** JSON configuration for payment gateway connectivity (API keys, secrets, etc.) */
  @Column(name = "payment_gateway_config", columnDefinition = "TEXT")
  public String paymentGatewayConfig;

  public enum Status {
    ACTIVE,
    INACTIVE
  }
}
