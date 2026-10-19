import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import type { Lead } from "@/lib/types";
import LeadsList from "@/components/employee/LeadsList";
import SignOutButton from "@/components/employee/SignOutButton";

export default async function EmployeeDashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/employee/login");
  }

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .eq("assigned_to", user.id)
    .order("updated_at", { ascending: false });

  if (leadsError) {
    // Surface error without crashing
    console.error("Failed to load leads:", leadsError.message);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top header bar */}
      <header className="bg-indigo-700 text-white">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Employee Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-80">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">My Leads</h2>
        <LeadsList leads={(leads as Lead[]) ?? []} />
      </main>
    </div>
  );
}
