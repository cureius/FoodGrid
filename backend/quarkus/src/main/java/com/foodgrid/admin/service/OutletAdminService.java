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
    String adminId = claim("sub"); // Admin user ID from JWT
    if (adminId != null && !adminId.isBlank()) {
      // Restaurant owners can only see their own outlets
      return outletRepository.list("ownerId", adminId).stream().map(OutletAdminService::toResponse).toList();
    }

    // Super admin can see all outlets
    return outletRepository.listAll().stream().map(OutletAdminService::toResponse).toList();
  }

  @Transactional
  public OutletResponse create(OutletUpsertRequest req) {
    String adminId = claim("sub");
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can create outlets");
    }

    // Restaurant owners can only create outlets for themselves
    if (!req.ownerId().equals(adminId)) {
      throw new BadRequestException("Can only create outlets for yourself");
    }

    Outlet o = new Outlet();
    o.id = Ids.uuid();
    o.ownerId = req.ownerId();
    o.name = req.name();
    o.timezone = req.timezone();
    o.status = req.status() != null ? Outlet.Status.valueOf(req.status()) : Outlet.Status.ACTIVE;
    outletRepository.persist(o);
    return toResponse(o);
  }

  @Transactional
  public OutletResponse update(String outletId, OutletUpsertRequest req) {
    String adminId = claim("sub");
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can update outlets");
    }

    Outlet o = outletRepository.findByIdOptional(outletId)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));

    // Restaurant owners can only update their own outlets
    if (!o.ownerId.equals(adminId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    o.name = req.name();
    o.timezone = req.timezone();
    if (req.status() != null) {
      o.status = Outlet.Status.valueOf(req.status());
    }
    outletRepository.persist(o);
    return toResponse(o);
  }

  @Transactional
  public void delete(String outletId) {
    String adminId = claim("sub");
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can delete outlets");
    }

    Outlet o = outletRepository.findByIdOptional(outletId)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));

    // Restaurant owners can only delete their own outlets
    if (!o.ownerId.equals(adminId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    outletRepository.delete(o);
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }

  private static OutletResponse toResponse(Outlet o) {
    return new OutletResponse(o.id, o.ownerId, o.name, o.timezone, o.status.name());
  }
}
