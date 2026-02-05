package com.foodgrid.common.exception;

/**
 * Exception for resource not found scenarios.
 * Maps to HTTP 404 Not Found.
 */
public class ResourceNotFoundException extends FoodGridException {

    private final String resourceType;
    private final String resourceId;

    public ResourceNotFoundException(final ErrorCode errorCode, final String message) {
        super(errorCode, message);
        this.resourceType = null;
        this.resourceId = null;
    }

    public ResourceNotFoundException(final ErrorCode errorCode, final String resourceType, final String resourceId) {
        super(errorCode, resourceType + " not found with ID: " + resourceId);
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }

    public String getResourceType() {
        return resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public static ResourceNotFoundException employee(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_EMPLOYEE_NOT_FOUND, "Employee", id);
    }

    public static ResourceNotFoundException employeeByEmail(final String email) {
        return new ResourceNotFoundException(ErrorCode.RES_EMPLOYEE_NOT_FOUND, "Employee not found with email: " + email);
    }

    public static ResourceNotFoundException outlet(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_OUTLET_NOT_FOUND, "Outlet", id);
    }

    public static ResourceNotFoundException order(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_ORDER_NOT_FOUND, "Order", id);
    }

    public static ResourceNotFoundException device(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_DEVICE_NOT_FOUND, "Device", id);
    }

    public static ResourceNotFoundException menuItem(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_MENU_ITEM_NOT_FOUND, "MenuItem", id);
    }

    public static ResourceNotFoundException customer(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_CUSTOMER_NOT_FOUND, "Customer", id);
    }

    public static ResourceNotFoundException admin(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_ADMIN_NOT_FOUND, "AdminUser", id);
    }

    public static ResourceNotFoundException payment(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_PAYMENT_NOT_FOUND, "Payment", id);
    }

    public static ResourceNotFoundException transaction(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_TRANSACTION_NOT_FOUND, "Transaction", id);
    }

    public static ResourceNotFoundException challenge(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_CHALLENGE_NOT_FOUND, "Challenge", id);
    }

    public static ResourceNotFoundException table(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_TABLE_NOT_FOUND, "Table", id);
    }

    public static ResourceNotFoundException ingredient(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_INGREDIENT_NOT_FOUND, "Ingredient", id);
    }

    public static ResourceNotFoundException integration(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_INTEGRATION_NOT_FOUND, "Integration", id);
    }

    public static ResourceNotFoundException client(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_CLIENT_NOT_FOUND, "Client", id);
    }

    public static ResourceNotFoundException shift(final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_SHIFT_NOT_FOUND, "Shift", id);
    }

    public static ResourceNotFoundException generic(final String resourceType, final String id) {
        return new ResourceNotFoundException(ErrorCode.RES_NOT_FOUND, resourceType, id);
    }
}
