package com.foodgrid.pos.dto;

import com.foodgrid.pos.model.StockMovement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record StockMovementCreateRequest(
    @NotBlank String ingredientId,
    @NotNull StockMovement.MovementType movementType,
    @NotNull BigDecimal quantity,
    @NotNull String unitId,
    BigDecimal unitCost,
    String supplierId,
    String purchaseOrderNumber,
    String invoiceNumber,
    String wastageReason,
    String notes
) {}
