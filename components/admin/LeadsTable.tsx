"use client";

import React, { useState, useMemo } from "react";
import type { Lead, Profile, LeadStatus } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface LeadsTableProps {
  leads: Lead[];
  employees: Profile[];
  secretKey: string;
}

const STATUS_OPTIONS: LeadStatus[] = [
  "New", "Picked Up", "Interested", "Demo Sent",
  "Meeting Scheduled", "Converted", "Dropped",
];

export default function LeadsTable({ leads: initialLeads, employees, secretKey }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkEmployee, setBulkEmployee] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (filterEmployee !== "all" && l.assigned_to !== filterEmployee) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.name?.toLowerCase().includes(q) ||
          l.company_name?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.category?.toLowerCase().includes(q) ||
          l.area?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, filterStatus, filterEmployee, search]);

  // ── Selection helpers ──────────────────────────────────────────
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  }

  // ── Bulk assign ────────────────────────────────────────────────
  async function handleBulkAssign() {
    if (!bulkEmployee) {
      setBulkMsg({ type: "error", text: "Select an employee first." });
      return;
    }
    if (selected.size === 0) {
      setBulkMsg({ type: "error", text: "Select at least one lead." });
      return;
    }

    setBulkLoading(true);
    setBulkMsg(null);

    try {
      const res = await fetch("/api/admin/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": secretKey },
        body: JSON.stringify({ leadIds: Array.from(selected), employeeId: bulkEmployee }),
      });

      const body = (await res.json()) as { assigned?: number; error?: string };

      if (!res.ok) {
        setBulkMsg({ type: "error", text: body.error ?? "Bulk assign failed" });
        return;
      }

      // Update local state
      setLeads((prev) =>
        prev.map((l) =>
          selected.has(l.id) ? { ...l, assigned_to: bulkEmployee } : l
        )
      );
      setSelected(new Set());
      setBulkMsg({
        type: "success",
        text: `✓ ${(body.assigned ?? selected.size).toLocaleString()} leads assigned to ${employees.find((e) => e.id === bulkEmployee)?.full_name ?? "employee"}`,
      });
    } catch {
      setBulkMsg({ type: "error", text: "Network error. Try again." });
    } finally {
      setBulkLoading(false);
    }
  }

  function getEmployeeName(id: string | null): string {
    if (!id) return "—";
    return employees.find((e) => e.id === id)?.full_name ?? "—";
  }

  const allOnPageSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div className="space-y-4">
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search name, phone, category, area…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-64
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterEmployee}
          onChange={(e) => setFilterEmployee(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All employees</option>
          <option value="">Unassigned</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        <span className="text-xs text-gray-500">{filtered.length.toLocaleString()} leads</span>
      </div>

      {/* ── Bulk assign bar ── */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3">
          <span className="text-sm font-medium text-indigo-800">
            {selected.size.toLocaleString()} lead{selected.size !== 1 ? "s" : ""} selected
          </span>
          <select
            value={bulkEmployee}
            onChange={(e) => setBulkEmployee(e.target.value)}
            className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— Assign to employee —</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
          <Button
            variant="primary"
            size="sm"
            onClick={handleBulkAssign}
            disabled={bulkLoading || !bulkEmployee}
          >
            {bulkLoading ? "Assigning…" : `Assign ${selected.size.toLocaleString()} leads`}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
          {bulkMsg && (
            <span className={`text-sm ${bulkMsg.type === "success" ? "text-green-700" : "text-red-600"}`}>
              {bulkMsg.text}
            </span>
          )}
        </div>
      )}

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No leads found.</p>
        ) : (
          filtered.map((lead) => (
            <div key={lead.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(lead.id)}
                  onChange={() => toggleOne(lead.id)}
                  className="mt-1 rounded text-indigo-600"
                  aria-label={`Select ${lead.name || lead.company_name}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">{lead.name || lead.company_name}</span>
                    <Badge status={lead.status} />
                  </div>
                  <div className="text-sm text-gray-500">{lead.phone}</div>
                  <div className="text-xs text-gray-400">{lead.category} · {lead.area}</div>
                  <div className="text-xs text-gray-400">Assigned: {getEmployeeName(lead.assigned_to)}</div>
                </div>
              </div>
              {lead.map_link && (
                <a href={lead.map_link} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-indigo-600 hover:underline">
                  View on Maps
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                  className="rounded text-indigo-600"
                  aria-label="Select all"
                />
              </th>
              {["Sl No", "Name", "Phone", "Category", "Area", "Address", "Map", "Status", "Assigned To"].map((col) => (
                <th key={col} scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.map((lead) => (
              <tr key={lead.id}
                  className={`hover:bg-gray-50 transition-colors ${selected.has(lead.id) ? "bg-indigo-50" : ""}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(lead.id)}
                    onChange={() => toggleOne(lead.id)}
                    className="rounded text-indigo-600"
                    aria-label={`Select ${lead.name || lead.company_name}`}
                  />
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lead.sl_no ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap max-w-[180px] truncate">
                  {lead.name || lead.company_name}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.phone}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap max-w-[140px] truncate">{lead.category}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap max-w-[120px] truncate">{lead.area}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={lead.address}>{lead.address}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {lead.map_link ? (
                    <a href={lead.map_link} target="_blank" rel="noopener noreferrer"
                       className="text-indigo-600 hover:underline text-xs">Maps ↗</a>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{getEmployeeName(lead.assigned_to)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
