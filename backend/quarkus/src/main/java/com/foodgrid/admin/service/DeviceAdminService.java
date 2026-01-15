package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.PosDeviceResponse;
import com.foodgrid.admin.dto.PosDeviceUpdateRequest;
import com.foodgrid.auth.model.PosDevice;
import com.foodgrid.auth.repo.DeviceRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.List;

@ApplicationScoped
public class DeviceAdminService {

  @Inject DeviceRepository deviceRepository;
  @Inject SecurityIdentity identity;

  public List<PosDeviceResponse> list(String outletId) {
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    return deviceRepository.listByOutlet(outletId).stream().map(DeviceAdminService::toResponse).toList();
  }

  @Transactional
  public PosDeviceResponse update(String outletId, String deviceId, PosDeviceUpdateRequest req) {
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    PosDevice d = deviceRepository.findByIdAndOutlet(deviceId, outletId)
      .orElseThrow(() -> new NotFoundException("Device not found"));

    d.name = req.name();
    deviceRepository.persist(d);
    return toResponse(d);
  }

  @Transactional
  public void delete(String outletId, String deviceId) {
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }

    PosDevice d = deviceRepository.findByIdAndOutlet(deviceId, outletId)
      .orElseThrow(() -> new NotFoundException("Device not found"));
    deviceRepository.delete(d);
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }

  private static PosDeviceResponse toResponse(PosDevice d) {
    return new PosDeviceResponse(d.id, d.outletId, d.deviceCode, d.name);
  }
}
