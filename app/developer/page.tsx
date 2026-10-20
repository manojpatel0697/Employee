import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import type { ProjectPRD } from "@/lib/types";
import PRDStatusCard from "@/components/developer/PRDStatusCard";
import ClientEmailSearch from "@/components/developer/ClientEmailSearch";
import DeveloperSignOutButton from "@/components/developer/DeveloperSignOutButton";
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
  // Verify session server-side (middleware also checks, this is defence-in-depth)
  const supabaseAuth = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    redirect("/developer/login");
  }

  // Await searchParams — required in Next.js 15
  const resolvedParams = await searchParams;
  const clientEmail = resolvedParams.clientEmail?.trim() ?? "";

  // Fetch PRDs using service-role client (bypasses RLS for server-side read)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
          {/* Brand + title */}
          <div className="flex items-center gap-4">
            <TheramifyLogo size={48} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Developer &amp; PRD Status Portal
              </h1>
              <p className="text-xs text-gray-500">
                Track project requirements, Lovable generation progress, and
                deployment milestones.
              </p>
            </div>
          </div>

          {/* User info + sign out */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="hidden sm:block text-sm text-gray-500">
              {user.email}
            </span>
            <DeveloperSignOutButton />
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
