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
    final String cid = clientId();
    final String adminId = subject();
    
    if (cid != null && !cid.isBlank()) {
      // If user has a clientId, they should see all outlets for that client, 
      // PLUS any outlets they personally own that aren't yet assigned to a client.
      return outletRepository.find("clientId = ?1 or (clientId is null and ownerId = ?2)", cid, adminId)
          .stream().map(OutletAdminService::toResponse).toList();
    }

    if (adminId != null && !adminId.isBlank()) {
      // Regular owner access (no clientId in token yet)
      return outletRepository.list("ownerId", adminId).stream().map(OutletAdminService::toResponse).toList();
    }

    // Super admin fallback
    return outletRepository.listAll().stream().map(OutletAdminService::toResponse).toList();
  }

  @Transactional
  public OutletResponse get(final String outletId) {
    final Outlet o = outletRepository.findByIdOptional(outletId)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));
      
    // Auto-migration: If outlet has no clientId but user accessing it does,
    // and this user is the owner, or part of the same client admin group.
    final String cid = clientId();
    if (o.clientId == null && cid != null && !cid.isBlank()) {
        final String sub = subject();
        if (sub != null && sub.equals(o.ownerId)) {
            o.clientId = cid;
            outletRepository.persist(o);
        }
    }
    
    return toResponse(o);
  }

  @Transactional
  public OutletResponse create(final OutletUpsertRequest req) {
    final String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can create outlets");
    }

    // Restaurant owners can only create outlets for themselves
    if (!req.ownerId().equals(adminId)) {
      throw new BadRequestException("Can only create outlets for yourself");
    }

    final Outlet o = new Outlet();
    o.id = Ids.uuid();
    o.ownerId = req.ownerId();
    o.clientId = clientId();
    o.name = req.name();
    o.timezone = req.timezone();
    o.status = req.status() != null ? Outlet.Status.valueOf(req.status()) : Outlet.Status.ACTIVE;
    outletRepository.persist(o);
    return toResponse(o);
  }

  @Transactional
  public OutletResponse update(final String outletId, final OutletUpsertRequest req) {
    final String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can update outlets");
    }

    final Outlet o = outletRepository.findByIdOptional(outletId)
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
  public void delete(final String outletId) {
    final String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can delete outlets");
    }

    final Outlet o = outletRepository.findByIdOptional(outletId)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));

    // Restaurant owners can only delete their own outlets
    if (!o.ownerId.equals(adminId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    outletRepository.delete(o);
  }

  private String clientId() {
    final Object v = identity.getAttributes().get("clientId");
    return v == null ? null : v.toString();
  }

  private String subject() {
    // Quarkus populates principal name with JWT subject.
    if (identity.getPrincipal() != null && identity.getPrincipal().getName() != null && !identity.getPrincipal().getName().isBlank()) {
      return identity.getPrincipal().getName();
    }

    // Fallback to attribute if present.
    final Object v = identity.getAttributes().get("sub");
    return v == null ? null : v.toString();
  }

  private static OutletResponse toResponse(final Outlet o) {
    return new OutletResponse(o.id, o.ownerId, o.name, o.timezone, o.status.name());
  }
}
