"use client";

import React, { useState } from "react";
import type { Lead, LeadStatus, ServiceInterest, MeetingType } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface LeadUpdateModalProps {
  lead: Lead;
  onClose: () => void;
  onSaved: (updatedLead: Lead) => void;
}

interface FormState {
  service_interest: ServiceInterest;
  is_interested: boolean | null;
  demo_website_sent: boolean;
  demo_liked: boolean | null;
  meeting_scheduled: boolean;
  meeting_type: MeetingType | null;
  meeting_date_time: string | null;
  site_visit_requested: boolean;
  notes: string;
  status: LeadStatus;
}

export default function LeadUpdateModal({
  lead,
  onClose,
  onSaved,
}: LeadUpdateModalProps) {
  const [form, setForm] = useState<FormState>({
    service_interest: lead.service_interest,
    is_interested: lead.is_interested,
    demo_website_sent: lead.demo_website_sent,
    demo_liked: lead.demo_liked,
    meeting_scheduled: lead.meeting_scheduled,
    meeting_type: lead.meeting_type,
    meeting_date_time: lead.meeting_date_time,
    site_visit_requested: lead.site_visit_requested,
    notes: lead.notes,
    status: lead.status,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Failed to save changes");
      return;
    }

    const updated = (await res.json()) as Lead;
    onSaved(updated);
  }

  return (
    <Modal isOpen title={`Update: ${lead.company_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Step 1 — Service interest */}
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 mb-2">
            1. Service focus
          </legend>
          <div className="flex flex-wrap gap-3">
            {(["Camera", "Web", "Both", "Other"] as ServiceInterest[]).map(
              (opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="service_interest"
                    value={opt}
                    checked={form.service_interest === opt}
                    onChange={() => setField("service_interest", opt)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  {opt}
                </label>
              )
            )}
          </div>
        </fieldset>

        {/* Step 2 — Interest level */}
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 mb-2">
            2. Interest level
          </legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="is_interested"
                checked={form.is_interested === true}
                onChange={() => setField("is_interested", true)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Interested
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="is_interested"
                checked={form.is_interested === false}
                onChange={() => setField("is_interested", false)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Not interested
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="is_interested"
                checked={form.is_interested === null}
                onChange={() => setField("is_interested", null)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              Unknown
            </label>
          </div>
        </fieldset>

        {/* Step 3 — Demo website */}
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 mb-2">
            3. Demo website
          </legend>
          <label className="flex items-center gap-2 text-sm mb-2">
            <input
              type="checkbox"
              checked={form.demo_website_sent}
              onChange={(e) => {
                setField("demo_website_sent", e.target.checked);
                if (!e.target.checked) setField("demo_liked", null);
              }}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Demo website sent
          </label>

          {/* Conditional: demo_liked shown only when demo_website_sent is true */}
          {form.demo_website_sent && (
            <div className="ml-5 flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="demo_liked"
                  checked={form.demo_liked === true}
                  onChange={() => setField("demo_liked", true)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Liked it
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="demo_liked"
                  checked={form.demo_liked === false}
                  onChange={() => setField("demo_liked", false)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Didn&apos;t like it
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="demo_liked"
                  checked={form.demo_liked === null}
                  onChange={() => setField("demo_liked", null)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Not viewed yet
              </label>
            </div>
          )}
        </fieldset>

        {/* Step 4 — Meeting */}
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 mb-2">
            4. Meeting setup
          </legend>
          <label className="flex items-center gap-2 text-sm mb-2">
            <input
              type="checkbox"
              checked={form.meeting_scheduled}
              onChange={(e) => {
                setField("meeting_scheduled", e.target.checked);
                if (!e.target.checked) {
                  setField("meeting_type", null);
                  setField("meeting_date_time", null);
                }
              }}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Meeting scheduled
          </label>

          {/* Conditional: meeting_type + meeting_date_time shown only when meeting_scheduled is true */}
          {form.meeting_scheduled && (
            <div className="ml-5 space-y-3">
              <div className="flex gap-4">
                {(["Google Meet", "Onsite"] as MeetingType[]).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="meeting_type"
                      value={opt}
                      checked={form.meeting_type === opt}
                      onChange={() => setField("meeting_type", opt)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    {opt}
                  </label>
                ))}
              </div>
              <div>
                <label
                  htmlFor="meeting_date_time"
                  className="block text-xs text-gray-600 mb-1"
                >
                  Date &amp; time
                </label>
                <input
                  id="meeting_date_time"
                  type="datetime-local"
                  value={form.meeting_date_time ?? ""}
                  onChange={(e) =>
                    setField("meeting_date_time", e.target.value || null)
                  }
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </fieldset>

        {/* Step 5 — Site visit */}
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 mb-2">
            5. Site visit
          </legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.site_visit_requested}
              onChange={(e) =>
                setField("site_visit_requested", e.target.checked)
              }
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Client asked for a site visit
          </label>
        </fieldset>

        {/* Step 6 — Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            6. Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Add any remarks about this call / interaction…"
          />
        </div>

        {/* Step 7 — Outcome / Status override */}
        <fieldset className="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <legend className="text-sm font-semibold text-gray-700 px-1">
            7. Outcome
          </legend>
          <p className="text-xs text-gray-500 mb-3">
            Set the final outcome for this lead. Use &ldquo;Converted&rdquo; when the client has agreed to proceed.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                "New",
                "Contacted",
                "Demo Sent",
                "Meeting Scheduled",
                "Site Visit Requested",
                "Converted",
                "Dropped",
              ] as LeadStatus[]
            ).map((s) => {
              const colorMap: Record<LeadStatus, string> = {
                New: "bg-gray-100 border-gray-300 text-gray-700",
                Contacted: "bg-blue-50 border-blue-300 text-blue-700",
                "Demo Sent": "bg-purple-50 border-purple-300 text-purple-700",
                "Meeting Scheduled": "bg-yellow-50 border-yellow-300 text-yellow-700",
                "Site Visit Requested": "bg-orange-50 border-orange-300 text-orange-700",
                Converted: "bg-green-50 border-green-400 text-green-700",
                Dropped: "bg-red-50 border-red-300 text-red-600",
              };
              const isSelected = form.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setField("status", s)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all
                    ${colorMap[s]}
                    ${isSelected ? "ring-2 ring-indigo-500 ring-offset-1 font-bold" : "opacity-70 hover:opacity-100"}`}
                  aria-pressed={isSelected}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
