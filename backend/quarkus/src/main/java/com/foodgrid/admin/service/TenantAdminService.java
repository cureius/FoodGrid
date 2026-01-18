package com.foodgrid.admin.service;

import com.foodgrid.admin.dto.ClientResponse;
import com.foodgrid.admin.dto.ClientUpsertRequest;
import com.foodgrid.admin.model.AdminUser;
import com.foodgrid.admin.model.Client;
import com.foodgrid.admin.repo.AdminUserRepository;
import com.foodgrid.admin.repo.AdminUserRoleRepository;
import com.foodgrid.admin.repo.ClientRepository;
import com.foodgrid.auth.service.PinHasher;
import com.foodgrid.common.util.Ids;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class TenantAdminService {

  @Inject ClientRepository clientRepository;
  @Inject AdminUserRepository adminUserRepository;
  @Inject AdminUserRoleRepository adminUserRoleRepository;
  @Inject PinHasher pinHasher;
  @Inject SecurityIdentity identity;

  private record AdminUserCreationResult(AdminUser user, String password) {}

  public List<ClientResponse> list() {
    // Tenant admin can see all tenants/clients
    return clientRepository.listAll().stream()
      .map(client -> {
        AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
        return toResponse(client, adminUser, null);
      })
      .toList();
  }

  public ClientResponse get(String clientId) {
    Client client = clientRepository.findByIdOptional(clientId)
      .orElseThrow(() -> new NotFoundException("Client not found"));
    AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
    return toResponse(client, adminUser, null);
  }

  @Transactional
  public ClientResponse create(ClientUpsertRequest req) {
    String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can create clients");
    }

    // Check if client with same name already exists
    clientRepository.findByName(req.name()).ifPresent(c -> {
      throw new BadRequestException("Client with this name already exists");
    });

    // Check if contact email is provided and unique
    if (req.contactEmail() != null && !req.contactEmail().isBlank()) {
      clientRepository.findByContactEmail(req.contactEmail()).ifPresent(c -> {
        throw new BadRequestException("Client with this contact email already exists");
      });
    }

    Client client = new Client();
    client.id = Ids.uuid();
    client.name = req.name();
    client.contactEmail = req.contactEmail();
    client.status = req.status() != null ? Client.Status.valueOf(req.status()) : Client.Status.ACTIVE;
    client.createdAt = new Date();
    client.updatedAt = new Date();

    clientRepository.persist(client);

    // Create a client admin user associated with this client
    AdminUserCreationResult result = createClientAdmin(client, req);
    
    return toResponse(client, result.user(), result.password());
  }

  private AdminUserCreationResult createClientAdmin(Client client, ClientUpsertRequest req) {
    // Generate default email if not provided
    String adminEmail = req.adminEmail();
    if (adminEmail == null || adminEmail.isBlank()) {
      // Generate email from client name: "client-name@foodgrid.local"
      String emailBase = client.name.toLowerCase()
        .replaceAll("[^a-z0-9]", "-")
        .replaceAll("-+", "-")
        .replaceAll("^-|-$", "");
      adminEmail = emailBase + "@foodgrid.local";
      
      // Ensure uniqueness
      int counter = 1;
      while (adminUserRepository.findByEmail(adminEmail).isPresent()) {
        adminEmail = emailBase + counter + "@foodgrid.local";
        counter++;
      }
    } else {
      // Check if email already exists
      adminUserRepository.findByEmail(adminEmail).ifPresent(u -> {
        throw new BadRequestException("Admin email already exists");
      });
    }

    // Generate default password if not provided
    String adminPassword = req.adminPassword();
    if (adminPassword == null || adminPassword.isBlank()) {
      // Generate a random password
      adminPassword = UUID.randomUUID().toString().substring(0, 8);
    }

    // Generate display name if not provided
    String adminDisplayName = req.adminDisplayName();
    if (adminDisplayName == null || adminDisplayName.isBlank()) {
      adminDisplayName = client.name + " Admin";
    }

    // Create admin user
    AdminUser adminUser = new AdminUser();
    adminUser.id = Ids.uuid();
    adminUser.email = adminEmail;
    adminUser.passwordHash = pinHasher.hash(adminPassword);
    adminUser.displayName = adminDisplayName;
    adminUser.status = AdminUser.Status.ACTIVE;
    adminUser.clientId = client.id;

    adminUserRepository.persist(adminUser);

    // Assign ADMIN role
    adminUserRoleRepository.replaceRoles(adminUser.id, List.of("ADMIN"));

    return new AdminUserCreationResult(adminUser, adminPassword);
  }

  @Transactional
  public ClientResponse update(String clientId, ClientUpsertRequest req) {
    String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can update clients");
    }

    Client client = clientRepository.findByIdOptional(clientId)
      .orElseThrow(() -> new NotFoundException("Client not found"));

    // Check if name is being changed and if new name already exists
    if (!client.name.equals(req.name())) {
      clientRepository.findByName(req.name()).ifPresent(c -> {
        if (!c.id.equals(clientId)) {
          throw new BadRequestException("Client with this name already exists");
        }
      });
    }

    // Check if contact email is being changed and if new email already exists
    if (req.contactEmail() != null && !req.contactEmail().isBlank()) {
      if (client.contactEmail == null || !client.contactEmail.equals(req.contactEmail())) {
        clientRepository.findByContactEmail(req.contactEmail()).ifPresent(c -> {
          if (!c.id.equals(clientId)) {
            throw new BadRequestException("Client with this contact email already exists");
          }
        });
      }
    }

    client.name = req.name();
    client.contactEmail = req.contactEmail();
    if (req.status() != null) {
      client.status = Client.Status.valueOf(req.status());
    }
    client.updatedAt = new Date();

    clientRepository.persist(client);
    AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
    return toResponse(client, adminUser, null);
  }

  @Transactional
  public void delete(String clientId) {
    String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can delete clients");
    }

    Client client = clientRepository.findByIdOptional(clientId)
      .orElseThrow(() -> new NotFoundException("Client not found"));

    // Delete associated admin user first
    AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
    if (adminUser != null) {
      // Remove roles first
      adminUserRoleRepository.replaceRoles(adminUser.id, List.of());
      // Then delete the admin user
      adminUserRepository.delete(adminUser);
    }

    // Hard delete the client
    clientRepository.delete(client);
  }

  @Transactional
  public ClientResponse activate(String clientId) {
    String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can activate clients");
    }

    Client client = clientRepository.findByIdOptional(clientId)
      .orElseThrow(() -> new NotFoundException("Client not found"));

    client.status = Client.Status.ACTIVE;
    client.updatedAt = new Date();
    clientRepository.persist(client);
    AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
    return toResponse(client, adminUser, null);
  }

  @Transactional
  public ClientResponse deactivate(String clientId) {
    String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can deactivate clients");
    }

    Client client = clientRepository.findByIdOptional(clientId)
      .orElseThrow(() -> new NotFoundException("Client not found"));

    client.status = Client.Status.INACTIVE;
    client.updatedAt = new Date();
    clientRepository.persist(client);
    AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
    return toResponse(client, adminUser, null);
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

  private static ClientResponse toResponse(Client client, AdminUser adminUser, String adminPassword) {
    return new ClientResponse(
      client.id,
      client.name,
      client.contactEmail,
      client.status.name(),
      client.createdAt,
      client.updatedAt,
      adminUser != null ? adminUser.id : null,
      adminUser != null ? adminUser.email : null,
      adminUser != null ? adminUser.displayName : null,
      adminPassword
    );
  }

  private static ClientResponse toResponse(Client client, AdminUser adminUser) {
    return toResponse(client, adminUser, null);
  }
}
