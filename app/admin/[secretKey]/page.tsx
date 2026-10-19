import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Lead, Profile, ProjectPRD } from "@/lib/types";
import CSVImport from "@/components/admin/CSVImport";
import LeadsTable from "@/components/admin/LeadsTable";
import EmployeeStats from "@/components/admin/EmployeeStats";
import PRDManager from "@/components/admin/PRDManager";

interface AdminPageProps {
  params: { secretKey: string };
}

export default async function AdminPage({ params }: AdminPageProps) {
  // Guard: redirect to /not-found if secret key doesn't match
  if (params.secretKey !== process.env.ADMIN_SECRET_KEY) {
    redirect("/not-found");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [
    { data: employees },
    { data: leads },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "employee")
      .order("full_name"),
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("projects_prd")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const secretKey = params.secretKey;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col py-6 px-4 gap-2 flex-shrink-0">
        <h1 className="text-lg font-bold mb-6 px-2 text-white">Admin Panel</h1>
        <a
          href={`#leads`}
          className="rounded-lg px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
        >
          Leads
        </a>
        <a
          href={`#analytics`}
          className="rounded-lg px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
        >
          Analytics
        </a>
        <a
          href={`#prds`}
          className="rounded-lg px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
        >
          PRDs
        </a>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-white overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-12">

          {/* Leads section */}
          <section id="leads">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lead Pipeline</h2>
            <div className="mb-6">
              <CSVImport />
            </div>
            <LeadsTable
              leads={(leads as Lead[]) ?? []}
              employees={(employees as Profile[]) ?? []}
              secretKey={secretKey}
            />
          </section>

          {/* Analytics section */}
          <section id="analytics">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Employee Analytics
            </h2>
            <EmployeeStats
              leads={(leads as Lead[]) ?? []}
              employees={(employees as Profile[]) ?? []}
            />
          </section>

          {/* PRDs section */}
          <section id="prds">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Project PRDs
            </h2>
            <PRDManager projects={(projects as ProjectPRD[]) ?? []} />
          </section>
        </div>
      </main>
    </div>
  );
}
