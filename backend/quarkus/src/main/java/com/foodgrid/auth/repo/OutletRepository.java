package com.foodgrid.auth.repo;

import com.foodgrid.auth.model.Outlet;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OutletRepository implements PanacheRepositoryBase<Outlet, String> {}
