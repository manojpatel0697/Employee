"use client";

import React, { useState } from "react";
import type { Lead, Profile } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface LeadAssignModalProps {
  lead: Lead;
  employees: Profile[];
  onClose: () => void;
  onAssigned: (updatedLead: Lead) => void;
}

export default function LeadAssignModal({
  lead,
  employees,
  onClose,
  onAssigned,
}: LeadAssignModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    lead.assigned_to ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmployee) {
      setError("Please select an employee.");
      return;
    }

    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, employeeId: selectedEmployee }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Failed to assign lead");
      return;
    }

    const updated = (await res.json()) as Lead;
    onAssigned(updated);
  }

  return (
    <Modal isOpen title={`Assign: ${lead.company_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="employee-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Assign to employee
          </label>
          <select
            id="employee-select"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— Select employee —</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
          >
            {loading ? "Assigning…" : "Assign"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
