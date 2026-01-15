package com.foodgrid.auth.repo;

import com.foodgrid.auth.model.PosDevice;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class DeviceRepository implements PanacheRepositoryBase<PosDevice, String> {
  public Optional<PosDevice> findByDeviceCode(String deviceCode) {
    return find("deviceCode", deviceCode).firstResultOptional();
  }

  public List<PosDevice> listByOutlet(String outletId) {
    return list("outletId", outletId);
  }

  public Optional<PosDevice> findByIdAndOutlet(String deviceId, String outletId) {
    return find("id = ?1 and outletId = ?2", deviceId, outletId).firstResultOptional();
  }
}
