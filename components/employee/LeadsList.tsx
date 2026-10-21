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
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    setSelectedLead(null);
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 p-8 text-center text-gray-500">
        No leads assigned to you yet.
      </div>
    );
  }

  const total = leads.length;
  const pickedUp = leads.filter((l) => l.picked_up).length;
  const interested = leads.filter((l) => l.is_interested === true).length;
  const demoSent = leads.filter((l) => l.demo_website_sent).length;
  const meetingSet = leads.filter((l) => l.meeting_scheduled).length;
  const converted = leads.filter((l) => l.status === "Converted").length;

  return (
    <>
      {/* Summary stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total", value: total, color: "text-gray-700" },
          { label: "Called", value: pickedUp, color: "text-blue-700" },
          { label: "Interested", value: interested, color: "text-cyan-700" },
          { label: "Demo Sent", value: demoSent, color: "text-purple-700" },
          { label: "Meeting Set", value: meetingSet, color: "text-yellow-700" },
          { label: "Converted", value: converted, color: "text-green-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white ring-1 ring-gray-200 p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {leads.map((lead) => (
          <div key={lead.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-gray-900 truncate">{lead.name || lead.company_name}</span>
              <Badge status={lead.status} />
            </div>
            <div className="text-sm text-gray-500">{lead.phone}</div>
            <div className="text-xs text-gray-400">{lead.category} · {lead.area}</div>
            {lead.address && <div className="text-xs text-gray-400 truncate">📍 {lead.address}</div>}
            <div className="flex items-center justify-between">
              {lead.map_link ? (
                <a href={lead.map_link} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-indigo-600 hover:underline">View on Maps ↗</a>
              ) : <span />}
              <Button variant="secondary" size="sm" onClick={() => setSelectedLead(lead)}>
                Update
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Sl No", "Name", "Phone", "Category", "Area", "Address", "Map", "Called?", "Interested?", "Demo?", "Meeting", "Status", ""].map((col) => (
                <th key={col} scope="col"
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">{lead.sl_no ?? "—"}</td>
                <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap max-w-[160px] truncate">
                  {lead.name || lead.company_name}
                </td>
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{lead.phone}</td>
                <td className="px-3 py-3 text-gray-500 whitespace-nowrap max-w-[120px] truncate">{lead.category}</td>
                <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{lead.area}</td>
                <td className="px-3 py-3 text-gray-400 max-w-[180px] truncate" title={lead.address}>{lead.address}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {lead.map_link ? (
                    <a href={lead.map_link} target="_blank" rel="noopener noreferrer"
                       className="text-indigo-600 hover:underline text-xs">Maps ↗</a>
                  ) : "—"}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  {lead.picked_up
                    ? <span className="text-green-600 font-medium text-xs">{lead.call_status ?? "✓"}</span>
                    : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center text-xs">
                  {lead.is_interested === true ? "✅" : lead.is_interested === false ? "❌" : "—"}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center text-xs">
                  {lead.demo_website_sent ? "✅" : "—"}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600">
                  {lead.meeting_scheduled && lead.meeting_date_time
                    ? new Date(lead.meeting_date_time).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                    : lead.meeting_scheduled ? "Scheduled" : "—"}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Badge status={lead.status} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedLead(lead)}>
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
