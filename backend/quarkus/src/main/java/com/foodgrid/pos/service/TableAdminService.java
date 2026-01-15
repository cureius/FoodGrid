package com.foodgrid.pos.service;

import com.foodgrid.common.util.Ids;
import com.foodgrid.pos.dto.DiningTableResponse;
import com.foodgrid.pos.dto.DiningTableUpsertRequest;
import com.foodgrid.pos.model.DiningTable;
import com.foodgrid.pos.repo.DiningTableRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class TableAdminService {

  @Inject DiningTableRepository tableRepository;
  @Inject SecurityIdentity identity;

  public List<DiningTableResponse> list(String outletId) {
    enforceOutlet(outletId);
    return tableRepository.listByOutlet(outletId).stream().map(TableAdminService::toResponse).toList();
  }

  @Transactional
  public DiningTableResponse create(String outletId, DiningTableUpsertRequest req) {
    enforceOutlet(outletId);

    DiningTable t = new DiningTable();
    t.id = Ids.uuid();
    t.outletId = outletId;
    t.tableCode = req.tableCode();
    t.displayName = req.displayName();
    t.capacity = req.capacity() == null ? 0 : req.capacity();
    t.status = parseStatus(req.status());
    t.createdAt = Date.from(Instant.now());
    t.updatedAt = Date.from(Instant.now());

    tableRepository.persist(t);
    return toResponse(t);
  }

  @Transactional
  public DiningTableResponse update(String outletId, String tableId, DiningTableUpsertRequest req) {
    enforceOutlet(outletId);

    DiningTable t = tableRepository.findByIdAndOutlet(tableId, outletId)
      .orElseThrow(() -> new NotFoundException("Table not found"));

    t.tableCode = req.tableCode();
    t.displayName = req.displayName();
    t.capacity = req.capacity() == null ? t.capacity : req.capacity();
    t.status = parseStatus(req.status());
    t.updatedAt = Date.from(Instant.now());

    tableRepository.persist(t);
    return toResponse(t);
  }

  @Transactional
  public void delete(String outletId, String tableId) {
    enforceOutlet(outletId);

    DiningTable t = tableRepository.findByIdAndOutlet(tableId, outletId)
      .orElseThrow(() -> new NotFoundException("Table not found"));

    tableRepository.delete(t);
  }

  private void enforceOutlet(String outletId) {
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }

  private static DiningTable.Status parseStatus(String status) {
    if (status == null || status.isBlank()) return DiningTable.Status.ACTIVE;
    try {
      return DiningTable.Status.valueOf(status);
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("Invalid status");
    }
  }

  private static DiningTableResponse toResponse(DiningTable t) {
    return new DiningTableResponse(t.id, t.outletId, t.tableCode, t.displayName, t.capacity, t.status.name());
  }
}
