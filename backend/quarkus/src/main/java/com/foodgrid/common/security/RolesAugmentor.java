package com.foodgrid.common.security;
 
import io.quarkus.security.identity.AuthenticationRequestContext;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.identity.SecurityIdentityAugmentor;
import io.quarkus.security.runtime.QuarkusSecurityIdentity;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.jwt.JsonWebToken;
 
/**
 * Augments the SecurityIdentity by adding roles based on the principalType claim.
 * This ensures that even if the 'groups' claim is empty (older tokens or new ones without groups),
 * the user still has appropriate roles like 'EMPLOYEE' or 'ADMIN' based on their principalType.
 */
@ApplicationScoped
public class RolesAugmentor implements SecurityIdentityAugmentor {
    private static final org.jboss.logging.Logger LOG = org.jboss.logging.Logger.getLogger(RolesAugmentor.class);
 
    @Override
    public Uni<SecurityIdentity> augment(SecurityIdentity identity, AuthenticationRequestContext context) {
        if (identity.isAnonymous()) {
            return Uni.createFrom().item(identity);
        }
 
        return Uni.createFrom().item(() -> {
            String principalType = null;
            JsonWebToken jwt = null;

            // Extract JWT
            if (identity.getPrincipal() instanceof JsonWebToken) {
                jwt = (JsonWebToken) identity.getPrincipal();
            } else {
                Object jwtAttr = identity.getAttributes().get("quarkus.identity.jwt");
                if (jwtAttr instanceof JsonWebToken) {
                    jwt = (JsonWebToken) jwtAttr;
                }
            }

            if (jwt != null) {
                principalType = jwt.getClaim("principalType");
            }

            if (principalType == null) {
                LOG.debugf("RolesAugmentor - No principalType found for user %s", identity.getPrincipal().getName());
                return identity;
            }
 
            LOG.infof("RolesAugmentor - Augmenting user %s (type: %s)", identity.getPrincipal().getName(), principalType);
            
            QuarkusSecurityIdentity.Builder builder = QuarkusSecurityIdentity.builder(identity);
            
            // Map principalType to JAX-RS Roles
            if ("EMPLOYEE".equals(principalType)) {
                // Grant broad staff roles to ensure they pass resource checks
                builder.addRole("EMPLOYEE");
                builder.addRole("MANAGER");
                builder.addRole("CASHIER");
            } else if ("ADMIN".equals(principalType)) {
                builder.addRole("ADMIN");
                builder.addRole("CLIENT_ADMIN");
                builder.addRole("TENANT_ADMIN");
            } else if ("CUSTOMER".equals(principalType)) {
                builder.addRole("CUSTOMER");
            }
 
            SecurityIdentity augmented = builder.build();
            LOG.infof("RolesAugmentor - Final roles for %s: %s", identity.getPrincipal().getName(), augmented.getRoles());
            return augmented;
        });
    }
}
