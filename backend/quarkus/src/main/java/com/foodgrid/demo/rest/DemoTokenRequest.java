package com.foodgrid.demo.rest;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record DemoTokenRequest(
    @NotBlank @Pattern(regexp = "staff|admin|customer") String role
) {}
