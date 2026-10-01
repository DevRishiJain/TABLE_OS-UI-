"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function StaffLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "staff");
    router.replace(`/login?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background text-gray-100 flex items-center justify-center font-mono text-sm">
      Connecting to Staff Terminal...
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-gray-100 flex items-center justify-center font-mono text-sm">
          Loading Staff Terminal...
        </div>
      }
    >
      <StaffLoginRedirect />
    </Suspense>
  );
}
