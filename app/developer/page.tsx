import { createClient } from "@supabase/supabase-js";
import type { ProjectPRD } from "@/lib/types";
import PRDStatusCard from "@/components/developer/PRDStatusCard";
import ClientEmailSearch from "@/components/developer/ClientEmailSearch";
import TheramifyLogo from "@/components/ui/TheramifyLogo";

// Next.js 15: searchParams is now a Promise
interface DeveloperPageProps {
  searchParams: Promise<{ clientEmail?: string }>;
}

// Row returned from Supabase with the joined developer profile
type ProjectWithDeveloper = ProjectPRD & {
  profiles: { full_name: string } | null;
};

export default async function DeveloperPage({
  searchParams,
}: DeveloperPageProps) {
  // Await searchParams — required in Next.js 15
  const resolvedParams = await searchParams;
  const clientEmail = resolvedParams.clientEmail?.trim() ?? "";

  // Use the service-role client for intentional public/semi-private access.
  // The developer portal is accessible without authentication (per spec: public/semi-private).
  // All reads are performed server-side with the service role; no anon RLS policy is needed.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch projects_prd with developer name via foreign key join.
  let query = supabase
    .from("projects_prd")
    .select("*, profiles!assigned_developer_id(full_name)")
    .order("created_at", { ascending: false });

  if (clientEmail) {
    query = query.ilike("client_email", `%${clientEmail}%`);
  }

  const { data: rawProjects, error } = await query;

  if (error) {
    console.error("Failed to load PRDs:", error.message);
  }

  const projects: (ProjectPRD & { developer_name?: string })[] = (
    (rawProjects as ProjectWithDeveloper[] | null) ?? []
  ).map((p) => {
    const { profiles, ...rest } = p;
    return {
      ...rest,
      developer_name: profiles?.full_name ?? undefined,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-5 flex items-center gap-4">
          <TheramifyLogo size={48} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Developer &amp; PRD Status Portal
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track project requirements, Lovable generation progress, and
              deployment milestones.
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Search */}
        <div className="mb-8 max-w-xl">
          <ClientEmailSearch defaultValue={clientEmail} />
        </div>

        {/* Filter indicator */}
        {clientEmail && (
          <p className="mb-4 text-sm text-gray-600">
            Showing results for:{" "}
            <span className="font-medium text-indigo-700">{clientEmail}</span>
          </p>
        )}

        {/* PRD grid */}
        {projects.length === 0 ? (
          <div className="rounded-2xl bg-white ring-1 ring-gray-200 px-6 py-16 text-center text-gray-400">
            {clientEmail
              ? `No PRDs found matching "${clientEmail}".`
              : "No PRDs have been created yet."}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
            {projects.map((project) => (
              <PRDStatusCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
