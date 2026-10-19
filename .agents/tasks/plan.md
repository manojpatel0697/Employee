# Implementation Plan — Agency Operations, Lead Pipeline & PRD Status Portal

> Greenfield Next.js 14 + Supabase project. Every file is created from scratch.
> Artifact root: `.agents/tasks/agency-portal/`

---

## Design Decisions

1. **Supabase client split** — three distinct clients are needed:
   - `lib/supabase.ts` → browser client (`createClientComponentClient`) for client components.
   - `lib/supabase-server.ts` → server client (`createServerComponentClient`) for Server Components and API routes that respect the user's session and RLS.
   - Service-role client created inline in admin API routes only, never exposed to the browser.

2. **Admin secret protection** — middleware intercepts `/admin/:secretKey` at the edge, compares the path segment to `ADMIN_SECRET_KEY` env var, and redirects to `/not-found` on mismatch. The admin page server component re-validates as defence-in-depth.

3. **Status auto-derivation** — when an employee saves a lead, the API route computes `status` from the boolean fields (`is_interested → Contacted`, `demo_website_sent → Demo Sent`, `meeting_scheduled → Meeting Scheduled`, `site_visit_requested → Site Visit Requested`) so the modal never asks for a raw status string.

4. **CSV import** — handled via a dedicated API route `/api/leads/import` using `papaparse` on the server. The service-role client bulk-inserts rows, bypassing RLS.

5. **No external UI library** — all components use Tailwind only, matching the spec.

---

## Implementation Plan

- [ ] 1. **Bootstrap project scaffold**
      Run `create-next-app` equivalent by writing `package.json`, `tsconfig.json`, `next.config.js`, `postcss.config.js`, `tailwind.config.ts`, and `.env.example`. These files define the whole build pipeline.
      Files:
      - `package.json`
      - `tsconfig.json`
      - `next.config.js`
      - `postcss.config.js`
      - `tailwind.config.ts`
      - `.env.example`
      Verify: `npm install` completes without errors; `npx tsc --noEmit` finds no type errors after all files exist.

- [ ] 2. **Database migration SQL**
      Write the single SQL migration that creates `profiles`, `leads`, `projects_prd` tables with all columns, constraints, RLS enable statements, and RLS policies exactly matching the schema in the spec.
      Files:
      - `supabase/migrations/001_schema.sql`
      Verify: File exists; SQL is syntactically valid (reviewed manually or via `psql --dry-run`).

- [ ] 3. **Shared types and Supabase client utilities**
      Define all TypeScript types (Profile, Lead, ProjectPRD with all enum unions) in `lib/types.ts`. Write the browser client in `lib/supabase.ts` and the server client factory in `lib/supabase-server.ts`.
      Notes:
      - `lib/supabase.ts` exports `createBrowserClient()` using `@supabase/auth-helpers-nextjs` `createClientComponentClient`.
      - `lib/supabase-server.ts` exports `createServerClient(cookieStore)` using `createServerComponentClient`.
      - Both are typed with the `Database` generic (inlined from `lib/types.ts`).
      Files:
      - `lib/types.ts`
      - `lib/supabase.ts`
      - `lib/supabase-server.ts`
      Verify: `npx tsc --noEmit` — no type errors on these files.

- [ ] 4. **Middleware**
      Write `middleware.ts` at the repo root. Logic:
      - For `/admin/:secretKey` paths: extract segment, compare to `process.env.ADMIN_SECRET_KEY`. On mismatch → `NextResponse.redirect('/not-found')`.
      - For `/employee/dashboard`: use `@supabase/auth-helpers-nextjs` `createMiddlewareClient` to check session. No session → redirect to `/employee/login`.
      - All other paths: pass through.
      Export `config.matcher` covering both route patterns.
      Files:
      - `middleware.ts`
      Verify: `npx tsc --noEmit` passes; manually confirm matcher regex covers intended paths.

- [ ] 5. **Root layout and home page**
      Write `app/layout.tsx` (global HTML shell, Tailwind base, Inter font via `next/font`). Write `app/page.tsx` as a minimal landing with links to the three portals (admin, employee, developer).
      Files:
      - `app/layout.tsx`
      - `app/page.tsx`
      Verify: `npx next build` — no build errors on root route.

- [ ] 6. **Primitive UI components**
      Create reusable, Tailwind-only components: Button, Modal, Badge, Card. Badge accepts a `status` prop and maps the seven lead statuses to the specified colors (New=gray, Contacted=blue, Demo Sent=purple, Meeting Scheduled=yellow, Converted=green, Dropped=red, Site Visit Requested=orange).
      Files:
      - `components/ui/Button.tsx`
      - `components/ui/Modal.tsx`
      - `components/ui/Badge.tsx`
      - `components/ui/Card.tsx`
      Verify: `npx tsc --noEmit` — no type errors.

- [ ] 7. **API routes — Leads CRUD**
      Write `/api/leads/route.ts` (GET: fetch all leads with assigned profile name, server-role for admin; POST not needed — import handles bulk). Write `/api/leads/[id]/route.ts` (PATCH: update lead fields, auto-derive `status`, service-role client for writes; validate `assigned_to` matches `auth.uid()` for employees via RLS).
      Notes: PATCH derives status from the boolean pipeline fields before writing.
      Files:
      - `app/api/leads/route.ts`
      - `app/api/leads/[id]/route.ts`
      Verify: `npx tsc --noEmit` passes.

