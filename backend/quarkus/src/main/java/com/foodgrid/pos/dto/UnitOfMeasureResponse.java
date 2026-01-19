package com.foodgrid.pos.dto;

import com.foodgrid.pos.model.UnitOfMeasure;
import java.math.BigDecimal;

public record UnitOfMeasureResponse(
    String id,
    String name,
    String abbreviation,
    UnitOfMeasure.UnitType unitType,
    String baseUnitId,
    BigDecimal conversionFactor,
    UnitOfMeasure.Status status
) {
  public static UnitOfMeasureResponse from(UnitOfMeasure entity) {
    return new UnitOfMeasureResponse(
        entity.id,
        entity.name,
        entity.abbreviation,
        entity.unitType,
        entity.baseUnitId,
        entity.conversionFactor,
        entity.status
    );
  }
}
