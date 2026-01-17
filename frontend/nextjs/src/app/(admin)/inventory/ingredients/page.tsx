"use client";

import React from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const INGREDIENTS = [
  {
    name: "Bok Choy",
    category: "Fresh Produce",
    stock: "Stock: 1.5 kg",
    status: "Need Request",
  },
  {
    name: "Romaine Lettuce",
    category: "Fresh Produce",
    stock: "Stock: 4.2 kg",
    status: "Medium",
  },
  {
    name: "Chicken Breast",
    category: "Meat & Poultry",
    stock: "Stock: 10 kg",
    status: "High",
  },
  {
    name: "Salmon Fillet",
    category: "Seafood",
    stock: "Stock: 8 kg",
    status: "Low",
  },
];

export default function InventoryIngredientsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <InventoryTabs active="ingredients" />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>
        <Card>
          <h3 style={{ marginBottom: 16 }}>Filter</h3>

          <section style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>STOCK LEVEL</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "All", count: 20 },
                { label: "Low", count: 20 },
                { label: "Medium", count: 20 },
                { label: "High", count: 20 },
                { label: "Empty", count: 20 },
              ].map((f, idx) => (
                <button
                  key={f.label}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: idx === 0 ? "var(--primary-light)" : "var(--bg-app)",
                    fontSize: 12,
                  }}
                >
                  {f.label} <span style={{ opacity: 0.7 }}>{f.count}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>CATEGORY</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "All",
                "Fresh Produce",
                "Meat & Poultry",
                "Seafood",
                "Dairy & Eggs",
                "Dry Goods & Grains",
              ].map((c, idx) => (
                <button
                  key={c}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: idx === 0 ? "var(--primary-light)" : "transparent",
                    fontSize: 13,
                  }}
                >
                  <span>{c}</span>
                  <span style={{ opacity: 0.7 }}>{idx === 0 ? 64 : 11 + idx * 3}</span>
                </button>
              ))}
            </div>
          </section>

          <button
            style={{
              marginTop: 24,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 999,
              fontSize: 13,
            }}
          >
            ⟳ Reset Filter
          </button>
        </Card>

        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3>Ingredients List</h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 16px",
                borderRadius: 999,
                background: "var(--bg-card)",
                height: 40,
              }}
            >
              <input
                placeholder="Search Ingredients Name Here"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                  width: 260,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {INGREDIENTS.map((ing) => (
              <div
                key={ing.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "280px 1fr 140px 120px 40px",
                  alignItems: "center",
                  padding: "12px 8px",
                  borderRadius: 12,
                  background: "var(--bg-app)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "#222",
                    }}
                  />
                  <div>
                    <p style={{ fontWeight: 600 }}>{ing.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {ing.category}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{ing.stock}</p>

                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>GastroSupplies</p>

                <div style={{ justifySelf: "flex-start" }}>
                  <Badge
                    variant={
                      ing.status === "Need Request"
                        ? "danger"
                        : ing.status === "Low"
                        ? "warning"
                        : "success"
                    }
                  >
                    {ing.status}
                  </Badge>
                </div>

                <button
                  style={{
                    justifySelf: "flex-end",
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: "white",
                  }}
                />
              </div>
            ))}
          </div>

          <ToastBanner message="New Ingredient Added Successfully!" />
        </Card>
      </div>
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
