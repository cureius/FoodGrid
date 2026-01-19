package com.foodgrid.pos.dto;

import com.foodgrid.pos.model.Supplier;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierUpsertRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 120) String contactPerson,
    @Size(max = 190) String email,
    @Size(max = 30) String phone,
    String address,
    String notes,
    Supplier.Status status
) {}
