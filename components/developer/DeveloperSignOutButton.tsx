"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import Button from "@/components/ui/Button";

export default function DeveloperSignOutButton() {
  const router = useRouter();
  const supabase = createBrowserClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/developer/login");
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
