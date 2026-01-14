package com.foodgrid.auth.repo;

import com.foodgrid.auth.model.PosDevice;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class DeviceRepository implements PanacheRepositoryBase<PosDevice, String> {
  public Optional<PosDevice> findByDeviceCode(String deviceCode) {
    return find("deviceCode", deviceCode).firstResultOptional();
  }
}
