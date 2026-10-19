"use client";

import React, { useState } from "react";
import type { Lead, Profile } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LeadAssignModal from "./LeadAssignModal";

interface LeadsTableProps {
  leads: Lead[];
  employees: Profile[];
  secretKey: string;
}

type SortKey = keyof Pick<
  Lead,
  "company_name" | "contact_person" | "status" | "service_interest" | "created_at"
>;

export default function LeadsTable({
  leads: initialLeads,
  employees,
  secretKey,
}: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = [...leads].sort((a, b) => {
    const av = String(a[sortKey] ?? "");
    const bv = String(b[sortKey] ?? "");
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  function getEmployeeName(id: string | null): string {
    if (!id) return "—";
    return employees.find((e) => e.id === id)?.full_name ?? "—";
  }

  function handleAssigned(updatedLead: Lead) {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
    setSelectedLead(null);
  }

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      <span className="ml-1 text-xs">{sortAsc ? "▲" : "▼"}</span>
    ) : null;

  return (
    <>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {(
                [
                  ["company_name", "Company"],
                  ["contact_person", "Contact"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  scope="col"
                  onClick={() => toggleSort(key)}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                >
                  {label}
                  <SortIcon col={key} />
                </th>
              ))}
              {["Email", "Phone", "Source"].map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
              <th
                scope="col"
                onClick={() => toggleSort("status")}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
              >
                Status <SortIcon col="status" />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Assigned To
              </th>
              <th
                scope="col"
                onClick={() => toggleSort("service_interest")}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
              >
                Service <SortIcon col="service_interest" />
              </th>
              <th
                scope="col"
                onClick={() => toggleSort("created_at")}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
              >
                Created <SortIcon col="created_at" />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sorted.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {lead.company_name}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {lead.contact_person}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {lead.email}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {lead.phone}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {lead.source}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {getEmployeeName(lead.assigned_to)}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {lead.service_interest}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedLead(lead)}
                  >
                    Assign
                  </Button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <LeadAssignModal
          lead={selectedLead}
          employees={employees}
          secretKey={secretKey}
          onClose={() => setSelectedLead(null)}
          onAssigned={handleAssigned}
        />
      )}
    </>
  );
}
