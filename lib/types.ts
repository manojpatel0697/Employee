// ============================================================
// Shared TypeScript types — used across API routes, server
// components, and client components.
// ============================================================

export type UserRole = "admin" | "employee" | "developer";

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Demo Sent"
  | "Meeting Scheduled"
  | "Site Visit Requested"
  | "Converted"
  | "Dropped";

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
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  source: string;
  assigned_to: string | null;

  // Pipeline
  status: LeadStatus;
  service_interest: ServiceInterest;
  is_interested: boolean | null;
  demo_website_sent: boolean;
  demo_liked: boolean | null;
  meeting_scheduled: boolean;
  meeting_type: MeetingType | null;
  meeting_date_time: string | null;
  site_visit_requested: boolean;
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
