"use client";

import React, { useState, useMemo, useCallback } from "react";
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

type SortKey = "sl_no" | "name" | "phone" | "category" | "search_category" | "area" | "status" | "assigned_to";
type SortDir = "asc" | "desc";

// ── Sort icon ──────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <span className="ml-1 text-gray-300">↕</span>;
  return <span className="ml-1 text-indigo-500">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

// ── Sortable header ────────────────────────────────────────────────
function SortTh({
  col, label, sortKey, sortDir, onSort,
}: {
  col: SortKey; label: string;
  sortKey: SortKey; sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  return (
    <th
      scope="col"
      onClick={() => onSort(col)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider
                 whitespace-nowrap cursor-pointer select-none hover:text-indigo-600 hover:bg-gray-100 transition-colors"
    >
      {label}
      <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );
}

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

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("sl_no");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let rows = leads.filter((l) => {
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (filterEmployee !== "all" && l.assigned_to !== filterEmployee) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.name?.toLowerCase().includes(q) ||
          l.company_name?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.category?.toLowerCase().includes(q) ||
          l.search_category?.toLowerCase().includes(q) ||
          l.area?.toLowerCase().includes(q) ||
          l.address?.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // Sort
    rows = [...rows].sort((a, b) => {
      let av: string;
      let bv: string;

      if (sortKey === "sl_no") {
        // Numeric sort for sl_no
        const an = parseInt(a.sl_no ?? "0", 10) || 0;
        const bn = parseInt(b.sl_no ?? "0", 10) || 0;
        return sortDir === "asc" ? an - bn : bn - an;
      }

      if (sortKey === "assigned_to") {
        av = employees.find((e) => e.id === a.assigned_to)?.full_name ?? "";
        bv = employees.find((e) => e.id === b.assigned_to)?.full_name ?? "";
      } else {
        av = String(a[sortKey] ?? "").toLowerCase();
        bv = String(b[sortKey] ?? "").toLowerCase();
      }

      const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [leads, filterStatus, filterEmployee, search, sortKey, sortDir, employees]);

  // ── Selection ──────────────────────────────────────────────────
  // "selectAll" = true means every lead in the filtered set is selected
  // (even rows not on the current page)
  const [selectAll, setSelectAll] = useState(false);

  // When selectAll is true, selected contains ALL filtered IDs.
  // When false, selected contains only individually chosen IDs.
  function toggleOne(id: string) {
    // If selectAll was on, materialise the full set first then deselect this one
    if (selectAll) {
      const next = new Set(filtered.map((l) => l.id));
      next.delete(id);
      setSelected(next);
      setSelectAll(false);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /** Toggle all leads on the CURRENT PAGE */
  function togglePage() {
    const pageIds = paginated.map((l) => l.id);
    const allPageSelected = pageIds.every((id) => selectAll || selected.has(id));
    if (allPageSelected) {
      // Deselect page (and cancel selectAll)
      setSelectAll(false);
      setSelected((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all on page
      setSelected((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.add(id));
        return next;
      });
      setSelectAll(false);
    }
  }

  /** Select ALL leads in the entire filtered set (across all pages) */
  function selectAllFiltered() {
    setSelected(new Set(filtered.map((l) => l.id)));
    setSelectAll(true);
  }

  /** Clear all selections */
  function clearAll() {
    setSelected(new Set());
    setSelectAll(false);
    setSelectNInput("");
  }

  // "Select N" — pick an exact count from the filtered list
  const [selectNInput, setSelectNInput] = useState("");

  function applySelectN() {
    const n = parseInt(selectNInput, 10);
    if (!n || n <= 0) return;
    const ids = filtered.slice(0, n).map((l) => l.id);
    setSelected(new Set(ids));
    setSelectAll(n >= filtered.length);
  }

  // Effective selected IDs (handles selectAll shortcut)
  const effectiveSelected: Set<string> = useMemo(
    () => (selectAll ? new Set(filtered.map((l) => l.id)) : selected),
    [selectAll, selected, filtered]
  );

  // ── Pagination ─────────────────────────────────────────────────
  const PAGE_SIZE = 100;
  const [page, setPage] = useState(1);

  // Reset page when filters change
  React.useEffect(() => { setPage(1); }, [filterStatus, filterEmployee, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allPageSelected =
    paginated.length > 0 &&
    paginated.every((l) => selectAll || selected.has(l.id));

  // Show "select all X leads" banner when current page is all selected
  // but not every lead in the filtered set is selected yet
  const showSelectAllBanner =
    allPageSelected && effectiveSelected.size < filtered.length;

  // ── Bulk assign ────────────────────────────────────────────────
  const doAssign = useCallback(async (leadIds: string[], employeeId: string) => {
    setBulkLoading(true);
    setBulkMsg(null);
    try {
      const res = await fetch("/api/admin/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": secretKey },
        body: JSON.stringify({ leadIds, employeeId }),
      });
      const body = (await res.json()) as { assigned?: number; error?: string };
      if (!res.ok) {
        setBulkMsg({ type: "error", text: body.error ?? "Bulk assign failed" });
        return false;
      }
      setLeads((prev) =>
        prev.map((l) => leadIds.includes(l.id) ? { ...l, assigned_to: employeeId } : l)
      );
      return true;
    } catch {
      setBulkMsg({ type: "error", text: "Network error. Try again." });
      return false;
    } finally {
      setBulkLoading(false);
    }
  }, [secretKey]);

  async function handleBulkAssign() {
    if (!bulkEmployee) { setBulkMsg({ type: "error", text: "Select an employee first." }); return; }
    if (effectiveSelected.size === 0) { setBulkMsg({ type: "error", text: "Select at least one lead." }); return; }
    const ids = Array.from(effectiveSelected);
    const ok = await doAssign(ids, bulkEmployee);
    if (ok) {
      const name = employees.find((e) => e.id === bulkEmployee)?.full_name ?? "employee";
      setBulkMsg({ type: "success", text: `✓ ${ids.length.toLocaleString()} leads assigned to ${name}` });
      clearAll();
    }
  }

  function getEmployeeName(id: string | null) {
    if (!id) return "—";
    return employees.find((e) => e.id === id)?.full_name ?? "—";
  }

  const sortProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <div className="space-y-4">

      {/* ── Filters row ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search name, phone, category, area…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-64
                     focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All employees</option>
          <option value="">Unassigned</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        <span className="text-xs text-gray-500">
          {filtered.length.toLocaleString()} lead{filtered.length !== 1 ? "s" : ""}
          {effectiveSelected.size > 0 && (
            <span className="ml-2 text-indigo-600 font-medium">
              · {effectiveSelected.size.toLocaleString()} selected
            </span>
          )}
        </span>
        {/* Sort indicator */}
        <span className="text-xs text-gray-400">
          Sorted by <span className="text-gray-600 font-medium">{sortKey.replace("_", " ")}</span> {sortDir === "asc" ? "↑" : "↓"}
        </span>
      </div>

      {/* ── SELECT-N bar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Quick Select</span>

        {/* Preset buttons */}
        {[50, 100, 250, 500, 1000].map((n) => (
          <button
            key={n}
            onClick={() => { setSelectNInput(String(n)); const ids = filtered.slice(0, n).map((l) => l.id); setSelected(new Set(ids)); setSelectAll(n >= filtered.length); }}
            disabled={filtered.length === 0}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700
                       hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {n.toLocaleString()}
          </button>
        ))}

        {/* Custom N input */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={filtered.length}
            placeholder="Custom…"
            value={selectNInput}
            onChange={(e) => setSelectNInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySelectN()}
            className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-xs
                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Custom number of leads to select"
          />
          <button
            onClick={applySelectN}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 font-medium transition-colors"
          >
            Select
          </button>
        </div>

        {/* Select ALL filtered */}
        <button
          onClick={selectAllFiltered}
          className="rounded-lg border border-indigo-300 bg-indigo-50 hover:bg-indigo-100
                     text-indigo-700 text-xs px-3 py-1 font-medium transition-colors"
        >
          Select all {filtered.length.toLocaleString()}
        </button>

        {effectiveSelected.size > 0 && (
          <button
            onClick={clearAll}
            className="rounded-lg border border-gray-300 bg-white hover:bg-gray-50
                       text-gray-500 text-xs px-3 py-1 transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* ── Bulk assign bar ── */}
      {effectiveSelected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3">
          <span className="text-sm font-medium text-indigo-800">
            {effectiveSelected.size.toLocaleString()} lead{effectiveSelected.size !== 1 ? "s" : ""} selected
            {selectAll && (
              <span className="ml-1 text-xs text-indigo-500">(all filtered)</span>
            )}
          </span>
          <select value={bulkEmployee} onChange={(e) => setBulkEmployee(e.target.value)}
            className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— Assign to employee —</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
          <Button variant="primary" size="sm" onClick={handleBulkAssign} disabled={bulkLoading || !bulkEmployee}>
            {bulkLoading ? "Assigning…" : `Assign ${effectiveSelected.size.toLocaleString()} leads`}
          </Button>
          <Button variant="secondary" size="sm" onClick={clearAll}>Clear</Button>
          {bulkMsg && (
            <span className={`text-sm ${bulkMsg.type === "success" ? "text-green-700" : "text-red-600"}`}>
              {bulkMsg.text}
            </span>
          )}
        </div>
      )}

      {/* ── "Select all X leads" expansion banner ── */}
      {showSelectAllBanner && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800">
            All <span className="font-semibold">{paginated.length}</span> leads on this page are selected.
          </p>
          <button
            onClick={selectAllFiltered}
            className="text-sm font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2"
          >
            Select all {filtered.length.toLocaleString()} leads in this view
          </button>
        </div>
      )}

      {/* ── Drag-and-drop assign panel ── */}
      <DragAssignPanel
        leads={filtered}
        employees={employees}
        onAssign={async (ids, empId) => {
          const ok = await doAssign(ids, empId);
          if (ok) {
            const name = employees.find((e) => e.id === empId)?.full_name ?? "employee";
            setBulkMsg({ type: "success", text: `✓ ${ids.length.toLocaleString()} leads assigned to ${name}` });
          }
        }}
      />

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {paginated.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No leads found.</p>
        ) : (
          paginated.map((lead) => (
            <div key={lead.id} className={`rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 p-4 space-y-2 ${effectiveSelected.has(lead.id) ? "ring-indigo-400 bg-indigo-50" : ""}`}>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={effectiveSelected.has(lead.id)}
                  onChange={() => toggleOne(lead.id)}
                  className="mt-1 rounded text-indigo-600"
                  aria-label={`Select ${lead.name || lead.company_name}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">{lead.name || lead.company_name}</span>
                    <Badge status={lead.status} />
                  </div>
                  <p className="text-sm text-gray-500">{lead.phone}</p>
                  <p className="text-xs text-gray-400">{lead.category} · {lead.area}</p>
                  <p className="text-xs text-gray-400">Assigned: {getEmployeeName(lead.assigned_to)}</p>
                </div>
              </div>
              {lead.map_link && (
                <a href={lead.map_link} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-indigo-600 hover:underline">View on Maps ↗</a>
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
                <input type="checkbox" checked={allPageSelected} onChange={togglePage}
                  className="rounded text-indigo-600" aria-label="Select all on this page" />
              </th>
              <SortTh col="sl_no"          label="Sl No"           {...sortProps} />
              <SortTh col="name"           label="Name"            {...sortProps} />
              <SortTh col="phone"          label="Phone"           {...sortProps} />
              <SortTh col="category"       label="Category"        {...sortProps} />
              <SortTh col="search_category" label="Search Category" {...sortProps} />
              <SortTh col="area"           label="Area"            {...sortProps} />
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Address
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Map
              </th>
              <SortTh col="status"      label="Status"      {...sortProps} />
              <SortTh col="assigned_to" label="Assigned To" {...sortProps} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.map((lead) => (
              <tr key={lead.id}
                  className={`transition-colors ${effectiveSelected.has(lead.id) ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={effectiveSelected.has(lead.id)} onChange={() => toggleOne(lead.id)}
                    className="rounded text-indigo-600"
                    aria-label={`Select ${lead.name || lead.company_name}`} />
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{lead.sl_no ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap max-w-[160px] truncate">
                  {lead.name || lead.company_name}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.phone}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap max-w-[130px] truncate">{lead.category}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap max-w-[130px] truncate">{lead.search_category}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lead.area}</td>
                <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate text-xs" title={lead.address}>
                  {lead.address}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {lead.map_link ? (
                    <a href={lead.map_link} target="_blank" rel="noopener noreferrer"
                       className="text-indigo-600 hover:underline text-xs">Maps ↗</a>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap"><Badge status={lead.status} /></td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                  {getEmployeeName(lead.assigned_to)}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-400">No leads found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages.toLocaleString()} &nbsp;·&nbsp;
            showing {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              «
            </button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              ‹ Prev
            </button>

            {/* Page number buttons — show window of 5 */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              return start + i;
            }).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors
                  ${p === page
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"}`}>
                {p}
              </button>
            ))}

            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              Next ›
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              »
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DRAG-AND-DROP ASSIGN PANEL
// ══════════════════════════════════════════════════════════════════

interface DragAssignPanelProps {
  leads: Lead[];
  employees: Profile[];
  onAssign: (leadIds: string[], employeeId: string) => Promise<void>;
}

function DragAssignPanel({ leads, employees, onAssign }: DragAssignPanelProps) {
  const [open, setOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverEmp, setDragOverEmp] = useState<string | null>(null);
  // Custom number: how many unassigned leads to assign to each employee
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});
  const [msgs, setMsgs] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  const unassigned = useMemo(
    () => leads.filter((l) => !l.assigned_to),
    [leads]
  );

  // ── Drag handlers ──────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, leadId: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("leadId", leadId);
    setDraggingId(leadId);
  }

  function onDragEnd() {
    setDraggingId(null);
    setDragOverEmp(null);
  }

  function onDragOver(e: React.DragEvent, empId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverEmp(empId);
  }

  async function onDrop(e: React.DragEvent, empId: string) {
    e.preventDefault();
    setDragOverEmp(null);
    const leadId = e.dataTransfer.getData("leadId");
    if (!leadId) return;
    setDraggingId(null);
    await onAssign([leadId], empId);
  }

  // ── Quick-assign N leads ───────────────────────────────────────
  async function handleQuickAssign(empId: string) {
    const n = parseInt(counts[empId] ?? "0", 10);
    if (!n || n <= 0) {
      setMsgs((m) => ({ ...m, [empId]: { type: "error", text: "Enter a number > 0" } }));
      return;
    }
    if (unassigned.length === 0) {
      setMsgs((m) => ({ ...m, [empId]: { type: "error", text: "No unassigned leads left" } }));
      return;
    }
    const toAssign = unassigned.slice(0, n).map((l) => l.id);
    setAssigning((a) => ({ ...a, [empId]: true }));
    setMsgs((m) => ({ ...m, [empId]: undefined as unknown as { type: "success" | "error"; text: string } }));
    await onAssign(toAssign, empId);
    setAssigning((a) => ({ ...a, [empId]: false }));
    setCounts((c) => ({ ...c, [empId]: "" }));
    setMsgs((m) => ({
      ...m,
      [empId]: { type: "success", text: `✓ ${toAssign.length} leads assigned` },
    }));
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50
                   hover:bg-indigo-100 hover:border-indigo-400 transition-colors
                   py-3 px-4 text-sm text-indigo-600 font-medium flex items-center justify-center gap-2"
      >
        <span className="text-lg">🎯</span>
        Open Drag &amp; Drop Assign Panel
        <span className="text-xs text-indigo-400 ml-1">
          ({unassigned.length.toLocaleString()} unassigned leads)
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between bg-indigo-600 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">🎯 Drag &amp; Drop Assign Panel</span>
          <span className="rounded-full bg-indigo-500 text-white text-xs px-2 py-0.5">
            {unassigned.length.toLocaleString()} unassigned
          </span>
        </div>
        <button onClick={() => setOpen(false)}
          className="text-indigo-200 hover:text-white text-xs underline">
          Close panel
        </button>
      </div>

      <div className="flex gap-0 overflow-x-auto">

        {/* ── Left: Unassigned leads pool ── */}
        <div className="w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-100">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Unassigned ({unassigned.length.toLocaleString()})
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Drag leads to an employee</p>
          </div>
          <div className="overflow-y-auto max-h-72 p-2 space-y-1">
            {unassigned.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">All leads assigned ✓</p>
            ) : (
              unassigned.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, lead.id)}
                  onDragEnd={onDragEnd}
                  className={`rounded-lg border bg-white px-2 py-1.5 text-xs cursor-grab active:cursor-grabbing
                    select-none transition-all
                    ${draggingId === lead.id ? "opacity-40 scale-95" : "hover:border-indigo-300 hover:bg-indigo-50"}
                    border-gray-200`}
                >
                  <p className="font-medium text-gray-800 truncate max-w-[160px]">
                    {lead.name || lead.company_name}
                  </p>
                  <p className="text-gray-400 truncate">{lead.category} · {lead.area}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right: One lane per employee ── */}
        {employees.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-8">
            No employees found. Add employees first.
          </div>
        ) : (
          employees.map((emp) => {
            const empLeads = leads.filter((l) => l.assigned_to === emp.id);
            const isOver = dragOverEmp === emp.id;
            return (
              <div
                key={emp.id}
                onDragOver={(e) => onDragOver(e, emp.id)}
                onDragLeave={() => setDragOverEmp(null)}
                onDrop={(e) => onDrop(e, emp.id)}
                className={`w-52 flex-shrink-0 border-r border-gray-200 flex flex-col transition-colors
                  ${isOver ? "bg-green-50 border-green-300" : "bg-white"}`}
              >
                {/* Employee header */}
                <div className={`px-3 py-2 border-b transition-colors
                  ${isOver ? "bg-green-100 border-green-300" : "bg-gray-50 border-gray-200"}`}>
                  <p className="text-xs font-semibold text-gray-800 truncate">{emp.full_name}</p>
                  <p className="text-xs text-gray-400">{empLeads.length} leads assigned</p>

                  {/* Quick-assign N input */}
                  <div className="flex gap-1 mt-2">
                    <input
                      type="number"
                      min={1}
                      max={unassigned.length || 1}
                      placeholder="Count"
                      value={counts[emp.id] ?? ""}
                      onChange={(e) => setCounts((c) => ({ ...c, [emp.id]: e.target.value }))}
                      className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-xs
                                 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      aria-label={`Number of leads to assign to ${emp.full_name}`}
                    />
                    <button
                      onClick={() => handleQuickAssign(emp.id)}
                      disabled={assigning[emp.id] || unassigned.length === 0}
                      className="rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40
                                 text-white text-xs px-2 py-0.5 font-medium transition-colors"
                    >
                      {assigning[emp.id] ? "…" : "Assign"}
                    </button>
                  </div>
                  {msgs[emp.id] && (
                    <p className={`text-xs mt-1 ${msgs[emp.id].type === "success" ? "text-green-600" : "text-red-500"}`}>
                      {msgs[emp.id].text}
                    </p>
                  )}
                </div>

                {/* Drop zone + current leads */}
                <div className={`flex-1 overflow-y-auto max-h-60 p-2 space-y-1
                  ${isOver ? "ring-2 ring-inset ring-green-400 bg-green-50" : ""}`}>
                  {isOver && (
                    <div className="rounded-lg border-2 border-dashed border-green-400 bg-green-100
                                    text-green-700 text-xs text-center py-3 font-medium">
                      Drop here ↓
                    </div>
                  )}
                  {empLeads.length === 0 && !isOver ? (
                    <p className="text-xs text-gray-300 text-center py-4">Drop leads here</p>
                  ) : (
                    empLeads.map((lead) => (
                      <div key={lead.id}
                           className="rounded border border-gray-100 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                        <p className="font-medium truncate max-w-[170px]">
                          {lead.name || lead.company_name}
                        </p>
                        <p className="text-gray-400 truncate">{lead.category}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
