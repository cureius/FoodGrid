"use client";

import React from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const REQUESTS = [
  {
    id: "REQ-1024",
    supplier: "GastroSupplies",
    item: "Bok Choy",
    qty: "5 kg",
    status: "Sent",
  },
  {
    id: "REQ-1025",
    supplier: "Elite Ingredient Co.",
    item: "Salmon Fillet",
    qty: "10 kg",
    status: "Pending",
  },
];

export default function InventoryRequestsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <InventoryTabs active="requests" />

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3>Request List</h3>
          <button
            style={{
              background: "var(--primary)",
              color: "white",
              padding: "10px 18px",
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            + New Request
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                textAlign: "left",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <th style={{ padding: "12px 8px", fontSize: 13, color: "var(--text-muted)" }}>
                Request ID
              </th>
              <th style={{ padding: "12px 8px", fontSize: 13, color: "var(--text-muted)" }}>
                Supplier
              </th>
              <th style={{ padding: "12px 8px", fontSize: 13, color: "var(--text-muted)" }}>
                Item
              </th>
              <th style={{ padding: "12px 8px", fontSize: 13, color: "var(--text-muted)" }}>
                Quantity
              </th>
              <th style={{ padding: "12px 8px", fontSize: 13, color: "var(--text-muted)" }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {REQUESTS.map((r) => (
              <tr
                key={r.id}
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <td style={{ padding: "14px 8px", fontWeight: 600 }}>{r.id}</td>
                <td style={{ padding: "14px 8px" }}>{r.supplier}</td>
                <td style={{ padding: "14px 8px" }}>{r.item}</td>
                <td style={{ padding: "14px 8px" }}>{r.qty}</td>
                <td style={{ padding: "14px 8px" }}>
                  <Badge
                    variant={
                      r.status === "Sent"
                        ? "info"
                        : r.status === "Pending"
                        ? "warning"
                        : "success"
                    }
                  >
                    {r.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <ToastBanner message="Request Sent! Your ingredient request has been sent." />
      </Card>
    </div>
  );
}

function InventoryTabs({ active }: { active: "menu" | "ingredients" | "requests" }) {
  const base = "/inventory";
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Tab href={base + "/menu"} active={active === "menu"}>
        Menu
      </Tab>
      <Tab href={base + "/ingredients"} active={active === "ingredients"}>
        Ingredients
      </Tab>
      <Tab href={base + "/requests"} active={active === "requests"}>
        Request List
      </Tab>
    </div>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "8px 20px",
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        background: active ? "var(--bg-card)" : "transparent",
        boxShadow: active ? "var(--shadow-sm)" : "none",
      }}
    >
      {children}
    </Link>
  );
}

function ToastBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        marginTop: 20,
        alignSelf: "flex-start",
        padding: "12px 20px",
        borderRadius: 12,
        background: "var(--bg-card)",
        boxShadow: "var(--shadow-premium)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "var(--success)",
        }}
      />
      <span style={{ fontSize: 13 }}>{message}</span>
    </div>
  );
}
