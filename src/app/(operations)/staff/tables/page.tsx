"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StaffTablesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/staff/orders");
  }, [router]);

  return null;
}
