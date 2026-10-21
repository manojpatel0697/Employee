// ============================================================
// Shared TypeScript types — used across API routes, server
// components, and client components.
// ============================================================

export type UserRole = "admin" | "employee" | "developer";

export type LeadStatus =
  | "New"
  | "Picked Up"
  | "Interested"
  | "Demo Sent"
  | "Meeting Scheduled"
  | "Site Visit Requested"
  | "Converted"
  | "Dropped";

export type CallStatus =
  | "Answered"
  | "Not Answered"
  | "Busy"
  | "Switched Off";

export type ServiceInterest = "Camera" | "Web" | "Both" | "Other";

export type MeetingType = "Google Meet" | "Onsite";

export type LovableGenerationStatus =
  | "Pending Email Intake"
  | "Generated via Lovable"
  | "In Development"
  | "Review"
  | "Completed";

export type DevelopmentStatusEnum =
  | "Not Started"
  | "Frontend Built"
  | "Backend & DB Hooked"
  | "Deployed"
  | "Live";

// ----------------------------------------------------------------
// Database row interfaces
// ----------------------------------------------------------------

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Lead {
  id: string;

  // ── XLSX import columns ─────────────────────────────────────────
  sl_no: string | null;
  /** Business / person name from XLSX */
  name: string;
  /** Phone number */
  phone: string;
  /** Business category (e.g. "Restaurant", "Clinic") */
  category: string;
  /** Google Maps search category */
  search_category: string;
  /** Area / locality */
  area: string;
  /** Full address */
  address: string;
  /** Google Maps link */
  map_link: string;

  // ── Legacy / extra fields ───────────────────────────────────────
  company_name: string;
  contact_person: string;
  email: string;
  source: string;
  assigned_to: string | null;

  // ── Pipeline status ─────────────────────────────────────────────
  status: LeadStatus;

  // ── Employee workflow steps ─────────────────────────────────────
  /** Step 1: Did the employee pick up / call this lead? */
  picked_up: boolean;
  /** Step 1b: Call outcome */
  call_status: CallStatus | null;
  /** Step 2: Is the client interested? */
  is_interested: boolean | null;
  /** Step 3: Was a demo website sent? */
  demo_website_sent: boolean;
  /** Step 3b: Did the client like the demo? */
  demo_liked: boolean | null;
  /** Step 4: Was a meeting scheduled? */
  meeting_scheduled: boolean;
  meeting_type: MeetingType | null;
  meeting_date_time: string | null;
  /** Step 5: Site visit requested? */
  site_visit_requested: boolean;
  /** Step 6: Service focus */
  service_interest: ServiceInterest;

  notes: string;

  created_at: string;
  updated_at: string;
}

export interface ProjectPRD {
  id: string;
  client_name: string;
  client_email: string;
  prd_content: string;
  lovable_generation_status: LovableGenerationStatus;
  development_status: DevelopmentStatusEnum;
  current_blocker: string | null;
  assigned_developer_id: string | null;
  created_at: string;
  updated_at: string;
}
