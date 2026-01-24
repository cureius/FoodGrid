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
import com.foodgrid.payment.model.ClientPaymentConfig;
import com.foodgrid.payment.model.PaymentGatewayType;
import com.foodgrid.payment.repo.ClientPaymentConfigRepository;
import com.foodgrid.payment.rest.PaymentGatewayUpdateRequest;
import com.foodgrid.payment.service.PaymentConfigService;
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
  @Inject PaymentConfigService paymentConfigService;
  @Inject ClientPaymentConfigRepository clientPaymentConfigRepository;

  private record AdminUserCreationResult(AdminUser user, String password) {}

  public List<ClientResponse> list() {
    // Tenant admin can see all tenants/clients
    return clientRepository.listAll().stream()
      .map(client -> {
        final AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
        return toResponse(client, adminUser, null);
      })
      .toList();
  }

  public ClientResponse get(final String clientId) {
    final Client client = clientRepository.findByIdOptional(clientId)
      .orElseThrow(() -> new NotFoundException("Client not found"));
    final AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
    return toResponse(client, adminUser, null);
  }

  @Transactional
  public ClientResponse create(final ClientUpsertRequest req) {
    final String adminId = subject();
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

    final Client client = new Client();
    client.id = Ids.uuid();
    client.name = req.name();
    client.contactEmail = req.contactEmail();
    client.status = req.status() != null ? Client.Status.valueOf(req.status()) : Client.Status.ACTIVE;
    client.createdAt = new Date();
    client.updatedAt = new Date();

    clientRepository.persist(client);

    // Create a client admin user associated with this client
    final AdminUserCreationResult result = createClientAdmin(client, req);

    return toResponse(client, result.user(), result.password());
  }

  private AdminUserCreationResult createClientAdmin(final Client client, final ClientUpsertRequest req) {
    // Generate default email if not provided
    String adminEmail = req.adminEmail();
    if (adminEmail == null || adminEmail.isBlank()) {
      // Generate email from client name: "client-name@foodgrid.local"
      final String emailBase = client.name.toLowerCase()
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
    final AdminUser adminUser = new AdminUser();
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
  public ClientResponse update(final String clientId, final ClientUpsertRequest req) {
    final String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can update clients");
    }

    final Client client = clientRepository.findByIdOptional(clientId)
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
    final AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
    return toResponse(client, adminUser, null);
  }

  @Transactional
  public void delete(final String clientId) {
    final String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can delete clients");
    }

    final Client client = clientRepository.findByIdOptional(clientId)
      .orElseThrow(() -> new NotFoundException("Client not found"));

    // Delete associated admin user first
    final AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
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
  public ClientResponse activate(final String clientId) {
    final String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can activate clients");
    }

    final Client client = clientRepository.findByIdOptional(clientId)
      .orElseThrow(() -> new NotFoundException("Client not found"));

    client.status = Client.Status.ACTIVE;
    client.updatedAt = new Date();
    clientRepository.persist(client);
    final AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
    return toResponse(client, adminUser, null);
  }

  @Transactional
  public ClientResponse deactivate(final String clientId) {
    final String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can deactivate clients");
    }

    final Client client = clientRepository.findByIdOptional(clientId)
      .orElseThrow(() -> new NotFoundException("Client not found"));

    client.status = Client.Status.INACTIVE;
    client.updatedAt = new Date();
    clientRepository.persist(client);
    final AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
    return toResponse(client, adminUser, null);
  }

  @Transactional
  public ClientResponse updatePaymentGateway(final String clientId, final PaymentGatewayUpdateRequest request) {
    final String adminId = subject();
    if (adminId == null || adminId.isBlank()) {
      throw new BadRequestException("Only authenticated users can update payment gateway settings");
    }

    final Client client = clientRepository.findByIdOptional(clientId)
      .orElseThrow(() -> new NotFoundException("Client not found"));

    // Find or create the PaymentConfig for the specified gateway type
    var paymentConfig = clientPaymentConfigRepository
      .findActiveByClientAndGateway(clientId, request.defaultGatewayType());

    if (paymentConfig.isEmpty()) {
      throw new BadRequestException("No payment configuration found for gateway type " + request.defaultGatewayType() + ". Please add payment credentials first.");
    }

    final var config = paymentConfig.get();
    
    // Update settings
    config.isActive = request.paymentEnabled();
    config.autoCaptureEnabled = request.autoCaptureEnabled();
    config.partialRefundEnabled = request.partialRefundEnabled();
    config.webhookUrl = request.webhookUrl();
    config.additionalConfig = request.paymentGatewayConfig();
    config.updatedAt = new Date();

    clientPaymentConfigRepository.persist(config);
    
    // Invalidate cache
    paymentConfigService.invalidateCache(clientId, config.gatewayType);

    final AdminUser adminUser = adminUserRepository.find("clientId", client.id).firstResult();
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

  private ClientResponse toResponse(final Client client, final AdminUser adminUser, final String adminPassword) {
    // Fetch payment config from ClientPaymentConfig (primary active config)
    PaymentGatewayType defaultGatewayType = null;
    boolean paymentEnabled = false;
    Boolean autoCaptureEnabled = null;
    Boolean partialRefundEnabled = null;
    String webhookUrl = null;
    String paymentGatewayConfig = null;

    final var primaryPaymentConfig = clientPaymentConfigRepository
      .findPrimaryActiveByClient(client.id);
    
    if (primaryPaymentConfig.isPresent()) {
      final var config = primaryPaymentConfig.get();
      defaultGatewayType = config.gatewayType;
      paymentEnabled = config.isActive;
      autoCaptureEnabled = config.autoCaptureEnabled;
      partialRefundEnabled = config.partialRefundEnabled;
      webhookUrl = config.webhookUrl;
      paymentGatewayConfig = config.additionalConfig;
    }

    return new ClientResponse(
      client.id,
      client.name,
      client.contactEmail,
      client.status,
      client.createdAt,
      client.updatedAt,
      adminUser != null ? adminUser.id : null,
      adminUser != null ? adminUser.email : null,
      adminUser != null ? adminUser.displayName : null,
      adminPassword,
      defaultGatewayType,
      paymentEnabled,
      autoCaptureEnabled != null ? autoCaptureEnabled : true,
      partialRefundEnabled != null ? partialRefundEnabled : true,
      webhookUrl,
      paymentGatewayConfig
    );
  }

  private ClientResponse toResponse(final Client client, final AdminUser adminUser) {
    return toResponse(client, adminUser, null);
  }
}

