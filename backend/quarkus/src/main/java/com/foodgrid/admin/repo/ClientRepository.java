package com.foodgrid.admin.repo;

import com.foodgrid.admin.model.Client;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class ClientRepository implements PanacheRepositoryBase<Client, String> {
  public Optional<Client> findByName(String name) {
    return find("name", name).firstResultOptional();
  }

  public Optional<Client> findByContactEmail(String contactEmail) {
    return find("contactEmail", contactEmail).firstResultOptional();
  }
}