- [ ] 8. **API route — CSV Import**
      Write `/api/leads/import/route.ts`. Accepts `multipart/form-data` with a `file` field. Parse with `papaparse` server-side. Map columns (`company_name`, `contact_person`, `email`, `phone`, `source`). Bulk insert via service-role Supabase client. Return `{ inserted: N }`.
      Files:
      - `app/api/leads/import/route.ts`
      Verify: `npx tsc --noEmit` passes.

- [ ] 9. **API routes — Projects/PRD + Admin Assign**
      Write `/api/projects/route.ts` (GET all PRDs with developer name joined, POST create new PRD — both service-role; PATCH update). Write `/api/admin/assign/route.ts` (POST: assign lead to employee by id, service-role).
      Files:
      - `app/api/projects/route.ts`
      - `app/api/admin/assign/route.ts`
      Verify: `npx tsc --noEmit` passes.

- [ ] 10. **Employee login page**
       Write `app/employee/login/page.tsx` as a client component. Email + password form using `createBrowserClient`. On success redirects to `/employee/dashboard`. Magic link option rendered as a secondary button.
       Files:
       - `app/employee/login/page.tsx`
       Verify: `npx tsc --noEmit` passes; page renders without runtime error.

- [ ] 11. **Employee dashboard & lead components**
       Write `app/employee/dashboard/page.tsx` as a server component that fetches leads where `assigned_to = auth.uid()` via the server Supabase client. Renders `LeadsList`. Write `LeadsList.tsx` (table of leads with a "Update" button per row). Write `LeadUpdateModal.tsx` — the step-by-step form with:
       1. `service_interest` radio (Camera / Web / Both / Other)
       2. `is_interested` radio (Yes / No)
       3. `demo_website_sent` checkbox; `demo_liked` radio (conditionally shown)
       4. `meeting_scheduled` checkbox; `meeting_type` radio + `meeting_date_time` datetime input (conditionally shown)
       5. `site_visit_requested` checkbox
       6. `notes` textarea
       PATCHes `/api/leads/[id]` on submit.
       Files:
       - `app/employee/dashboard/page.tsx`
       - `components/employee/LeadsList.tsx`
       - `components/employee/LeadUpdateModal.tsx`
       Verify: `npx tsc --noEmit` passes; page renders with mock lead data.

- [ ] 12. **Admin dashboard page & section components**
       Write `app/admin/[secretKey]/page.tsx` as a server component. Re-validates secret key server-side. Renders three tab sections using a simple tab UI: Leads, Analytics, PRDs. Write the component tree:
       - `CSVImport.tsx` — file input, calls `/api/leads/import`, shows success/error.
       - `LeadsTable.tsx` — data table of all leads, sortable by status, shows assigned employee name.
       - `LeadAssignModal.tsx` — dropdown of employees, POSTs to `/api/admin/assign`.
       - `EmployeeStats.tsx` — stat cards fetched server-side: total leads/employee, conversion rate, meetings scheduled, site visits requested.
       - `PRDManager.tsx` — table of `projects_prd` rows with inline status update + create-new modal.
       Files:
       - `app/admin/[secretKey]/page.tsx`
       - `components/admin/CSVImport.tsx`
       - `components/admin/LeadsTable.tsx`
       - `components/admin/LeadAssignModal.tsx`
       - `components/admin/EmployeeStats.tsx`
       - `components/admin/PRDManager.tsx`
       Verify: `npx tsc --noEmit` passes; navigating to `/admin/test` (wrong key) redirects; correct key renders the dashboard.

- [ ] 13. **Developer portal page & components**
       Write `app/developer/page.tsx` as a server component. Fetches all `projects_prd` with developer name joined (uses anon key — `developers_read_prd` RLS policy allows SELECT for all). Accepts optional `?clientEmail=` query param for filtering. Write:
       - `PRDStatusCard.tsx` — card with client name, 200-char PRD snippet, Lovable status step indicator (5-step horizontal progress), development status progress bar, current blocker badge.
       - `DevelopmentTimeline.tsx` — linear timeline of `development_status` enum values with current state highlighted.
       Files:
       - `app/developer/page.tsx`
       - `components/developer/PRDStatusCard.tsx`
       - `components/developer/DevelopmentTimeline.tsx`
       Verify: `npx tsc --noEmit` passes; page renders without auth.

- [ ] 14. **Final build verification**
       Run full TypeScript check and Next.js production build to confirm zero errors across all files.
       Verify: `npm install && npx tsc --noEmit && npx next build` — exits 0.

---

## Supabase Client Usage Summary

| Context | Client | Key used |
|---|---|---|
| Client Components (browser) | `createClientComponentClient()` | anon key (env) |
| Server Components / RSC | `createServerComponentClient({ cookies })` | anon key + session cookie |
| Admin API routes | `createClient(url, SERVICE_ROLE_KEY)` | service_role (server only) |
| Employee API routes (PATCH lead) | service_role with RLS | RLS enforces `assigned_to = auth.uid()` |
| Developer portal (public) | `createServerComponentClient` | anon key; `developers_read_prd` policy allows SELECT |

---

## File Count: 36 files total across app/, components/, lib/, supabase/, and config root.
