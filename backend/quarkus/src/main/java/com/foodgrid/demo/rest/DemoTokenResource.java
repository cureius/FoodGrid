package com.foodgrid.demo.rest;

import com.foodgrid.admin.model.AdminUser;
import com.foodgrid.auth.model.Customer;
import com.foodgrid.auth.model.Employee;
import com.foodgrid.common.security.JwtIssuer;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;

@Path("/api/v1/demo")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DemoTokenResource {

    private static final String DEMO_OUTLET_ID = "demo-outlet-1";
    private static final String DEMO_CLIENT_ID = "demo-admin-1";
    private static final String DEMO_SESSION_ID = "demo-session-1";

    @Inject
    JwtIssuer jwtIssuer;

    @Inject
    EntityManager em;

    @ConfigProperty(name = "foodgrid.demo.enabled", defaultValue = "true")
    boolean demoEnabled;

    @POST
    @Path("/token")
    public Response issueToken(@Valid DemoTokenRequest request) {
        if (!demoEnabled) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity("{\"error\":\"Demo mode is disabled\"}")
                    .build();
        }

        return switch (request.role()) {
            case "staff" -> issueStaffToken();
            case "admin" -> issueAdminToken();
            case "customer" -> issueCustomerToken();
            default -> Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\":\"Invalid role\"}")
                    .build();
        };
    }

    @POST
    @Path("/reset")
    @Transactional
    public Response resetDemoData() {
        if (!demoEnabled) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity("{\"error\":\"Demo mode is disabled\"}")
                    .build();
        }

        // Delete demo orders and related data
        em.createNativeQuery("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE outlet_id = :outletId)")
                .setParameter("outletId", DEMO_OUTLET_ID)
                .executeUpdate();
        em.createNativeQuery("DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE outlet_id = :outletId)")
                .setParameter("outletId", DEMO_OUTLET_ID)
                .executeUpdate();
        em.createNativeQuery("DELETE FROM orders WHERE outlet_id = :outletId")
                .setParameter("outletId", DEMO_OUTLET_ID)
                .executeUpdate();

        return Response.ok("{\"status\":\"reset_complete\"}").build();
    }

    private Response issueStaffToken() {
        final Employee employee = new Employee();
        employee.id = "demo-emp-cashier";
        employee.displayName = "Priya Sharma";

        final String token = jwtIssuer.issueAccessToken(
                employee, DEMO_OUTLET_ID, DEMO_CLIENT_ID,
                List.of("CASHIER", "MANAGER"), DEMO_SESSION_ID);

        return Response.ok(new DemoTokenResponse(
                token, "staff", DEMO_OUTLET_ID, employee.displayName,
                employee.id, DEMO_SESSION_ID)).build();
    }

    private Response issueAdminToken() {
        final AdminUser admin = new AdminUser();
        admin.id = DEMO_CLIENT_ID;
        admin.email = "demo-admin@foodgrid.com";
        admin.displayName = "Demo Restaurant Admin";

        final String token = jwtIssuer.issueAdminAccessToken(
                admin, DEMO_OUTLET_ID, DEMO_CLIENT_ID,
                List.of("CLIENT_ADMIN", "ADMIN"));

        return Response.ok(new DemoTokenResponse(
                token, "admin", DEMO_OUTLET_ID, admin.displayName,
                null, null)).build();
    }

    private Response issueCustomerToken() {
        final Customer customer = new Customer();
        customer.id = "demo-customer-1";
        customer.mobileNumber = "9876543210";
        customer.email = "demo-customer@foodgrid.com";
        customer.displayName = "Demo Customer";

        final String token = jwtIssuer.issueCustomerAccessToken(customer);

        return Response.ok(new DemoTokenResponse(
                token, "customer", DEMO_OUTLET_ID, customer.displayName,
                null, null)).build();
    }
}
