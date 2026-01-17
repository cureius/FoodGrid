"use client";

import React from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const DISHES = [
  {
    name: "Snapper in Spicy Sour Sauce",
    category: "Soup",
    canServe: 30,
    stockStatus: "High",
  },
  {
    name: "Seafood Fried Noodles",
    category: "Noodle",
    canServe: 30,
    stockStatus: "High",
  },
  {
    name: "Sour Meat Soup",
    category: "Soup",
    canServe: 4,
    stockStatus: "Low",
  },
  {
    name: "Chicken Fried Rice",
    category: "Rice",
    canServe: 1,
    stockStatus: "Low",
  },
];

const CATEGORIES = [
  "All",
  "Soup",
  "Noodle",
  "Rice",
  "Dessert",
  "Drink",
];

export default function InventoryMenuPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <InventoryTabs active="menu" />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>
        <Card>
          <h3 style={{ marginBottom: 16 }}>Filter</h3>

          <section style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>DISHES STATUS</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "All", count: 20 },
                { label: "Available", count: 20 },
                { label: "Not Available", count: 20 },
              ].map((f) => (
                <button
                  key={f.label}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: f.label === "All" ? "var(--primary-light)" : "var(--bg-app)",
                    fontSize: 12,
                  }}
                >
                  {f.label} {" "}
                  <span style={{ opacity: 0.7 }}>{f.count}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>CATEGORY</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CATEGORIES.map((c, idx) => (
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
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <h3>Menu List</h3>
            <div style={{ display: "flex", gap: 12 }}>
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
                  placeholder="Search Dish Name Here"
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 13,
                    width: 220,
                  }}
                />
              </div>
              <button
                style={{
                  background: "var(--primary)",
                  color: "white",
                  padding: "0 20px",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                + Add New Dish
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {DISHES.map((dish) => (
              <Card key={dish.name}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div
                    style={{
                      height: 120,
                      borderRadius: 16,
                      background: "var(--bg-app)",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontWeight: 700 }}>{dish.name}</p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                        }}
                      >
                        {dish.category}
                      </p>
                    </div>
                    <Badge
                      variant={dish.stockStatus === "High" ? "success" : "warning"}
                    >
                      {dish.stockStatus}
                    </Badge>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    Can be served: {dish.canServe}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <ToastBanner message="Dish Added Successfully! Your new dish has been added." />
        </div>
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
        marginTop: 8,
        alignSelf: "center",
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
