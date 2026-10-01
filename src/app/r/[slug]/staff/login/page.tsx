"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RestaurantStaffSlugRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      router.replace(`/staff/login?restaurant=${encodeURIComponent(slug)}`);
    }
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-gray-400 font-mono text-xs">
      Connecting to {slug} operations terminal...
    </div>
  );
}
