package com.foodgrid.demo.rest;

import com.foodgrid.admin.model.AdminUser;
import com.foodgrid.auth.model.Employee;
import com.foodgrid.auth.model.Customer;
import com.foodgrid.common.security.JwtIssuer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/v1/demo/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class DemoAuthResource {

    @Inject
    JwtIssuer jwtIssuer;

    private static final String DEMO_CLIENT_ID = "demo-client-1";
    private static final String DEMO_OUTLET_ID = "demo-outlet-1";

    @GET
    @Path("/token/{role}")
    public Response getDemoToken(@PathParam("role") String role) {
        String token;
        switch (role.toLowerCase()) {
            case "customer":
                Customer customer = new Customer();
                customer.id = "demo-customer-1";
                customer.displayName = "Demo Guest";
                customer.email = "guest@demo.com";
                token = jwtIssuer.issueCustomerAccessToken(customer);
                break;
            case "kitchen":
                Employee kitchen = new Employee();
                kitchen.id = "demo-emp-kitchen";
                kitchen.displayName = "Demo Chef";
                kitchen.outletId = DEMO_OUTLET_ID;
                kitchen.tenantId = DEMO_CLIENT_ID;
                token = jwtIssuer.issueAccessToken(kitchen, DEMO_OUTLET_ID, DEMO_CLIENT_ID, List.of("KITCHEN"), "demo-session");
                break;
            case "cashier":
                Employee cashier = new Employee();
                cashier.id = "demo-emp-cashier";
                cashier.displayName = "Demo Cashier";
                cashier.outletId = DEMO_OUTLET_ID;
                cashier.tenantId = DEMO_CLIENT_ID;
                token = jwtIssuer.issueAccessToken(cashier, DEMO_OUTLET_ID, DEMO_CLIENT_ID, List.of("CASHIER", "MANAGER"), "demo-session");
                break;
            case "admin":
                AdminUser admin = new AdminUser();
                admin.id = "demo-admin-1";
                admin.displayName = "Demo Admin";
                admin.email = "admin@democafe.com";
                token = jwtIssuer.issueAdminAccessToken(admin, DEMO_OUTLET_ID, DEMO_CLIENT_ID, List.of("CLIENT_ADMIN"));
                break;
            case "staff":
                Employee staff = new Employee();
                staff.id = "demo-emp-cashier";
                staff.displayName = "Demo Staff";
                staff.outletId = DEMO_OUTLET_ID;
                staff.tenantId = DEMO_CLIENT_ID;
                token = jwtIssuer.issueAccessToken(staff, DEMO_OUTLET_ID, DEMO_CLIENT_ID, List.of("CASHIER"), "demo-session");
                break;
            default:
                return Response.status(Response.Status.BAD_REQUEST).entity("Invalid demo role").build();
        }

        return Response.ok(new TokenResponse(token)).build();
    }

    public static class TokenResponse {
        public String access_token;
        public TokenResponse(String token) {
            this.access_token = token;
        }
    }
}
