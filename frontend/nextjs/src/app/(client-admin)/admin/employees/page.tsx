"use client";

import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    window.location.replace("/client-admin/employees");
  }, []);

  return null;
}
