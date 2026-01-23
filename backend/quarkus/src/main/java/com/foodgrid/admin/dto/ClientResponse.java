package com.foodgrid.admin.dto;

import com.foodgrid.admin.model.Client;
import com.foodgrid.payment.model.PaymentGatewayType;

import java.util.Date;

public record ClientResponse(
  String id,
  String name,
  String contactEmail,
  Client.Status status,
  Date createdAt,
  Date updatedAt,
  String adminUserId,
  String adminEmail,
  String adminDisplayName,
  String adminPassword,
  PaymentGatewayType defaultGatewayType,
  boolean paymentEnabled,
  boolean autoCaptureEnabled,
  boolean partialRefundEnabled,
  String webhookUrl,
  String paymentGatewayConfig
) {}

