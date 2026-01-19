package com.foodgrid.pos.dto;

import com.foodgrid.pos.model.Supplier;

public record SupplierResponse(
    String id,
    String name,
    String contactPerson,
    String email,
    String phone,
    String address,
    String notes,
    Supplier.Status status
) {
  public static SupplierResponse from(Supplier entity) {
    return new SupplierResponse(
        entity.id,
        entity.name,
        entity.contactPerson,
        entity.email,
        entity.phone,
        entity.address,
        entity.notes,
        entity.status
    );
  }
}
