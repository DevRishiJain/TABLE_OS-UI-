"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FranchiseDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/restaurant/franchise");
  }, [router]);

  return null;
}
