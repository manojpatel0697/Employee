"use client";

import React, { useState } from "react";
import type {
  ProjectPRD,
  LovableGenerationStatus,
  DevelopmentStatusEnum,
} from "@/lib/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface PRDManagerProps {
  projects: ProjectPRD[];
}

const LOVABLE_STATUSES: LovableGenerationStatus[] = [
  "Pending Email Intake",
  "Generated via Lovable",
  "In Development",
  "Review",
  "Completed",
];

const DEV_STATUSES: DevelopmentStatusEnum[] = [
  "Not Started",
  "Frontend Built",
  "Backend & DB Hooked",
  "Deployed",
  "Live",
];

const lovableColors: Record<LovableGenerationStatus, string> = {
  "Pending Email Intake": "bg-gray-100 text-gray-700",
  "Generated via Lovable": "bg-blue-100 text-blue-700",
  "In Development": "bg-yellow-100 text-yellow-700",
  Review: "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
};

const devColors: Record<DevelopmentStatusEnum, string> = {
  "Not Started": "bg-gray-100 text-gray-700",
  "Frontend Built": "bg-blue-100 text-blue-700",
  "Backend & DB Hooked": "bg-yellow-100 text-yellow-700",
  Deployed: "bg-indigo-100 text-indigo-700",
  Live: "bg-green-100 text-green-700",
};

// ─────────────────────────────────────────────
// Blank form helpers
// ─────────────────────────────────────────────

type PRDFormFields = Omit<ProjectPRD, "id" | "created_at" | "updated_at" | "assigned_developer_id">;

function blankForm(): PRDFormFields {
  return {
    client_name: "",
    client_email: "",
    prd_content: "",
    lovable_generation_status: "Pending Email Intake",
    development_status: "Not Started",
    current_blocker: "",
  };
}

export default function PRDManager({ projects: initialProjects }: PRDManagerProps) {
  const [projects, setProjects] = useState<ProjectPRD[]>(initialProjects);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<ProjectPRD | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProjectPRD>>({});

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PRDFormFields>(blankForm());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Edit ────────────────────────────────────
  function openEdit(project: ProjectPRD) {
    setEditTarget(project);
    setEditForm({
      lovable_generation_status: project.lovable_generation_status,
      development_status: project.development_status,
      current_blocker: project.current_blocker ?? "",
    });
    setError(null);
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editTarget.id, ...editForm }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Failed to update");
      return;
    }

    const updated = (await res.json()) as ProjectPRD;
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditTarget(null);
  }

  // ── Create ───────────────────────────────────
  async function handleCreateSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });

    setLoading(false);

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Failed to create");
      return;
    }

    const created = (await res.json()) as ProjectPRD;
    setProjects((prev) => [created, ...prev]);
    setCreateOpen(false);
    setCreateForm(blankForm());
  }

  return (
    <>
      <div className="mb-4">
        <Button variant="primary" size="sm" onClick={() => { setCreateOpen(true); setError(null); }}>
          + New PRD
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Client", "Email", "Lovable Status", "Dev Status", "Blocker", "Assigned Developer", "Actions"].map((col) => (
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
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{p.client_name}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.client_email}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${lovableColors[p.lovable_generation_status]}`}>
                    {p.lovable_generation_status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${devColors[p.development_status]}`}>
                    {p.development_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{p.current_blocker ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.assigned_developer_id ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No PRDs yet. Click &ldquo;+ New PRD&rdquo; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <Modal isOpen title={`Edit PRD: ${editTarget.client_name}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lovable generation status</label>
              <select
                value={editForm.lovable_generation_status ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, lovable_generation_status: e.target.value as LovableGenerationStatus }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {LOVABLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Development status</label>
              <select
                value={editForm.development_status ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, development_status: e.target.value as DevelopmentStatusEnum }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEV_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current blocker</label>
              <input
                type="text"
                value={editForm.current_blocker ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, current_blocker: e.target.value || null }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Leave blank if none"
              />
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" size="md" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" variant="primary" size="md" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Modal */}
      {createOpen && (
        <Modal isOpen title="New PRD" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreateSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client name</label>
              <input
                required
                type="text"
                value={createForm.client_name}
                onChange={(e) => setCreateForm((f) => ({ ...f, client_name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client email</label>
              <input
                required
                type="email"
                value={createForm.client_email}
                onChange={(e) => setCreateForm((f) => ({ ...f, client_email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PRD content</label>
              <textarea
                rows={5}
                value={createForm.prd_content}
                onChange={(e) => setCreateForm((f) => ({ ...f, prd_content: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Paste or type the PRD here…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lovable generation status</label>
              <select
                value={createForm.lovable_generation_status}
                onChange={(e) => setCreateForm((f) => ({ ...f, lovable_generation_status: e.target.value as LovableGenerationStatus }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {LOVABLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Development status</label>
              <select
                value={createForm.development_status}
                onChange={(e) => setCreateForm((f) => ({ ...f, development_status: e.target.value as DevelopmentStatusEnum }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEV_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" size="md" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="md" disabled={loading}>{loading ? "Creating…" : "Create PRD"}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
