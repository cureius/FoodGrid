package com.foodgrid.customer.service;

import com.foodgrid.admin.dto.OutletResponse;
import com.foodgrid.admin.dto.OutletUpsertRequest;
import com.foodgrid.auth.model.Outlet;
import com.foodgrid.auth.repo.OutletRepository;
import com.foodgrid.common.util.Ids;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.List;

@ApplicationScoped
public class OutletCustomerService {

  @Inject OutletRepository outletRepository;
  @Inject SecurityIdentity identity;

  public List<OutletResponse> list() {
    return outletRepository.listAll().stream().map(OutletCustomerService::toResponse).toList();
  }

  public OutletResponse get(final String outletId) {
    return outletRepository.findByIdOptional(outletId)
      .map(OutletCustomerService::toResponse)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));
  }

  private static OutletResponse toResponse(final Outlet o) {
    return new OutletResponse(o.id, o.ownerId, o.name, o.timezone, o.status.name());
  }
}
