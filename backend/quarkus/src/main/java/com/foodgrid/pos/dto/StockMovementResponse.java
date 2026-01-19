package com.foodgrid.pos.dto;

import com.foodgrid.pos.model.StockMovement;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StockMovementResponse(
    String id,
    String ingredientId,
    String ingredientName,
    StockMovement.MovementType movementType,
    BigDecimal quantity,
    String unitId,
    String unitAbbreviation,
    BigDecimal unitCost,
    BigDecimal totalCost,
    String referenceType,
    String referenceId,
    String supplierId,
    String supplierName,
    String purchaseOrderNumber,
    String invoiceNumber,
    String wastageReason,
    BigDecimal stockBefore,
    BigDecimal stockAfter,
    String notes,
    String recordedByEmployeeId,
    String recordedByEmployeeName,
    LocalDateTime recordedAt
) {
  public static StockMovementResponse from(StockMovement entity, String ingredientName, 
                                            String unitAbbreviation, String supplierName,
                                            String employeeName) {
    return new StockMovementResponse(
        entity.id,
        entity.ingredientId,
        ingredientName,
        entity.movementType,
        entity.quantity,
        entity.unitId,
        unitAbbreviation,
        entity.unitCost,
        entity.totalCost,
        entity.referenceType,
        entity.referenceId,
        entity.supplierId,
        supplierName,
        entity.purchaseOrderNumber,
        entity.invoiceNumber,
        entity.wastageReason,
        entity.stockBefore,
        entity.stockAfter,
        entity.notes,
        entity.recordedByEmployeeId,
        employeeName,
        entity.recordedAt
    );
  }
}
