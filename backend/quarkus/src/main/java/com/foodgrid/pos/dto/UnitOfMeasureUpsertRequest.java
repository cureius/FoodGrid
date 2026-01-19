package com.foodgrid.pos.dto;

import com.foodgrid.pos.model.UnitOfMeasure;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UnitOfMeasureUpsertRequest(
    @NotBlank @Size(max = 50) String name,
    @NotBlank @Size(max = 10) String abbreviation,
    @NotNull UnitOfMeasure.UnitType unitType,
    String baseUnitId,
    BigDecimal conversionFactor,
    UnitOfMeasure.Status status
) {}
