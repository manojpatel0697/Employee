import React from "react";
import type { LeadStatus } from "@/lib/types";

interface BadgeProps {
  status: LeadStatus;
}

const statusClasses: Record<LeadStatus, string> = {
  New: "bg-gray-100 text-gray-700",
  "Picked Up": "bg-blue-100 text-blue-700",
  Interested: "bg-cyan-100 text-cyan-700",
  "Demo Sent": "bg-purple-100 text-purple-700",
  "Meeting Scheduled": "bg-yellow-100 text-yellow-700",
  "Site Visit Requested": "bg-orange-100 text-orange-700",
  Converted: "bg-green-100 text-green-700",
  Dropped: "bg-red-100 text-red-700",
};

export default function Badge({ status }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
