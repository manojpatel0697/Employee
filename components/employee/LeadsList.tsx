"use client";

import React, { useState } from "react";
import type { Lead } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LeadUpdateModal from "./LeadUpdateModal";

interface LeadsListProps {
  leads: Lead[];
}

export default function LeadsList({ leads: initialLeads }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  function handleSaved(updatedLead: Lead) {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
    setSelectedLead(null);
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 p-8 text-center text-gray-500">
        No leads assigned to you yet.
      </div>
    );
  }

  return (
    <>
      {/* Mobile card list — visible below md breakpoint */}
      <div className="md:hidden space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 p-4 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-gray-900 truncate">{lead.company_name}</span>
              <Badge status={lead.status} />
            </div>
            <div className="text-sm text-gray-600">{lead.contact_person}</div>
            <div className="text-sm text-gray-500">{lead.phone}</div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{lead.service_interest}</span>
              <span>{new Date(lead.updated_at).toLocaleDateString()}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedLead(lead)}
            >
              Update
            </Button>
          </div>
        ))}
      </div>

      {/* Desktop table — hidden below md breakpoint */}
      <div className="hidden md:block overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Company",
                "Contact",
                "Phone",
                "Status",
                "Service Interest",
                "Last Updated",
                "Actions",
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
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {lead.company_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {lead.contact_person}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {lead.phone}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {lead.service_interest}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {new Date(lead.updated_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedLead(lead)}
                  >
                    Update
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <LeadUpdateModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
