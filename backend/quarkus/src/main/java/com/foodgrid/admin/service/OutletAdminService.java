package com.foodgrid.admin.service;

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
public class OutletAdminService {

  @Inject OutletRepository outletRepository;
  @Inject SecurityIdentity identity;

  public List<OutletResponse> list() {
    // If token has outletId claim, limit to that outlet
    String scopedOutletId = claim("outletId");
    if (scopedOutletId != null && !scopedOutletId.isBlank()) {
      Outlet o = outletRepository.findByIdOptional(scopedOutletId)
        .orElseThrow(() -> new NotFoundException("Outlet not found"));
      return List.of(toResponse(o));
    }

    return outletRepository.listAll().stream().map(OutletAdminService::toResponse).toList();
  }

  @Transactional
  public OutletResponse create(OutletUpsertRequest req) {
    ensureGlobalAdmin();

    Outlet o = new Outlet();
    o.id = Ids.uuid();
    o.name = req.name();
    o.timezone = req.timezone();
    outletRepository.persist(o);
    return toResponse(o);
  }

  @Transactional
  public OutletResponse update(String outletId, OutletUpsertRequest req) {
    // If scoped, only allow updating that one outlet
    String scopedOutletId = claim("outletId");
    if (scopedOutletId != null && !scopedOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    Outlet o = outletRepository.findByIdOptional(outletId)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));

    o.name = req.name();
    o.timezone = req.timezone();
    outletRepository.persist(o);
    return toResponse(o);
  }

  @Transactional
  public void delete(String outletId) {
    ensureGlobalAdmin();

    Outlet o = outletRepository.findByIdOptional(outletId)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));
    outletRepository.delete(o);
  }

  private void ensureGlobalAdmin() {
    String scopedOutletId = claim("outletId");
    if (scopedOutletId != null && !scopedOutletId.isBlank()) {
      throw new BadRequestException("Outlet-scoped admin cannot perform this action");
    }
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }

  private static OutletResponse toResponse(Outlet o) {
    return new OutletResponse(o.id, o.name, o.timezone);
  }
}
