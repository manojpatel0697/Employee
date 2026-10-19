import React from "react";
import type { Lead, Profile } from "@/lib/types";

interface EmployeeStatsProps {
  leads: Lead[];
  employees: Profile[];
}

interface EmployeeStat {
  employee: Profile;
  totalLeads: number;
  converted: number;
  conversionRate: string;
  meetingsScheduled: number;
  siteVisitsRequested: number;
}

export default function EmployeeStats({ leads, employees }: EmployeeStatsProps) {
  const stats: EmployeeStat[] = employees.map((emp) => {
    const assigned = leads.filter((l) => l.assigned_to === emp.id);
    const converted = assigned.filter((l) => l.status === "Converted").length;
    const rate =
      assigned.length > 0
        ? ((converted / assigned.length) * 100).toFixed(1)
        : "0.0";

    return {
      employee: emp,
      totalLeads: assigned.length,
      converted,
      conversionRate: `${rate}%`,
      meetingsScheduled: assigned.filter((l) => l.meeting_scheduled).length,
      siteVisitsRequested: assigned.filter((l) => l.site_visit_requested).length,
    };
  });

  if (employees.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No employees found.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[
              "Employee",
              "Total Leads",
              "Converted",
              "Conversion Rate",
              "Meetings Scheduled",
              "Site Visits Requested",
            ].map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {stats.map(({ employee, totalLeads, converted, conversionRate, meetingsScheduled, siteVisitsRequested }) => (
            <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                {employee.full_name}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {totalLeads}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  {converted}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {conversionRate}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                  {meetingsScheduled}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                  {siteVisitsRequested}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
