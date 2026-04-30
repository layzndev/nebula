"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /dashboard is now an alias for /servers — the customer's first stop.
export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/servers");
  }, [router]);
  return null;
}
