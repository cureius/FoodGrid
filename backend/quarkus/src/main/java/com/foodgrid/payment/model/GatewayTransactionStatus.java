package com.foodgrid.payment.model;

/**
 * Payment transaction status.
 */
public enum GatewayTransactionStatus {
    /** Transaction initiated, waiting for gateway order creation */
    INITIATED,

    /** Gateway order created, pending customer payment */
    PENDING,

    /** Payment authorized but not captured */
    AUTHORIZED,

    /** Payment successfully captured */
    CAPTURED,

    /** Payment failed */
    FAILED,

    /** Payment cancelled by user */
    CANCELLED,

    /** Payment refunded (full) */
    REFUNDED,

    /** Payment partially refunded */
    PARTIALLY_REFUNDED,

    /** Payment expired (timeout) */
    EXPIRED
}
